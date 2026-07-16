# Post-core MVP findings plan

Status: detached follow-up backlog  
Execution order: after the gates in [TEACHER-EDITING-AND-MANUAL-PLAN.md](./TEACHER-EDITING-AND-MANUAL-PLAN.md)  
Scope: findings that improve coherence, depth, resilience, and polish without blocking the first teacher setup-to-insight loop

## 1. Purpose and triage rule

This plan records useful findings that do not belong in the critical teacher-flow plan. It is intentionally broader and less coupled: items may be selected independently after the core MVP is usable.

Before implementing an item, recheck its impact. If it can cause data loss, break logout/navigation/presentation/live acknowledgement, alter delivered history, or prevent a teacher from completing a core journey, promote it to the core plan instead of treating it as polish.

Priority labels:

- **S1 — solidify:** high-value work for the first hardening cycle after core MVP acceptance;
- **S2 — deepen:** worthwhile product or engineering depth after S1;
- **S3 — explore:** optional or strategic work that needs separate discovery.

## 2. Findings register

### 2.1 Information architecture and navigation

#### F-IA-01 — Group navigation by teacher intent (S1)

The current sidebar is a flat list mixing daily work, creation shortcuts, outcomes, projects, administration, and help. Several implemented routes—Courses, Groups, Learners, Locations, and Annual Plans—are not exposed, while `Új feladat` receives a permanent top-level slot.

After the core editors settle, reorganize the shell into stable groups such as Today, Plan, Teach, Review, Library, and Workspace. Use a single Create action for context-aware creation rather than one privileged direct shortcut. Preserve current route compatibility and presentation escape paths.

Acceptance notes:

- active state works for list, detail, create, and nested manual routes;
- collapsed and narrow-screen navigation remains keyboard accessible;
- no destination disappears solely because a feature flag is off; it is either hidden intentionally or explained as unavailable;
- a teacher can still reach logout and learner join without scrolling through a long content menu.

#### F-IA-02 — Replace raw pathname headings with route metadata (S1)

The top bar currently shows values such as `/guide` and `/lessons/lesson.demo-presentation`. Introduce typed route metadata/breadcrumbs so the shell displays localized entity names and parent context. Avoid duplicating a second page title when the page already supplies one.

#### F-IA-03 — Clarify Library versus Assignments naming (S1)

The Hungarian label `Feladatok` can mean reusable Exercises or assigned work, while `Új feladat` creates an Exercise and `Feladatok` opens Assignments. Validate terminology with teachers and use distinct, consistently applied labels such as reusable exercise/task versus assignment. Update routes only if redirects preserve bookmarks.

#### F-IA-04 — Cross-entity recents, favorites, and command navigation (S3)

Once normal lists and search are reliable, explore recent items, pinned/favorite materials, and a keyboard command/search surface. Do not build this before list discoverability and permissions have stable semantics.

### 2.2 Visual, responsive, and interaction polish

#### F-UX-01 — Responsive shell and dense-editor layouts (S1)

Audit sidebar, table overflow, split previews, drag handles, and presentation controls at common laptop, tablet, and phone widths. Use the narrow layout for review and emergency lesson control, not only learner pages. Reset any temporary test viewport and add visual/browser coverage at agreed breakpoints.

#### F-UX-02 — Accessibility pass (S1)

- verify logical heading hierarchy and landmarks;
- provide visible focus states and skip-to-content;
- ensure error summaries announce and focus invalid fields;
- label icon-only move/drag actions with item context;
- provide keyboard alternatives for drag/drop;
- review contrast for chips, warnings, muted text, disabled states, and projected content;
- expose tables, live response counts, timers, and save state to assistive technology;
- honor reduced motion and avoid color-only status communication.

Use automated checks as a floor and complete keyboard/screen-reader-oriented manual checks for critical pages.

#### F-UX-03 — Standard feedback and destructive-action language (S1)

Unify success, saving, warning, conflict, empty, error, and retry presentations. Replace browser-default or absent confirmations with focused dialogs for archive, discard, reset, assignment issue, assessment generation, reveal, and completion where consequences warrant them. Avoid notification noise for routine autosaves.

#### F-UX-04 — Status and date presentation (S1)

The UI currently exposes codes including `published`, `assigned`, `warning`, and ISO dates. Create shared Hungarian labels, status semantics, and locale/timezone-aware formatters. Show relative context only alongside an unambiguous date/time where deadlines or schedules matter.

#### F-UX-05 — Deliberate empty and loading states (S2)

Replace generic `Betöltés…`, blank sections, and demo-oriented prompts with skeletons or small state components that explain what is loading, what an empty list means, and the next valid action. Preserve errors instead of turning them into emptiness.

#### F-UX-06 — Visual consistency audit (S2)

After component behavior stabilizes, audit typography, spacing, form widths, card density, table alignment, action hierarchy, chip semantics, editor chrome, projected content, print styles, and dark-theme readiness. Consolidate repeated CSS patterns without introducing a parallel design framework.

