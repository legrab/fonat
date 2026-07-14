# Fonat

## Authoritative One-Shot MVP Implementation Specification, Version 2

**Status:** implementation-ready  
**Primary language:** Hungarian  
**Source and fallback language:** English  
**Product name:** Fonat  
**Primary motto:** **Szálról szálra.** / **Thread by thread.**

This document is the single authoritative prompt for implementing the Fonat repository. Where a later section narrows an earlier general principle, the later and more specific requirement wins. Do not invent substitute product concepts merely because they are faster to code. When scope must be reduced, preserve the connected teacher workflow and simplify automation, breadth, or secondary surfaces.

---

# 0. Project inputs to confirm before implementation

These inputs must appear at the top of the generated repository documentation and must be easy to change before the implementation agent begins. They intentionally cover only decisions that strongly affect the result while leaving the architecture unchanged.

## 0.1 Demo Clock

Use a fixed, injectable Demo Clock.

```yaml
demoClock:
  referenceInstant: '2026-09-15T08:00:00+02:00'
  schoolTimezone: 'Europe/Budapest'
```

Requirements:

- All demo-relative concepts derive from this clock: Today, upcoming lessons, completed history, deadlines, school-week views, analyzer fixtures, and time-dependent acceptance tests.
- The implementation must not scatter calls to `Date.now()` through domain or application code.
- Operational timestamps use UTC instants.
- School calendar dates use date-only values.
- Recurring lesson time uses local wall-clock time plus an IANA timezone so daylight-saving changes do not move an intended 08:00 lesson.
- The deployment, Course, or user may override display timezone where relevant.
- No timezone is hardcoded to Hungary or Austria.
- Use Temporal semantics behind a project Clock/time adapter. Use the native ECMAScript Temporal API where supported and a maintained polyfill where required.

## 0.2 Visual preset

Choose one preset or replace its semantic tokens explicitly. The implementation must still verify contrast for actual foreground/background combinations.

### Preset A: Lavender Workshop, default

| Token      |     Light |      Dark |
| ---------- | --------: | --------: |
| Background | `#F3F0F7` | `#1E1B24` |
| Surface    | `#FAF8FC` | `#292430` |
| Primary    | `#486B91` | `#8FB8E2` |
| Accent     | `#A9571E` | `#E19A55` |
| Text       | `#29232F` | `#ECE8F1` |

Character: pale lavender canvas, muted academic blue, warm pumpkin accent, no pure white or pure black.

### Preset B: Forest Paper

| Token      |     Light |      Dark |
| ---------- | --------: | --------: |
| Background | `#F3F1E8` | `#1B2421` |
| Surface    | `#FAF8F0` | `#24302C` |
| Primary    | `#426A60` | `#8EB7AA` |
| Accent     | `#9A4655` | `#D7848F` |
| Text       | `#252A27` | `#EEEAE0` |

Character: warm paper, forest/sage structure, muted berry accent, restrained institutional tone.

Theme colors must be centralized as semantic tokens. Components may not hardcode palette values.

## 0.3 Language profile

```yaml
languages:
  sourceLocale: 'en'
  defaultUserLocale: 'hu'
  enabledLocales:
    - 'hu'
    - 'en'
```

Requirements:

- English is the code-facing source and fallback locale.
- Hungarian is the default user-facing locale.
- A third locale is not required for the MVP.
- The localization architecture must permit later locales without changing domain identities.

## 0.4 Optional capability defaults

```yaml
features:
  projects:
    demo: true
    development: true
    blankProduction: false
```

Disabled capability data must remain intact and recover when re-enabled.

---

# 1. Product promise

Fonat is a source-available educational operating system for a teacher who wants to build connected material over years rather than repeatedly assembling isolated documents.

The core promise is:

> A teacher can build connected material, prepare a lesson, run it, involve students, preserve how they worked, assess them, understand what happened, and use that evidence to prepare what comes next.

Fonat is not primarily:

- a generic learning-management system,
- a document archive,
- a school-wide timetable optimizer,
- an AI content generator,
- an automatic mastery oracle,
- a multiplayer game platform,
- an institutional administration suite.

The central asset is the evolving network among Concepts, Curriculum Requirements, Resources, Exercises, Activities, Plans, Lessons, Assignments, Assessments, learner evidence, and revisions.

---

# 2. Non-negotiable product principles

## 2.1 Szálról szálra

The product supports incremental construction. Teachers may start from a single lesson, Exercise, Resource, or Concept and connect it later. The application must not require a complete curriculum model before useful work can begin.

## 2.2 Preserve engagement

Teacher and student attention must not be consumed by configuration. Prefer contextual defaults, nearby actions, progressive disclosure, searchable selectors, and in-place state changes.

Normal teacher workflows must not require entering internal IDs, editing JSON, or navigating to unrelated administration screens.

## 2.3 Show how it was done

Fonat values reasoning evidence, corrections, confidence, method, and progression, not only the final answer. It must support step evidence without forcing every activity onto a screen.

## 2.4 The journey matters, while correctness still matters

Evidence, attempts, correction history, teacher observations, and follow-up actions remain visible. Correctness is not discarded, but a final score never erases the route taken.

## 2.5 Assist rather than administer

Useful defaults must be present. Blank-instance onboarding must create a usable first Course and lesson without forcing the teacher to configure the whole platform.

## 2.6 Explainable and deterministic before clever

Use deterministic rules, transparent scores, visible constraints, and typed findings before optimization or AI. A teacher must be able to understand why an Exercise, warning, grade, or follow-up was proposed.

## 2.7 Safe by default

Do not silently relax constraints, overwrite revisions, merge identities, discard package data, propagate updates, or partially import invalid content. Prefer typed Result outcomes, guard clauses, and explicit fallbacks over hidden mitigation.

## 2.8 YAGNI for infrastructure

Build a modular monolith. Do not introduce microservices, event sourcing, GraphQL, tRPC, Redux, distributed locks, a generic workflow engine, or a universal plugin runtime.

---

# 3. Brand and logo

## 3.1 Name and written identity

- Product: **Fonat**
- Primary motto: **Szálról szálra.** / **Thread by thread.**
- Separate About/README line, not adjacent to the motto: **Az oktatás minden szála egy helyen.** / **Every thread of teaching in one place.**
- Do not use “flow” as a brand word. It remains an internal design principle only.

## 3.2 Logo direction, fixed

Create a hand-maintainable SVG mark from three rounded interwoven strands:

- the three strands rise from the bottom as a compact braid forming the vertical stem of a subtle `F`;
- the accent-colored strand stays inside the vertical braid and continues to the top;
- the neutral strand branches right near the top to form the upper horizontal stroke;
- the primary-colored strand branches right at mid-height to form the lower horizontal stroke;
- the branches must naturally peel out of the braid rather than appear attached afterward;
- use only two or three visually clear over-under crossings;
- use rounded terminals and generous negative space;
- the `F` should be discoverable, not a heavy literal glyph.

Reject variants that resemble a plant, road interchange, letter K, textile spool, generic book, brain, lightbulb, atom, or graduation cap.

Required assets:

```text
assets/brand/
├── fonat-logo.svg
├── fonat-logo-monochrome.svg
├── fonat-mark.svg
├── favicon.svg
└── BRAND.md
```

Validate at 16 px, 32 px, ordinary navigation size, print, dark/light themes, monochrome, and projected-screen use. SVGs need accessible titles/descriptions and no scripts or external resources.

---

# 4. Scope classification

Every capability is classified as one of the following.

## 4.1 Complete MVP

A user can perform the workflow through a normal interface. Data persists correctly, errors are handled, and automated acceptance proves both happy and important failure paths.

## 4.2 Functional Foundation

A real schema, contract, reference implementation, documentation, and at least one working path exist, but advanced behavior or broad UI coverage is intentionally deferred.

## 4.3 Deferred

The architecture must not block it, but no placeholder screen or fake implementation is required.

Never count a raw JSON editor, inert button, mock response, or seed-only read view as a complete feature.

---

# 5. Complete MVP boundary

The Complete MVP includes:

- first-run bootstrap and a foundation package;
- blank-instance onboarding;
- basic Admin and Teacher account management;
- Subjects, Concepts, Curriculum Requirements, Curricula, Collections, Resources, Exercises, and typed Relations;
- dedicated normal editors for core entities;
- Learner Groups, Courses, Enrollments, Teaching Locations, and a weekly teacher timetable;
- Teaching Profiles, Lesson Blueprints, Lesson Layouts, Annual Plans, Phases, Lessons, Sections, contextual Activities, and Activity Templates;
- guided Lesson planning with deterministic recommendations and diagnostics;
- published revisions, exact revision pinning, and immutable deliveries;
- Presentation Mode and Lesson Runs;
- browser-based live quizzes with authenticated participants;
- Assignments, asynchronous drafts, Submissions, correction, resubmission, evidence, and minimal official Grade Entries;
- Assessment Blueprints, deterministic slot filling, stable A/B-compatible deliveries, reduced Assessments, grading, regrading preview, and a small analyzer pipeline;
- lightweight Rubric support for one reference manual-grading path only;
- Milkdown Crepe authoring, KaTeX, and constrained Mafs rendering where enabled;
- package-backed reference educational content;
- ZIP package import/export with atomic apply;
- print-ready HTML and browser PDF export;
- Hungarian/English localization;
- package validation CLI and content-repository template;
- real MongoDB integration tests;
- local Docker, Vercel, and Render deployment configurations and step-by-step README instructions.

---

# 6. Functional Foundations

Functional Foundations include:

- isolated Project capability module and seed example;
- one deterministic Exercise Family generator;
- constrained `math.2d-plot` capability;
- a narrow public GitHub snapshot import path only if it does not threaten the core build;
- local filesystem asset-provider contract and one optional rich-media fixture;
- server-side PDF in local Docker only if straightforward;
- lightweight Rubric schema and one grading UI path, without a broad reusable rubric-management system;
- ActivityTemplate reuse beyond the reference examples;
- guest-result claiming, not required for the golden path.

---

# 7. Deferred

Defer:

- advanced multi-teacher collaboration and simultaneous editing;
- guest identity claiming and merge conflict resolution;
- private GitHub integration, OAuth, write-back, and automatic repository synchronization;
- advanced Assessment optimization and global equivalence solvers;
- broad Rubric libraries, criterion analytics, or standards-based grading;
- cloud uploads, object storage, media processing, video transcoding, and presentation ingestion;
- automatic revision propagation and policy engines;
- room conflicts across teachers, equipment booking, travel time, or institutional timetable optimization;
- broad analyzer catalogues beyond the small deterministic pipeline;
- symbolic algebra equivalence;
- vector search and embeddings;
- built-in AI;
- a full game engine;
- WebSockets;
- native mobile applications;
- full offline synchronization;
- school administration and report-card export;
- generic checkpoint/restore engines;
- visual graph canvas;
- runtime installation of executable modules;
- school-wide scheduling and resource optimization;
- automated archival deletion/restoration;
- complex Project execution engines or collaborative canvases.

---

# 8. Users, roles, ownership, and visibility

## 8.1 Roles

Fixed default roles:

- Site Admin
- Teacher
- Student

A user may hold multiple roles. Internally authorize through capabilities, not role-name conditionals. No permission editor is required.

## 8.2 Site Admin

Complete MVP operations:

- complete first-run bootstrap;
- create a Teacher account;
- assign Admin and Teacher roles;
- issue/reset a temporary password;
- force password change;
- disable an account;
- invalidate sessions;
- view deployment health, enabled modules, failed imports/operations, and security warnings;
- enable/disable optional capabilities.

## 8.3 Ownership model

- Published reusable educational content is shared instance-wide.
- Drafts are private to their creator.
- Courses, Learners, Submissions, Evidence, Grades, and Assignments are visible only to assigned Teachers and Site Admins.
- Admins may reassign ownership.
- No arbitrary per-node ACL editor.
- No collaborative simultaneous editing in MVP.

