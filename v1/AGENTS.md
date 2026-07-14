# Fonat agent guidance

Read `docs/SPECIFICATION.md` before material product changes. Preserve the golden workflow before adding breadth.

## Commands

- `npm run validate`: full local validation.
- `npm run test:integration`: service and API integration tests.
- `npm run test:e2e`: browser journeys.
- `npm run demo:reset`: replace educational demo data while preserving users.

## Architecture rules

- Domain and contracts must not import React, Fastify, MongoDB, Vercel, or Render.
- Expected failures use the Result pattern. Exceptions are for programming faults and unexpected infrastructure failures.
- Capability modules register through manifests at build time. Do not add runtime executable plugins.
- Large collections use server-side queries and bounded pages.
- Do not silently relax assessment or import constraints.
- Keep advanced options out of the default teacher path.
- No inert buttons, fake analytics, or hidden best-effort fallbacks.

Nested `AGENTS.md` files may add local constraints. Read the nearest relevant file for every touched path.
