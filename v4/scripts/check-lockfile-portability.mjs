import fs from "node:fs";
const path = new URL("../package-lock.json", import.meta.url);
const text = fs.readFileSync(path, "utf8");
const forbidden = [
  /applied-caas-gateway/i,
  /\.internal\./i,
  /api\.openai\.org/i,
  /\/mnt\/data/i,
  /\/home\/oai/i,
  /\/tmp\//i,
  /file:\/\//i,
  /localhost/i,
  /127\.0\.0\.1/i,
  /[A-Za-z]:\\/,
];
const hits = forbidden.filter((pattern) => pattern.test(text)).map(String);
const lock = JSON.parse(text);
for (const [name, entry] of Object.entries(lock.packages || {})) {
  if (
    entry?.resolved &&
    !(entry.link === true && !String(entry.resolved).includes(":")) &&
    !String(entry.resolved).startsWith("https://registry.npmjs.org/")
  )
    hits.push(`${name}: non-public resolved URL ${entry.resolved}`);
}
if (hits.length) {
  console.error(`Portable lockfile check failed:\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(
  `Portable lockfile OK: ${Object.keys(lock.packages || {}).length} package entries.`,
);