## 8.4 Student identity

Separate:

- immutable internal Learner ID;
- editable pseudonymous display identity with nickname, icon, and color;
- optional administrative identity, disabled by default;
- credentials/access records;
- time-bounded Enrollments.

Educational records refer to Learner ID, never full name. Color is never the only identity signal.

## 8.5 Credentials

- Teacher credentials use a modern memory-hard password policy.
- Hash records store algorithm, salt, and all work-factor parameters.
- Supported older hashes may be verified and opportunistically rehashed after successful login.
- Student access may use classroom code plus personal secret according to policy.
- Temporary passwords require change on first login.
- Credential reset invalidates prior sessions.

---

# 9. Blank-instance onboarding

A production installation without demo content loads only a tiny built-in Foundation Package containing:

- selected school-system defaults;
- required relation contracts;
- terminology;
- one Balanced Teaching Profile;
- one 45-minute Lesson Blueprint;
- one compact Lesson Layout;
- required Subject and grading-scale scaffolding.

The onboarding journey must create through guided UI:

```text
Foundation package
→ first Learner Group
→ first Course
→ first Teaching Location
→ learners and Enrollments
→ first Concept
→ first Exercise
→ first Annual Plan and Phase
→ first Lesson
→ first Assignment or Assessment
```

No screen may depend on demo IDs. This journey must have an automated browser test against a clean database.

---

# 10. Canonical terminology

## 10.1 Educational graph

### Graph

The complete network of reusable educational objects and typed Relations.

### Node

An independently addressable, reusable, searchable, ownable, relation-capable, or revisioned object.

Not every meaningful value is a Node. Parent-owned structures remain embedded value objects where independent identity would add complexity without reuse.

### Relation

A typed directed connection registered by the platform or an executable Capability Module.

### Subject

A versioned data-defined educational domain with stable ID, localized names, aliases, grade applicability, Concept namespaces, default terminology, and Curriculum compatibility.

A Subject does not require executable code. A Capability Module may add subject-specific behavior.

### Concept

A curriculum-independent unit of knowledge, skill, method, competency, misconception, or prerequisite.

### Curriculum Requirement

A curriculum-owned expectation that references one or more Concepts and defines depth, timing, or educational expectation.

### Curriculum

A versioned hierarchy or collection of Curriculum Requirements for a Subject and school-system context.

### Collection

An optional teacher-created grouping of Nodes. It has no hidden pedagogical semantics. Do not introduce a vague canonical Topic type.

### Resource

Reusable instructional material such as Markdown explanation, image, SVG, video link, plot, worked example, or teacher note.

### Exercise

Reusable structured task requiring learner action or response.

### Exercise Family

A deterministic generator definition that produces reproducible Exercise instances from validated parameters and a seed.

### Rubric

A lightweight reusable set of manual-grading criteria. In Complete MVP, prove one constrained grading path only.

## 10.2 People and teaching organization

### Learner Profile

Stable pseudonymous person record independent of school year or group.

### Learner Group

A cohort such as `8.A`, independent of Subject.

### Enrollment

Time-bounded connection between a Learner and a Learner Group or Course, with status and historical dates.

### Course

A Subject taught by one or more assigned Teachers to a roster during a school year. A Course may derive its roster from one or more Learner Groups with explicit individual inclusions/exclusions. Historical Course Enrollment records preserve the resolved roster.

### Teaching Location

Reusable location with stable ID, display name, short code, optional building/address/notes, and optional equipment tags.

## 10.3 Planning

### Teaching Profile

Teacher-controlled pedagogical defaults and preferences.

### Lesson Blueprint

Reusable ordered Section structure with timing ranges, slot constraints, and educational shape.

### Lesson Layout

Printable/digital visual layout.

### Annual Plan

Course-specific plan for a school year.

### Phase

Bounded sequence of Lessons around a theme, project, method, or curriculum segment.

### Lesson

Concrete planned or completed classroom event.

### Lesson Section

Embedded timed structural part of a Lesson revision.

### Activity

Embedded lesson-specific execution record inside a Lesson Section. It references Resources and/or Exercises and adds duration, grouping, teacher instructions, evidence policy, presentation behavior, differentiation, and contextual notes.

### Activity Template

Reusable Node that can instantiate an Activity. Existing Lessons do not silently change when a template changes.

## 10.4 Delivery and evidence

### Assignment

Operational delivery container for homework, practice, classwork, quiz, or formal Assessment. It defines targets, availability, deadline, attempts, feedback release, evidence, and grading policy.

### Submission

Immutable submitted attempt snapshot belonging to an Assignment. Drafts are separate and are not Learning Evidence.

### Learning Evidence

First-class record of an answer, explanation, confidence, observation, oral demonstration, project contribution, correction, self-assessment, or other meaningful evidence.

### Grade Entry

Official teacher-confirmed grade ledger record, independent from raw Evidence and automatic scores.

### Assessment Blueprint

Reusable constrained definition of Assessment slots and source eligibility.

### Assessment Variant

Equivalent constrained selection of questions that fills the same Blueprint intent.

### Assessment Delivery

Immutable learner-specific resolved Assessment instance, including selected revisions, generated parameters, question order, option permutation, and policies.

### Lesson Run

Operational record of actual classroom execution.

### Concept State

Explainable derived summary based on recent Evidence and optional teacher assertion, not a hidden mutable mastery percentage.

## 10.5 Platform

### Revision

Immutable published state of a reusable Node.

### Content Package

Portable versioned data/assets bundle with no executable code.

### Capability Module

Trusted build-time/deploy-time code registering schemas, identifiers, renderers, validators, graders, generators, analyzers, and limited UI contributions.

### Finding

Explainable output of a deterministic validator or analyzer. A Finding never mutates domain state directly.

### Project

Optional cross-subject educational structure supplied by an isolated capability slice. It is Functional Foundation, not a dependency of normal teaching workflows.

## 10.6 Core entity capability matrix

The following is the minimum normal-user capability matrix. “Guided edit” means a dedicated or module-owned human interface, not raw JSON. Archive/delete behavior must respect historical references.

| Entity                 |        List/search |         Create |        Guided edit |           Archive/delete |        Duplicate/fork |                Publish/revise |        Relation edit |         Import/export |
| ---------------------- | -----------------: | -------------: | -----------------: | -----------------------: | --------------------: | ----------------------------: | -------------------: | --------------------: |
| Subject                |                Yes |  Package/Admin |                Yes |                  Archive |                  Fork |                        Revise |                  Yes |                   Yes |
| Concept                |                Yes |            Yes |                Yes |                  Archive |        Duplicate/fork |                        Revise |                  Yes |                   Yes |
| Curriculum Requirement |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |                  Yes |                   Yes |
| Curriculum             |                Yes |            Yes |                Yes |                  Archive |                  Fork |                        Revise |                  Yes |                   Yes |
| Collection             |                Yes |            Yes |                Yes | Archive/delete if unused |             Duplicate |                        Revise |                  Yes |                   Yes |
| Resource               |                Yes |            Yes |                Yes |                  Archive |        Duplicate/fork |                        Revise |                  Yes |                   Yes |
| Exercise               |                Yes |            Yes |                Yes |                  Archive |        Duplicate/fork |                        Revise |                  Yes |                   Yes |
| Exercise Family        |                Yes | Module/package |      Module editor |                  Archive |        Duplicate/fork |                        Revise |                  Yes |                   Yes |
| Rubric                 |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |                  Yes |                   Yes |
| Teaching Profile       |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |              Limited |                   Yes |
| Lesson Blueprint       |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |              Limited |                   Yes |
| Lesson Layout          |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |              Limited |                   Yes |
| Activity Template      |                Yes |            Yes |                Yes |                  Archive |             Duplicate |                        Revise |                  Yes |                   Yes |
| Annual Plan            |                Yes |            Yes |                Yes |                  Archive |                  Fork |                Publish/revise |                  Yes |                   Yes |
| Phase                  | Within plan/search |            Yes |                Yes |           Archive/remove |             Duplicate |                 Plan revision |                  Yes |         Yes with plan |
| Lesson                 |                Yes |            Yes |                Yes |           Cancel/archive |     Duplicate/variant |                Publish/revise |                  Yes |                   Yes |
| Assessment             |                Yes |   Yes/generate |                Yes |                  Archive |     Duplicate/variant |                Publish/revise |                  Yes |                   Yes |
| Learner Group          |                Yes |            Yes |                Yes |                  Archive | Duplicate roster only |           No content revision |              Limited | Administrative export |
| Course                 |                Yes |            Yes |                Yes |                  Archive |       Duplicate setup |           No content revision |              Limited | Administrative export |
| Teaching Location      |                Yes |            Yes |                Yes |                  Archive |             Duplicate |           No content revision |              Limited |                   Yes |
| Learner Profile        |    Yes, authorized |            Yes |                Yes |               Deactivate |          No duplicate |               Audited updates | No public graph edit | Administrative export |
| Assignment             |                Yes |            Yes |    Yes before lock |           Cancel/archive |             Duplicate | Versioned policy/content refs |              Limited | Administrative export |
| Grade Entry            |    Yes, authorized |    Yes/confirm | Correct with audit |  Void, never hard delete |                    No |            Correction history |                   No | Administrative export |
| Project                |       When enabled |            Yes |     Minimal editor |                  Archive |        Duplicate/fork |                        Revise |                  Yes |                   Yes |

Operational records such as Submissions, Evidence, LessonRuns, live sessions, and Assessment Deliveries have task-specific views and audited state transitions rather than generic create/edit/delete screens.

---

# 11. Node versus embedded value rules

Use Nodes for independently reusable or addressable entities such as:

- Subjects;
- Concepts;
- Curricula and Requirements;
- Collections;
- Resources;
- Exercises and Exercise Families;
- Rubrics;
- Profiles, Blueprints, Layouts, and Activity Templates;
- Annual Plans, Phases, Lessons, Assessments, and Projects where their lifecycle warrants independent identity.

Use embedded value objects with stable local IDs for:

- Lesson Sections;
- contextual Activities;
- presentation Slides;
- Assessment slots;
- option permutations;
- grading details;
- bounded notes and overrides.

Promote an embedded value to a Node only when independent reuse, Relations, revisioning, ownership, or search justifies it.

# 12. Domain and persistence model

## 12.1 Common Node envelope

Every Node carries at least:

```ts
interface NodeEnvelope<TPayload> {
  id: string;
  type: RegisteredNodeType;
  subjectIds: string[];
  lifecycle: 'draft' | 'published' | 'archived';
  ownerId?: string;
  createdAt: InstantString;
  updatedAt: InstantString;
  concurrencyVersion: number;
  currentRevision?: number;
  translations: Record<Locale, LocalizedIdentity>;
  provenance: Provenance;
  rights: RightsMetadata;
  searchProjection: SearchProjection;
  payload: TPayload;
  extensions?: Record<NamespacedExtensionKey, unknown>;
}
```

The exact TypeScript names may differ, but the semantics may not.

## 12.2 Payload schemas

Every canonical Node and operational record must have a registered runtime schema. Capability Modules own schemas for their types.

Validation must run consistently for:

- UI submissions;
- API writes;
- seed/foundation loading;
- package import;
- revision publication;
- export;
- migrations.

Generic payload dictionaries are permitted only for optional namespaced extensions. Behavior-critical fields may not remain untyped.

## 12.3 Persistence collections

Use MongoDB only for MVP. Keep the collection model deliberate:

