# MongoDB integration tests

The memory repository is used for fast application-service tests. It cannot prove MongoDB transactions, index behavior, cursor ordering, compare-and-swap updates, or atomic aggregate commands. The MongoDB integration suite covers those adapter-specific guarantees.

## Start an isolated replica set

Use the normal Compose database:

```bash
docker compose up -d mongodb mongo-init
```

Confirm initialization:

```bash
docker compose ps
```

The `mongo-init` container should exit successfully and `mongodb` should remain healthy.

## Run the tests

Linux, macOS, or Git Bash:

```bash
MONGODB_TEST_URI='mongodb://localhost:27017/fonat_test?replicaSet=rs0' npm run test:integration
```

PowerShell:

```powershell
$env:MONGODB_TEST_URI='mongodb://localhost:27017/fonat_test?replicaSet=rs0'
npm run test:integration
```

When `MONGODB_TEST_URI` is absent, the real-Mongo test is reported as skipped. A skipped test does not prove the MongoDB adapter.

## Isolation model

- Use a database dedicated to tests, such as `fonat_test`.
- The suite deletes only its dedicated test database or uniquely prefixed fixture records.
- Never point `MONGODB_TEST_URI` at a real Fonat database.
- Tests create indexes and apply the migration baseline before assertions.
- Each test uses deterministic IDs so a failed retry is diagnosable.

## What the suite should prove

- package writes commit or roll back as one bounded transaction,
- compare-and-swap rejects stale versions,
- stable tuple cursors neither repeat nor hide equal-sort-key records,
- live-session and answer commands do not lose concurrent updates,
- idempotency records prevent duplicate retry effects,
- revision lookups return the exact pinned revision,
- indexes required by list and relation queries exist,
- migration records are idempotent.

## Debugging

Inspect logs:

```bash
docker compose logs -f mongodb
```

Connect with `mongosh`:

```bash
docker compose exec mongodb mongosh 'mongodb://localhost:27017/fonat_test?replicaSet=rs0'
```

Useful checks:

```javascript
rs.status();
db.schemaMigrations.find().sort({ appliedAt: 1 });
db.nodes.getIndexes();
db.relations.getIndexes();
```

A transaction error usually means the replica set has not finished initializing or the URI omitted `replicaSet=rs0`. A timeout commonly means Docker's published port is unavailable. A duplicate-key failure usually indicates that the tested idempotency or stable-identity contract is not being honored.

## CI

Use a MongoDB service configured as a replica set, wait for primary election, and set `MONGODB_TEST_URI`. Do not replace this suite with a mocked Mongo driver. The adapter is the behavior under test.
