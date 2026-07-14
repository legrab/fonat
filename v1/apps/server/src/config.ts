import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/?replicaSet=rs0'),
  MONGODB_DB: z.string().default('fonat'),
  SESSION_SECRET: z.string().min(16).default('development-session-secret-change-me'),
  PERSISTENCE_MODE: z.enum(['mongo', 'memory']).default('mongo'),
  ASSET_PROFILE: z.enum(['hosted-restricted', 'local-rich']).default('local-rich'),
  LOCAL_ASSET_DIR: z.string().default('./local-assets'),
  MAX_PACKAGE_BYTES: z.coerce.number().positive().default(4_194_304),
  MAX_UPLOAD_BYTES: z.coerce.number().positive().default(2_097_152),
  BOOTSTRAP_ADMIN_USERNAME: z.string().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional()
});

export type AppConfig = z.infer<typeof configSchema>;
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse(env);
}