- `nodes`
- `nodeRevisions`
- `relations`
- `users`
- `sessions`
- `learnerProfiles`
- `enrollments`
- `courseEnrollments`
- `lessonRuns`
- `liveSessions`
- `assignments`
- `answerDrafts`
- `submissions`
- `learningEvidence`
- `gradeEntries`
- `assessmentDeliveries`
- `auditEvents`
- `activityEvents`
- `packageImports`
- `schemaMigrations`

The implementation may merge or separate operational collections when justified by volume and lifecycle, but must document deviations.

## 12.4 Repository contracts

- Domain/application code does not import MongoDB.
- Repositories expose server-side search, filter, stable sort, and cursor paging.
- Generic CRUD is insufficient for concurrency-sensitive aggregates.
- Live joins, answer acceptance, session transitions, counters, and LessonRun transitions use domain-specific atomic commands or compare-and-swap updates.
- Do not read an active aggregate, mutate it in memory, and replace it without a version guard.

## 12.5 Optimistic concurrency

Editable records carry a concurrency version or ETag.

A stale write returns a typed `Conflict` Result with enough information to reload and compare. Do not silently overwrite work from another tab, autosave, active Presentation Mode, or another assigned Teacher.

Use this narrowly. Do not add distributed locking or a generalized concurrency framework.

## 12.6 Idempotency

Retry-prone operations require idempotency keys or deterministic unique identities:

- Submission;
- answer draft save;
- live answer;
- live join;
- package import;
- Assessment generation/delivery;
- demo reset;
- seed/foundation application.

Duplicate requests must resolve to the same domain outcome rather than create duplicate records.

## 12.7 Document growth

- Lesson revisions reference reusable content and embed only bounded contextual data.
- Do not copy full Resource/Exercise bodies into every Lesson revision.
- Exact content is copied only into immutable delivery snapshots where historical fidelity requires it.
- Enforce limits well below MongoDB’s document maximum and return actionable validation before save.

## 12.8 Migrations

From the first tagged usable release:

- record ordered migrations in `schemaMigrations`;
- migrations are forward, idempotent, and tested;
- development may explicitly drop/reseed;
- production never silently resets;
- require portable export before unsupported/destructive migration;
- no guarantee is required for arbitrary experimental pre-release snapshots.

---

# 13. Registered identifiers and Capability Modules

## 13.1 Registered identifiers

The following are stable registered strings, not hardcoded closed enums:

- Node type;
- Relation type;
- Exercise type;
- Resource type;
- grading handler;
- generator;
- analyzer;
- validator;
- renderer;
- presentation renderer.

A build step discovers installed module folders, generates a static registry, and generates TypeScript identifier unions for the installed build. Runtime validation checks against the generated registry.

A Content Package may use only supported registered identifiers. It cannot introduce executable behavior by inventing strings.

## 13.2 Module entry points

Each executable module may expose:

```text
manifest
shared
server
web
```

- `shared`: schemas and portable contracts;
- `server`: validators, graders, generators, analyzers, application-service registrations, and optional route-slice registration;
- `web`: editors, renderers, presentation renderers, and allowed navigation/settings contributions;
- `manifest`: IDs, dependencies, capabilities, versions, compatibility, and settings schemas.

Generated registries import these entry points statically for Vercel and Docker compatibility.

Modules depend only on public platform contracts and shared UI primitives, never another module’s private files or direct MongoDB access.

## 13.3 Required modules

At minimum:

- core educational platform;
- mathematics capability;
- constrained 2D mathematics visualization;
- isolated Project capability.

Runtime installation of untrusted executable modules is deferred.

---

# 14. Relation model and editing

## 14.1 Relation contract

A Relation record contains:

- stable ID;
- registered Relation type;
- source and target Node IDs;
- optional relation-specific dimensions;
- provenance;
- lifecycle/audit metadata;
- concurrency version.

Each Relation type declares:

- allowed source/target types;
- direction;
- inverse display label;
- duplicate policy;
- validation rules;
- dimensions;
- localization.

## 14.2 Required relation types

Include at least:

- `covers`
- `requires`
- `alternative-to`
- `uses`
- `instantiates`
- `satisfies`
- `demonstrates`
- `belongs-to`
- `derived-from`
- `forked-from`
- `related-to`

Use more specific names where the domain requires them, but do not collapse all semantics into `related-to`.

## 14.3 Named contribution dimensions

Coverage-related Relations support named contributions:

- introduces;
- reinforces;
- practises;
- assesses;
- strongly-covers.

Alternative Relations may include dimensions such as difficulty similarity, method similarity, context similarity, and substitution suitability.

## 14.4 Normal editing workflow

Relationship authoring is Complete MVP.

Teachers must be able to:

- inspect incoming and outgoing Relations;
- add/remove a registered Relation;
- search eligible targets through contextual selectors;
- see why a target is ineligible;
- edit relation-specific dimensions;
- inspect provenance and inverse meaning;
- quick-create a missing Concept or Collection where appropriate.

The graph cannot be read-only from the UI.

## 14.5 Related panel

Every relevant Node detail page contains a compact Wikipedia-like Related panel. An advanced graph canvas is deferred.

---

# 15. Revisions and immutable resolution

## 15.1 Publication lifecycle

- Draft autosaves are mutable and concurrency-protected.
- Explicit Publish creates an immutable Revision.
- Routine saves do not create revisions.
- Published content may be archived but remains resolvable historically.

## 15.2 Compatibility classes

Internal classes:

- `presentation-only`
- `content-equivalent`
- `planning-impacting`
- `contract-breaking`

Simplified UI labels may be:

- Compatible
- Review
- Breaking

Fonat may suggest the class, but a Teacher may override with a reason.

## 15.3 Canonical revision resolver

Provide one authoritative resolver for exact historical material:

```text
resolve(nodeId, revision)
```

Scheduled/completed Lessons, LessonRuns, Assignment deliveries, Assessment Deliveries, generated Exercise instances, grading, and Submissions must use exact pinned Revisions or stored immutable delivery snapshots.

Editing the current Node must never change previously delivered material.

## 15.4 Propagation policy

Complete MVP policy:

- draft Lessons may follow the latest compatible Revision;
- scheduled Lessons remain pinned and receive an update notice;
- completed Lessons and delivered Assessments never update;
- presentation-only changes may be reviewed and bulk accepted later, but automatic propagation is post-MVP;
- all other updates are manual through impact review.

## 15.5 Package-origin revisions and forks

Package-owned published Nodes are read-only by default.

- Updating a package creates a new package-owned Revision.
- Teacher customization creates a teacher-owned fork with provenance to the package Node and Revision.
- Package updates do not overwrite forks.
- Seed/demo reset does not delete teacher forks.
- Optional “import as unmanaged teacher content” may sever future package tracking explicitly.

---

# 16. School-system, Subject, Curriculum, and coverage

## 16.1 School-system package

The Hungarian reference package includes:

- Hungarian grading scale 1 to 5;
- school-year/calendar defaults;
- terminology and grade-level metadata;
- foundation Profiles, Blueprints, and Layouts;
- no hardcoded assumptions in core domain code.

## 16.2 Subject definitions

Subject is data-defined. Include at least Mathematics and Informatics in reference packages. Subject-specific code is optional and supplied through Capability Modules.

## 16.3 Curriculum

Curricula are versioned data packages. Requirements reference Concepts rather than duplicating them.

Curriculum conflicts or missing Concepts produce staged findings. Do not silently invent mappings.

## 16.4 Coverage

Keep distinct:

- planned content coverage;
- completed content coverage;
- practice volume;
- Assessment evidence;
- learner Concept State;
- teacher assertions.

Recursive coverage:

1. Activities reference Resources/Exercises.
2. Their Relations contribute to Concepts.
3. Concepts satisfy Curriculum Requirements.
4. Requirements aggregate through the Curriculum structure.
5. completed Activities may count differently from planned Activities.
6. teacher assertions display separately.

Do not fold learner mastery into curriculum coverage.

---

# 17. Learner Groups, Courses, roster, and timetable

## 17.1 Learner Group and Course separation

- Learner Group represents the cohort.
- Course represents a Subject taught during a school year.
- A Course may reference one or more Learner Groups.
- The Course roster starts from active group memberships and permits explicit individual inclusions/exclusions.
- Resolve and preserve historical Course Enrollment records.
- Later group changes must not rewrite past Course history.

## 17.2 Teaching Location

A Course may define a default Teaching Location.

Resolution order:

```text
Course default
→ recurring timetable entry override
→ individual Lesson override
```

## 17.3 Weekly teacher timetable

Complete MVP weekly view shows:

- weekday/date;
- local start/end time;
- Subject and Course;
- Learner Group(s);
- Teaching Location name/short code;
- cancelled, moved, shortened, or extended state;
- teacher-overlap warnings.

Support recurring weekly entries, school holidays/exceptions, moved Lessons, and unscheduled Lessons.

Defer room availability, room conflicts across Teachers, equipment booking, travel time, and institutional timetable optimization.

---

# 18. Annual Plan

## 18.1 Three synchronized projections

The same Annual Plan data appears as:

1. coverage structure: Phases, Concepts, Requirements, lesson counts, milestones;
2. calendar schedule: recurring and concrete Lessons;
3. concrete Lesson content.

Do not create three independent sources of truth.

## 18.2 Creation wizard

Ask for:

- school year;
- Course and Subject;
- Curriculum or free mode;
- recurring timetable availability and default location;
- Teaching Profile;
- approximate Phases;
- optional imported skeleton.

Generate an editable initial skeleton with clear provenance.

## 18.3 Complete planning operations

Complete:

- move;
- reorder;
- cancel;
- shorten;
- extend;
- unschedule;
- change location;
- drag-and-drop Phases and Lessons;
- keyboard and move-button alternatives;
- teacher-overlap warning.

Foundation/deferred:

- automatic split/merge;
- automatic compression/extension of large Phases;
- complex dependent regeneration;
- timetable optimization.

---

# 19. Teaching Profiles, Blueprints, and Layouts

## 19.1 Teaching Profile

Contains pedagogical preferences such as:

- participation mix;
- differentiation intensity;
- evidence intensity;
- feedback/reveal defaults;
- preferred difficulty distribution;
- assessment familiarity mix;
- validator severity overrides where safe.

Effective merge order:

```text
school-system defaults
→ Teaching Profile
→ Course or Annual Plan overrides
→ Lesson overrides
```

Show the source of every overridden value.

## 19.2 Lesson Blueprint

Reusable ordered structure of Section slots, time ranges, participation expectations, and constraints.

## 19.3 Lesson Layout

Reusable print/presentation layout. Include compact one-page and detailed teacher-guide reference layouts.

---

# 20. Lesson planning and Activity model

## 20.1 Guided flow

```text
intent
→ optional Course/Curriculum/Phase
→ effective Teaching Profile
→ Lesson Blueprint
→ Sections and slots
→ contextual candidate basket
→ transparent deterministic proposal
→ pin/swap/reorder/remove
→ diagnostics and coverage preview
→ save
→ publish
→ schedule
```

Provide a curriculum-free quick mode using the same domain model.

## 20.2 Contextual Activities

A Lesson Section embeds Activity instances. Each Activity may reference one or more Exercises/Resources and contains lesson-specific duration, grouping, instructions, evidence, presentation settings, differentiation, and notes.

A Teacher may save a successful pattern as an ActivityTemplate. Instantiation records provenance but copies contextual defaults, so later template edits do not mutate existing Lessons.

## 20.3 Candidate recommendation

Use deterministic eligibility filters plus transparent weighted ranking.

Suggested score dimensions:

- Concept fit;
- duration fit;
- difficulty fit;
- prerequisite relevance;
- Course suitability;
- participation variety;
- differentiation support;
- recent repetition/novelty.

No global combinatorial optimizer.

Explain:

- positive score contributions;
- rejected constraints;
- missing data;
- why another candidate ranked lower.

## 20.4 Normal UI

