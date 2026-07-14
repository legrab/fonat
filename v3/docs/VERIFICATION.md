# Verification

## Executed during generation

Passed:

```text
npm install
npm run format:check
npm run typecheck
npm test                       # 6/6 unit and API tests
npm run test:integration       # 3/3 API tests after packaging fixes
npm run package:validate       # 4/4 content packages
npm run openapi:generate
npm run demo:reset
npm run build                  # Vite and bundled Fastify server
node apps/server/dist/dev.js   # HTTP smoke: health, static UI, login, Today
```

The production smoke found and drove fixes for two packaging defects: workspace TypeScript dependencies were initially left external from the server bundle, and static frontend routes were initially protected by the API authentication hook.

Not executable in this environment:

- Docker was not installed, so replica-set startup and Mongo integration smoke were not run.
- Playwright’s browser download failed because external DNS was unavailable. The installed system Chromium is managed with `URLBlocklist: ["*"]`, so it cannot navigate even to localhost. The Playwright test is included but must be rerun elsewhere.

## Reproduce

```bash
npm ci
npm run package:validate
npm run openapi:generate
npm run validate
npx playwright install chromium
npm run test:e2e
```

Where Docker exists, also run `docker compose up --build`, verify `/api/health`, complete the live-quiz flow in two browser contexts, then test logout and rejection of the prior cookie. Record machine-specific failures rather than marking them passed.
