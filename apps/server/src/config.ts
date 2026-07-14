import { z } from "zod";
const schema = z.object({
  RUNTIME_PROFILE: z
    .enum(["development", "test", "demo", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().optional().default(""),
  MONGODB_DB: z.string().default("fonat"),
  SESSION_SECRET: z
    .string()
    .min(16)
    .default("development-only-change-me-please-32-chars"),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:5173"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3001"),
  SCHOOL_TIMEZONE: z.string().default("Europe/Budapest"),
  DEFAULT_LOCALE: z.enum(["hu", "en"]).default("hu"),
  FEATURE_PROJECTS: z.string().default("true"),
  ASSET_PROFILE: z
    .enum(["hosted-restricted", "local-rich"])
    .default("hosted-restricted"),
});
export type AppConfig = z.infer<typeof schema> & {
  allowedOrigins: string[];
  projectsEnabled: boolean;
};
const toOrigin = (value: string) => new URL(value).origin;
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.parse({
    ...env,
    PUBLIC_APP_URL:
      env.PUBLIC_APP_URL ??
      env.PUBLIC_BASE_URL ??
      env.WEB_ORIGIN ??
      env.RENDER_EXTERNAL_URL,
    ALLOWED_ORIGINS:
      env.ALLOWED_ORIGINS ??
      env.WEB_ORIGIN ??
      env.PUBLIC_BASE_URL ??
      env.RENDER_EXTERNAL_URL,
  });
  if (
    parsed.RUNTIME_PROFILE === "production" &&
    (!parsed.MONGODB_URI || parsed.SESSION_SECRET.includes("development-only"))
  )
    throw new Error(
      "Production requires MongoDB and a strong non-default SESSION_SECRET",
    );
  const publicAppOrigin = toOrigin(parsed.PUBLIC_APP_URL);
  const allowedOrigins = [publicAppOrigin, ...parsed.ALLOWED_ORIGINS.split(",")]
    .map((value) => value.trim())
    .filter(Boolean)
    .map(toOrigin);
  return {
    ...parsed,
    PUBLIC_APP_URL: publicAppOrigin,
    ALLOWED_ORIGINS: [...new Set(allowedOrigins)].join(","),
    allowedOrigins: [...new Set(allowedOrigins)],
    projectsEnabled: parsed.FEATURE_PROJECTS !== "false",
  };
}
