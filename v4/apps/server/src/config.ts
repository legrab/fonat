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
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.parse(env);
  if (
    parsed.RUNTIME_PROFILE === "production" &&
    (!parsed.MONGODB_URI || parsed.SESSION_SECRET.includes("development-only"))
  )
    throw new Error(
      "Production requires MongoDB and a strong non-default SESSION_SECRET",
    );
  return {
    ...parsed,
    allowedOrigins: parsed.ALLOWED_ORIGINS.split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    projectsEnabled: parsed.FEATURE_PROJECTS !== "false",
  };
}