- contextual candidate panel;
- guided selectors, never raw IDs;
- drag Activities into slots;
- pointer reordering plus keyboard/move-button alternatives;
- inline quick creation where appropriate;
- accessible preview and validation near the affected area.

## 20.5 Parallel Course variants

Support related Lesson variants for parallel Courses without automatic coupling:

- lineage to the source Lesson/Revision;
- structured diff;
- independent editing and publication;
- selective copy of an improvement from one variant to another;
- no silent propagation.

This may use a narrow reference path rather than a broad variant-management system.

---

# 21. Validation and Findings

## 21.1 Severities

- Info
- Suggestion
- Warning
- Error

Structural-integrity errors block. Pedagogical Findings may be disabled or reclassified through Profiles where safe.

## 21.2 Initial Lesson rules

Include:

- duration mismatch;
- missing Blueprint slot;
- missing prerequisite;
- unavailable Resource;
- unsupported renderer/capability;
- difficulty mismatch;
- repetitive participation pattern;
- disabled capability reference;
- oversized embedded structure.

## 21.3 Behavior

Findings explain their basis and suggest actions. They never rewrite a Lesson automatically.

Use typed Results at application boundaries and guard clauses in domain code.

---

# 22. Presentation Mode and Lesson Runs

## 22.1 Projection of Lesson

Presentation Mode is a projection of the exact pinned Lesson Revision, not an independent deck.

Each Section creates a presentation segment. Supported slide types:

- Section intro;
- Markdown;
- Exercise prompt;
- image/SVG;
- registered external video;
- quiz launch;
- solution/explanation;
- discussion prompt;
- closure/homework.

Teachers may reorder, duplicate, add, or remove presentation Slides without changing educational graph Relations unless explicitly promoted.

## 22.2 Dual view

- projected student-safe view;
- teacher control view with upcoming content, guidance/answers, notes, timers, and response summaries.

## 22.3 Lesson Run

Store:

- exact Lesson Revision;
- actual start/end instants;
- current Section/Slide;
- timer state;
- paused/extended/skipped/completed states;
- quick notes;
- actual Activity outcomes;
- optional live-session references.

State transitions are centralized and tested.

## 22.4 Post-Lesson reflection and follow-up

Reflection is quick and optional. Capture:

- poor / mixed / well;
- Activities completed, replaced, or skipped;
- follow-up: none, revise, or continue.

Offer at most three immediate actions:

- Adjust next group;
- Plan follow-up;
- Improve reusable material.

The Teacher may dismiss all. Runtime notes remain LessonRun-specific unless explicitly promoted into reusable content.

## 22.5 Connection resilience

Preload current Lesson Slides and tiny assets, keep local timers running, and show clear unavailable-media fallbacks. Full offline write synchronization is deferred.

---

# 23. Live classroom sessions

## 23.1 Student surface

Responsive route in the same React application. Mobile-first. Native app deferred.

## 23.2 Join paths

- authenticated Student;
- Course/class access code plus personal secret;
- guest with generated unique nickname and badge.

Guest claiming is post-MVP. Guest data remains temporary and teacher-visible.

## 23.3 Participant credential

Joining returns a short-lived participant credential or signed token scoped to one participant/session. Participant-specific poll, answer, and claim operations authorize that credential, not a supplied participant ID.

Credentials expire with the session. Writes are rate-limited and idempotent.

## 23.4 Complete activity types

- single choice;
- multiple select;
- true/false;
- numeric;
- accepted text;
- confidence vote;
- exit ticket.

Support teacher-paced and student-paced modes, optional timer, deterministic option order, answer reveal policy, and aggregate results.

## 23.5 Polling

No WebSockets.

Suggested adaptive intervals:

- teacher active: 2 to 3 seconds;
- student active: 4 to 5 seconds;
- slower when idle/background;
- immediate refresh after local submit/advance.

Keep payloads compact and separate aggregates from detailed teacher answer views.

## 23.6 Privacy

Public projection defaults to aggregates. Do not publicly expose individual wrong answers. Leaderboard is optional, nickname-based, disabled by default, and has no permanent ranking or default speed bonus.

---

# 24. Assignments, drafts, Submissions, and evidence

## 24.1 Assignment

An Assignment targets a Course, Learner Group, or selected Learners and contains:

- type: homework, practice, classwork, quiz, formal Assessment;
- referenced Activities/Exercises/Assessment;
- availability and deadline;
- attempt policy;
- draft policy;
- feedback and answer-release policy;
- evidence policy;
- grading policy;
- status.

## 24.2 Server-side drafts

Asynchronous Assignments and Assessments support server-side answer drafts.

- periodic and explicit save;
- idempotent and concurrency-versioned;
- not Learning Evidence;
- not visible as a submitted answer;
- formal Submit creates an immutable attempt snapshot;
- live quizzes do not use the draft workflow;
- full offline editing remains deferred.

## 24.3 Submission lifecycle

```text
assigned
→ in-progress
→ submitted
→ auto-checked
→ teacher-review
→ returned
→ resubmitted
→ accepted
```

Policies may skip states where appropriate. Preserve original attempts, feedback, corrections, and differences. Do not overwrite earlier attempts.

## 24.4 Evidence types

Include:

- submitted answer;
- automatic result;
- explanation/method;
- confidence;
- teacher observation;
- oral demonstration;
- project contribution;
- resubmission/correction;
- self-assessment;
- group activity.

## 24.5 Evidence intensity

- none;
- light;
- standard;
- deep.

Sampling may target every Student, selected Students, incorrect answers, or selected questions.

## 24.6 Scaffolding

Support a reusable sequence:

- hint;
- stronger hint;
- relevant formula;
- worked first step;
- next operation;
- inspect wrong step;
- compare approaches;
- full explanation.

Hint use may be Evidence and is not automatically penalized.

## 24.7 Concept State

Explainable sequence:

```text
not introduced
→ introduced
→ practising
→ mostly secure
→ secure
→ needs revision
```

Show basis, recent Evidence, corrections, direction, uncertainty, and optional Teacher assertion. Do not claim mathematical certainty about mastery.

## 24.8 Grade Entry

A minimal official ledger stores:

- Learner;
- Course;
- source Assignment/Assessment;
- official grade;
- grading scale;
- date;
- category;
- optional weight;
- Teacher note;
- locked/corrected state;
- audit history.

Automatic points may propose a grade, but the Teacher confirms it. No report-card or government integration.

---

# 25. Exercise authoring and ContentEditor

## 25.1 Core Exercise types

- single choice;
- multiple select;
- boolean;
- numeric tolerance;
- short accepted text;
- ordering;
- manually graded explanation;
- image/visual prompt;
- generated deterministic instance.

## 25.2 Editing depths

- quick create;
- inline common fields;
- dedicated full editor;
- advanced source/diagnostic view.

Raw JSON is never the normal editor.

## 25.3 Milkdown Crepe, mandatory

Milkdown Crepe is the Complete MVP rich Markdown editor.

Implement a thin `ContentEditor` adapter with:

- initial Markdown;
- controlled replacement through documented editor APIs;
- debounced change events;
- autosave hooks;
- read-only mode;
- focus control;
- validation state;
- safe teardown/remount;
- light/dark theme integration.

Use Crepe’s standard tables, links/images, toolbar, and inline/block LaTeX. Do not deeply customize ProseMirror or build a custom editor.

Provide an advanced Source tab using a simple textarea, or CodeMirror only if already justified. Synchronize through Milkdown Markdown getter/event APIs and documented replace behavior.

Pin the last validated Milkdown version. If a future release is temporarily incompatible, the Source tab is an emergency fallback and the missing rich editor must be recorded as an unmet requirement, not claimed complete.

Integration fixture must prove:

- Hungarian Unicode;
- headings/lists/tables;
- links/images;
- inline/block LaTeX;
- paste;
- undo/redo;
- autosave;
- lossless source round-trip;
- read-only mode;
- light/dark styling;
- remount without duplicate editors.

## 25.4 Suggestions

Deterministic authoring suggestions only:

- exact Concept aliases;
- normalized token matching;
- recent/current Phase Concepts;
- duplicate title/text warning;
- explicit “Load suggestions.”

Lazy, debounced, cancellable, capped, and cached. No embeddings.

# 26. Mathematics capability

## 26.1 Rendering

Use KaTeX for Markdown mathematics. Formula authoring needs buttons/examples, live preview, validation errors, and a raw LaTeX escape hatch. No visual equation editor.

## 26.2 Grading

Complete:

- choice/multi-select/boolean;
- ordering;
- exact accepted text variants;
- numeric answers;
- numeric tolerance;
- simple fractions and equivalent numeric forms;
- optional unit suffix;
- explainable grading result;
- manual-review fallback.

Do not implement symbolic algebraic equivalence. Never compare rendered HTML or normalized LaTeX strings as mathematical equality.

## 26.3 Exercise Family reference

Provide one deterministic Pythagorean family:

- constrained integer triples;
- reproducible seed;
- generator ID/version;
- preview variants;
- duplicate exclusion;
- exact resolved parameters stored in delivery;
- clear insufficient-variant Result.

No general constraint solver.

## 26.4 Constrained 2D plot

Provide `math.2d-plot` using Mafs with validated data only:

- axes/view;
- points/labels;
- lines/segments/vectors;
- polynomial coefficients;
- sine/cosine parameters;
- optional simple shading;
- optional movable points where safe.

Content Packages cannot provide JavaScript functions.

## 26.5 External tools

Structured helpers only:

- WolframAlpha exploration link;
- YouTube;
- ordinary URL.

Only registered providers may render embedded external media. Generic URLs open as external links with safety metadata. Fonat does not scrape or proxy external content by default. Unavailable media never blocks the core Lesson.

---

# 27. Assessment model

## 27.1 Assessment Blueprint

A Blueprint defines ordered constrained slots with:

- Concept/Curriculum intent;
- difficulty range;
- points;
- expected duration;
- eligible Exercise types;
- source eligibility;
- familiarity category;
- alternative-group requirements;
- manual/automatic grading expectations.

Profiles include weekly recap, Phase-closing, diagnostic, final, worksheet, and oral pool, but the implementation may seed a smaller set.

## 27.2 Source choices

Teacher-facing source filters:

- classwork;
- homework;
- previous quizzes;
- selected Phases/Lessons/Concepts/date range;
- close alternatives;
- generated instances.

Familiarity categories:

- repeated;
- close alternative;
- transfer;
- unseen extension.

## 27.3 Deterministic generation

Use hard eligibility rules and transparent deterministic slot filling. No global optimizer.

When content is insufficient, never silently relax. Show the shortfall and explicit options:

- add or author content;
- permit repetition;
- widen difficulty;
- allow broader alternatives;
- reduce variants;
- reduce Assessment size;
- leave a slot empty.

## 27.4 Reduced Assessment and deferred coverage

A reduced Assessment preserves the original unmet Blueprint slots as deferred coverage. A later Assessment may target those slots. Display combined coverage.

## 27.5 Variants

A/B variants must fill equivalent Blueprint slots with compatible but not necessarily identical Exercises. A report compares:

- Concepts;
- difficulty;
- expected duration;
- points;
- cognitive demand;
- tools;
- familiarity/repetition proportions.

Reordering the same questions may supplement equivalence but does not itself constitute a meaningful A/B variant.

## 27.6 Delivery and randomization

Each learner receives an immutable Assessment Delivery that stores:

- Blueprint and Assessment Revisions;
- selected Exercise Revisions;
- generator/strategy IDs and versions;
- seed and resolved parameters;
- final question order;
- canonical option IDs and presented order;
- feedback/retry/reveal policies;
- delivery timestamps and status.

Submitted presented answers normalize back to canonical answer IDs. Historical grading never reruns a later generator version.

## 27.7 Retry policy

Control separately:

