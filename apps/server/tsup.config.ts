import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/dev.ts", "src/vercel.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  outDir: "dist",
  clean: true,
  noExternal: [/^@fonat\//],
});
