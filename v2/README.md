# Fonat

**Szálról szálra.**

Fonat is a source-available educational workspace for teachers. It connects reusable content, curriculum requirements, annual and weekly planning, lesson execution, assignments, assessments, student evidence, and later improvement into one traceable system.

> Az oktatás minden szála egy helyen.  
> Every thread of teaching in one place.

## What this repository contains

This is the v2 one-shot MVP implementation. It includes:

- blank-instance onboarding and a small built-in foundation package,
- Subjects, Concepts, Resources, Exercises, typed Relations, revisions, and rights metadata,
- Learner Groups, Courses, Enrollments, Teaching Locations, and a teacher weekly timetable,
- Annual Plans, Phases, lesson assembly, accessible drag-and-drop, diagnostics, and Presentation Mode,
- QR-based live quizzes with scoped participant credentials,
- Assignments, server-side answer drafts, immutable submissions, corrections, and evidence,
- Assessment Blueprints, deterministic per-student deliveries, stable option order, reduced coverage, grading, and findings,
- package-backed Grade 8 and Grade 11 reference workspaces,
- an isolated, feature-toggled Project foundation with the Mushroom Yard escape-room example,
- Milkdown Crepe rich Markdown editing with KaTeX,
- local Docker, Vercel, and Render deployment profiles.

The default interface language is Hungarian. English is the source and fallback locale.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop or Docker Engine with Compose for the recommended local environment
- MongoDB Atlas for Vercel or Render deployment

Do not commit `.env` or real credentials.

## Project inputs

The opinionated defaults are in `.env.example`:

```dotenv
DEMO_CLOCK=2026-09-15T08:00:00+02:00
SCHOOL_TIMEZONE=Europe/Budapest
DEFAULT_LOCALE=hu
FEATURE_PROJECTS=true
```

`DEMO_CLOCK` controls all reference-workspace dates and deterministic time-dependent tests. `SCHOOL_TIMEZONE` is an IANA timezone and is used for school dates and intended wall-clock schedules. Operational events are stored as UTC instants.

The default visual preset is **Lavender Workshop**. Its semantic tokens are centralized in `apps/web/src/styles/tokens.css`. The alternative **Forest Paper** token set is documented in `docs/BRAND.md`.

## Fastest start: local Docker

Docker Compose starts Fonat and MongoDB 8 as a single-node replica set. The replica set is required for transactional package import and realistic MongoDB integration behavior.

### 1. Create the environment file

```bash
cp .env.example .env
```

Generate a session secret of at least 32 random bytes.

Linux, macOS, or Git Bash:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Paste the value into `.env`:

```dotenv
SESSION_SECRET=<generated-value>
```

### 2. Build and start

```bash
docker compose up --build
```

Open:

- application: `http://localhost:3000`
- health check: `http://localhost:3000/api/health`
- OpenAPI UI in the local profile: `http://localhost:3000/documentation`

### 3. Complete first-run setup

1. Create the first administrator account.
2. Choose either:
   - **Start with the foundation package** for a blank real workspace, or
   - **Load the demonstration workspace** for the full Grade 8 and Grade 11 examples.
3. The Project capability is enabled in the local demo profile. It can be disabled with `FEATURE_PROJECTS=false` without deleting Project data.

### Useful Docker commands

```bash
# Follow application logs
docker compose logs -f fonat

# Stop services but keep data
docker compose down

# Rebuild after dependency or Dockerfile changes
docker compose up --build

# Remove local database and asset volumes permanently
docker compose down -v
```

## Raw development

The recommended raw-development setup runs Vite and Fastify directly while MongoDB stays in Docker.

### 1. Install dependencies

```bash
npm ci
```

### 2. Start MongoDB and initialize the replica set

```bash
docker compose up -d mongodb mongo-init
```

Wait until `mongo-init` exits successfully:

```bash
docker compose ps
```

### 3. Configure the development environment

```bash
cp .env.example .env
```

The example URI expects the Docker-published MongoDB port:

```dotenv
MONGODB_URI=mongodb://localhost:27017/fonat?replicaSet=rs0
WEB_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
```

Replace `SESSION_SECRET` before starting.

### 4. Run the applications

```bash
npm run dev
```

