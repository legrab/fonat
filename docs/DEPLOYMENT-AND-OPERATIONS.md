# Deployment and operations

The README is authoritative for local, Docker, Vercel, and Render values. `/api/health` reports profile, persistence, and workspace version. Production startup rejects memory persistence and the default development secret. MongoDB replica-set support is required for the intended transaction-capable profile.

Vercel uses the repository root, Framework Preset `Other`, install command `npm ci --include=dev`, build command `npm run build`, and output directory `apps/web/dist`. No Development Command is required. The explicit dev-dependency inclusion preserves the TypeScript/Vite build when `NODE_ENV=production` is present during installation. `api/index.ts` imports the bundled `apps/server/dist/vercel.js` artifact; it must not import raw server or workspace TypeScript.

Render derives its default public origin from `RENDER_EXTERNAL_URL`. `PUBLIC_APP_URL` and `ALLOWED_ORIGINS` remain available for custom domains; legacy `PUBLIC_BASE_URL` and `WEB_ORIGIN` are accepted during migration. Origin values are URL origins, never client IP addresses.
