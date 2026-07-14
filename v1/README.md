# Fonat

**Szálról szálra.**

Fonat is a source-available, single-teacher workspace connecting reusable educational content, curricula, annual plans, lesson execution, assessments, and learning evidence.

> Az oktatás minden szála egy helyen.  
> Every thread of teaching in one place.

## Status

This repository is the first one-shot MVP implementation. It contains a detailed Hungarian Grade 8 Pythagorean workspace, a lighter Grade 11 probability editing workspace, phone-based live quizzes, Presentation Mode, deterministic assessment findings, package import/export, and a modular mathematics foundation.

## Fastest local start

```bash
cp .env.example .env
# Replace SESSION_SECRET in .env
docker compose up --build
```

Open `http://localhost:3000`, create the first administrator, and choose **Load demonstration workspace**.

## Raw development

Requirements: Node.js 22 and Docker for MongoDB.

```bash
npm install
docker compose up -d mongodb mongo-init
npm run dev
```

The web application runs at `http://localhost:5173`; the API runs at `http://localhost:3000`.

Useful commands:

```bash
npm run validate
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run demo:reset
npm run db:indexes
npm run package:validate -- ./content/demo
```

## Demonstration student credentials

Classroom code: `FONAT8`

| Learner     | ID                  | Personal code |
| ----------- | ------------------- | ------------- |
| Vörös Panda | `learner.red-panda` | `demo1`       |
| Vidra       | `learner.otter`     | `demo2`       |
| Hiúz        | `learner.lynx`      | `demo3`       |
| Sün         | `learner.hedgehog`  | `demo4`       |
| Róka        | `learner.fox`       | `demo5`       |

A pre-seeded closed live session uses code `843921`; create a new open session from Presentation Mode for interactive testing.

## Deployment profiles

- **Vercel + MongoDB Atlas:** restricted assets, one Fastify function entry point, browser print-to-PDF.
- **Docker / Render:** conventional Node server, MongoDB, optional local filesystem assets.
- **Local raw development:** Vite and Fastify with Docker-managed MongoDB.

No cloud media upload provider is included in the MVP. Use tiny bundled SVGs or externally hosted links on restricted deployments.

## Documentation

- [Authoritative specification](docs/SPECIFICATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN-MODEL.md)
- [Extensions and contracts](docs/EXTENSIONS-AND-CONTRACTS.md)
- [Content authoring](docs/CONTENT-AUTHORING.md)
- [Deployment and operations](docs/DEPLOYMENT-AND-OPERATIONS.md)
- [Implementation deviations](docs/IMPLEMENTATION-DEVIATIONS.md)
- [Verification status](docs/VERIFICATION.md)
- [Security](SECURITY.md)
- [Project stewardship request](STEWARDSHIP.md)

## Licensing

Application code is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

Project-owned educational seed content and prose documentation are licensed under CC BY-NC-SA 4.0 unless a file or item says otherwise. Imported content retains its own per-item rights metadata. The Fonat name and visual identity are not licensed for commercial white-labelling.

## Project Stewardship Request

Large institutions, public authorities, platform operators, and commercial vendors are requested to contact the maintainer before institutional-scale integration, redistribution, or white-labelling. This request does not change the legal permissions granted by the licence. See [STEWARDSHIP.md](STEWARDSHIP.md).
