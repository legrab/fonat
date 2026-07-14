# Implementation deviations and bounded foundations

The repository implements the v2 golden workflow and records the following deliberate boundaries honestly.

1. **Public GitHub Content Source:** ZIP package import/export, contracts, CLI, repository template, and CI example are present. The public GitHub browsing UI remains a Functional Foundation.
2. **Rubrics:** the registered Node type and lightweight grading contract are present. A broad reusable rubric library and analytics remain post-MVP.
3. **Projects:** the isolated, feature-toggled Project slice has schema, package, relation support, minimal editor/detail UI, and the Mushroom Yard fixture. It intentionally has no custom scheduling, progress engine, room allocation, or collaborative canvas.
4. **Revision propagation:** exact revisions, snapshots, impact information, and manual updates are implemented. Automatic and bulk propagation remain deferred.
5. **Rich media:** bundled SVGs, small images, external providers, and local asset contracts are supported. Cloud object storage, uploaded video, transcoding, and thumbnail pipelines are deferred.
6. **PDF:** print-ready HTML and browser Save as PDF are the guaranteed path. Server-side Chromium PDF remains a local deployment foundation.
7. **Offline behavior:** loaded Presentation content and local timers remain usable during a brief interruption. A general offline write queue and reconciliation engine are deferred.
8. **Multi-teacher scope:** account creation, role assignment, disable/reset, ownership fields, and capability checks are present. Simultaneous collaborative editing and granular per-node ACLs are deferred.
9. **Guest identity claiming:** live guests receive scoped session credentials. Merging guest history into a permanent Learner Profile is deferred.
10. **Assessment optimization:** deterministic constrained selection, stable deliveries, reduced coverage, and explicit shortfalls are implemented. Global optimization and sophisticated multi-assessment balancing are deferred.
11. **Analyzer breadth:** the pipeline is deliberately small and deterministic. It is designed for additional analyzers rather than claiming comprehensive educational diagnosis.
12. **Legacy compatibility slice:** a limited set of v1 routes and seed identifiers remains so the mature lesson, presentation, live-quiz, and analyzer workflows can coexist with the v2 organization model. New teacher-facing organization UI uses Course, Learner Group, Enrollment, and Teaching Location. The legacy compatibility layer is isolated and documented for later removal after package migration.
13. **OpenAPI coverage:** a generated OpenAPI artifact and Swagger endpoint are included. New feature slices use runtime Zod validation, but not every retained compatibility route has exhaustive response schemas yet.
14. **Password hashing:** Node `scrypt` is used with versioned algorithm parameters, random salts, constant-time comparison, and opportunistic rehashing. This avoids native-binary deployment risk while retaining a memory-hard password derivation function.
