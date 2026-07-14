# Dependency review for the v4 variant

The v4 modernization was performed under Node.js 24.18.0 and npm 11.16.0.

## Deliberate upgrades

The production dependency audit of the v3 implementation found high-severity advisories in Fastify and React Router, plus vulnerable static-serving dependencies. The v4 variant upgrades and verifies:

- Fastify 5.10.0 and compatible Fastify plugins;
- `@fastify/static` 10.1.0 and `@fastify/swagger-ui` 6.1.0;
- React Router DOM 7.18.1;
- MongoDB driver 7.5.0;
- Zod 4.4.3;
- Milkdown Crepe 7.21.3;
- React and React DOM 19.2.7;
- Vitest 3.2.7, using the fork pool for stable Node.js 24 execution;
- Node.js type definitions 24.13.3;
- tsx 4.23.1 and tsup 8.5.1.

`npm audit --omit=dev` reports zero vulnerabilities after this pass.

## Archive packages

The current runtime does not create or extract ZIP files. Therefore it does not depend on `archiver`, and no stale Archiver version is present in `package.json` or `package-lock.json`. The incomplete package ZIP import/export workflow remains listed as a deviation. When implemented, ZIP creation must use the then-current maintained Archiver major, while extraction must use a separate maintained streaming reader with Fonat-owned bounded safety checks.

The downloadable source ZIP is created by the release environment, not by application runtime code.

## npm 11 lifecycle scripts

npm 11 requires explicit approval for dependency lifecycle scripts. The repository approves only the exact esbuild versions present in the lockfile. This is required for clean Vite and tsup builds and avoids an interactive or machine-local approval step during `npm ci`.

## Deferred broad upgrades

Major upgrades such as Vite 8 and TypeScript 7 were not applied merely because they are newer. They should be evaluated separately with migration notes and full browser/build verification. `npm outdated` is informational and is not treated as permission for indiscriminate upgrades.
