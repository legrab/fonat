# Deployment and operations

The step-by-step operator guide is maintained in the root [README](../README.md). This document records the deployment contracts that code and configuration must preserve.

## Profiles

### Local raw development

- Vite and Fastify run as separate processes.
- MongoDB runs as a Docker-managed single-node replica set.
- `ASSET_PROFILE=local-rich` permits the mounted local asset adapter.
- Swagger is normally enabled.

### Local Docker

- `docker compose up --build` is the authoritative acceptance environment.
- MongoDB runs as a single-node replica set so transactions match Atlas behavior.
- Fonat binds to `0.0.0.0:$PORT`.
- Database and local assets use named volumes.
- `SESSION_SECRET` must be supplied through `.env`.

### Vercel

- Repository root is the Vercel project root.
- Framework Preset is `Other`.
- Node.js is 22.x.
- Install command is `npm ci`.
- Build command is `npm run build`.
- Output directory is `apps/web/dist`.
- `vercel.json` maps `/api/*` to one Fastify Function and serves the Vite SPA for other paths.
- Persistence is MongoDB Atlas.
- Assets use `hosted-restricted`.
- General uploads, server-generated PDF, and local persistent files are unavailable.

### Render

- `render.yaml` is a Blueprint for one Docker web service.
- The service uses MongoDB Atlas and `hosted-restricted` assets.
- The Docker image binds to Render's `PORT`.
- `/api/health` is the health-check path.
- Free-service sleep is an operational limitation, not application-level offline support.

## Fail-closed startup

Production startup fails when:

- `PERSISTENCE_MODE` is not `mongo`,
- `SESSION_SECRET` is missing, weak, or a known placeholder,
- `WEB_ORIGIN` or `PUBLIC_BASE_URL` is invalid,
- an insecure non-local HTTP origin is used,
- an asset profile lacks its required storage configuration.

Test-only memory persistence is never an implicit production fallback.

## First run

A new database exposes only setup status and bootstrap operations until the first administrator exists. The administrator then selects either:

- the foundation package and blank onboarding, or
- the package-backed demonstration workspace.

No default administrator password is shipped.

## Schema migrations and indexes

`createIndexes()` first applies ordered, idempotent schema migrations recorded in `schemaMigrations`, then creates indexes. Migration guarantees begin with the first tagged usable v2 release. Development may explicitly drop and reseed; production never resets automatically.

## Reset and ownership

Demo reset reimports reference educational packages and restores versioned operational fixtures while retaining administrator and teacher accounts. Portable package/workspace exports are the content-ownership format. Infrastructure backups remain necessary for disaster recovery.

## Health and diagnosis

`GET /api/health` reports the deployment profile, configured persistence mode, database reachability, enabled capability flags, and build information without exposing secrets.

Technical logs, audit events, and user-facing Recent Activity are separate concerns. Expected domain failures use typed `Result` values rather than exception-shaped HTTP success responses.