- same/different question set;
- same/different option order;
- same/different generated numeric parameters;
- official versus practice stability.

## 27.8 Online and printable delivery

Both are Complete MVP:

- assign to Course or selected Learners;
- stable learner-specific variant;
- availability/deadline;
- answer drafts;
- save/submit;
- attempt policy;
- automatic/manual grading;
- correction/resubmission;
- print-ready paper and answer key.

## 27.9 Regrading

Changes to accepted answers or grading rules require an impact preview before confirm. Store rule/module version and explanation. Teacher override reason is required for official/locked results.

---

# 28. Analyzer pipeline

Implement a small deterministic pipeline, approximately five analyzers:

1. easiest and hardest questions;
2. strongest and weakest Concepts;
3. high omission rate;
4. unusually attractive distractor;
5. Learners requiring follow-up.

An expected-difficulty mismatch analyzer may replace one of the above if better supported by the seed data.

Analyzers produce Findings only. They do not mutate Grades, Concept States, or plans.

Each Finding contains:

- type/version;
- evidence basis;
- affected entities;
- severity;
- explanation;
- suggested actions;
- dismissal/acknowledgment state.

---

# 29. Rubric scope

Keep Rubric intentionally narrow.

Complete one manually graded reference path with:

- ordered criteria;
- title and short description;
- maximum points;
- optional simple performance descriptions;
- calculated total;
- Teacher adjustment with reason.

Defer broad Rubric library management, curriculum-wide analytics, standards matrices, and attaching Rubrics to every entity.

---

# 30. Project capability, isolated Functional Foundation

## 30.1 Isolation and toggle

Implement Project as a separate feature slice/capability module.

- enabled in demo and development;
- disabled in blank production by default;
- no dependency from normal Course, Lesson, Assignment, or Assessment workflows;
- disabling removes routes/navigation but preserves data;
- normal workflows ignore disabled Project data;
- encountered Relations display unavailable-capability references;
- imports remain staged as unsupported;
- re-enabling restores access;
- disabling never deletes data.

Use typed Results, guard clauses, and explicit fallbacks. Do not implement hidden partial behavior.

## 30.2 Minimal real framework

Provide:

- schema/package contract;
- Project Node and Relations;
- minimal create/edit/detail UI;
- feature toggle administration;
- one seeded Project;
- contributor documentation.

A Project may connect Subjects, Courses, Learner Groups, Concepts, Curriculum Requirements, Phases, Activities/ActivityTemplates, Resources, Assignments, expected outputs, equipment, and preparation notes.

Do not implement scheduling optimization, room allocation, custom progress engines, collaborative canvas, or institutional administration.

## 30.3 Seed fixture: Escape from the Mushroom Yard

Working titles:

- **Szökés a gombakertből**
- **Escape from the Mushroom Yard**

Create a small, intentionally incomplete, original cross-subject Project:

- playful forest setting;
- distinct forest-animal characters as the players;
- each animal has an identity, strength, and recurring role;
- they encounter a short sequence of challenges while trying to escape a mushroom yard in the middle of the forest;
- ensemble-adventure tone may evoke classic village fantasy, but all characters, writing, art, and tasks are original;
- use Bebras-style pedagogical inspiration only: concise story-framed computational-thinking puzzles, no copied or closely adapted protected task.

Include compact challenges around:

- binary-number decoding/representation;
- visual or structural pattern matching;
- mathematical fractions.

Connect Mathematics and Informatics Subjects, relevant Concepts/Requirements, one or more Courses/Learner Groups, Resources, Activities/Templates, Assignments, expected outputs, equipment, and preparation notes.

Mark clear incomplete areas as contributor opportunities suitable for gradual development by high-school computer-science students.

---

# 31. Search, selectors, and collection views

## 31.1 Native MongoDB search baseline

Do not require Atlas Search so local Docker and hosted free-tier behavior remain aligned.

Each module supplies a bounded deterministic search projection containing relevant:

- localized titles;
- aliases;
- normalized Markdown/plain text;
- tags;
- registered identifiers;
- type-specific searchable fields.

Store/index the projection in the Node envelope.

## 31.2 Guided selectors

No normal UI asks for raw IDs. Use searchable selectors, chips, contextual defaults, recent selections, and inline quick creation for:

- Subjects;
- Courses;
- Learner Groups;
- Learners;
- Concepts;
- Exercises;
- Profiles;
- Blueprints;
- Relations;
- Locations;
- packages.

Internal IDs appear only in advanced details.

## 31.3 Cursor paging

- server-side paging/filtering/sorting;
- cursor contains the full stable sort tuple, such as `(updatedAt, id)`;
- no fixed `limit=100` screen may silently hide records;
- exact total count is optional and should not be recomputed without real UI need;
- changing filter/sort resets paging safely;
- subsequent pages remain stable under ordinary concurrent changes.

## 31.4 Tables

Use Radix Table for simple small lists and TanStack Table for advanced server-driven views. Do not load complete large collections into the browser.

---

# 32. Navigation and UX

Primary workspace navigation:

- Today
- Planning
- Library
- Classes
- Assessments
- Insights
- Admin

Optional Project navigation appears only when enabled.

## 32.1 Today

Prioritized actions, not a KPI dashboard:

- current/next Lesson;
- Course, Learner Group, time, and Teaching Location;
- launch Presentation;
- diagnostics;
- submissions awaiting review;
- Findings/gaps;
- quick create/free Lesson.

## 32.2 Node detail

Use a shared detail shell with:

- localized identity;
- lifecycle/revision;
- rights/provenance;
- type-specific content;
- Relations/Related panel;
- activity/revision history;
- contextual actions.

## 32.3 Action progression

Preserve spatial context with evolving controls where safe:

- Save → Saved → Publish
- Generate → Review → Apply

Destructive or meaning-changing actions still require nearby preview/confirmation.

## 32.4 Activity and notifications

- Recent Activity: meaningful domain events, newest first, roughly 30 lines, timestamp/status/link.
- Notifications: actionable attention only.
- No raw HTTP logs, autosave chatter, or generic messaging framework.

## 32.5 Result-to-UI mapping

- field errors beside fields;
- panel errors in the local panel;
- structured operation summary for imports/generation;
- toast only for brief global confirmation;
- expandable technical reference;
- retry only when safe/idempotent.

## 32.6 Fonat Guide

Provide an in-application searchable terminology and behavior guide with canonical entries and contextual help links. Tabs:

- teaching structure;
- educational content;
- planning configuration;
- learners and progress;
- platform concepts.

Each canonical term gets a concise one- or two-sentence explanation plus links to relevant screens or deeper docs. Contextual info icons must point to the canonical entry rather than duplicating inconsistent tooltip text.

---

# 33. Visual system and accessibility

## 33.1 UI foundation

- Radix Themes as primary styled component system;
- Radix Primitives for genuine gaps;
- CSS Modules for custom layouts;
- no Tailwind or CSS-in-JS;
- centralized `tokens.css`, `theme.css`, `print.css`, `presentation.css`, and small utilities.

Avoid custom components when a stable platform/library feature exists.

## 33.2 Appearance

- light and dark themes;
- selected Project Input palette;
- no pure black/white contrast by default;
- density preference where useful;
- print styling separate from screen styling.

## 33.3 Accessibility

Required:

- keyboard operation;
- visible focus;
- semantic HTML;
- tested contrast;
- no color-only states;
- text/icon labels for identity and findings;
- alt text;
- reduced motion;
- accessible drag-and-drop alternatives;
- readable projected view;
- practical formula accessibility and source visibility.

---

# 34. Localization

Use `i18next` and `react-i18next` JSON namespaces.

- English source/fallback;
- Hungarian default;
- modules own namespaces;
- educational translations share stable structural identity and may override language-specific assets/answers where necessary;
- normal surfaces never expose raw lifecycle/status identifiers;
- internal codes remain only in advanced/debug details.

Administration-editable localization overrides are post-MVP.

---

# 35. Content Packages

## 35.1 Folder format

```text
package.json
nodes/*.json
content/*.md
relations.json
assets/
README.md
USAGE.md
AUTHORING.md
AI-GENERATION.md
examples/
schemas/
```

The exact subdivision may evolve, but package identity and validation contracts must remain versioned.

## 35.2 Content only

Packages contain data/assets, never executable code.

Stable package ID plus local stable keys define identity. Packages declare required capability IDs/versions.

## 35.3 Validation

Validate:

- schema versions;
- IDs and duplicate identities;
- supported registered types;
- relation endpoints/contracts;
- dependencies;
- Markdown/assets/translations;
- lifecycle;
- grading contracts;
- URL schemes;
- rights metadata;
- deployment profile limits;
- cycles where forbidden;
- optional declarative grading/generator cases.

## 35.4 Archive ingestion safety

Limit:

- compressed size;
- total uncompressed size;
- entry count;
- per-entry size;
- directory depth;
- JSON/Markdown parse size.

Reject:

- absolute paths;
- `..` traversal;
- duplicate normalized paths;
- symlinks;
- executables;
- unsupported compression;
- zip bombs;
- suspicious MIME mismatch;
- SVG scripts, event handlers, foreign objects, or uncontrolled external references.

## 35.5 Staging

Show package-level:

- additions;
- updates;
- conflicts;
- invalid records;
- missing dependencies;
- unsupported/disabled capabilities;
- skipped assets;
- rights issues.

Select/apply/reject complete packages. Per-record mixed partial import is not required.

## 35.6 Atomic apply

Validate before write, then apply a bounded complete package in one MongoDB transaction.

- local Docker MongoDB runs as a single-node replica set;
- memory test repository applies to cloned state and swaps only after success;
- keep package size bounded for short transactions;
- record an Import Run and audit outcome;
- do not promise all-or-nothing while performing unguarded ordered upserts.

## 35.7 Export and reset

Support:

- selected package export;
- educational workspace export;
- package round-trip validation;
- deterministic demo reset;
- reset never deletes teacher-owned forks.

---

# 36. Reference content as packages

Educational reference content must be authored as normal validated Content Packages and loaded through the same importer used by users.

Separate operational workspace fixture data:

- accounts;
- Learners/Enrollments;
- Assignment deliveries;
- Submissions/Evidence;
- LessonRuns/live sessions;
- Findings.

Do not maintain one giant seed source file that bypasses normal contracts.

---

# 37. Content repository, contracts, and CLI

Monorepo packages:

- `@fonat/content-contracts`
- `@fonat/content-cli`

They must be versioned, buildable, testable, and `npm pack` compatible. Publishing to a public registry is not one-shot acceptance because credentials are unavailable.

Provide content-repository template:

```text
AGENTS.md
README.md
package.json
package-lock.json
contracts.lock
content/
examples/
scripts/validate.ps1
scripts/validate.sh
.github/workflows/validate.yml
```

Commands:

- validate;
- test declarative cases;
- package ZIP;
- inspect dependencies;
- report contract compatibility.

Use the same validation core in app import, CLI, and content CI.

Contract upgrades in MVP provide version checks, migration guidance, machine-readable reports, and only trivial deterministic converters.

---

# 38. Public GitHub Content Source

Manual ZIP import is the Complete MVP path.

A narrow public GitHub foundation may support:

- owner/repository;
- branch/tag/commit;
- optional content root;
- download one snapshot;
- discover complete recognized packages;
- select packages and route through normal staging/import.

No clone, credentials, private repository, write-back, auto-sync, or arbitrary file interpretation. If this threatens core correctness, retain contracts/tests/documentation and classify the UI as unfinished Foundation.

---

# 39. External AI exchange

No internal AI in MVP.

Provide one real export task bundle for generating missing Exercises:

- README/instructions;
- selected Concepts/Requirements;
- existing related Exercises;
- schemas and terminology;
- rights constraints;
- expected output folder;
- validation command.

AI output returns through normal package staging. Additional task types may be documented examples.

