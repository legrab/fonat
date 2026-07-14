import { z } from 'zod';

const envBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return value;
}, z.boolean());

const baseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/?replicaSet=rs0'),
  MONGODB_DB: z.string().default('fonat'),
  SESSION_SECRET: z.string().min(16).default('development-session-secret-change-me'),
  PERSISTENCE_MODE: z.enum(['mongo', 'memory']).default('mongo'),
  ASSET_PROFILE: z.enum(['hosted-restricted', 'local-rich']).default('local-rich'),
  LOCAL_ASSET_DIR: z.string().default('./local-assets'),
  MAX_PACKAGE_BYTES: z.coerce.number().positive().default(4_194_304),
  MAX_UPLOAD_BYTES: z.coerce.number().positive().default(2_097_152),
  DEMO_CLOCK: z.string().datetime({ offset: true }).default('2026-09-15T08:00:00+02:00'),
  SCHOOL_TIMEZONE: z.string().min(3).default('Europe/Budapest'),
  DEFAULT_LOCALE: z.enum(['hu', 'en']).default('hu'),
  FEATURE_PROJECTS: envBoolean.default(true),
  ENABLE_SWAGGER: envBoolean.default(true),
  BOOTSTRAP_ADMIN_USERNAME: z.string().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional()
});

export type AppConfig = z.infer<typeof baseConfigSchema>;

function validateProduction(config: AppConfig): AppConfig {
  if (config.NODE_ENV !== 'production') return config;
  const failures: string[] = [];
  if (config.PERSISTENCE_MODE === 'memory') failures.push('PERSISTENCE_MODE cannot be memory');
  if (
    config.SESSION_SECRET.length < 32 ||
    config.SESSION_SECRET.includes('development') ||
    config.SESSION_SECRET.includes('change-me')
  )
    failures.push('SESSION_SECRET must be at least 32 characters and non-default');
  const isAllowedProductionUrl = (value: string) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname))
    );
  };
  try {
    if (!isAllowedProductionUrl(config.PUBLIC_BASE_URL))
      failures.push('PUBLIC_BASE_URL must use HTTPS except for local Docker hosts');
  } catch {
    failures.push(`Invalid PUBLIC_BASE_URL: ${config.PUBLIC_BASE_URL}`);
  }
  for (const origin of config.WEB_ORIGIN.split(',')) {
    try {
      if (!isAllowedProductionUrl(origin.trim()))
        failures.push(`WEB_ORIGIN must use HTTPS except for local Docker hosts: ${origin}`);
    } catch {
      failures.push(`Invalid WEB_ORIGIN: ${origin}`);
    }
  }
  if (config.ASSET_PROFILE === 'local-rich' && !config.LOCAL_ASSET_DIR)
    failures.push('LOCAL_ASSET_DIR is required for local-rich assets');
  if (failures.length) throw new Error(`Invalid production configuration:\n- ${failures.join('\n- ')}`);
  return config;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return validateProduction(baseConfigSchema.parse(env));
}
