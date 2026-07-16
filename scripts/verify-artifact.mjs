import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenDirs = new Set([
  "node_modules",
  ".git",
  "coverage",
  ".playwright",
  ".cache",
  "test-results",
  "playwright-report",
]);
const selfDescribingFiles = new Set([
  "docs/SPEC-v4.md",
  "fonat-one-shot-mvp-spec-v4.md",
  "scripts/check-lockfile-portability.mjs",
  "scripts/verify-artifact.mjs",
]);
const forbiddenFragments = [
  /applied-caas-gateway/i,
  /\.internal\./i,
  /\/mnt\/data/i,
  /\/home\/oai/i,
  /file:\/\/(?:\/)?(?:mnt\/data|home\/oai|tmp\/|[A-Za-z]:)/i,
];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (forbiddenDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (/^\.env(?!\.example$)/.test(entry.name) || /\.log$/.test(entry.name)) {
      errors.push(`forbidden artifact file: ${rel}`);
    }
    if (
      !selfDescribingFiles.has(rel) &&
      /\.(?:json|mjs|js|ts|md|yaml|yml|map|txt)$/.test(entry.name) &&
      fs.statSync(full).size < 5_000_000
    ) {
      const text = fs.readFileSync(full, "utf8");
      for (const pattern of forbiddenFragments) {
        if (pattern.test(text)) errors.push(`${rel}: ${pattern}`);
      }
    }
  }
}

walk(root);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  "Artifact portability scan passed; ignored build/cache directories are not release inputs.",
);
