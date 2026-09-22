/**
 * Bakes ALL predefined onboarding voice prompts into public/voices/ on your PC.
 * Every clip plays instantly from local files — zero API delay, zero cost.
 *
 * Usage:
 *   1. npm run dev            (in another terminal, or set VOICE_BASE)
 *   2. npm run voice:download
 *
 * 33 clips = 11 prompts x 3 languages (en-IN, hi-IN, mr-IN).
 * Re-running is cheap: it skips files that already exist.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.VOICE_BASE || "http://localhost:3000";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const CONCURRENCY = Number(process.env.VOICE_CONCURRENCY || 2);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadOne(item, attempt = 1) {
  const { key, lang, text, file } = item;
  const dest = join(ROOT, file);
  if (await exists(dest)) return { ok: true, skipped: true, bytes: 0 };
  try {
    const res = await fetch(`${BASE}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: lang }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("empty audio");
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    return { ok: true, skipped: false, bytes: buf.length };
  } catch (e) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500));
      return downloadOne(item, attempt + 1);
    }
    return { ok: false, error: String(e?.message || e) };
  }
}

async function main() {
  console.log("Fetching manifest from", BASE + "/api/voice/manifest ...");
  const manifest = await (await fetch(`${BASE}/api/voice/manifest`)).json();
  const items = manifest.items;
  console.log(`Processing ${items.length} clips with concurrency ${CONCURRENCY} ...`);

  let done = 0;
  let ok = 0;
  let skipped = 0;
  let fail = 0;
  let bytes = 0;
  const failures = [];
  const queue = [...items];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      const r = await downloadOne(item);
      done++;
      if (r.ok) {
        ok++;
        bytes += r.bytes;
        if (r.skipped) skipped++;
        else console.log(`  saved ${item.lang}/${item.key} (${(r.bytes / 1024).toFixed(0)} KB)`);
      } else {
        fail++;
        failures.push(`${item.lang}/${item.key}: ${r.error}`);
      }
      if (done % 20 === 0 || done === items.length) {
        console.log(`  ${done}/${items.length} ... (${ok} ok, ${skipped} skipped, ${fail} failed)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone: ${ok} ok (${skipped} already existed), ${fail} failed, ${(bytes / 1024 / 1024).toFixed(1)} MB new in public/voices/`);
  if (failures.length) {
    console.log("Failures:\n" + failures.join("\n"));
    console.log("Re-run npm run voice:download to retry.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("voice:download failed:", e.message);
  process.exit(1);
});