### 2.3 Internationalization and content language

#### F-I18N-01 — Remove mixed-language product copy (S1)

Visible copy currently mixes Hungarian with `Today`, `Fonat Guide`, `Deterministic delivery`, raw slide types, status codes, and English error message keys. Complete one coherent Hungarian MVP vocabulary first. Keep canonical English terms in the manual where they aid package or API understanding.

#### F-I18N-02 — Introduce localization boundaries (S2)

Move UI strings, status labels, validation messages, and domain names into feature-owned localization namespaces. Format dates, numbers, percentages, and plural forms through locale-aware helpers. Do not translate user-authored content automatically.

#### F-I18N-03 — English interface (S3)

Only after Hungarian terminology and workflows are stable, add an English interface and manual set with parity checks. Define fallback behavior and a missing-translation build report.

### 2.4 Product depth beyond the first teacher loop

#### F-PROD-01 — Advanced timetable depth (S2)

Extend recurrence and overrides with cancellations, moved lessons, exceptions, historical views, term breaks, and better overlap details. Institutional room availability and automated timetable solving remain separate products.

#### F-PROD-02 — Broader evidence workflows (S2)

Add evidence capture from teacher observation, lesson notes, assignment answers, confidence, correction quality, and rubric decisions. Provide provenance and correction, never hidden automatic mutation. Explore learner and Concept timelines only after privacy and retention rules are explicit.

#### F-PROD-03 — Assessment analysis depth (S2)

Beyond the five core analyzers, explore cohort comparison, item-quality history, misconception clusters, coverage trends, export, moderation, and reduced/deferred assessment chains. Clearly separate descriptive evidence from causal claims.

#### F-PROD-04 — Print and offline classroom resilience (S2)

Reconnect messaging, typed network failures, retained editor state after failed saves, and an authentication-safe retry screen are implemented. Complete print layouts for lessons, teacher sheets, assignments, assessments, and answer keys. Explore graceful offline/read-only lesson access without promising offline writes before conflict behavior is designed.

#### F-PROD-05 — Project capability (S3)

The Project surface is a feature-toggled fixture viewer. Run separate discovery for project authoring, contributor opportunities, challenge sequencing, evidence, outputs, and teacher controls. Keep it isolated until the common Resource/Exercise/Assignment contracts can be reused cleanly.

#### F-PROD-06 — Rich assets and providers (S3)

Define the local-rich asset provider, upload limits, MIME validation, accessible metadata, thumbnails, replacement/version behavior, and structured video/provider records. Maintain learner-safe projection and content-rights metadata.

#### F-PROD-07 — Import/export user experience (S2)

Complete staged package import, bounded ZIP validation, manifest/schema report, reference validation, diff, atomic apply, update impact, teacher-fork preservation, and round-trip export. Treat the existing raw workspace JSON export as an administrative diagnostic, not the finished teacher exchange workflow.

### 2.5 Architecture and maintainability

#### F-ARCH-01 — Decompose the Fastify application factory (S1)

`apps/server/src/app.ts` owns authentication, generic collections, presentation, live, assignments, assessments, packages, and manual delivery. Move each growing workflow into its feature slice with route registration, schemas, application service, and tests. Keep the app factory responsible for composition and shared middleware.

#### F-ARCH-02 — Replace `any` and generic entity assumptions (S1)

The web app extensively uses `api<any>`, generic tables, and open records. Generate or share typed response/command contracts, add query-key helpers, and model discriminated unions for Nodes, Exercises, slides, results, and feature errors. Avoid broad type assertions and duplicated frontend validation.

#### F-ARCH-03 — API error and concurrency client (S1)

The client preserves error code, retryability, field errors, technical reference, and HTTP status; it also normalizes offline and transport failures and no longer treats those failures as expired authentication. Add helpers for conditional writes and explicit conflict recovery. Centralize the remaining session-expiry behavior across public and protected workflows without masking other 401/403 cases.

#### F-ARCH-04 — Collection-specific validation (S1)

Only Exercises have meaningful creation validation in the generic collection loop. Add schemas and invariants for every mutable aggregate, or remove that aggregate from generic writes. Prevent invalid references at the application boundary, not only in UI selectors.

#### F-ARCH-05 — Collection-per-aggregate persistence (S2)

Replace the optimistic whole-workspace snapshot before large data sets, multiple teachers, or high write concurrency. Design repositories and transaction boundaries around aggregates and immutable histories. Provide a migration, backup, and rollback plan; keep current snapshot fixtures readable during transition.

#### F-ARCH-06 — Search and pagination correctness (S2)

Current search serializes entire records, returns at most 100, and uses an ID cursor over unsorted arrays. Add explicit search projections, stable sort tuples, indexes, total/next metadata where useful, and UI pagination. Keep private fields out of search documents.

#### F-ARCH-07 — Revision model completion (S2)

