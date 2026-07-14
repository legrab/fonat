# Architecture

Fonat is a TypeScript modular monolith with one React/Vite application and one conventional Fastify server. Vercel wraps the same Fastify application in one function; Docker and Render run it as a persistent process.

## Dependency direction

```text
contracts and domain
        ↑
application services and capability contracts
        ↑
MongoDB, Fastify, React, Vercel and Docker adapters
        ↑
composition roots
```

The educational graph uses one `nodes` collection, one `relations` collection, and a `revisions` collection. Operational data with materially different volume or lifecycle uses dedicated collections: users, sessions, learners, classroom access, lesson runs, live sessions, submissions, evidence, activity, notifications, and assessment instances.

Node types have a common graph envelope and validated type-specific payloads. This is composition, not a class hierarchy or entity-attribute-value system.

## Extension points

- build-time capability module manifests
- registered relation contracts
- lesson validator pipeline
- deterministic assessment analyzer pipeline
- grading handlers
- resource renderers
- content package contracts
- asset capability profile

The MVP proves these with core and mathematics modules. It does not include a runtime plugin installer.

## Result pattern

Expected failures return typed Results at application and HTTP boundaries. Security failures fail closed. Exceptions are logged and converted only at outer boundaries.

## Deployment

Docker is the authoritative acceptance environment. Vercel uses one Node function entry point and restricted assets. Render consumes the same Docker image.
