import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";

const expectedNode = "v24.18.0";
const expectedNpm = "11.16.0";
const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url)),
);
const npmExecPath = process.env.npm_execpath;
const actualNpm = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, "--version"], {
      encoding: "utf8",
    }).stdout.trim()
  : undefined;
const problems = [];
if (process.version !== expectedNode)
  problems.push(`Node ${process.version}; expected ${expectedNode}`);
if (actualNpm && actualNpm !== expectedNpm)
  problems.push(`npm ${actualNpm}; expected ${expectedNpm}`);
if (packageJson.packageManager !== `npm@${expectedNpm}`)
  problems.push("packageManager is not exact");
if (packageJson.engines?.node !== `${expectedNode.split(".")[0].slice(1)}.x`)
  problems.push("engines.node must select the supported major");
if (packageJson.engines?.npm !== undefined)
  problems.push("engines.npm must not reject hosted npm patch versions");
for (const file of [".nvmrc", ".node-version"]) {
  if (
    fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8").trim() !==
    expectedNode.slice(1)
  )
    problems.push(`${file} is not aligned`);
}
const registry =
  process.env.npm_config_registry ||
  process.env.NPM_CONFIG_REGISTRY ||
  "(npm default)";
console.log(
  JSON.stringify(
    {
      node: process.version,
      npm: actualNpm || "unknown",
      registry,
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
    },
    null,
    2,
  ),
);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
