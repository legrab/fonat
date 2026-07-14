# Deployment and operations

## Vercel

Use `vercel.json`, one Fastify function, MongoDB Atlas, and the hosted-restricted asset profile. Keep packages below configured limits. Browser print is the guaranteed PDF path.

## Docker

`docker compose up --build` starts MongoDB as a single-node replica set and Fonat as a conventional server. Local assets use a mounted volume.

## Render

`render.yaml` uses the Docker image. Free services may sleep. Configure an external MongoDB URI and the public origins.

## Reset and backup

Demo reset replaces seeded educational and runtime data but keeps users. Package and workspace exports are the portable ownership format. Database backups are infrastructure recovery, not the content contract.
