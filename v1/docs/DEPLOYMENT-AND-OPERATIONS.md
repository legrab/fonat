# Deployment and operations

This document covers the supported deployment profiles. The application uses MongoDB for persistence in all normal deployments; `PERSISTENCE_MODE=memory` is for tests only.

## Shared MongoDB Atlas cluster

Vercel, Render, and a local raw-development process can use the same MongoDB Atlas cluster. Create a separate Atlas database user for Fonat with `readWrite` access to the target database, then copy the driver connection string into `MONGODB_URI`. URL-encode special characters in the database-user password.

Atlas must allow connections from the deployment environments in its IP access list. Vercel and Render may not provide a small stable egress range on the plans used here; if an allow-all entry (`0.0.0.0/0`) is necessary, use a strong database credential and restrict it later when stable egress or private networking is available.

Use a different `MONGODB_DB` for each environment that should be isolated, for example `fonat-prod`, `fonat-render`, and `fonat-local`. Use the same database name only when the Vercel and Render services are intentionally sharing the same Fonat data. Fonat creates its indexes when it first connects; no migration command is required.

The first visit to the deployed URL opens the normal bootstrap flow. `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD` are optional and are not needed for the least-configuration setup. If both are supplied, the runtime creates that admin and loads the demo seed automatically; the generated admin must then change its password.

## Vercel + MongoDB Atlas

1. Import the repository into Vercel with the repository root as the project root.
2. Keep the checked-in `vercel.json` settings. It already selects `npm run build`, `apps/web/dist`, the single `api/index.ts` Fastify function, and the API/static rewrites. No `VITE_API_BASE` is needed because the web app calls the same-origin `/api` path.
3. Add these Production environment variables in the Vercel project, then redeploy:

   | Variable          | Value                                                                   |
   | ----------------- | ----------------------------------------------------------------------- |
   | `MONGODB_URI`     | The Atlas application connection string                                 |
   | `MONGODB_DB`      | The isolated database name, or `fonat` if sharing is intentional        |
   | `SESSION_SECRET`  | A new random secret; use at least 32 characters                         |
   | `ASSET_PROFILE`   | `hosted-restricted` (required; the application default is `local-rich`) |
   | `WEB_ORIGIN`      | The exact public Vercel URL, such as `https://fonat.example.com`        |
   | `PUBLIC_BASE_URL` | The same public Vercel URL                                              |
   | `NODE_ENV`        | `production`                                                            |

   `PERSISTENCE_MODE` already defaults to `mongo`; `MAX_PACKAGE_BYTES`, `MAX_UPLOAD_BYTES`, `LOCAL_ASSET_DIR`, and the bootstrap variables can remain unset. Do not use `local-rich` or depend on a writable filesystem on Vercel.

4. Open `/api/health` on the deployed URL and confirm `persistence` is `mongo` and `assetProfile` is `hosted-restricted`.
5. Open the root URL, create the first administrator, and optionally load the demonstration workspace.

For Preview deployments, add environment variables separately only if previews should run. Prefer a separate `MONGODB_DB` for Preview so it cannot modify Production data.

## Render + MongoDB Atlas

Use the checked-in [`render.yaml`](../render.yaml) as a Render Blueprint. It builds the repository `Dockerfile`, sets the production defaults, generates `SESSION_SECRET`, and already sets `ASSET_PROFILE=hosted-restricted`.

1. Create a Blueprint from the repository and select `render.yaml`.
2. When Render prompts for `sync: false` values, set `MONGODB_URI` and choose `MONGODB_DB` if the default `fonat` is not the intended database.
3. After the service URL is known, set `WEB_ORIGIN` and `PUBLIC_BASE_URL` to that exact HTTPS URL (or the custom domain), then redeploy.
4. Verify `/api/health`, then complete the first-admin bootstrap in the browser.

The Blueprint already supplies `NODE_ENV=production`, `PORT=3000`, `PERSISTENCE_MODE=mongo`, `MONGODB_DB=fonat`, `ASSET_PROFILE=hosted-restricted`, and a generated session secret. Do not add `LOCAL_ASSET_DIR` for this profile. Render's free service may sleep, and its filesystem is ephemeral; use bundled/sanitized or externally hosted media rather than relying on uploaded local files. Rich local media requires a persistent disk or an external asset provider, neither of which is part of this MVP configuration.

## Local Docker setup

This is the shortest fully local setup and does not require Node.js on the host for the running application.

1. Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a random development secret.
2. Start the included MongoDB 8 single-node replica set and the application:

   ```bash
   docker compose up --build
   ```

3. Open `http://localhost:3000`, create the first administrator, and select **Load demonstration workspace**.

The Compose file supplies the local service defaults, including `mongodb://mongodb:27017/?replicaSet=rs0`, `MONGODB_DB=fonat`, `PERSISTENCE_MODE=mongo`, `ASSET_PROFILE=local-rich`, and the mounted local-assets volume. The `.env` file is used for the Compose `SESSION_SECRET` override. Keep the MongoDB and asset volumes when stopping the stack if the data should be retained.

## Local non-Docker setup

This runs the Vite web app and Fastify server directly. Use Node.js 22, as declared by `.nvmrc` and the Dockerfile, and install MongoDB 8 locally or use the shared Atlas cluster.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`.
3. Choose one database:

   - For local MongoDB, run a single-node replica set named `rs0`, then keep the example `MONGODB_URI`. A typical setup is `mongod --dbpath <data-directory> --replSet rs0 --bind_ip 127.0.0.1` in one terminal, followed once by `mongosh --host 127.0.0.1:27017 --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'` in another.
   - For Atlas, set `MONGODB_URI` to the Atlas connection string, set `MONGODB_DB` to the intended isolated database, and ensure the current machine's IP is in the Atlas IP access list.

4. Set `SESSION_SECRET` to a random development secret. Keep `WEB_ORIGIN=http://localhost:5173`, `PUBLIC_BASE_URL=http://localhost:3000`, `PERSISTENCE_MODE=mongo`, and `ASSET_PROFILE=local-rich`.
5. Start both processes:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:5173`, create the first administrator, and optionally load the demonstration workspace. Vite proxies `/api` to the Fastify server at `http://localhost:3000`; no `VITE_API_BASE` setting is required.

For a production-like non-Docker run, use `npm run build` followed by `npm start` with the same environment variables and a public-facing `WEB_ORIGIN`/`PUBLIC_BASE_URL`.

The repository currently declares Node.js 24.x in `package.json` but Node.js 22 in `.nvmrc` and the Dockerfile. Local and Docker setup follow the latter; if Vercel exposes a manual Node.js runtime setting, use the `package.json` declaration. Align these declarations before standardizing on one runtime version.

## Reset and backup

Demo reset replaces seeded educational and runtime data but keeps users. Package and workspace exports are the portable ownership format. Database backups are infrastructure recovery, not the content contract.
