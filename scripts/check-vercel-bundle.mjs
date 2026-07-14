import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = path.resolve("apps/server/dist");
const entry = path.join(dist, "vercel.js");

if (!fs.existsSync(entry)) {
  console.error("Vercel server bundle is missing; run npm run build first");
  process.exit(1);
}

const source = fs
  .readdirSync(dist)
  .filter((name) => name.endsWith(".js"))
  .map((name) => fs.readFileSync(path.join(dist, name), "utf8"))
  .join("\n");

if (/(?:from\s*|import\s*\()["']@fonat\//.test(source)) {
  console.error("Vercel server bundle retains a @fonat workspace import");
  process.exit(1);
}

if (/(?:from\s*|import\s*\()["']@fastify\/cookie["']/.test(source)) {
  console.error("Vercel server bundle externalizes @fastify/cookie");
  process.exit(1);
}

await import(pathToFileURL(entry).href);
console.log(
  "Vercel server bundle imports successfully without workspace runtime imports.",
);
