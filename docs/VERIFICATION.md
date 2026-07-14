# Verification

## v4 modernization environment

```text
Node.js: 24.18.0
npm: 11.16.0
Platform: linux x64
Application version: 0.4.0
Server bundle target: node24
Vercel runtime: Node 24.x selected through the root package engine
Docker base image: node:24.18.0-bookworm-slim
```

Node.js 24 was executed through an isolated npm-provided binary because the host default remained Node.js 22. The checks therefore exercised Node.js 24 rather than merely changing metadata.

## Passed under Node.js 24.18.0

```text
npm run toolchain:check
npm run lockfile:check
npm run config:check
npm run format:check
npm run typecheck                    # all 11 workspaces
npm test                             # 6/6 unit and API integration tests
npm run test:integration             # 3/3 API integration tests
npm run package:validate             # 4/4 content packages
npm run openapi:generate
npm run build                        # Vite frontend and bundled Fastify server
npm run smoke:production             # health, static UI, login, authenticated API, logout
npm run artifact:verify
npm audit --omit=dev                 # 0 vulnerabilities
```

The portable lockfile contains public `registry.npmjs.org` tarball URLs and normal relative workspace links only. A fresh directory without `node_modules` or build output completed `npm ci --offline`, proving the lock graph was usable without the original internal registry URL. The same fresh copy built successfully after npm 11 esbuild lifecycle-script approval was committed.

A production-runtime rehearsal then ran:

```text
npm ci
npm run build
npm prune --omit=dev --offline
npm run smoke:production
```

The built application continued to pass the HTTP smoke after development dependencies were removed.

## Defects found and corrected during modernization

1. Node.js declarations still targeted 22 in `engines`, Docker, Vercel, README, and tsup.
2. The lockfile contained 735 OpenAI-internal resolved URLs.
3. Older Fastify, static-serving, Swagger UI, and React Router packages produced high-severity production audit findings.
4. Vitest's default worker behavior stalled under Node.js 24 in this environment. Pinning Vitest 3.2.7 and using the fork pool produced stable runs.
5. npm 11 clean installs required explicit esbuild lifecycle-script approval. The exact lockfile versions are now approved in `package.json`.
6. Successful type checking alone was insufficient. The built server and pruned production dependency tree were started and exercised over HTTP.

## Unavailable checks

- Docker is not installed in this environment. JSON/YAML deployment configuration and Node declarations were parsed and checked, but MongoDB replica-set container startup was not executed.
- The available system Chromium is managed with an administrator URL blocklist. Playwright started but navigation to `http://127.0.0.1:5173/login` failed with `ERR_BLOCKED_BY_ADMINISTRATOR`. This is an environmental browser-policy failure, not a passed E2E result.
- Vercel and Render hosted deployments were not executed. Their committed configuration was statically parsed and aligned with Node.js 24.

## Reproduce outside the restricted environment

```bash
node --version
npm --version
npm run toolchain:check
npm run lockfile:check
npm ci
npm run config:check
npm run format:check
npm run typecheck
npm test
npm run package:validate
npm run build
npm run smoke:production
npm audit --omit=dev
npx playwright install chromium
npm run test:e2e
docker compose up --build
```

The release ZIP has a companion `.sha256` file generated after packaging. A checksum cannot be embedded inside the ZIP without changing the ZIP being checksummed.