---

# 40. Assets and deployment profiles

## 40.1 Hosted restricted profile

For Vercel/ordinary Render free deployment:

- bundled SVG/tiny images;
- external URLs/registered providers;
- no general upload/object storage;
- no reliance on writable persistent filesystem;
- assets referenced by metadata/hash, never MongoDB blobs.

## 40.2 Local rich profile

Docker may use a mounted filesystem provider and a very small optional rich-media fixture. This proves the provider contract only.

## 40.3 Hard and soft limits

Environment/deployment profile sets hard maxima. Admin may lower but never raise them beyond environment limits.

## 40.4 External availability

Broken/unavailable external content displays a clear placeholder and attribution/source link. It never blocks Lesson execution.

---

# 41. Exports

Canonical export is print-ready HTML with browser Print/Save as PDF.

Required layouts:

- compact teacher Lesson sheet;
- detailed teacher guide;
- student worksheet;
- Assessment paper;
- answer key;
- Curriculum coverage overview;
- Annual Plan overview;
- teacher weekly timetable.

Optional local Docker Chromium/Playwright server PDF may be implemented if straightforward. Do not require server PDF on Vercel. No DOCX.

# 42. Architecture

## 42.1 Locked stack

- TypeScript end-to-end;
- npm workspaces and `package-lock.json`;
- React + Vite frontend;
- Fastify backend;
- MongoDB official driver;
- Zod runtime schemas;
- Fastify Zod/JSON-Schema type-provider approach;
- `@fastify/swagger` generated OpenAPI;
- React Router;
- TanStack Query where server-state behavior justifies it;
- TanStack Table for advanced paged tables;
- React Hook Form + Zod;
- Radix Themes/Primitives;
- Milkdown Crepe;
- KaTeX;
- Mafs;
- `dnd-kit`;
- Playwright and focused unit/integration tooling;
- Temporal adapter/polyfill as needed.

Do not switch to Next.js, GraphQL, tRPC, Mongoose, Redux, Zustand, microservices, or a workflow framework without a recorded blocking reason.

## 42.2 Monorepo shape

A suitable structure:

```text
apps/
  web/
  server/
packages/
  domain/
  application/
  contracts/
  graph/
  modules/
  ui/
  testing/
  content-contracts/
  content-cli/
modules/
  core/
  mathematics/
  math-2d/
  projects/
content/
  foundation/
  reference-grade8/
  reference-grade11/
  reference-projects/
deployment/
  docker/
  vercel/
  render/
docs/
```

Exact paths may change, but dependency direction and feature slices may not.

## 42.3 Feature slices

Group schemas, use cases, routes, UI, and tests by feature. Avoid giant controller/service/route folders.

A route handler must:

1. parse/validate request;
2. authenticate/authorize;
3. call one application use case;
4. map a typed Result.

Business workflows, lifecycle transitions, pedagogical decisions, revision resolution, and validation do not live in Fastify handlers or React pages.

Repositories persist/query and expose atomic commands. They do not make pedagogical decisions.

No CQRS framework is required.

## 42.4 Dependency rules

Machine-check:

- domain imports no React/Fastify/Mongo/Vercel/Render;
- application imports domain/contracts, not adapters;
- web/server adapters depend inward;
- modules depend only public platform contracts;
- module private imports are forbidden;
- capability code cannot access MongoDB directly.

## 42.5 Result pattern

Expected failures use typed Results, including:

- Validation;
- NotFound;
- Unauthorized/Forbidden;
- Conflict;
- UnsupportedCapability;
- DependencyMissing;
- ImportRejected;
- InsufficientCandidates;
- ExternalUnavailable.

Exceptions are for programming/unexpected infrastructure failures and are caught/mapped at boundaries.

## 42.6 Lifecycle transitions

Centralize allowed transitions for:

- publication;
- Lesson;
- LessonRun;
- LiveSession;
- Assignment;
- Submission;
- Assessment Delivery;
- GradeEntry;
- package operation.

Use explicit functions/tables, typed Results, invariants, audit/activity emission, and unit tests. No external state-machine framework unless it clearly simplifies the code.

---

# 43. API and client contract

## 43.1 REST and OpenAPI

Use REST. Runtime route schemas generate a committed/CI-generated OpenAPI artifact.

Require:

- standardized Result/error envelopes;
- paging/filter/sort schemas;
- authorization metadata/documentation;
- stable operation IDs;
- contract CI validation;
- frontend types generated from OpenAPI;
- very small typed fetch adapter integrated with TanStack Query.

Do not lock the specification to a large fetch-client library with uncertain maintenance direction.

## 43.2 Server state

Use TanStack Query for:

- server paging;
- mutation invalidation;
- autosave status where appropriate;
- lazy suggestions;
- polling live sessions;
- conflict handling.

Do not prefetch aggressively or put ordinary local form state into a global server cache.

## 43.3 Authorization

Every protected API operation checks capabilities and ownership. Protected UI routes also hide/guard unavailable actions, but UI checks never replace API enforcement.

---

# 44. Security

Complete MVP security acceptance:

- app-owned credentials and server-side sessions;
- HTTP-only secure cookies in production;
- SameSite policy appropriate to deployment;
- CSRF or strict Origin/Referer protection for mutation requests;
- authentication and live-answer rate limits;
- password/secret length bounds;
- versioned password hashes and constant-time comparison;
- temporary-password change enforcement;
- reset invalidates sessions;
- session expiry and manual invalidation;
- security headers and CSP suitable for registered media providers;
- input/schema validation;
- sanitized Markdown/SVG;
- no browser JWT storage;
- no email requirement;
- audit for auth, grading, publication, import, destructive actions, and capability changes;
- secret scanning and no committed production secrets.

## 44.1 Environment validation

Production startup fails fast when:

- persistence is in-memory;
- session secret is missing/default/weak;
- public URL or allowed origins are invalid;
- required storage/profile settings are absent;
- test adapters are configured;
- MongoDB is unavailable after bounded startup retries.

Provide profile smoke tests for local raw development, Docker, Vercel, and Render.

---

# 45. Performance, indexes, and scale

Architectural target, not Atlas Free fixture size:

- 100k Nodes;
- 500k Relations;
- 10k Exercises;
- 2k Lessons;
- 500 Assessments;
- 100 historical Learners;
- 100k Evidence records;
- external assets potentially GB outside MongoDB.

Requirements:

- deliberate idempotent indexes;
- compound indexes matching filters/sorts;
- unique identity/package constraints;
- bounded graph traversal;
- stable cursor paging;
- no whole-collection loading;
- no aggregation requiring `allowDiskUse` for Atlas Free;
- compact live polling payloads;
- index creation/migration tests.

Archiving remains manual export/metadata foundation. Do not build full automated archival workflow.

---

# 46. Deployment and operations

## 46.1 Runtime adapters

One conventional Fastify application factory with thin adapters:

- local Node listener;
- Docker/Render listener binding `0.0.0.0:$PORT`;
- Vercel Function entry point.

No business logic in adapters. Reuse Mongo clients safely in serverless environments. Runtime behavior must not depend on in-memory locks, sessions, or persistent local files.

## 46.2 Docker, authoritative acceptance runtime

Local Docker Compose is the authoritative acceptance environment.

It must provide:

- application image;
- MongoDB single-node replica set for transaction support;
- automatic replica-set initialization/health checks;
- persistent local volumes;
- one command startup;
- health endpoint;
- optional demo seed/reset commands;
- clean shutdown and reset documentation.

## 46.3 Vercel

Support a single Vercel project with:

- Vite static frontend output;
- one Fastify Vercel Function for API routes;
- `vercel.json` or equivalent committed configuration;
- SPA rewrites;
- explicit output directory;
- bounded request sizes;
- no persistent filesystem assumptions;
- Atlas MongoDB;
- hosted restricted asset profile.

For the generated repository, the README must state the exact dashboard values. Unless the implementation produces a different verified adapter, use:

- **Framework Preset:** `Other`
- **Root Directory:** repository root
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Output Directory:** controlled by committed `vercel.json`, expected `apps/web/dist`
- **Node.js version:** the exact pinned/supported version declared by the repository

The agent must verify this with `vercel build` or the closest available local Vercel adapter test and update README values to match the actual repository, never leave generic placeholders.

## 46.4 Render

Support Docker deployment using a committed `render.yaml` Blueprint and root Dockerfile.

Requirements:

- one Web Service;
- Docker runtime;
- bind to `0.0.0.0` and `$PORT`;
- health check path such as `/api/health`;
- hosted restricted asset profile unless a paid persistent disk is deliberately configured;
- Atlas MongoDB or another externally reachable MongoDB replica set;
- no assumption that the free ephemeral filesystem retains uploads;
- graceful shutdown.

## 46.5 Background work

No generic persistent job framework. Ordinary operations are synchronous and bounded. Use GitHub Actions for low-frequency maintenance where appropriate. Vercel cron limitations must not be part of core classroom workflows.

## 46.6 Observability

Practical only:

- structured logs;
- correlation IDs;
- auth failures;
- module/pipeline failures;
- package operations;
- destructive/grading/publication events;
- admin health.

Keep technical logs, audit records, and user-facing activity separate. No full OpenTelemetry platform required.

---

# 47. README deployment instructions, mandatory

The generated root `README.md` must be sufficient for a developer unfamiliar with the repository to start each supported environment without guessing. Do not merely link to provider documentation.

## 47.1 README opening

Include:

- what Fonat is;
- screenshots or concise feature summary if available;
- motto and separate About line;
- current capability status;
- prerequisites;
- fastest local path;
- links to detailed architecture/content docs.

## 47.2 Local raw development, step by step

Document exact commands and expected outputs:

1. install the pinned Node/npm version;
2. clone repository;
3. copy `.env.example` to `.env`;
4. generate a strong `SESSION_SECRET` with a provided command;
5. start MongoDB through the supported Compose dependency command;
6. install with `npm ci`;
7. run migrations/index creation/foundation seed as actually required;
8. start web/server development processes through one root command;
9. open the exact URL;
10. complete first-run Admin bootstrap;
11. optionally load/reset demo workspace;
12. run tests and validation;
13. stop/clean local services.

Explain environment variables in a table with required/optional, example-safe value, profile, and purpose.

## 47.3 Full local Docker, step by step

Document:

1. prerequisites: Docker Desktop/Engine and Compose;
2. copy/configure Docker env file;
3. `docker compose up --build` or exact repository command;
4. Mongo replica-set initialization behavior;
5. exact application and health URLs;
6. first-run bootstrap;
7. demo load/reset;
8. logs command;
9. stop command;
10. preserve data versus destructive volume reset;
11. how to rebuild after dependency/schema changes;
12. common failures: occupied port, replica-set health, old volume/schema, weak secret.

## 47.4 Vercel, step by step

The root README must explain:

1. create or select MongoDB Atlas project/cluster;
2. create database user with the minimum needed permissions;
3. configure network access appropriate to Vercel, with a warning about broad allowlists;
4. copy the connection string;
5. push repository to GitHub/GitLab/Bitbucket;
6. Vercel: **Add New → Project → Import repository**;
7. choose the exact Framework Preset, normally `Other` for this custom Fastify+Vite monorepo;
8. set Root Directory to repository root;
9. confirm Install/Build/Output values from committed `vercel.json`;
10. add every required environment variable for Production and Preview where appropriate;
11. include at least `MONGODB_URI`, strong `SESSION_SECRET`, `PUBLIC_APP_URL` or equivalent, allowed origins, deployment profile, timezone/default locale, and any asset limits used by the implementation;
12. deploy;
13. inspect build/function logs;
14. call the health endpoint;
15. complete first-run Admin bootstrap;
16. explain preview-environment database isolation recommendation;
17. explain redeploy and rollback basics;
18. explain Vercel restrictions: ephemeral filesystem, hosted restricted assets, payload limits, no always-running process.

