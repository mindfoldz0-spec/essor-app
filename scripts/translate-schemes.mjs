/**
 * Backfill _hi/_mr content columns in public.schemes via Sarvam Translate (mayura:v1).
 * Translates ONLY empty targets — safe to re-run. Nothing touches git.
 *
 * Usage: npm run schemes:translate
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.SARVAM_API_KEY;
if (!API_KEY) throw new Error("SARVAM_API_KEY missing");
const CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY || 2);
const SEP = "\n§\n"; // array join separator (rare in source text)

// Global rate-limit pause: when Sarvam answers 429, ALL workers wait.
let pausedUntil = 0;
async function respectPause() {
  const wait = pausedUntil - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

function cleanUrl(url) {
  const u = new URL(url);
  u.searchParams.delete("channel_binding");
  u.searchParams.delete("sslmode");
  u.searchParams.delete("ssl");
  return u.toString();
}

// Split long text into ≤900-char chunks at sentence boundaries.
function chunk(text, max = 900) {
  if (text.length <= max) return [text];
  const parts = text.split(/(?<=[.!?\n])\s+/);
  const out = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + " " + p).trim().length > max && cur) {
      out.push(cur.trim());
      cur = p;
    } else {
      cur = (cur + " " + p).trim();
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [text];
}

async function translate(text, target, attempt = 1) {
  await respectPause();
  const chunks = chunk(text);
  const done = [];
  for (const c of chunks) {
    await respectPause();
    const res = await postTranslate(
      {
        input: c,
        source_language_code: "en-IN",
        target_language_code: target,
        model: "mayura:v1",
        mode: "formal",
        numerals_format: "international",
      },
      45000
    );
    if (res.status === 429) {
      // Back off globally: 60s (grows with consecutive hits).
      const extra = Math.min(300000, 60000 * attempt);
      pausedUntil = Math.max(pausedUntil, Date.now() + extra);
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP 429 (retry in ${Math.round(extra / 1000)}s): ${err.slice(0, 120)}`);
    }
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
    }
    const json = await res.json();
    if (!json.translated_text) throw new Error("empty translation");
    done.push(json.translated_text);
  }
  return done.join(" ");
}

// fetch with a hard timeout — Sarvam sometimes tarpits (accepts the
// connection, never responds) instead of answering 429. Never wait forever.
async function postTranslate(body, ms = 45000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": API_KEY },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function translateWithRetry(text, target) {
  for (let a = 1; a <= 6; a++) {
    try {
      return await translate(text, target, a);
    } catch (e) {
      const rateLimited = String(e.message).includes("429");
      if (a === 6) throw e;
      await new Promise((r) => setTimeout(r, rateLimited ? 20000 : 3000 * a));
    }
  }
}

// Scalars (summary, max_benefit, department, target_group) and arrays
// (eligibility, documents, apply_steps) for hi + mr.
const SCALARS = ["summary", "max_benefit", "department", "target_group"];
const ARRAYS = ["eligibility", "documents", "apply_steps"];
const LANGS = [
  { suffix: "hi", code: "hi-IN" },
  { suffix: "mr", code: "mr-IN" },
];

async function main() {
  const pool = new pg.Pool({
    connectionString: cleanUrl(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  });

  const { rows } = await pool.query("select * from public.schemes order by id");
  console.log(`${rows.length} schemes loaded`);

  // Build work list: only empty targets with non-empty English source.
  const jobs = [];
  for (const row of rows) {
    for (const f of SCALARS) {
      for (const L of LANGS) {
        const src = (row[f] || "").trim();
        const dst = (row[`${f}_${L.suffix}`] || "").trim();
        if (src && !dst) jobs.push({ id: row.id, field: `${f}_${L.suffix}`, kind: "scalar", src, lang: L.code });
      }
    }
    for (const f of ARRAYS) {
      const srcArr = row[f] || [];
      for (const L of LANGS) {
        const dstArr = row[`${f}_${L.suffix}`] || [];
        const missing = srcArr.filter((s) => s && s.trim()).length > 0 && dstArr.filter((s) => s && s.trim()).length === 0;
        if (missing) {
          const joined = srcArr
            .map((s) => (s || "").trim())
            .filter(Boolean)
            .join(SEP);
          if (joined) jobs.push({ id: row.id, field: `${f}_${L.suffix}`, kind: "array", src: joined, lang: L.code, count: srcArr.filter((s) => (s || "").trim()).length });
        }
      }
    }
  }
  console.log(`${jobs.length} translations needed (skipping already-filled)`);

  let done = 0;
  let ok = 0;
  let fail = 0;
  const failures = [];
  const queue = [...jobs];

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      try {
        const out = await translateWithRetry(job.src, job.lang);
        if (job.kind === "array") {
          const parts = out.split(SEP).map((s) => s.trim()).filter(Boolean);
          const value = parts.length === job.count ? parts : [out];
          if (parts.length !== job.count) {
            console.log(`  [${job.id}] ${job.field}: separator lost (${parts.length}/${job.count}), storing whole`);
          }
          await pool.query(`update public.schemes set ${job.field} = $2, updated_at = now() where id = $1`, [
            job.id,
            value,
          ]);
        } else {
          await pool.query(`update public.schemes set ${job.field} = $2, updated_at = now() where id = $1`, [
            job.id,
            out.trim(),
          ]);
        }
        ok++;
      } catch (e) {
        fail++;
        failures.push(`${job.id}/${job.field}: ${e.message}`);
      }
      done++;
      if (done % 25 === 0 || done === jobs.length) {
        console.log(`  ${done}/${jobs.length} ... (${ok} ok, ${fail} failed)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const cov = await pool.query(`select
    count(*) filter (where summary_hi <> '') as shi, count(*) filter (where summary_mr <> '') as smr,
    count(*) filter (where cardinality(eligibility_hi) > 0) as ehi,
    count(*) filter (where cardinality(eligibility_mr) > 0) as emr
    from public.schemes`);
  console.log("coverage:", JSON.stringify(cov.rows[0]));
  console.log(`Done: ${ok} ok, ${fail} failed`);
  if (failures.length) {
    console.log("Failures:\n" + failures.slice(0, 20).join("\n"));
    process.exitCode = 1;
  }
  await pool.end();
}

main().catch((e) => {
  console.error("translate failed:", e.message);
  process.exit(1);
});
