/**
 * Seed public.schemes in Neon from a LOCAL data file (never committed).
 *
 * Usage:
 *   SCHEMES_JSON=/path/to/schemes.json npm run schemes:seed
 *   # default: src/data/schemes.json (gitignored — keep your copy private)
 *
 * Upserts by id, so re-running after data fixes is safe.
 */
import { readFile } from "node:fs/promises";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function cleanUrl(url) {
  const u = new URL(url);
  u.searchParams.delete("channel_binding");
  u.searchParams.delete("sslmode");
  u.searchParams.delete("ssl");
  return u.toString();
}

const SRC = process.env.SCHEMES_JSON || "src/data/schemes.json";

async function main() {
  const raw = await readFile(SRC, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : parsed.schemes || parsed.items || parsed.data;
  if (!Array.isArray(items) || items.length === 0) throw new Error(`no schemes found in ${SRC}`);
  console.log(`Seeding ${items.length} schemes from ${SRC} ...`);

  let url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  url = cleanUrl(url);
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  const sql = `insert into public.schemes
    (id, name, name_hi, name_mr, department, level, categories, target_group,
     is_women_focused, primary_goal, max_benefit, summary, eligibility,
     documents, apply_steps, official_portal, youtube_tutorials, official_articles)
   values
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb)
   on conflict (id) do update set
     name = excluded.name, name_hi = excluded.name_hi, name_mr = excluded.name_mr,
     department = excluded.department, level = excluded.level, categories = excluded.categories,
     target_group = excluded.target_group, is_women_focused = excluded.is_women_focused,
     primary_goal = excluded.primary_goal, max_benefit = excluded.max_benefit,
     summary = excluded.summary, eligibility = excluded.eligibility,
     documents = excluded.documents, apply_steps = excluded.apply_steps,
     official_portal = excluded.official_portal,
     youtube_tutorials = excluded.youtube_tutorials,
     official_articles = excluded.official_articles,
     updated_at = now()`;

  let ok = 0;
  const failures = [];
  for (const s of items) {
    try {
      await pool.query(sql, [
        s.id,
        s.name ?? "",
        s.nameHi ?? s.name ?? "",
        s.nameMr ?? s.name ?? "",
        s.department ?? "",
        s.level ?? "Central",
        s.categories ?? [],
        s.targetGroup ?? "",
        !!s.isWomenFocused,
        s.primaryGoal ?? "subsidy",
        s.maxBenefit ?? "",
        s.summary ?? "",
        s.eligibility ?? [],
        s.documents ?? [],
        s.applySteps ?? [],
        s.officialPortal ?? "",
        JSON.stringify(s.youtubeTutorials ?? []),
        JSON.stringify(s.officialArticles ?? []),
      ]);
      ok++;
    } catch (e) {
      failures.push(`${s.id}: ${e.message}`);
    }
  }
  const { rows } = await pool.query("select count(*)::int as c from public.schemes");
  console.log(`Done: ${ok} upserted, ${failures.length} failed, table count: ${rows[0].c}`);
  if (failures.length) {
    console.log(failures.join("\n"));
    process.exitCode = 1;
  }
  await pool.end();
}

main().catch((e) => {
  console.error("seed failed:", e.message);
  process.exit(1);
});
