# Verification status

Verified on 2026-07-14 in the repository execution environment.

## Passed checks

| Check                         | Result                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Clean dependency installation | `npm ci` completed successfully from `package-lock.json`.                                                              |
| Formatting                    | `npm run format:check` passed.                                                                                         |
| Lint                          | `npm run lint` passed.                                                                                                 |
| TypeScript                    | `npm run typecheck` passed for shared packages, server, modules, and web.                                              |
| Unit tests                    | 5 files and 9 tests passed.                                                                                            |
| Memory integration tests      | 2 files and 4 workflow tests passed.                                                                                   |
| Foundation package            | Valid, 2 nodes and 0 relations.                                                                                        |
| Grade 8 package               | Valid, 110 nodes and 170 relations.                                                                                    |
| Grade 11 package              | Valid, 26 nodes and 17 relations.                                                                                      |
| Project package               | Valid, 12 nodes and 11 relations.                                                                                      |
| Generated OpenAPI             | 74 paths and 88 operations generated in `docs/openapi.json`.                                                           |
| Production build              | Server/shared TypeScript and Vite production builds passed.                                                            |
| Production dependency audit   | `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.                                                  |
| Compiled-server smoke test    | Health, first-user bootstrap, demo loading, cookie session, and Today data passed against `apps/server/dist/index.js`. |

The compiled smoke test used the fixed Demo Clock `2026-09-15T08:00:00+02:00`, memory persistence in test mode, and confirmed the seeded next lesson `lesson.grade8.07`.

## Environment-limited checks

### Real MongoDB integration test

The MongoDB repository integration test is included and automatically runs when `MONGODB_TEST_URI` is available. It was skipped here because neither Docker nor a local `mongod` executable was installed.

Use the exact setup and troubleshooting guide in `docs/MONGODB-INTEGRATION-TESTS.md`.

### Docker build and startup

The repository includes `Dockerfile`, `docker-compose.yml`, replica-set initialization, health checks, and step-by-step instructions. The image could not be built in this environment because the `docker` command is unavailable.

### Playwright browser journey

The Playwright golden journey is included. Chromium was not present in the Playwright cache. Attempting `npx playwright install chromium` failed because this environment could not resolve `cdn.playwright.dev` (`EAI_AGAIN`). The browser suite was therefore not executed here.

Run locally with:

```bash
npx playwright install chromium
npm run test:e2e
```

## Build observation

Milkdown Crepe and its editor dependencies produce a large lazy-capable frontend payload and Vite emits a chunk-size warning. This is not a build failure. Crepe remains the required Complete MVP authoring surface. A later performance pass may route-split editor-heavy pages or narrow optional editor features without replacing the editor contract.

## Standard verification commands

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run generate:openapi
npm run package:validate -- content/foundation
npm run package:validate -- content/reference-grade8
npm run package:validate -- content/reference-grade11
npm run package:validate -- content/reference-projects
npm audit --omit=dev --audit-level=high
```
