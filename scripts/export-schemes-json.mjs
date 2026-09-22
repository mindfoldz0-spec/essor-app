import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsPath = path.join(__dirname, "../src/data/schemes.ts");
const content = fs.readFileSync(tsPath, "utf8");

// Extract ALL_SCHEMES array definition
const match = content.match(/export const ALL_SCHEMES: Scheme\[\] = (\[[\s\S]*?\n\]);/);
if (match) {
  // Safe evaluation of the JS array object
  const schemes = eval(match[1]);
  const outPath = path.join(__dirname, "../src/data/schemes.json");
  fs.writeFileSync(outPath, JSON.stringify(schemes, null, 2), "utf8");
  console.log(`Successfully exported ${schemes.length} schemes to ${outPath}`);
} else {
  console.error("Could not parse ALL_SCHEMES from schemes.ts");
  process.exit(1);
}
