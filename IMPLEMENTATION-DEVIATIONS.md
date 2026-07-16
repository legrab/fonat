# Implementation deviations

This is a substantial runnable MVP modernized against the Version 4 specification, not a truthful claim that every product requirement is complete.

## Implemented vertical paths

- login, first-run bootstrap endpoint, server sessions, visible logout, cookie invalidation, disabled-user session invalidation;
- stable shell, explicit presentation leave/complete actions, 404 recovery;
- all six guided exercise types with Milkdown Crepe prompt/solution editors and learner preview;
- atomic blank-workspace onboarding for the first Subject, Group, learners, Location, Course, and Enrollments, plus guided organization editors;
- guided Concept/Resource material editing, actionable Library rows, named Relation management, and an Exercise catalogue with structured choice answers and Concept/evidence metadata;
- guided Annual Plan phases/coverage and a complete Lesson activity editor with explicit Exercise selection, teacher-only notes, scheduling fields, diagnostics, preview, and all presentation slide types;
- 24 Grade 8 concepts, 18 authored exercises, five learner fixtures, multiple lessons, evidence, findings, assignments, assessment blueprint, and the complete ten-slide demo sequence;
- live join code, scoped participant token, idempotent answer acceptance, polling, response table, teacher reveal, privacy-safe nickname leaderboard;
- mutable assignment draft, immutable attempts, return/resubmit/accept flow;
- guided Assignment draft/issue editing with real Course/Exercise selectors, attempt policy, formatted review, editable feedback, and named learner context;
- deterministic A/B assessment delivery with copied question snapshots, submission, grading, and grade entry;
- guided Assessment Blueprint slots, eligibility/shortfall preview, selected learner delivery, deterministic Concept-based filling, explained manual overrides, print styling, and linked follow-up findings;
- feature-toggled Project route and original Mushroom Yard fixture;
- React/Vite, Fastify, Zod, official MongoDB driver, TanStack Query/Table, React Hook Form, Milkdown Crepe, KaTeX, Mafs, dnd-kit, Playwright configuration;
- Docker, Vercel, Render, OpenAPI generation, package manifests, brand assets, and required documentation set.
- file-backed searchable Markdown manual with GFM, KaTeX, stable contextual-help routes, complete teacher terminology, workflow guides, troubleshooting, tips, and link/glossary validation tests;
- accessible unsaved-change protection for setup and the core organization, material, exercise, annual-plan, lesson, assignment, and assessment editors, including refresh/close protection and explicit stay/discard actions;
- centralized connection and editor save-state feedback, typed retryable offline/network failures, duplicate-save prevention, and an authentication-safe reconnect screen without automatic offline writes;

## Partial or deferred from the specification

1. **Persistence granularity:** MongoDB stores a bounded optimistic workspace snapshot, not separate aggregate collections with transaction-specific repositories. This is the largest architectural deviation. It preserves end-to-end behavior but is unsuitable for large collections and high concurrency.
2. **Package ZIP staging:** manifests and validation exist, but safe ZIP expansion, MIME checks, staging diff, transactional package update, and round-trip export are not complete.
3. **Revision model:** published exercise revision counters and immutable assessment snapshots exist. Full canonical revision records, scheduled impact notices, package-owned forks, and cross-workflow revision resolution are incomplete.
4. **Blank onboarding depth:** the guided setup creates the first real Subject, Group, learners, Location, Course, and Enrollments atomically without demo IDs. Foundation-package application and embedding the first Concept, Exercise, and Lesson directly in the wizard remain incomplete; the Today quick-start actions lead into their real editors instead.
5. **Organization depth:** guided Group, learner, Course, and Location editors work, but historical roster resolution, explicit inclusion/exclusion, bulk roster correction, and full timetable recurrence/override editing remain simplified.
6. **Assessment sophistication:** deterministic Concept-slot delivery, A/B labels, shortfall preview, grading, explained manual override, Grade Entries, print styling, and basic follow-up Findings work. Broader source filters, meaningful equivalent ranking beyond deterministic eligible selection, interactive shortfall remediation, regrade impact preview, and the full five-analyzer cohort pipeline remain incomplete.
7. **Content package volume:** the runtime demo contains the important Grade 8 catalogue. The on-disk packages are contract examples rather than complete exported mirrors of every fixture.
8. **Authorization and CSRF:** role data, protected routes, secure cookie policy, origin checks, and rate limits exist. Fine-grained capabilities and an explicit CSRF token mechanism are incomplete.
9. **Server route decomposition:** feature ownership folders are present, but the Fastify application factory remains large. Extract routes/use cases when a second implementation cycle begins.
10. **Real Mongo and browser verification:** configuration and tests are included. Docker was unavailable in the generation environment. Playwright’s bundled Chromium is not installed and could not be downloaded because external DNS was unavailable, so the checked-in Playwright suite could not launch here. The same rendered path was manually verified with the in-app browser for login, exercise hydration, manual search and contextual help, presentation pause/escape, logout, unsaved-change handling, and online save-state feedback; the production server was also smoke-tested over HTTP for health, static delivery, authenticated Today data, and session cookies. The checked-in Playwright connection-loss scenario covers offline indication, retained form state, failed-save feedback, reconnection, and retry, but could only be listed rather than launched in this environment.
11. **Localization:** Hungarian UI is the default, with English content fields in package contracts. Full i18next namespaces and complete English UI are not implemented.
12. **Assets:** bundled SVG and external-link records work. Local filesystem rich-media provider and YouTube structured record are only documented foundations.

These deviations favor the specification's priority order: usable navigation, historical delivery snapshots, connected workflows, safe failure, reproducible builds, then extensibility and polish.

## Version 4 toolchain status

The Node.js 24, npm 11, portable-lockfile, production-smoke, dependency-audit, and clean-runtime requirements added in Version 4 are implemented. The application ZIP import/export feature remains incomplete, so no runtime `archiver` dependency is included. See `docs/DEPENDENCY-REVIEW.md` and `docs/VERIFICATION.md`.