The README must name the actual file/routes Vercel uses and describe how SPA routes reach `index.html` and API routes reach the single Fastify Function.

## 47.5 Render, step by step

Prefer the committed Blueprint path:

1. create/select Atlas MongoDB as above;
2. push repository to supported Git provider;
3. Render: **New → Blueprint**;
4. connect repository and select `render.yaml`;
5. review the generated Docker Web Service;
6. add required secret environment variables;
7. confirm Dockerfile path, health check, branch, and region;
8. deploy;
9. verify logs show binding to `0.0.0.0:$PORT`;
10. call health endpoint;
11. complete first-run bootstrap;
12. explain free-service sleeping where relevant;
13. explain ephemeral filesystem and why uploads are disabled in hosted restricted profile;
14. explain manual redeploy/rollback and environment update;
15. provide manual Web Service setup as a fallback if Blueprint import is unavailable.

## 47.6 Documentation truthfulness test

CI or a verification checklist must confirm that every command, path, environment variable, Framework Preset, Build Command, Output Directory, health route, and port stated in README matches repository configuration. A README copied from a generic template fails acceptance.

---

# 48. Supply-chain policy

- one package manager/registry;
- committed lockfile and `npm ci`;
- pinned Node version;
- avoid install scripts where practical and document exceptions;
- review transitive impact, maintenance, license, and removal plan for significant dependencies;
- no automatic major updates;
- vulnerability and license checks;
- secret scan;
- SBOM generation where straightforward;
- imported content non-executable;
- Capability Module code receives normal code review.

Significant dependency changes document:

- need;
- alternatives;
- maintenance/license;
- transitive size/scripts;
- adapter boundary;
- removal path.

---

# 49. Testing and verification

## 49.1 Strategy

Prioritize workflow integration tests, focused domain units, module conformance, and a small set of browser journeys.

Required feature slices:

- content/graph;
- onboarding/identity;
- Course/timetable;
- lesson planning;
- revision resolution;
- presentation/live;
- Assignment/submission/evidence;
- Assessment delivery/grading/analysis;
- packages;
- admin/security/deployment;
- optional Project isolation.

## 49.2 Required browser journeys

At minimum:

1. blank database → bootstrap → first Course/Learners/Concept/Exercise/Lesson/Assignment;
2. load Grade 8 demo → prepare/publish Lesson;
3. run Presentation Mode → launch live quiz → join/answer as Student;
4. assign asynchronous work → save draft → submit → return → resubmit;
5. generate A/B-compatible Assessment → stable learner delivery → grade/analyze;
6. publish Exercise revision → inspect impact → preserve scheduled/completed behavior;
7. import/export package → verify atomic rejection and successful round trip;
8. reset demo without deleting teacher fork;
9. weekly timetable displays Course, Learner Group, and Location;
10. disabled Project capability hides UI, preserves data, and stages unsupported import.

## 49.3 Real MongoDB integration tests

Do not rely only on memory repositories.

Test against the same replica-set topology used by Docker:

- transactions;
- indexes/unique constraints;
- cursor paging;
- filters/sorts;
- compare-and-swap conflicts;
- idempotency;
- atomic live joins/answers/transitions;
- revision resolution;
- package rollback;
- migration application.

Provide clear developer documentation:

- how to start the test MongoDB;
- required Docker commands;
- how databases are isolated per run/worker;
- seed/reset strategy;
- cleanup;
- debugging retained databases;
- how to interpret transaction/replica-set failures;
- CI service setup.

## 49.4 Additional contract tests

- OpenAPI artifact matches handlers/schemas;
- frontend generated types compile;
- module registry/conformance;
- ContentEditor fixture;
- localization does not expose raw codes;
- paging reaches records beyond first page;
- security/authorization failure paths;
- Vercel adapter smoke;
- Render/Docker config validation;
- README command/config truthfulness.

## 49.5 Root commands

Provide and verify:

```text
npm ci
npm run dev
npm run build
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run validate
npm run demo:reset
npm run package:validate
npm run openapi:generate
```

Names may differ slightly, but the root README and package scripts must agree.

---

# 50. Documentation and agent guidance

Required:

```text
AGENTS.md
docs/ARCHITECTURE.md
docs/DOMAIN-MODEL.md
docs/EXTENSIONS-AND-CONTRACTS.md
docs/CONTENT-AUTHORING.md
docs/DEPLOYMENT-AND-OPERATIONS.md
docs/TESTING.md
docs/SECURITY.md
docs/adr/
IMPLEMENTATION-DEVIATIONS.md
CONTENT-RIGHTS.md
STEWARDSHIP.md
```

Use nested `AGENTS.md` only in meaningful folders. Root explains reading nearest ancestors. Do not build a generated agent-doc index for MVP.

`IMPLEMENTATION-DEVIATIONS.md` must list every unverified, deferred, simplified, or substituted requirement with reason and impact. It may not be used to excuse silent omissions.

Provide a machine-readable capability catalogue with statuses such as Complete, Foundation, Deferred, Stable, Preview, Experimental. Generate a small Admin/Roadmap view from it rather than building a project-management system.

---

# 51. Licensing, rights, and stewardship

- Code, CLI, schemas, and executable module examples: exact PolyForm Noncommercial 1.0.0 text.
- Project-owned educational seed content and prose docs: CC BY-NC-SA 4.0.
- Imported content: per-item metadata/license.
- Brand/logo: all rights reserved unless separately licensed.

Include a nonbinding stewardship request asking public authorities, national/regional systems, vendors, platform operators, and large institutions to contact the project before integration, redistribution, white-labeling, or institutional-scale use. State explicitly that this request does not alter the license.

Every imported/published Resource/asset carries author, source/bibliographic data, license, attribution, modification, redistribution status, and rights state.

Public packages exclude unknown/unresolved/private-use rights. Source citation is not permission.

---

# 52. Grade 8 reference workspace

## 52.1 Identity

- Hungarian Grade 8 Mathematics;
- right triangles and Pythagorean theorem;
- one Learner Group and Course;
- Teaching Location;
- five animal-pseudonymous Learners with varied profiles;
- fixed Demo Clock-relative schedule.

## 52.2 Educational content

Approximately:

- 20 to 25 Concepts including prerequisites/extensions;
- 18 carefully authored Exercises;
- at least 6 close alternatives or deterministic generated instances;
- 5 to 6 Resources;
- 3 Teaching Profiles;
- 3 Lesson Blueprints;
- 2 Lesson Layouts;
- 12 Phase lesson positions;
- at least 5 fully authored Lessons;
- 2 completed LessonRuns;
- 3 Assignments/homework instances;
- 2 formative quizzes;
- 1 closing Assessment with compatible A/B variants;
- 1 reduced Assessment with deferred coverage;
- one lightweight Rubric/manual-grading example;
- real Results/Evidence for all five Learners;
- deliberate Findings/revision cases.

## 52.3 Exact learner fixture

1. `learner.red-panda` / Vörös Panda
   - advanced and fast numerically;
   - sometimes omits explanation.
2. `learner.otter` / Vidra
   - broadly on level;
   - strong collaborative participation.
3. `learner.lynx` / Hiúz
   - broadly on level;
   - inconsistent confidence.
4. `learner.hedgehog` / Sün
   - needs scaffolding;
   - benefits from visual and step-by-step support.
5. `learner.fox` / Róka
   - inconsistent participation;
   - capable when engaged.

Each has a unique icon, color, and text label. Do not rely on color alone.

## 52.4 Exact Concept catalogue

Include at least these 24 Concepts with prerequisite, extension, and application Relations:

1. natural-number square;
2. exponent with exponent two;
3. square root;
4. approximate square root;
5. length and units;
6. unit conversion;
7. triangle;
8. right angle;
9. right triangle;
10. leg of a right triangle;
11. hypotenuse;
12. square area;
13. Pythagorean theorem;
14. identify the hypotenuse;
15. calculate a missing hypotenuse;
16. calculate a missing leg;
17. validate triangle side lengths;
18. converse of the Pythagorean theorem;
19. estimation and plausibility check;
20. mathematical modelling from text;
21. rectangle diagonal;
22. coordinate plane;
23. distance between two points;
24. visual area interpretation of the theorem.

Required example Relations:

- square root requires natural-number square;
- Pythagorean theorem requires right triangle, square area, and exponent two;
- missing leg requires Pythagorean theorem and square root;
- distance between two points extends Pythagorean theorem and coordinate plane;
- rectangle diagonal applies Pythagorean theorem.

## 52.5 Exact Resource catalogue

1. `resource.right-triangle-vocabulary`
   - Hungarian Markdown and representative English translation;
   - labelled bundled SVG;
   - leg/hypotenuse terminology.
2. `resource.pythagorean-visual-proof`
   - area-based explanation;
   - bundled SVG with squares on triangle sides;
   - alt text;
   - no external dependency.
3. `resource.missing-hypotenuse-worked-example`
   - step-by-step example;
   - KaTeX formulas and scaffold.
4. `resource.missing-leg-worked-example`
   - worked example;
   - common subtraction/sign mistake warning.
5. `resource.coordinate-distance-bridge`
   - coordinate differences connected to a right triangle;
   - tiny SVG and optional Mafs representation.
6. `resource.wolfram-pythagorean-exploration`
   - structured external WolframAlpha link.
7. Optional local-rich `resource.local-video-demo`
   - one short small video proving the local provider contract;
   - excluded from core hosted acceptance.

## 52.6 Exact authored Exercise catalogue

Each Exercise includes a real Hungarian prompt, representative English where useful, expected answer/grading guidance, duration, difficulty, Concept Relations, purpose, rights, and evidence policy.

1. `exercise.identify-hypotenuse-01`: labelled-triangle single choice, 2 min.
2. `exercise.identify-hypotenuse-02`: rotated image single choice, close alternative, 2 min.
3. `exercise.square-values-recap`: matching/accepted text for 3, 4, 5, 6 and their squares, 4 min.
4. `exercise.square-root-recap`: simple perfect-square numeric items, 4 min.
5. `exercise.discover-3-4-5`: guided explanation comparing square areas, 8 min, light evidence.
6. `exercise.theorem-true-false`: right-triangle theorem statements, 4 min.
7. `exercise.missing-hypotenuse-6-8`: numeric, exact 10, scaffold, 5 min.
8. `exercise.missing-hypotenuse-decimal`: tolerance answer plus plausibility check, 6 min.
9. `exercise.missing-leg-13-5`: numeric, exact 12, scaffold, 6 min.
10. `exercise.missing-leg-common-mistake`: identify first invalid step, 6 min, standard evidence.
11. `exercise.rectangle-diagonal`: word problem, 7 min.
12. `exercise.ladder-wall`: practical height problem with units, 8 min.
13. `exercise.is-right-triangle`: multi-select side triples, 7 min.
14. `exercise.converse-explanation`: manual explanation, 8 min, deep evidence, lightweight Rubric.
15. `exercise.coordinate-distance-01`: integer-distance numeric, 7 min.
16. `exercise.coordinate-distance-02`: non-integer tolerance, 8 min.
17. `exercise.choose-method`: choose missing hypotenuse/leg/not applicable plus light explanation, 6 min.
18. `exercise.exit-ticket`: numeric item, confidence vote, short reflection, 4 min.

## 52.7 Exercise Family and pinned instances

`family.pythagorean-integer-triples` uses selected primitive/scaled triples, including:

- 3, 4, 5;
- 5, 12, 13;
- 6, 8, 10;
- 8, 15, 17;
- 9, 12, 15;
- 7, 24, 25.

Generated forms:

- missing hypotenuse;
- missing first leg;
- missing second leg;
- short practical context.

Seed at least six pinned resolved instances with reproducible seeds and duplicate exclusion.

