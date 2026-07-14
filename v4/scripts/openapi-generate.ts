import { mkdir, writeFile } from "node:fs/promises";
import { createApp } from "../apps/server/src/app.js";
const ctx = await createApp({
  env: { ...process.env, RUNTIME_PROFILE: "test", MONGODB_URI: "" },
});
const document = ctx.app.swagger();
await mkdir("docs", { recursive: true });
await writeFile("docs/openapi.json", JSON.stringify(document, null, 2));
await ctx.close();
console.log("Generated docs/openapi.json");