Complete canonical revision records, scheduled impact notices, package revisions, fork ancestry, compatible-latest policies, and one resolver used by Lessons, Presentation, Assignments, Assessment generation, grading, and history views. The core plan establishes the safety baseline; this item completes operational depth and migration tooling.

#### F-ARCH-08 — Audit and observability model (S2)

Define structured audit events for publish/archive/fork, roster changes, assignment issue/review, assessment generation/override/regrade, resets, and account administration. Add correlation/reference IDs and privacy-aware structured logs. Avoid storing answer content or secrets in routine logs.

### 2.6 Security, privacy, and administration

#### F-SEC-01 — Capability enforcement and admin controls (S1)

Derive explicit capabilities from fixed roles and enforce them in route workflows and navigation. Complete account disable/reset, temporary-password change, session invalidation, and audit UI. Do not introduce an arbitrary permission editor.

#### F-SEC-02 — CSRF and mutation protection review (S1)

Reassess cookie-session origin checks, explicit CSRF strategy, rate limits, content types, public endpoints, reveal/control tokens, and error disclosure after editor mutations expand. Add negative integration tests rather than relying on frontend behavior.

#### F-SEC-03 — Learner privacy and retention (S2)

Document and implement which administrative identities, pseudonyms, live nicknames, answers, evidence, grades, exports, and audit records are visible to each role and how long they are retained. Add privacy-safe export/deletion/anonymization workflows only after historical and legal constraints are decided.

#### F-SEC-04 — Content and URL safety (S1)

Apply one allowlist-based link/media policy to Markdown, Resources, manual pages, projected content, print output, and package imports. Keep raw HTML and executable package content disabled. Verify external links do not leak teacher-only context.

### 2.7 Testing, release, and operations

#### F-TEST-01 — Component and accessibility test layer (S1)

Add focused tests for editor primitives, selectors, option lists, conflict panels, Markdown rendering, status/date formatters, and keyboard ordering. Keep E2E tests for user outcomes rather than every field permutation.

#### F-TEST-02 — Browser matrix and visual regression (S2)

Run critical journeys in supported Chromium plus at least one additional engine if the product commits to it. Add intentional visual snapshots for shell, dense editors, projection, print, and narrow layouts. Review changes rather than updating snapshots blindly.

#### F-TEST-03 — Real Mongo integration profile (S1)

Exercise atomic multi-record workflows, stale retries, delivery immutability, package staging, migration, and concurrent writes against the Docker Mongo replica set. Keep memory tests fast but do not use them as transaction evidence.

#### F-OPS-01 — Backup, restore, and migration runbooks (S1)

Document and test backups, restore drills, schema/data migration, demo reset boundaries, rollback, and environment separation. Ensure reset and import actions cannot target production accidentally.

#### F-OPS-02 — Performance budgets (S2)

Measure shell startup, large Library lists, editor load, Markdown/KaTeX rendering, lesson presentation transitions, live polling, assessment generation, and workspace persistence. Set practical budgets only after collecting a representative baseline.

#### F-OPS-03 — Dependency and generated-artifact maintenance (S2)

Continue the existing Node/npm/lockfile checks. Add scheduled dependency review for editor, Markdown, Fastify, Vite, MongoDB, and browser tooling; regenerate OpenAPI after route changes; and verify clean artifacts contain the manual Markdown source needed by the build.

## 3. Suggested post-core execution waves

### Wave 1 — MVP solidification

Prioritize S1 items that make the accepted workflows coherent and supportable:

- F-IA-01 through F-IA-03;
- F-UX-01 through F-UX-04;
- F-I18N-01;
- F-ARCH-01 through F-ARCH-04;
- F-SEC-01, F-SEC-02, and F-SEC-04;
- F-TEST-01, F-TEST-03, and F-OPS-01.

Exit condition: the core journeys are consistently named, accessible, observable, type-safe at boundaries, validated on real MongoDB, and administratively recoverable.

### Wave 2 — Depth and scale readiness

Choose S2 items based on pilot-teacher evidence:

- deeper timetable, evidence, assessment, print, and package workflows;
- localization boundaries;
- persistence, search, revisions, audit, privacy, browser matrix, and performance.

Exit condition: the chosen pilot scale and support model have explicit capacity, privacy, history, and operational evidence.

### Wave 3 — Strategic extensions

Evaluate S3 items—command navigation, English UI, full Project authoring, rich assets—through separate product briefs. Do not let these reopen the core MVP scope without evidence.

## 4. Intake template for new detached findings

Record new findings with:

- ID and short title;
- observed evidence and affected surface;
- why it does not block the core teacher loop;
- user/engineering risk;
- proposed direction, not a premature full design;
- priority and dependencies;
- measurable acceptance note;
- promotion trigger into the core plan.

## 5. Completion rule

This backlog is not expected to reach zero. A post-core wave is complete when its selected items have acceptance evidence, `npm run validate` passes, targeted integration/browser tests pass, and every unverified item is recorded in `IMPLEMENTATION-DEVIATIONS.md`. Unselected findings remain explicit rather than being implied as implemented.
