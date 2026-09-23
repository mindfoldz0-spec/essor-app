/**
 * Export every voice clip with a human-readable label.
 * Reads /api/voice/manifest (key + text), copies each wav to:
 *   labeled-voices/<lang>/<key>__<english-slug>.wav
 * plus labeled-voices/index.csv (file, key, lang, text) for review.
 *
 * Usage: npm run voice:labels
 */
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.VOICE_BASE || "http://localhost:3000";
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "public");
const DEST = process.env.VOICE_LABEL_DEST || join(HERE, "..", "..", "_reference", "labeled-voices");

function slug(text) {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join("-");
  return clean || "clip";
}

function csvCell(s) {
  const v = String(s ?? "").replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

async function main() {
  console.log("Fetching manifest from", BASE + "/api/voice/manifest ...");
  const manifest = await (await fetch(`${BASE}/api/voice/manifest`)).json();
  const items = manifest.items;
  console.log(`${items.length} clips`);

  // slug source = english text for the same key (ASCII-safe filenames)
  const enText = {};
  for (const it of items) {
    if (it.lang === "en-IN") enText[it.key] = it.text;
  }

  const rows = [["file", "key", "lang", "text"]];
  let done = 0;
  for (const it of items) {
    const name = `${it.key}__${slug(enText[it.key] || it.key)}.wav`;
    const destDir = join(DEST, it.lang);
    await mkdir(destDir, { recursive: true });
    await copyFile(join(SRC, it.file), join(destDir, name));
    rows.push([`${it.lang}/${name}`, it.key, it.lang, it.text]);
    done++;
  }
  await writeFile(join(DEST, "index.csv"), rows.map((r) => r.map(csvCell).join(",")).join("\n"), "utf8");
  console.log(`Done: ${done} labeled clips + index.csv in ${DEST}`);
}

main().catch((e) => {
  console.error("voice:labels failed:", e.message);
  process.exit(1);
});
