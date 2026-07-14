import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
const base = process.argv[2] || "content";
const entries = await readdir(base);
let checked = 0;
for (const name of entries) {
  const dir = path.join(base, name);
  if (!(await stat(dir)).isDirectory()) continue;
  const manifest = JSON.parse(
    await readFile(path.join(dir, "package.json"), "utf8"),
  );
  for (const field of [
    "packageId",
    "version",
    "contractVersion",
    "requiredCapabilities",
    "locales",
    "rights",
  ])
    if (!(field in manifest)) throw new Error(`${name}: missing ${field}`);
  if (
    !Array.isArray(manifest.requiredCapabilities) ||
    !Array.isArray(manifest.locales)
  )
    throw new Error(`${name}: invalid arrays`);
  checked++;
  console.log(`✓ ${manifest.packageId}@${manifest.version}`);
}
if (!checked) throw new Error("No content packages found");
