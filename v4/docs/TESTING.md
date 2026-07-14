# Testing

`npm test` runs unit and Fastify injection tests. `npm run test:e2e` runs Playwright against a started web/server pair.

For real MongoDB integration:

```bash
docker compose up -d mongo
MONGODB_URI='mongodb://localhost:27017/?replicaSet=rs0' npm run test:integration
```

Use a unique `MONGODB_DB` per worker or run. Remove the database after success; retain it after failure for inspection. A transaction/replica-set error usually means initiation has not completed or the URI omitted `replicaSet=rs0`. Memory tests prove workflow logic but cannot prove MongoDB compare-and-swap or transaction semantics.