- Vite: `http://localhost:5173`
- Fastify API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/documentation`

## MongoDB Atlas preparation

Vercel and Render use MongoDB Atlas rather than the local Compose database.

1. Create an Atlas project and a cluster.
2. Create a dedicated database user. Database users are separate from Atlas web-console users.
3. Open **Network Access** and add an IP access-list entry.
4. Copy the driver connection string and replace its username, password, and database placeholders.
5. Use `fonat` as `MONGODB_DB`, or choose another database name explicitly.

Vercel uses dynamic outbound addresses. The simplest free-tier setup is an Atlas `0.0.0.0/0` access-list entry combined with a strong unique database password and least-privilege database user. For a stricter production environment, use networking features appropriate to the chosen paid deployment rather than assuming fixed Vercel egress addresses.

Example variable:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<encoded-password>@<cluster-host>/fonat?retryWrites=true&w=majority
```

Percent-encode special characters in the username or password.

## Deploy to Vercel

Fonat deploys the Vite application and one Fastify Function from the repository root. `vercel.json` contains the build, output, function, and rewrite configuration.

### 1. Import the repository

In Vercel:

1. Select **Add New Project**.
2. Import the Git repository.
3. Set **Root Directory** to the repository root. Do not select `apps/web` or `apps/server`.

### 2. Configure build settings

Use these values if Vercel does not adopt the checked-in configuration automatically:

| Setting          | Value                  |
| ---------------- | ---------------------- |
| Framework Preset | **Other**              |
| Node.js Version  | **24.x**               |
| Install Command  | `npm ci --include=dev` |
| Build Command    | `npm run build`        |
| Output Directory | `apps/web/dist`        |

Do not select the Vite preset for this combined project. The repository contains both a Vite frontend and a Fastify backend, and the checked-in `vercel.json` is the authoritative adapter.

No Development Command is required for deployment. `--include=dev` is intentional because the build uses TypeScript and declaration packages from `devDependencies`, while `NODE_ENV=production` would otherwise make npm omit them.

### 3. Add environment variables

Set these at least for the Production environment:

```dotenv
NODE_ENV=production
PERSISTENCE_MODE=mongo
MONGODB_URI=<atlas-driver-uri>
MONGODB_DB=fonat
SESSION_SECRET=<at-least-32-random-bytes>
WEB_ORIGIN=https://<your-vercel-domain>
PUBLIC_BASE_URL=https://<your-vercel-domain>
ASSET_PROFILE=hosted-restricted
DEMO_CLOCK=2026-09-15T08:00:00+02:00
SCHOOL_TIMEZONE=Europe/Budapest
DEFAULT_LOCALE=hu
FEATURE_PROJECTS=false
ENABLE_SWAGGER=false
```

Use the exact public origin, without a trailing slash. Add custom domains to `WEB_ORIGIN` as a comma-separated list if required.

For Preview deployments, either configure the preview origin deliberately or use production-only authentication testing. Cookie-session origin checks are intentionally strict and do not trust arbitrary preview hosts.

### 4. Deploy and verify

After deployment:

1. Open `https://<domain>/api/health`.
2. Confirm `persistence` is `mongo` and the database is reachable.
3. Open `https://<domain>/api/setup/status`.
4. Open the normal application URL and create the first administrator.
5. Load the foundation or demo workspace.

Fonat fails production startup when the session secret, persistence mode, origin, or asset profile is unsafe or incomplete. Do not work around these checks with development defaults.

### Vercel limitations

The Vercel profile intentionally uses:

- one Fastify Function,
- MongoDB Atlas,
- small bundled SVG/image assets and external links,
- browser print and Save as PDF,
- no general local file uploads,
- bounded package uploads and synchronous operations.

## Deploy to Render

`render.yaml` defines one Docker web service. Render uses the same production image as local Docker, but the hosted service connects to MongoDB Atlas.

### 1. Prepare Atlas

Complete the MongoDB Atlas steps above and retain the connection string.

### 2. Create a Blueprint

1. In Render, choose **New** and then **Blueprint**.
2. Connect the Git repository.
3. Use the repository-root `render.yaml`.
4. Confirm the service runtime is Docker and the Dockerfile path is `./Dockerfile`.

### 3. Set the required environment variables

Render generates `SESSION_SECRET`. Enter the unsynced values when prompted:

```dotenv
MONGODB_URI=<atlas-driver-uri>
WEB_ORIGIN=https://<your-render-service>.onrender.com
PUBLIC_BASE_URL=https://<your-render-service>.onrender.com
```

The Blueprint already sets:

- `NODE_ENV=production`
- `PERSISTENCE_MODE=mongo`
- `ASSET_PROFILE=hosted-restricted`
- `MONGODB_DB=fonat`
- timezone, locale, Demo Clock, Project toggle, and Swagger policy.

The server listens on Render's `PORT` through the ordinary Docker entry point.

### 4. Deploy and verify

1. Wait for the Docker build and health check to pass.
2. Open `/api/health`.
3. Open `/api/setup/status`.
4. Create the first administrator through the application.
5. Load the foundation or demo workspace.

Free Render services may sleep after inactivity. This is acceptable for evaluation but can delay the first classroom request. The local Docker profile remains the authoritative always-on acceptance environment.

## Validation and testing

```bash
# Formatting, lint, type checks, unit tests, and production build
npm run validate

# API and workflow integration tests
npm run test:integration

# Real MongoDB repository tests
MONGODB_TEST_URI='mongodb://localhost:27017/fonat_test?replicaSet=rs0' npm run test:integration

# Browser journeys
npx playwright install chromium
npm run test:e2e

# Generate OpenAPI from runtime schemas
npm run generate:openapi

# Validate content packages
npm run package:validate -- ./content/foundation
npm run package:validate -- ./content/reference-grade8
npm run package:validate -- ./content/reference-grade11
npm run package:validate -- ./content/reference-projects
```

Detailed MongoDB-test setup and failure interpretation are in `docs/MONGODB-INTEGRATION-TESTS.md`.

## Operational commands

```bash
# Reapply demo data while preserving user accounts
npm run demo:reset

# Create or repair MongoDB indexes and run the migration baseline
npm run db:indexes

# Generate the build-time capability registry
npm run generate:modules

# Start the compiled production server
npm run build
npm start
```

## Demonstration access

The Grade 8 reference workspace uses the classroom access code `FONAT8` and these personal demo secrets:

| Learner     | Personal code |
| ----------- | ------------- |
| Vörös Panda | `demo1`       |
| Vidra       | `demo2`       |
| Hiúz        | `demo3`       |
| Sün         | `demo4`       |
| Róka        | `demo5`       |

Demo credentials are for local/reference use only. Replace or reset them before retaining real learner records.

## Repository map

```text
apps/web                 React/Vite teacher, student, presentation, and admin UI
apps/server              Fastify server and deployment adapters
packages/contracts       runtime schemas and portable contracts
packages/application     shared use-case helpers and transition/concurrency primitives
packages/domain          framework-independent educational behavior
packages/content-*       package validation and CLI
packages/module-registry generated installed-capability registry
modules/core             core graph, planning, validation, and exercise contracts
modules/math             mathematics grading, plotting, and exercise-family behavior
modules/projects         isolated feature-toggled Project capability
content                  foundation and reference content packages
docs                     architecture, domain, operations, verification, and specification
```

## Documentation

- [v2 specification](docs/SPECIFICATION-V2.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN-MODEL.md)
- [Extensions and contracts](docs/EXTENSIONS-AND-CONTRACTS.md)
- [Content authoring](docs/CONTENT-AUTHORING.md)
- [Deployment and operations](docs/DEPLOYMENT-AND-OPERATIONS.md)
- [MongoDB integration tests](docs/MONGODB-INTEGRATION-TESTS.md)
- [Brand assets](docs/BRAND.md)
- [Implementation deviations](docs/IMPLEMENTATION-DEVIATIONS.md)
- [Verification status](docs/VERIFICATION.md)
- [Security](SECURITY.md)
- [Content rights](CONTENT-RIGHTS.md)
- [Project stewardship request](STEWARDSHIP.md)

## Licensing

Application code, executable module examples, the CLI, and schemas are licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

Project-owned educational seed content and prose documentation are licensed under CC BY-NC-SA 4.0 unless an item states otherwise. Imported content retains its own rights metadata. The Fonat name and visual identity are reserved for separate permission.

The nonbinding stewardship request in [STEWARDSHIP.md](STEWARDSHIP.md) does not alter the licence.