## 52.8 Exact Profiles, Blueprints, and Layouts

Profiles:

- **Balanced standard:** moderate explanation/repetition, mixed participation, short evidence, ordinary homework.
- **Small advanced:** less repetition, more transfer, faster pacing, independent work, deeper selected explanations.
- **Support-focused:** prerequisite recap, smaller steps, guided examples, frequent low-stakes checks, scaffold-first feedback.

Blueprints:

1. **45-minute introduction:** 5 recap, 8 problem introduction, 12 guided discovery, 10 formalization, 7 practice, 3 closure.
2. **45-minute practice:** 5 recap, 8 worked example, 20 differentiated practice, 7 interactive check, 5 closure/homework.
3. **20-minute recap/formative:** 3 retrieval, 10 quiz/Exercises, 5 correction, 2 exit ticket.

Layouts:

- **Compact one-page teacher sheet:** objective, timeline, prompts, Resources, expected answers, note area.
- **Detailed teacher guide:** full instructions, differentiation, answers, misconceptions, slide outline, follow-up notes.

## 52.9 Phase sequence

1. prerequisite revision;
2. discover the relationship;
3. theorem and notation;
4. calculate hypotenuse;
5. calculate a leg;
6. word problems;
7. coordinate link;
8. differentiated practice;
9. formative Assessment;
10. correction and targeted recap;
11. Phase-closing A/B Assessment;
12. follow-up based on Findings.

## 52.10 Detailed Lesson examples

### Lesson 2: Discovering the relationship

- Introduction Blueprint;
- right-triangle vocabulary Resource;
- identify-hypotenuse Activity;
- 3-4-5 discovery Activity;
- visual-proof Resource;
- short class discussion;
- confidence-vote closure;
- planned 45 minutes.

### Lesson 3: Formal theorem and notation

- vocabulary recap;
- formal KaTeX theorem statement;
- worked example;
- true/false check;
- learner explanation prompt;
- homework Assignment.

### Lesson 4: Missing hypotenuse

- completed LessonRun;
- standard worked example;
- generated integer-triple practice;
- scaffolded decimal task;
- live exit ticket;
- runtime note that one Activity ran long.

### Lesson 9: Formative Assessment

- completed LessonRun;
- phone-based quiz;
- five Learners with real results;
- attractive distractor;
- weak-prerequisite Finding;
- learner follow-up Finding.

### Lesson 11: Phase-closing Assessment

- meaningful A/B variants;
- printable and online delivery;
- manual grading override example;
- deferred coverage linked to a later smaller Assessment.

## 52.11 Assignments and formative quizzes

Assignments:

1. hypotenuse practice with light evidence;
2. missing-leg correction cycle;
3. practical home measurement with optional local-profile photo and a written alternative always available.

Formative quizzes:

1. vocabulary and theorem recognition;
2. mixed missing-side calculation plus confidence vote.

## 52.12 Assessment Blueprint fixture

Slots:

1. identify right-triangle elements, 2 points;
2. missing hypotenuse, 3 points;
3. missing leg, 3 points;
4. practical word problem, 4 points;
5. right-triangle validation, 3 points;
6. short reasoning item, 5 points.

Generate compatible A/B variants. The reduced fixture fills slots 1 to 3 and retains slots 4 to 6 as deferred coverage.

## 52.13 Seeded result patterns

Create realistic data that deterministically yields:

- easiest and hardest question;
- high omission on the reasoning item;
- attractive distractor around the missing-leg mistake;
- weak square-root prerequisite;
- Vörös Panda correct but missing explanation;
- Sün improving after scaffold and correction;
- Róka showing inconsistent participation;
- Hiúz showing low confidence despite correct answers;
- Vidra performing steadily.

## 52.14 Exercise variety

Include:

- single/multiple choice;
- boolean;
- numeric tolerance;
- accepted text;
- ordering;
- manual explanation;
- image/SVG;
- close alternatives;
- generated family;
- physical/collaborative Activity;
- evidence-rich homework;
- ambiguous draft;
- planning-impacting Revision.

## 52.15 Deliberate diagnostics

Seed:

- 55 minutes of content in a 45-minute Lesson;
- compatible newer Revision;
- planning-impacting Revision;
- missing prerequisite;
- unavailable external asset;
- ambiguous draft;
- insufficient alternatives;
- reduced/deferred Assessment;
- attractive distractor;
- weak Concept;
- inconsistent learner Evidence;
- improved parallel variant;
- intentionally omitted Requirement with justification;
- timetable/location example.

---

# 53. Grade 11 editing workspace

- Hungarian Grade 11 Mathematics;
- probability;
- eight astronomy-pseudonymous Learners: Vega, Orion, Lyra, Kepler, Nova, Atlas, Cygnus, Andromeda;
- 8 to 12 Concepts;
- 6 to 8 Exercises;
- 2 Resources;
- incomplete Phase;
- 2 partially authored Lessons;
- visible missing coverage;
- formal/restrained style;
- one constrained Mafs example where useful.

Concepts include experiment/outcome, sample space, event, favourable outcomes, classical probability, complement, mutually exclusive events, addition rule, repeated experiments, tree diagrams, independence upcoming, and combinatorics prerequisite.

---

# 54. Project reference workspace

Include the isolated **Szökés a gombakertből / Escape from the Mushroom Yard** fixture defined in section 30.

It must be:

- enabled in demo/development;
- small and understandable;
- original;
- partly incomplete;
- detached from golden-path dependencies;
- documented as a student-contributor growth area.

---

# 55. Demo workspace behavior

- educational data loads through Content Packages;
- operational fixture data uses separate versioned contracts;
- dates derive from Demo Clock;
- reset is deterministic/idempotent;
- reset may recreate package-owned and fixture records;
- reset never deletes unrelated teacher-created content or forks;
- demo and blank onboarding are both first-class tested paths.

---

# 56. Implementation order

Implement vertical slices in this order unless a documented dependency demands a small change:

1. monorepo, environment validation, Clock, Result, Mongo replica-set repository foundation;
2. module registry, schemas, migrations, OpenAPI baseline;
3. authentication/Admin and Foundation Package;
4. blank onboarding, Subject/Course/LearnerGroup/Enrollment/Location;
5. Node/Relation creation and normal editors;
6. package-backed Grade 8 content;
7. Annual Plan/timetable/Lesson/Activity planning;
8. revision publication and exact resolution;
9. Crepe editor and mathematical rendering;
10. Presentation/LessonRun/live quiz;
11. Assignment drafts/Submissions/Evidence/GradeEntry;
12. Assessment Blueprint/Delivery/grading/analyzers;
13. packages/CLI/export/reset;
14. Grade 11 workspace;
15. isolated Project foundation;
16. deployment adapters, README walkthroughs, full verification.

Build a working vertical workflow before broad CRUD coverage. Do not build the module framework, generic forms, or administration pages as an end in itself.

---

# 57. Scope reduction rule

If the one-shot implementation is at risk:

Preserve:

1. blank onboarding;
2. editable typed Relations;
3. Assignment delivery lifecycle;
4. exact Revision/Delivery resolution;
5. Course/LearnerGroup/Enrollment correctness;
6. package-backed content;
7. Crepe authoring;
8. guided selectors;
9. feature-slice application services;
10. real MongoDB tests;
11. minimal concurrency/idempotency.

Reduce or move out first:

- advanced multi-teacher collaboration;
- guest claiming;
- GitHub Content Source UI;
- advanced Assessment optimization;
- broad Rubric management;
- rich media;
- automatic Revision propagation;
- timetable optimization;
- analyzer breadth.

Do not cut structural correctness while retaining visually impressive secondary features.

---

# 58. Completion definition

The agent may claim success only when:

- `npm ci` succeeds from a clean checkout;
- format/lint/typecheck succeed;
- production web/server builds succeed;
- unit/integration/browser requirements succeed or environment-blocked cases are documented honestly;
- Docker Compose starts application and Mongo replica set;
- migrations/indexes are idempotent;
- blank onboarding works;
- Grade 8 and Grade 11 workspaces load;
- Relation editing works;
- Course timetable shows Subject, group, location, and overlaps;
- Lesson planning/publishing/Presentation/live path works;
- Assignment draft/submit/correct/resubmit works;
- Assessment stable delivery/grading/analysis works;
- package atomic reject/apply/export/round-trip works;
- Revision history remains exact after current content changes;
- Project can be disabled/re-enabled without loss or core breakage;
- OpenAPI and generated client types are current;
- Docker, Vercel, and Render configurations validate;
- README contains tested step-by-step setup for all three environments;
- no normal workflow button is inert;
- no normal form requires raw IDs;
- unsupported behavior returns explicit Results;
- deviations are complete and honest.

Hosted deployment itself is not required without credentials, but the adapters/configuration/build tests and exact README instructions are required.

---

# 59. Validated deployment baseline and documentation sources

Implementation agents must recheck current official provider documentation at implementation time, because limits and dashboard labels change.

As of this v2 specification:

- Vercel documents Fastify deployment through Vercel Functions and supports committed project configuration through `vercel.json`.
- Vite static output and custom build/output settings can be controlled through project configuration.
- Render Docker Web Services must bind to `0.0.0.0` and the `PORT` environment variable.
- Render’s default filesystem is ephemeral; persistent disks require an eligible paid service.
- Render supports repository-defined Blueprints through `render.yaml`.

Official references to include in `docs/DEPLOYMENT-AND-OPERATIONS.md` or README where useful:

- Vercel: Fastify on Vercel
- Vercel: Vite on Vercel
- Vercel: Configuring a Build
- Vercel: `vercel.json` Project Configuration
- Render: Web Services
- Render: Docker
- Render: Blueprint YAML Reference
- Render: Environment Variables and Secrets
- Render: Persistent Disks

Do not copy current numeric platform limits into operational logic. Put deployment limits in configuration and document the date of verification.

---

# 60. Version 2 consolidation changes

Version 2 incorporates the implementation audit and subsequent Q&A. Most important changes:

- top-level Demo Clock, theme, language, and capability inputs;
- fixed interwoven-strand `F` logo;
- blank-instance onboarding;
- capability matrix expectation and dedicated editors;
- editable typed Relations;
- registered payload schemas and generated module registries;
- Node versus embedded value distinction;
- Subject separated from executable capability;
- LearnerGroup/Course/Enrollment/Location model;
- weekly teacher timetable;
- Assignment and online delivery lifecycle;
- exact Revision and immutable delivery resolution;
- deterministic Assessment deliveries and meaningful A/B variants;
- package-backed reference content;
- transactional package apply and ZIP safety;
- optimistic concurrency/idempotency without distributed overengineering;
- application services and feature slices;
- OpenAPI-generated client contract;
- mandatory Milkdown Crepe;
- isolated feature-toggled Project foundation;
- migrations from first tagged usable release;
- stronger security, search, paging, time, and MongoDB integration acceptance;
- explicit scope reductions for multi-teacher, guest claiming, GitHub UI, optimization, rich media, propagation, timetable solving, and analyzer breadth;
- mandatory step-by-step README setup for local development, Docker, Vercel, and Render.

---

# 61. Final instruction to the implementation agent

Build the repository now as a runnable, coherent product.

Do not respond only with a plan. Do not create placeholder screens to claim breadth. Implement the golden workflow vertically, use stable third-party libraries instead of custom infrastructure, run all available checks, and record every limitation honestly.

When a requirement cannot be fully completed in one pass:

1. preserve the domain contract and data safety;
2. complete the narrowest real workflow;
3. hide unfinished optional surfaces behind capability status/toggles;
4. document the deviation and exact next step;
5. never silently substitute a weaker behavior for a required one.

The expected output is a complete repository suitable for ZIP delivery, local Docker startup, Vercel/Render deployment configuration, and continued agentic development.
