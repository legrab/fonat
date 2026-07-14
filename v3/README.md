# Fonat

**Szálról szálra. / Thread by thread.**

Fonat is a source-available, single-teacher-first educational operating system. This repository is a one-shot implementation of the Version 3 specification, with a working React/Vite teacher interface, Fastify API, optional MongoDB persistence, deterministic demo fixtures, guided exercise authoring, presentation control, live learner responses, assignments, assessments, evidence, and the isolated Mushroom Yard project.

## Fastest local start

Requirements: Node.js **22.16.0**, npm 10.9+, and optionally Docker.

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`. Demo login:

- email: `admin@fonat.local`
- password: `fonat-demo`

The development profile uses memory persistence when `MONGODB_URI` is empty. Set a MongoDB replica-set URI to exercise persistent compare-and-swap storage.

## Root commands

| Command                    | Purpose                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `npm ci`                   | Reproducible workspace install                                               |
| `npm run dev`              | Start Vite on 5173 and Fastify on 3001                                       |
| `npm run build`            | Build frontend and server                                                    |
| `npm run lint`             | Strict TypeScript check                                                      |
| `npm run format:check`     | Check Prettier formatting                                                    |
| `npm run typecheck`        | Check every workspace                                                        |
| `npm test`                 | Unit and API integration tests                                               |
| `npm run test:integration` | API integration tests                                                        |
| `npm run test:e2e`         | Playwright browser paths                                                     |
| `npm run validate`         | Format, typecheck, test, build                                               |
| `npm run demo:reset`       | Reset Mongo demo data, or write a deterministic reset artifact without Mongo |
| `npm run package:validate` | Validate all content package manifests                                       |
| `npm run openapi:generate` | Generate `docs/openapi.json` from Fastify                                    |

## Docker, authoritative persistence profile

```bash
docker compose up --build
```

Open `http://localhost:3001`. Compose starts MongoDB 8 as a single-node replica set, waits for health, then starts the application. Data is retained in `fonat-mongo`.

Preserve data:

```bash
docker compose down
```

Destructive reset:

```bash
docker compose down -v
docker compose up --build
```

## Environment variables

| Variable           |   Required | Safe example                                  | Profile | Purpose                                        |
| ------------------ | ---------: | --------------------------------------------- | ------- | ---------------------------------------------- |
| `RUNTIME_PROFILE`  |        yes | `development`                                 | all     | `development`, `test`, `demo`, or `production` |
| `PORT`             |         no | `3001`                                        | server  | Fastify listener port                          |
| `MONGODB_URI`      | production | `mongodb://localhost:27017/?replicaSet=rs0`   | server  | MongoDB connection string                      |
| `MONGODB_DB`       |         no | `fonat`                                       | server  | Database name                                  |
| `SESSION_SECRET`   |        yes | a random 32+ character string                 | server  | Signed cookie and session protection           |
| `PUBLIC_APP_URL`   |        yes | `http://localhost:5173`                       | all     | Public application origin                      |
| `ALLOWED_ORIGINS`  |        yes | `http://localhost:5173,http://localhost:3001` | server  | Comma-separated CORS allowlist                 |
| `SCHOOL_TIMEZONE`  |         no | `Europe/Budapest`                             | all     | Default school timezone                        |
| `DEFAULT_LOCALE`   |         no | `hu`                                          | all     | Default interface locale                       |
| `FEATURE_PROJECTS` |         no | `true`                                        | all     | Project capability toggle                      |
| `ASSET_PROFILE`    |        yes | `hosted-restricted`                           | all     | `hosted-restricted` or `local-rich`            |

Production refuses memory persistence and the checked-in development session secret.

## Vercel

1. Import the repository and use **Other** as Framework Preset.
2. Keep Root Directory at repository root.
3. Install Command: `npm ci`.
4. Build Command: `npm run build`.
5. Output Directory: `apps/web/dist`.
6. Set Node.js to **22.16.0**.
7. Create a MongoDB Atlas database user and network rule, preferably restricted to Vercel egress where practical.
8. Set `RUNTIME_PROFILE=production`, `MONGODB_URI`, `SESSION_SECRET`, `PUBLIC_APP_URL`, and `ALLOWED_ORIGINS`.
9. Use a separate Atlas database name for Preview deployments to prevent demo and production data mixing.
10. Check `/api/health`, Function logs, and the first-run login after deployment.

`vercel.json` routes `/api/*` to the single Fastify function and all other paths to the built SPA. The filesystem is ephemeral. Assets in hosted mode must be bundled or external-provider records. Roll back by promoting the preceding Vercel deployment.

## Render

1. Choose **New → Blueprint** and connect the repository.
2. Render reads `render.yaml` and builds the root Dockerfile.
3. Set secret `MONGODB_URI`, `SESSION_SECRET`, `PUBLIC_APP_URL`, and `ALLOWED_ORIGINS`.
4. The service binds `0.0.0.0:$PORT` and exposes `/api/health`.
5. Complete first-run bootstrap or use the seeded demo login when starting from a fresh demo database.
6. Free services may sleep, and the local filesystem is ephemeral.
7. Redeploy from a prior commit or image to roll back.

Manual fallback: create a Docker Web Service from the root Dockerfile with the same variables and health path.

## Repository map

- `apps/web`: React, Vite, React Router, Radix Themes, TanStack Query/Table, React Hook Form, Milkdown Crepe, KaTeX, Mafs, dnd-kit.
- `apps/server`: Fastify factory, authentication, route groups, OpenAPI, adapters.
- `packages/contracts`: Result envelope and shared runtime schemas.
- `packages/application`: demo clock, fixtures, grading, transitions.
- `packages/persistence-mongodb`: memory and MongoDB optimistic state persistence.
- `content`: validated non-executable packages.
- `features` and `modules`: ownership boundaries and capability manifests.

Read `IMPLEMENTATION-DEVIATIONS.md` before treating this repository as production-complete.
