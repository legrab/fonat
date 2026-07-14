# Architecture

Fonat v2 is a TypeScript modular monolith with one React/Vite application and one conventional Fastify server. Vercel wraps the same Fastify application in one Node function. Docker and Render run the identical server as a persistent process.

## Dependency direction

```text
contracts and domain
        ↑
feature-slice application services and capability contracts
        ↑
MongoDB, Fastify, React, Vercel and Docker adapters
        ↑
composition roots
```

Fastify routes authenticate, validate transport input, call one application service, and map a typed Result. Domain state transitions and pedagogical decisions belong in the feature slice, not in routes, React pages, or repositories.

## Educational graph and embedded values

Independently reusable or addressable educational objects are graph Nodes. Examples include Concepts, Curriculum Requirements, Resources, Exercises, Rubrics, Collections, Teaching Profiles, Blueprints, Layouts, Activity Templates, Assessments, Projects, Subjects, and reusable plans.

Parent-owned structures remain embedded value objects with stable local IDs. Examples include Lesson Sections, contextual Activities, Slides, Assessment slots, grading details, and option permutations. They become Nodes only when independent reuse, relations, revisioning, ownership, or search justify promotion.

MongoDB uses `nodes`, `relations`, and `revisions` for the reusable graph. Operational records with distinct lifecycle or write patterns use dedicated collections, including users, sessions, learner profiles, learner groups, enrollments, courses, teaching locations, timetable entries, assignments, drafts, submissions, assessment deliveries, lesson runs, live sessions, evidence, grades, activity, notifications, idempotency records, and migrations.

## Revision and delivery resolution

Publishing a Node creates an immutable revision. Scheduled and completed Lessons pin exact revisions. Lesson Runs resolve and store the Lesson revision plus bounded snapshots of referenced content. Assessment Deliveries store the strategy ID and version, seed, selected exact Exercise revisions, option order, and immutable question snapshots. Historical records never depend on rerunning a later algorithm version.

## Concurrency

Editable records use a numeric version and compare-and-swap updates. Stale writes return a typed Conflict. Retry-prone operations use explicit idempotency keys or deterministic identities. Active aggregate updates are transactional or version-guarded. This is deliberately smaller than a general distributed locking framework.

## Capability modules

Installed executable modules expose static `manifest`, `shared`, `server`, and `web` entry points as needed. The build generates one module registry and TypeScript identifier unions. Runtime content packages can use only registered Node, relation, renderer, validator, grader, generator, and analyzer identifiers. Content packages cannot introduce executable code.

The isolated Project capability is enabled in demo and development profiles and disabled in blank production by default. Disabling a capability hides routes and navigation, preserves data, and returns explicit unsupported-capability Results when encountered.

## Search and pagination

Node envelopes contain bounded denormalized search text generated from module-defined payload projections. Native MongoDB indexes are the common baseline for local Docker and Atlas. Cursor tokens carry the complete stable sort tuple rather than only a non-unique date. Collection UIs page incrementally and do not assume a fixed first batch.

## Result pattern

Expected failures use typed Results at domain, application, and HTTP boundaries. Guard clauses reject invalid states early. Security failures fail closed. Exceptions represent programming or unexpected infrastructure failures and are converted only at the outer boundary.

## Time

The Clock adapter separates UTC instants, date-only school dates, local wall-clock values, and zoned schedules. Operational timestamps are UTC instants. Recurring lesson times retain local wall-clock time and an IANA timezone so daylight-saving changes do not shift intended lesson time. Demo behavior uses the fixed configured Demo Clock.

## Deployment

Local Docker with a single-node MongoDB replica set is the authoritative full-stack acceptance profile. Vercel uses one Node function and restricted assets. Render consumes the same Docker image. Production configuration fails closed for memory persistence, weak or default secrets, invalid public origins, and incompatible asset profiles.
