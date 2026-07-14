import fs from "node:fs";
import { parse } from "yaml";
const root = new URL("../", import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), "utf8");
for (const file of ["package.json", "vercel.json", "docs/openapi.json"])
  JSON.parse(read(file));
for (const file of [
  "render.yaml",
  "docker-compose.yml",
  "docs/requirements-v4.yaml",
])
  parse(read(file));
const packageJson = JSON.parse(read("package.json"));
const vercel = JSON.parse(read("vercel.json"));
const docker = read("Dockerfile");
const vercelEntry = read("api/index.ts");
const expectedNodeEngine = "24.x";
const expectedDockerNode = "24.18.0";
const errors = [];
if (packageJson.engines.node !== expectedNodeEngine)
  errors.push("package.json Node mismatch");
if (!docker.includes(`node:${expectedDockerNode}-bookworm-slim`))
  errors.push("Docker Node mismatch");
if (vercel.functions?.["api/index.ts"]?.runtime)
  errors.push(
    "Vercel Node runtime must be selected through package.json engines",
  );
if (!vercelEntry.includes("../apps/server/dist/vercel.js"))
  errors.push("Vercel function must import the bundled server artifact");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("JSON/YAML configuration parsed; Node declarations are aligned.");
