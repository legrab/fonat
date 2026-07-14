# Fonat

## Authoritative One-Shot MVP Implementation Specification, Version 3

**Primary motto:** Szálról szálra. / Thread by thread.

**Separate About line:** Az oktatás minden szála egy helyen. / Every thread of teaching in one place.

This document is the normative implementation contract for a one-shot Fonat MVP repository. Requirements use the following levels:

- **MUST:** required for completion.
- **SHOULD:** expected unless a documented technical reason prevents it.
- **MAY:** optional and must not endanger required behavior.

When requirements conflict, use this priority order:

1. basic navigation and usable end-to-end behavior;
2. historical and data correctness;
3. the connected teacher-to-learner workflow;
4. security and safe failure;
5. deployment reproducibility;
6. extensibility foundations;
7. visual polish and optional sophistication.

Do not claim completion while a higher-priority requirement is broken, even if lower-priority features are extensive.

---

# 0. Project inputs

These values MUST be easy to change near the top of the repository before implementation or deployment. They alter presentation and deterministic fixtures, not architecture.

```yaml
project:
  name: Fonat
  demoClock:
    referenceInstant: "2026-09-15T08:00:00+02:00"
    schoolTimezone: "Europe/Budapest"
  visualPreset: lavender-workshop
  languages:
    sourceLocale: en
    defaultUserLocale: hu
    enabledLocales: [hu, en]
  features:
    projects:
      demo: true
      development: true
      blankProduction: false
```

## 0.1 Demo Clock and time rules

- The application MUST expose an injectable Clock/time adapter.
- All demo-relative dates, Today views, deadlines, completed history, timetable entries, analyzer fixtures, and time-sensitive tests MUST derive from the Demo Clock.
- Operational events MUST use UTC instants.
- School calendar days MUST use date-only values.
- Intended recurring lesson times MUST preserve local wall-clock time plus an IANA timezone so daylight-saving changes do not shift an intended lesson.
- The UI MUST render dates in the relevant Course, deployment, or user timezone.
- No domain or application service may directly scatter `Date.now()` calls.
- Temporal semantics SHOULD be used behind the time adapter, with a maintained polyfill where required.

## 0.2 Visual presets

### Lavender Workshop, default

| Token | Light | Dark |
|---|---:|---:|
| Background | `#F3F0F7` | `#1E1B24` |
| Surface | `#FAF8FC` | `#292430` |
| Primary | `#486B91` | `#8FB8E2` |
| Accent | `#A9571E` | `#E19A55` |
| Text | `#29232F` | `#ECE8F1` |

### Forest Paper

| Token | Light | Dark |
|---|---:|---:|
| Background | `#F3F1E8` | `#1B2421` |
| Surface | `#FAF8F0` | `#24302C` |
| Primary | `#426A60` | `#8EB7AA` |
| Accent | `#9A4655` | `#D7848F` |
| Text | `#252A27` | `#EEEAE0` |

Requirements:

- Theme values MUST be centralized semantic tokens.
- Components MUST NOT hardcode palette values.
- Actual foreground/background combinations MUST pass accessible contrast checks.
- Avoid pure white and pure black as the primary background/text contrast.

## 0.3 Logo direction, fixed

Create a maintainable SVG mark from three rounded interwoven strands:

- all three rise from the bottom as a compact braid forming the vertical stem of a subtle `F`;
- the accent strand remains in the vertical stem and continues upward;
- the neutral strand branches right near the top to form the upper horizontal stroke;
- the primary strand branches right at mid-height to form the lower horizontal stroke;
- use only two or three visually clear crossings, rounded terminals, and generous negative space;
- the mark MUST remain recognizable in monochrome, at 16 to 32 px, on light/dark backgrounds, in print, and on a projected screen;
- reject variants resembling a plant, road interchange, letter `K`, book, brain, lightbulb, atom, graduation cap, or literal textile spool.

Repository assets MUST include the editable SVG source, monochrome variant, favicon mark, and `BRAND.md`.

---

# 1. Two-page implementation contract

## 1.1 Product outcome

Fonat is a source-available, single-teacher-first educational operating system and living educational knowledge graph. It connects reusable educational content, curriculum expectations, yearly planning, concrete Lessons, classroom delivery, learner work, evidence, assessments, and future planning.

The MVP MUST let a teacher:

1. start from a blank installation;
2. create a Course, Learner Group, learners, Concepts, Resources, and multiple Exercise types;
3. connect content through typed Relations;
4. create and publish a Lesson;
5. run a usable Presentation Mode;
6. launch a live quiz that learners can join and answer;
7. see response results and a privacy-safe leaderboard in the presentation;
8. complete or leave Presentation Mode safely;
9. assign asynchronous work;
10. receive, review, return, and accept learner Submissions;
11. generate and deliver an Assessment;
12. preserve exact revisions and delivered snapshots;
13. record Learning Evidence and an official Grade Entry;
14. use the resulting evidence to prepare the next Lesson;
15. log out successfully from every authenticated teacher surface.

## 1.2 Priority 0 usability gate

These requirements override feature breadth. Any failure is a release blocker.

### Navigation and escape

- Every authenticated teacher page MUST have a stable path back to the workspace shell.
- Every modal, full-screen editor, Presentation controller, and live-session view MUST have a visible and keyboard-accessible exit path.
- Browser Back MUST NOT trap the user in a loop or silently discard unsaved work.
- Unknown routes MUST show a recovery page with links to Today and the previous safe location.
- Long-running or failed operations MUST expose retry or safe return actions.

### Logout

- A visible Logout action MUST be available from the authenticated teacher shell and teacher Presentation controller.
- Logout MUST call a server endpoint that invalidates the current session, clears the cookie, clears authenticated client state, and redirects to Login.
- Reusing the old cookie after logout MUST fail.
- Logout MUST work after normal navigation, after Presentation Mode, after an authorization failure, and after session expiry.

### Exercise authoring

The teacher MUST be able to create, preview, edit, publish, search, and add to a Lesson at least these Exercise types:

1. manual explanation or open response with Markdown content;
2. single choice;
3. multiple choice;
4. true/false;
5. numeric answer with tolerance and optional unit;
6. short text with accepted variants.

Each type MUST have a guided type-specific editor. Raw JSON and comma-separated internal identifiers do not satisfy this requirement.

### Presentation Mode

- Presentation Mode MUST always expose **Pause and leave** and **Complete Lesson** actions in the teacher controller.
- `Escape` SHOULD open the leave/complete decision rather than closing the browser or doing nothing.
- Pause and leave MUST persist the Lesson Run and return to the Lesson or Today with a Resume action.
- Complete Lesson MUST close the active run, persist completion, and navigate to the reflection/follow-up view.
- The projected student-safe window MUST stop following a completed run and show a clear completion state.

### Live quiz delivery

- A learner who joins through QR or code MUST receive a scoped participant credential.
- Submitting an answer MUST return an explicit accepted/already-accepted/validation-error Result.
- A successfully accepted answer MUST appear in the teacher response state without a page reload.
- The Presentation controller MUST be able to show aggregate results, an answer-status table, and a privacy-safe nickname leaderboard.
- Answer reveal MUST be controlled by the teacher.
- The demo MUST prove the complete join → answer → acknowledge → aggregate → reveal → leaderboard path.

### Demo Presentation acceptance sequence

The Grade 8 demo MUST include a runnable Lesson that demonstrates, in order:

1. a Section introduction;
2. a learning Concept definition with Markdown and KaTeX;
3. a visual or SVG explanation;
4. a normal task prompt;
5. a live single-choice or numeric quiz;
6. the learner response status table;
7. the revealed aggregate result and privacy-safe leaderboard;
8. a solution or explanation slide;
9. a timed closing Activity;
10. a homework slide shown after the configured timer transition;
11. successful Complete Lesson behavior;
12. a return to Today or the post-Lesson reflection screen.

Timer behavior MUST be explicit per Section or Slide: `stay`, `reveal-next`, or `advance`. The demo may use `advance` for the final timed closing into the homework slide. Normal Lessons SHOULD default to `stay` or `reveal-next` to avoid surprising automatic navigation.

## 1.3 Complete MVP

The Complete MVP includes:

- authentication, logout, session management, and basic Admin teacher management;
- blank-instance onboarding and a tiny foundation package;
- Subjects, Learner Groups, Courses, Enrollments, Teaching Locations, and weekly timetable;
- reusable Concepts, Curriculum Requirements, Resources, Exercises, Collections, Profiles, Blueprints, and Layouts, plus one lightweight Rubric grading path;
- typed editable Relations;
- multiple guided Exercise editors;
- Milkdown Crepe Markdown authoring;
- Annual Plans, Phases, Lessons, Sections, Activities, diagnostics, publication, and revisions;
- Presentation Mode, Lesson Runs, live quiz participation, response tables, and leaderboard;
- Assignments, answer drafts, Submissions, corrections, Learning Evidence, Concept State, and Grade Entries;
- Assessment Blueprints, deterministic variants, immutable Deliveries, online delivery, print-ready HTML/browser PDF, grading, and a small analyzer pipeline;
- package-backed reference content, ZIP import/export, transaction-safe apply, and demo reset;
- generated OpenAPI and typed frontend API contracts;
- local development, Docker, Vercel, and Render setup documentation;
- unit, MongoDB integration, API integration, and critical browser tests.

## 1.4 Functional Foundations

These MUST be real but narrow and isolated:

- feature-toggled Project capability with the Mushroom Yard fixture;
- one deterministic Exercise Family;
- constrained 2D mathematics renderer;
- lightweight Rubric grading example;
- content-repository template and CLI packages;
- local filesystem asset provider contract;
- external WolframAlpha, YouTube, and ordinary-link records.

## 1.5 Deferred

Do not implement:

- advanced multi-teacher collaboration;
- guest identity claiming;
- public GitHub Content Source browsing/import UI, private GitHub authentication, and write-back;
- complex assessment optimization;
- full Rubric analytics/library workflows;
- rich-media upload/transcoding/cloud object storage;
- automatic revision propagation;
- room availability and institutional scheduling;
- broad analyzer coverage;
- server-generated PDF as a hosted requirement; browser print and Save as PDF remain Complete MVP;
- symbolic algebra equivalence;
- full game engine;
- native mobile applications;
- full offline synchronization;
- vector search;
- runtime executable plugin installation;
- generic persistent job framework;
- school-wide administration or reporting integrations.

## 1.6 Locked technology

- TypeScript end to end;
- npm workspaces with committed lockfile and `npm ci`;
- React + Vite;
- React Router;
- Radix Themes and Radix Primitives only for gaps;
- Fastify;
- Zod and a Fastify type-provider/JSON-Schema path;
- `@fastify/swagger` generated OpenAPI;
- MongoDB using the official driver;
- TanStack Query for server state and polling;
- TanStack Table for server-driven complex tables;
- React Hook Form + Zod for forms;
- Milkdown Crepe for rich Markdown editing;
- KaTeX/remark-math for rendering;
- Mafs for the constrained math plot capability;
- `dnd-kit` for Lesson and Annual Plan drag-and-drop, with accessible move buttons;
- Temporal semantics through a Clock adapter;
- Playwright for critical browser journeys;
- Docker Compose with MongoDB single-node replica set.

Do not replace the stack with Next.js, GraphQL, tRPC, Mongoose, Redux, microservices, a workflow engine, or a custom rich-text editor.

## 1.7 Golden workflow

```text
Blank installation
→ bootstrap Admin/Teacher
→ load tiny foundation package
→ create Learner Group, Course, Location, and learners
→ create Concepts and multiple Exercise types
→ connect Exercises to Concepts
→ create Annual Plan and Lesson
→ add Activities and publish the Lesson
→ run Presentation Mode
→ learners join and answer live quiz
→ show response table and leaderboard
→ complete Lesson and assign homework
→ learner saves draft and submits
→ teacher reviews, returns, and accepts correction
→ generate and deliver Assessment
→ grade and create Grade Entry
→ inspect Evidence and Findings
→ plan next Lesson
→ logout
```

The blank workflow and Grade 8 demo MUST use the same production services and contracts.

## 1.8 Completion definition

Do not claim completion unless:

- the Priority 0 usability gate passes in browser tests;
- blank onboarding works without demo identifiers;
- all six required Exercise types can be created and inserted into a Lesson;
- the demo Presentation sequence works from start to completion;
- learners can submit live answers and asynchronous work;
- teacher response tables and leaderboard update correctly;
- logout invalidates the server session;
- scheduled and delivered content resolves exact revisions/snapshots;
- package-backed demo import and reset work;
- MongoDB transaction/concurrency tests pass;
- production frontend/backend builds pass;
- Docker configuration builds and starts where Docker is available;
- Vercel and Render configurations and README instructions match the repository;
- no required control is inert;
- all unverified items and deviations are listed honestly.

---

# 2. Product invariants

1. **Preserve engagement:** authoring and classroom use MUST minimize unnecessary navigation and configuration.
2. **Show how it was done:** Learning Evidence may include steps, explanations, confidence, corrections, and teacher observation, not only final correctness.
3. **Progression over isolated answers:** Concepts, prerequisites, Lessons, evidence, and revisions remain connected.
4. **Deterministic before clever:** selection, grading, findings, and imports MUST be explainable and reproducible.
5. **Safe by default:** unsupported capability, invalid package, stale save, missing renderer, or unavailable external asset MUST return a typed Result and preserve the core workflow.
6. **Graph where reuse justifies it:** not every value is a Node. Parent-owned contextual values remain embedded.
7. **No demo-only architecture:** reference fixtures MUST pass through real package/import/application paths.
8. **No hidden partial success:** guard clauses and explicit Results are preferred over best-effort mutation.

---

# 3. Required screen inventory

Each listed surface MUST be reachable, usable, and covered by at least API integration or browser acceptance evidence.

## Teacher shell

- Login and first-run bootstrap
- Today
- Weekly timetable
- Annual Plan list and editor
- Lesson editor
- Presentation controller
- Projected presentation window
- Library collection view
- Node detail and Relation editor
- Exercise create/edit/preview
- Learner Groups
- Courses and Course roster
- Learners and Evidence overview
- Teaching Locations
- Assignments
- Assessment Blueprints/Assessments/Deliveries
- Insights/Findings
- Package staging/import/export
- Admin users, modules, health, feature flags
- Fonat Guide

## Learner surfaces

- live-session join
- live Exercise prompt and answer
- live answer acknowledgment
- asynchronous Assignment list/task
- server-side draft state
- submit/resubmit confirmation
- returned feedback and correction
- Assessment Delivery completion

## Navigation requirements

- A stable application shell MUST contain the current location, primary navigation, user menu, and Logout.
- Full-screen Presentation Mode MUST retain a teacher-only exit/complete control.
- Every create/edit flow MUST provide Save and Cancel/Back behavior.
- Unsaved-change prompts MUST appear only when data would actually be lost.
- All destructive actions MUST show scope and consequence.

---

# 4. Required API route groups

The exact verbs may vary, but each group MUST be owned by one feature slice and represented in OpenAPI.

```text
/api/auth
/api/admin/users
/api/admin/features
/api/admin/health
/api/subjects
/api/learner-groups
/api/learners
/api/enrollments
/api/courses
/api/locations
/api/nodes
/api/relations
/api/collections
/api/annual-plans
/api/phases
/api/lessons
/api/lesson-runs
/api/exercises
/api/assignments
/api/submissions
/api/evidence
/api/grades
/api/assessment-blueprints
/api/assessments
/api/assessment-deliveries
/api/findings
/api/packages
/api/live
/api/projects
/api/guide
```

Mandatory behavior:

- all mutation routes return typed Result envelopes;
- all protected routes enforce server-side capabilities;
- list routes use stable cursor paging where the collection can grow;
- route handlers parse/authenticate, call one application use case, and map the Result;
- domain transitions and pedagogical decisions MUST NOT live in Fastify route files.

---

# 5. Entity capability matrix

Legend: `R` required, `F` foundation/narrow, `-` not applicable, `W` workflow-controlled rather than ordinary edit.

| Entity | List/Search | Create | Guided Edit | Publish/Revise | Archive | Relations | Import/Export |
|---|---:|---:|---:|---:|---:|---:|---:|
| Subject | R | R | R | R | R | R | R |
| Concept | R | R | R | R | R | R | R |
| Curriculum Requirement | R | R | R | R | R | R | R |
| Curriculum | R | R | R | R | R | R | R |
| Collection | R | R | R | R | R | R | R |
| Resource | R | R | R | R | R | R | R |
| Exercise | R | R | R | R | R | R | R |
| Exercise Family | R | F | F | R | R | R | R |
| Rubric | R | F | F | R | R | R | R |
| Teaching Profile | R | R | R | R | R | R | R |
| Lesson Blueprint | R | R | R | R | R | R | R |
| Lesson Layout | R | R | R | R | R | R | R |
| Activity Template | R | R | R | R | R | R | R |
| Annual Plan | R | R | R | R | R | R | R |
| Phase | Within plan | R | R | Through plan | R | R | Export R |
| Lesson | R | R | R | R | R | R | Export R |
| Learner Group | R | R | R | - | R | Limited | Export R |
| Course | R | R | R | - | R | R | Export R |
| Learner Profile | R | R | R | - | R | Evidence | Export R |
| Enrollment | R | R | W | - | W | - | Export R |
| Teaching Location | R | R | R | - | R | R | Export R |
| Assignment | R | R | W | Immutable delivery | W | R | Export R |
| Submission | R | - | W | Immutable attempts | - | Evidence | Export R |
| Assessment Blueprint | R | R | R | R | R | R | R |
| Assessment | R | Generate | W | Immutable variants | R | R | Export R |
| Assessment Delivery | R | Generate | W | Immutable | - | Evidence | Export R |
| Grade Entry | R | W | W/audit | Corrected ledger | - | Source refs | Export R |
| Learning Evidence | R | W | Append/correct | Immutable record | - | R | Export R |
| Project | F | F | F | F | F | F | R |

A generic raw-JSON editor does not satisfy Guided Edit. Raw JSON may exist only in developer/advanced diagnostic mode.

---

# 6. Authoritative repository structure

Minor naming adjustments are allowed, but the dependency boundaries and feature ownership MUST remain recognizable.

```text
/
├─ AGENTS.md
├─ README.md
├─ package.json
├─ package-lock.json
├─ Dockerfile
├─ docker-compose.yml
├─ vercel.json
├─ render.yaml
├─ apps/
│  ├─ web/
│  │  └─ src/
│  │     ├─ app/
│  │     ├─ routes/
│  │     ├─ shared/
│  │     └─ generated/
│  └─ server/
│     └─ src/
│        ├─ app/
│        ├─ adapters/
│        ├─ composition/
│        └─ generated/
├─ packages/
│  ├─ contracts/
│  ├─ domain/
│  ├─ application/
│  ├─ persistence-mongodb/
│  ├─ module-registry/
│  ├─ ui/
│  ├─ testing/
│  ├─ content-contracts/
│  └─ content-cli/
├─ features/
│  ├─ auth/
│  ├─ onboarding/
│  ├─ organization/
│  ├─ graph/
│  ├─ exercises/
│  ├─ planning/
│  ├─ presentation/
│  ├─ live/
│  ├─ assignments/
│  ├─ assessments/
│  ├─ evidence/
│  ├─ packages/
│  ├─ admin/
│  └─ projects/
├─ modules/
│  ├─ core/
│  ├─ mathematics/
│  └─ math-2d-plot/
├─ content/
│  ├─ foundation/
│  ├─ grade8-pythagorean/
│  ├─ grade11-probability/
│  └─ mushroom-yard-project/
├─ docs/
└─ tests/
```

Each feature slice SHOULD contain:

```text
feature/
├─ shared/        # schemas, portable contracts, identifiers
├─ server/        # use cases, routes, repositories/commands, transitions
├─ web/           # screens, components, query hooks
└─ tests/         # focused unit/integration/browser support
```

Rules:

- Domain/application packages MUST NOT import React, Fastify, Vercel, Render, or MongoDB.
- Routes and React pages MUST NOT contain business workflows.
- Repositories persist/query and expose required atomic commands; they do not make pedagogical decisions.
- Capability modules expose `manifest`, `shared`, `server`, and `web` entry points.
- Generated registries statically import installed modules for Vercel and Docker compatibility.
- Modules may depend on public platform contracts, never another module's private files.

---

# 7. Canonical contracts

The examples are illustrative but internally authoritative. The implementation may rename fields only when the resulting contract preserves the same semantics.

## 7.1 Result envelope

```ts
export type Result<T, C extends string = string> =
  | { ok: true; value: T; meta?: Record<string, unknown> }
  | {
      ok: false;
      error: {
        code: C;
        messageKey: string;
        fieldErrors?: Record<string, string[]>;
        technicalReference?: string;
        retryable: boolean;
      };
    };
```

Expected failures MUST use Result values. Exceptions are reserved for programming defects and unexpected infrastructure failures caught at boundaries.

## 7.2 Node envelope and Revision

```ts
interface EducationalNode<TPayload> {
  id: string;
  type: RegisteredNodeType;
  subjectId?: string;
  lifecycle: "draft" | "published" | "archived";
  currentRevision: number;
  concurrencyVersion: number;
  owner: { kind: "package" | "teacher"; id: string };
  provenance: Provenance;
  localizedTitles: Record<Locale, string>;
  searchProjection: string;
  createdAt: InstantString;
  updatedAt: InstantString;
  payload: TPayload;
}

interface NodeRevision<TPayload> {
  nodeId: string;
  revision: number;
  compatibility:
    | "presentation-only"
    | "content-equivalent"
    | "planning-impacting"
    | "contract-breaking";
  payload: TPayload;
  publishedAt: InstantString;
  publishedBy: string;
  sourcePackageVersion?: string;
}
```

Every canonical Node type MUST register a runtime schema. Generic payload dictionaries are permitted only for namespaced optional extensions.

## 7.3 Relation

```ts
interface Relation {
  id: string;
  type: RegisteredRelationType;
  source: { nodeId: string; revision?: number };
  target: { nodeId: string; revision?: number };
  dimensions?: Record<string, number | string | boolean>;
  provenance: Provenance;
  concurrencyVersion: number;
}
```

Relation contracts define allowed source/target types, duplicate policy, inverse display, dimensions, validation, and localization.

## 7.4 Organization

```ts
interface LearnerProfile {
  id: string;
  displayPseudonym: string;
  badge: { icon: string; colorToken: string; textLabel: string };
  administrativeIdentity?: { fullName?: string; schoolId?: string };
}

interface Enrollment {
  id: string;
  learnerId: string;
  learnerGroupId: string;
  schoolYear: string;
  startDate: DateOnly;
  endDate?: DateOnly;
  status: "active" | "ended";
}

interface CourseEnrollment {
  id: string;
  courseId: string;
  learnerId: string;
  sourceLearnerGroupIds: string[];
  includedByOverride: boolean;
  excludedByOverride: boolean;
  startDate: DateOnly;
  endDate?: DateOnly;
}

interface Course {
  id: string;
  subjectId: string;
  schoolYear: string;
  teacherIds: string[];
  learnerGroupIds: string[];
  defaultLocationId?: string;
  timezone: string;
}
```

Learner identity, group Enrollment, Course roster, and credentials MUST remain separate.

## 7.5 Lesson revision and embedded values

```ts
interface LessonRevisionPayload {
  courseId: string;
  annualPlanId?: string;
  phaseId?: string;
  title: string;
  scheduledDate?: DateOnly;
  intendedStart?: LocalTime;
  timezone?: string;
  locationId?: string;
  blueprintRef?: RevisionRef;
  profileRef?: RevisionRef;
  sections: LessonSection[];
  diagnosticsSnapshot?: FindingSummary[];
}

interface LessonSection {
  id: string;
  title: string;
  plannedMinutes: number;
  timerEndBehavior: "stay" | "reveal-next" | "advance";
  activities: Activity[];
  slides: PresentationSlide[];
}

interface Activity {
  id: string;
  templateRef?: RevisionRef;
  resourceRefs: RevisionRef[];
  exerciseRefs: RevisionRef[];
  plannedMinutes: number;
  grouping: "individual" | "pair" | "group" | "whole-class" | "physical";
  teacherInstructions?: string;
  evidencePolicy?: EvidencePolicy;
  presentationOverrides?: Record<string, unknown>;
  differentiationNotes?: string;
}
```

Sections, contextual Activities, Slides, Assessment slots, permutations, and grading details are embedded values with stable local IDs. Promote a value to a Node only when independent reuse, search, relations, ownership, or revisioning justifies it.

## 7.6 Exercise payloads

Use a discriminated union registered by Capability Modules.

```ts
interface ExerciseBase {
  promptMarkdown: string;
  solutionMarkdown?: string;
  conceptRelations: Array<{
    conceptId: string;
    contribution: "introduces" | "reinforces" | "practises" | "assesses";
  }>;
  expectedMinutes: number;
  difficulty: number;
  evidencePolicy?: EvidencePolicy;
}

type ExercisePayload =
  | (ExerciseBase & {
      exerciseType: "manual-response";
      rubricRef?: RevisionRef;
    })
  | (ExerciseBase & {
      exerciseType: "single-choice";
      options: ChoiceOption[];
      correctOptionIds: [string];
    })
  | (ExerciseBase & {
      exerciseType: "multiple-choice";
      options: ChoiceOption[];
      correctOptionIds: string[];
    })
  | (ExerciseBase & {
      exerciseType: "boolean";
      correctValue: boolean;
    })
  | (ExerciseBase & {
      exerciseType: "numeric";
      expectedValue: number;
      absoluteTolerance?: number;
      relativeTolerance?: number;
      acceptedUnit?: string;
    })
  | (ExerciseBase & {
      exerciseType: "accepted-text";
      acceptedVariants: string[];
      normalization: "trim-casefold" | "exact";
    });
```

The UI MUST provide a dedicated form and preview for each required type.

## 7.7 Assignment and Submission

```ts
interface Assignment {
  id: string;
  courseId: string;
  target: { kind: "course" | "selected-learners"; learnerIds?: string[] };
  type: "homework" | "practice" | "classwork" | "quiz" | "formal-assessment";
  contentRefs: RevisionRef[];
  opensAt?: InstantString;
  deadlineDate?: DateOnly;
  attemptPolicy: AttemptPolicy;
  feedbackPolicy: FeedbackPolicy;
  evidencePolicy: EvidencePolicy;
  status: "draft" | "assigned" | "closed" | "archived";
  concurrencyVersion: number;
}

interface SubmissionAttempt {
  id: string;
  assignmentId: string;
  learnerId: string;
  attemptNumber: number;
  deliveredSnapshot: DeliveredTaskSnapshot;
  answers: NormalizedAnswer[];
  submittedAt: InstantString;
  autoResult?: AutoGradeResult;
  teacherDecision?: TeacherDecision;
  status: "submitted" | "returned" | "resubmitted" | "accepted";
}
```

Server-side drafts are mutable, concurrency-versioned, and not Learning Evidence. Submission creates an immutable attempt snapshot.

## 7.8 Assessment Blueprint and Delivery

```ts
interface AssessmentBlueprintPayload {
  courseId: string;
  title: string;
  slots: AssessmentSlot[];
  sourcePolicy: AssessmentSourcePolicy;
  retryPolicy: RetryPolicy;
}

interface AssessmentSlot {
  id: string;
  requiredConceptIds: string[];
  points: number;
  difficultyRange: [number, number];
  allowedExerciseTypes: RegisteredExerciseType[];
  familiarity: "repeated" | "close-alternative" | "transfer" | "extension";
}

interface AssessmentDelivery {
  id: string;
  assessmentId: string;
  learnerId: string;
  strategyId: string;
  strategyVersion: string;
  seed: string;
  questions: DeliveredQuestionSnapshot[];
  optionPermutations: Record<string, string[]>;
  createdAt: InstantString;
  status: "available" | "started" | "submitted" | "graded" | "returned";
}
```

Historical delivery MUST never depend on rerunning a newer generator or loading the current Exercise revision.

## 7.9 Capability Module manifest

```ts
interface CapabilityModuleManifest {
  id: string;
  version: string;
  requiredPlatformVersion: string;
  nodeTypes: RegisteredNodeDefinition[];
  relationTypes: RegisteredRelationDefinition[];
  exerciseTypes: RegisteredExerciseDefinition[];
  validators: RegisteredPipelineDefinition[];
  graders: RegisteredPipelineDefinition[];
  analyzers: RegisteredPipelineDefinition[];
  renderers: RegisteredRendererDefinition[];
  featureFlags?: string[];
}
```

A build step MUST generate the static registry and installed identifier unions. Content Packages cannot install executable behavior.

## 7.10 Content Package manifest

```json
{
  "packageId": "org.fonat.grade8-pythagorean",
  "version": "1.0.0",
  "contractVersion": "1",
  "requiredCapabilities": ["core", "mathematics"],
  "locales": ["hu", "en"],
  "rights": {
    "license": "CC-BY-NC-SA-4.0",
    "author": "Fonat project"
  }
}
```

Educational reference content MUST be imported through this contract. Operational fixture state uses a separate versioned workspace fixture contract.

---

# 8. Mandatory implementation sequence

The agent MUST build in the following order. Every checkpoint MUST compile and exercise a vertical path before continuing.

## Stage 1: workspace and contracts

- monorepo, toolchain, lint/format/typecheck;
- Clock, Result, identifiers, configuration profiles;
- generated module registry shell;
- initial docs and Project Inputs.

**Checkpoint:** build and configuration tests pass.

## Stage 2: persistence and migrations

- MongoDB repositories, indexes, single-node replica-set Docker;
- schema migrations collection;
- optimistic concurrency and idempotency primitives;
- test memory repository with transactional clone/swap behavior.

**Checkpoint:** real Mongo transaction, cursor, CAS, and migration tests pass.

## Stage 3: authentication, navigation, and logout

- first-run Admin;
- login/session/cookies;
- role capabilities;
- teacher account reset/disable;
- application shell, route guards, 404 recovery;
- complete Logout behavior.

**Checkpoint:** browser login → navigate → logout → old cookie rejected.

## Stage 4: foundation package and blank organization

- tiny foundation package;
- Subject, Learner Group, Course, Learner, Enrollment, Location;
- weekly timetable;
- guided blank onboarding.

**Checkpoint:** blank database can create first Course and learner roster without raw IDs.

## Stage 5: graph and authoring

- Node schemas and revisions;
- Relation registry/editing;
- Library, selectors, detail pages;
- Crepe ContentEditor;
- all six required Exercise types and previews.

**Checkpoint:** create each Exercise type, publish it, relate it to a Concept, and find it through search.

## Stage 6: Annual Plan and Lesson

- Profiles, Blueprints, Layouts;
- Annual Plan/Phase;
- Lesson Sections and contextual Activities;
- drag-and-drop plus move buttons;
- diagnostics and publication.

**Checkpoint:** build and publish a Lesson containing at least a Concept Resource, manual task, and quiz Exercise.

## Stage 7: exact revisions and Presentation Mode

- revision resolver;
- Lesson Run transitions;
- projected and controller views;
- pause/leave/resume/complete;
- timers and explicit timer-end behavior.

**Checkpoint:** demo presentation can be entered, navigated, paused, resumed, completed, and exited.

## Stage 8: live participation

- QR/code join;
- scoped participant credentials;
- idempotent answers;
- adaptive polling;
- response status table, aggregate result, answer reveal, leaderboard.

**Checkpoint:** two browser contexts join, submit, receive acknowledgment, and appear in teacher results without reload.

## Stage 9: Assignments and evidence

- Assignment lifecycle;
- learner task route and scoped credential;
- server-side drafts;
- immutable attempts;
- return/resubmit/accept;
- Learning Evidence and Concept State.

**Checkpoint:** learner saves draft, reloads, submits, receives correction, and resubmits.

## Stage 10: Assessments and grades

- Blueprint slots;
- deterministic generation;
- A/B-compatible variants;
- immutable learner Delivery;
- grading/regrading preview;
- Grade Entry ledger;
- small analyzer pipeline.

**Checkpoint:** generate, deliver, answer, grade, analyze, and record an official grade.

## Stage 11: packages and reference workspaces

- ZIP safety;
- staging;
- transactional apply;
- export/round trip;
- package-backed Grade 8/11 content;
- operational demo fixtures;
- reset preserving teacher forks.

**Checkpoint:** reject invalid package atomically and round-trip a valid package.

## Stage 12: isolated foundations

- feature-toggled Project slice;
- deterministic Exercise Family;
- constrained 2D plot;
- lightweight Rubric path;
- content CLI/template.

**Checkpoint:** disabling Project hides UI/routes, preserves data, and does not break core tests.

## Stage 13: deployment and final verification

- production builds;
- OpenAPI/frontend generated types;
- Docker, Vercel, Render;
- README truthfulness;
- full browser gate;
- honest deviations.

---
# 9. Feature contracts

Every feature below follows the same contract: user outcome, required model, required UI, required API behavior, acceptance proof, and exclusions.

## 9.1 Authentication, shell, and account administration

### User outcome

A teacher can bootstrap, log in, navigate, recover from expired sessions, and log out. An Admin can create, disable, reset, and assign basic roles to teacher accounts.

### Required model

- user identity with multiple fixed roles;
- capability list derived from roles;
- versioned password hash with algorithm, salt, and work-factor parameters;
- server-side session record with expiry and invalidation state;
- temporary-password flag;
- audit record for resets, disable, role changes, and logout/session invalidation.

### Required UI

- first-run Admin wizard;
- Login;
- forced password-change screen;
- user menu with Logout;
- Admin user list/create/reset/disable;
- session-expired recovery;
- no permission editor.

### Required API behavior

- secure HTTP-only cookies;
- production `Secure` policy;
- origin/CSRF protection appropriate to cookie sessions;
- authentication rate limiting;
- constant-time password verification;
- opportunistic password rehash after successful login;
- reset and disable invalidate existing sessions;
- Logout is idempotent and clears the cookie even if the server session is already missing.

### Acceptance proof

Browser test MUST prove Login, forced change, normal navigation, Logout, redirected Login, and old-cookie rejection.

### Exclusions

No email invitation, password recovery email, arbitrary role editor, SSO, or institution directory.

## 9.2 Organization and weekly timetable

### User outcome

The teacher can organize learners and see a complete personal weekly timetable including Subject/Course, Learner Group, and Teaching Location.

### Required model

- Subject as data-defined package entity;
- Learner Profile;
- Learner Group and time-bounded Enrollment;
- Course with one or more Learner Groups plus explicit learner inclusion/exclusion;
- resolved historical Course Enrollment;
- Teaching Location;
- recurring timetable entry and individual Lesson override.

Location resolution:

```text
Course default → recurring entry override → individual Lesson override
```

### Required UI

- guided Learner Group, learner, Course, roster, and Location editors;
- weekly timetable with current week navigation;
- overlap indicator for the teacher;
- readable local time, Subject, Course, group, Location, cancellation/move state.

### Acceptance proof

Create two Courses and Locations, schedule overlapping entries, confirm warning and correct location rendering.

### Exclusions

No room availability, equipment booking, travel time, or institutional timetable solver.

## 9.3 Graph, Relations, Library, and search

### User outcome

The teacher can grow the educational graph without entering internal identifiers.

### Required model

- common Node envelope and per-type payload schema;
- typed Relation registry;
- module-provided search projection;
- bounded native MongoDB search/index strategy;
- stable cursor using complete sort tuple such as `(updatedAt, id)`.

### Required UI

- Library with search, filters, sorting, and paging beyond 100 records;
- Node detail with incoming/outgoing Related panel;
- contextual Add Relation;
- searchable target selector;
- relation-specific fields such as contribution or alternative similarity;
- duplicate and invalid target prevention;
- archive rather than destructive delete for referenced educational content.

### Acceptance proof

Create Concepts and Exercises, add/edit/remove `covers`, `requires`, and `alternative-to`, search aliases, and page beyond the first result batch.

### Exclusions

No visual graph canvas, graph query language, vector search, or universal score.

## 9.4 Exercise authoring

### User outcome

The teacher can create useful reusable tasks, not only Markdown presentation cards.

### Required UI behavior

Exercise creation begins with a clear type chooser. Each required type has:

- localized title;
- Crepe prompt editor;
- optional solution/explanation editor;
- type-specific answer controls;
- Concept selector and contribution level;
- duration and difficulty;
- evidence/feedback policy;
- learner-facing preview;
- validation summary;
- Save Draft and Publish actions.

Type-specific requirements:

- **Manual response:** response guidance and optional Rubric.
- **Single choice:** at least two options, exactly one correct, stable option IDs.
- **Multiple choice:** at least two options and one or more correct.
- **True/false:** statement and canonical boolean.
- **Numeric:** expected value, tolerance, optional unit, preview examples.
- **Accepted text:** one or more normalized accepted variants.

The Lesson editor MUST let the teacher select any published supported Exercise and insert it into an Activity. Unsupported types MUST be visible as unavailable, never silently converted into manual Markdown.

### Acceptance proof

One browser journey MUST create all six types, publish them, insert at least four distinct types into one Lesson, preview them, and save/reload the Lesson.

### Exclusions

No symbolic algebra, arbitrary code grader, AI generator, or generic JSON form as normal UX.

## 9.5 ContentEditor

Milkdown Crepe is mandatory for normal Markdown-rich fields.

The Fonat `ContentEditor` adapter MUST provide:

- initial Markdown;
- debounced change callback;
- autosave integration;
- read-only mode;
- focus action;
- validation/error state;
- correct teardown and remount;
- light/dark theme integration;
- source tab synchronization using documented Markdown/event/replace APIs.

The integration fixture MUST cover Hungarian Unicode, headings, lists, tables, links, image syntax, inline/block LaTeX, paste, undo/redo, autosave, source round trip, read-only rendering, and remount without duplicate editors.

A plain textarea may be an emergency source mode, not the normal authoring experience. Pin the last validated Crepe version if a future release is incompatible.

## 9.6 Annual Plan and Lesson planning

### User outcome

The teacher can plan a year and assemble Lessons from reusable content while retaining understandable diagnostics.

### Required model

- Annual Plan with coverage, calendar, and concrete-Lesson projections;
- Phase hierarchy;
- Teaching Profile layering;
- Lesson Blueprint slots;
- Lesson Layout;
- contextual Activities and optional ActivityTemplate provenance;
- deterministic eligibility and weighted recommendation explanation.

Effective setting order:

```text
school-system defaults
→ selected Teaching Profile
→ Course/Annual Plan override
→ Lesson override
```

### Required UI

- guided Annual Plan wizard;
- Phase and Lesson drag-and-drop plus move buttons;
- Lesson intent, duration, Course, Location, Blueprint, Profile;
- contextual candidate panel;
- filters and explanation of recommendation score;
- add/swap/remove/reorder Activities;
- diagnostics for duration, prerequisites, unsupported renderer, repetitive participation, and missing slots;
- Save Draft and Publish.

### Acceptance proof

Build a Lesson with at least three Sections, multiple Exercises/Resources, a live quiz, timers, and homework. Publish, reload, and verify exact order and diagnostics.

### Exclusions

No whole-Lesson optimizer, automatic phase compression, school timetable solver, or automatic pedagogical rewriting.

## 9.7 Revisions and immutable resolution

### User outcome

Editing reusable content never changes what was already delivered or completed.

### Rules

- draft saves mutate the draft with optimistic concurrency;
- publish creates a numbered Revision;
- scheduled Lessons remain pinned and receive update notices;
- draft Lessons may follow a latest compatible revision by explicit policy;
- completed Lessons and delivered Assessments never update;
- package updates create package-owned Revisions;
- teacher customization forks package content;
- generated content stores strategy ID/version/seed/parameters and exact resolved snapshot.

A single canonical revision resolver MUST be used by Lesson planning, Presentation Mode, Assignments, Assessment generation, grading, and Submission display.

### Acceptance proof

Publish an Exercise change after a Lesson is scheduled and after another Lesson is completed. Verify the scheduled Lesson shows impact without silent change and completed/delivered records retain their original content.

## 9.8 Presentation Mode and Lesson Runs

### User outcome

The teacher can reliably present, control, leave, resume, and complete a Lesson while learners see only safe content.

### Required slide types

- Section introduction;
- Markdown/Concept definition;
- image/SVG;
- normal Exercise prompt;
- live quiz launch;
- response status;
- result/leaderboard;
- solution/explanation;
- discussion prompt;
- closure/homework.

### Teacher controller

MUST show:

- current and next slide;
- answers/guidance where applicable;
- elapsed/remaining timer;
- learner response count;
- reveal controls;
- Pause and leave;
- Complete Lesson;
- quick note;
- connection status.

### Projected view

MUST show only student-safe information. It MUST NOT expose correct answers, private learner identities, teacher notes, or control tokens before reveal.

### Lesson Run transitions

Explicit transition functions MUST cover:

```text
planned → active → paused → active → completed
                  ↘ abandoned
```

Invalid transitions return typed Results. Completion is distinct from leaving. Paused runs are resumable.

### Acceptance proof

A browser E2E MUST run the exact demo sequence in section 1.2, including timer transition to homework, Pause and leave, Resume, Complete Lesson, and return to the workspace.

## 9.9 Live classroom session

### User outcome

Learners join quickly, submit, receive acknowledgment, and the teacher sees usable results.

### Required behavior

- QR and short code join;
- authenticated/personal-code learner path;
- generated nickname/badge guest path without claim workflow;
- short-lived session/participant credential;
- participant credential scoped to one participant and session;
- teacher-paced and student-paced mode;
- single choice, multiple choice, true/false, numeric, accepted text, confidence vote, exit ticket;
- idempotent answer command;
- rate limit;
- adaptive polling;
- atomic joins, answer acceptance, and session transitions;
- deterministic option order where configured;
- teacher response status table;
- aggregate chart/result;
- optional privacy-safe leaderboard, enabled in demo;
- no speed bonus by default;
- no public display of individual wrong answers before policy permits.

### Polling

Suggested baseline:

- teacher active: 2 to 3 seconds;
- learner active: 4 to 5 seconds;
- slower when idle/background;
- immediate refresh after submit/advance/reveal.

### Acceptance proof

Use two independent learner browser contexts. Both join through the displayed QR/code, submit different answers, receive acknowledgment, and appear in the controller. Reveal updates the projection to result table and leaderboard. Duplicate submit returns already accepted without creating a second answer.

### Exclusions

No WebSockets, full multiplayer engine, persistent global ranking, or guest-account merging.

## 9.10 Assignments, Submissions, and Evidence

### User outcome

The teacher can deliver homework/practice and preserve how learners worked, including corrections.

### Required workflow

```text
assignment draft
→ assigned
→ learner server-side draft
→ submitted immutable attempt
→ auto-check where supported
→ teacher review
→ returned or accepted
→ resubmitted immutable attempt when returned
```

### Required UI

Teacher:

- create Assignment from Exercises/Assessment;
- target Course or selected learners;
- configure deadline, attempts, feedback release, evidence policy;
- review answers, attempt history, differences, auto result, confidence, scaffold use;
- return with feedback or accept;
- create/confirm Grade Entry where applicable.

Learner:

- see available tasks;
- save draft and reload it;
- submit with confirmation;
- view returned feedback according to policy;
- correct and resubmit.

### Acceptance proof

Browser test MUST prove draft persistence through reload, submit, teacher return, resubmit, acceptance, and immutable attempt history.

## 9.11 Assessment

### User outcome

The teacher can generate a fair, explainable Assessment and deliver a stable version to each learner.

### Required behavior

- constrained Blueprint slots;
- source filters from classwork, homework, earlier quizzes, alternatives, Phases, Concepts, and date ranges;
- deterministic eligibility and ranking;
- explicit shortfall without silent relaxation;
- options to add content, allow repetition, widen difficulty, reduce size, or defer slots;
- meaningful A/B variants using equivalent slot-filling, not only reordering;
- stable learner-specific Delivery;
- canonical option permutation mapping;
- online and print-ready delivery;
- automatic grading for supported Exercise types;
- manual decision and override reason for official results;
- regrading impact preview;
- reduced Assessment retains deferred coverage for a later Assessment.

### Analyzer pipeline

Implement approximately five high-value analyzers:

1. easiest/hardest questions;
2. weakest/strongest Concepts;
3. omissions;
4. attractive distractor;
5. learners requiring follow-up.

Findings never mutate grades or plans automatically.

### Acceptance proof

Generate A/B variants, create two immutable learner Deliveries, complete them, grade, run findings, preview regrade, and record a Grade Entry.

## 9.12 Packages and demo content

### User outcome

Teachers and external agents can exchange validated educational content without executable code.

### Package structure

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

### Safety

MUST bound compressed size, expanded size, entry count, per-entry size, directory depth, and parseable document size. Reject absolute paths, `..`, normalized duplicates, symlinks, executables, unsupported compression, zip bombs, unsafe SVG features, and mismatched MIME where practical.

### Staging and apply

- parse and validate before mutation;
- show additions, updates, conflicts, unsupported capabilities, missing dependencies, invalid records, and skipped assets;
- apply one complete bounded package in a MongoDB transaction;
- memory repository applies against a cloned state and swaps only after success;
- package update creates normal Revisions;
- local forks survive reset/update;
- disabled capability package remains staged as unsupported.

### Acceptance proof

Test invalid atomic rejection, valid round trip, package update revision, and demo reset preserving a teacher fork.

## 9.13 Project capability

Project is a Functional Foundation behind a feature toggle.

MUST include:

- isolated feature slice/module;
- schema and package contract;
- create/edit/detail UI;
- typed Relations to Subjects, Courses, Learner Groups, Concepts, Requirements, Phases, ActivityTemplates, Resources, Assignments, outputs, equipment, and preparation notes;
- seeded Mushroom Yard Project;
- disabled routes/navigation disappear while data persists;
- unavailable capability references render explicitly;
- imports remain staged as unsupported;
- no dependency from core Lesson, Assessment, Assignment, or Today workflows.

Do not implement custom project scheduling, room allocation, progress engine, collaborative canvas, or institutional administration.

---

# 10. Cross-cutting technical contracts

## 10.1 Concurrency and idempotency

Use minimal shared primitives, not a distributed-lock framework.

- editable records carry `concurrencyVersion` or ETag;
- update commands use compare-and-swap;
- stale writes return Conflict with reload/compare guidance;
- live joins/answers/transitions use atomic MongoDB operations;
- submission, live answer, package apply, reset, and assessment generation use idempotency keys or deterministic unique identities;
- retrying a successful operation MUST not duplicate effects.

## 10.2 Lifecycle transitions

Publication, Lesson Run, Live Session, Assignment, Submission, Assessment Delivery, Grade Entry, and package-operation states MUST have centralized allowed-transition functions or tables. Transitions enforce invariants, return Results, and emit audit/activity records.

Do not introduce an external state-machine framework unless clearly justified.

## 10.3 Search and paging

- module payloads produce bounded normalized search projection including titles, aliases, relevant plain Markdown, tags, and registered identifiers;
- use native MongoDB indexes so local Docker and hosted free-tier behavior remain aligned;
- no Atlas Search requirement;
- cursors encode the complete stable sort tuple;
- exact totals are optional;
- UI MUST retrieve records beyond the first page and preserve filters/sorting.

## 10.4 Security

- app-owned credentials and server sessions;
- strong environment validation;
- production MUST fail if persistence is memory, session secret is missing/weak/default, origins are invalid, or required asset provider is unavailable;
- cookie security, origin/CSRF protection, input validation, auth rate limiting, session expiry/invalidation, security headers/CSP;
- participant/learner task credentials are short-lived and scoped;
- imported content is untrusted, Capability Module code is trusted build-time code;
- audit authentication, publication, import, grading, official grade changes, destructive actions, and Admin changes.

## 10.5 Localization

- English source/fallback, Hungarian default;
- UI namespaces use i18next/react-i18next or equivalent established approach;
- educational translations share stable identity and structure but may override assets/answers when necessary;
- normal UI MUST not display raw lifecycle/status/error identifiers;
- internal codes may appear only in advanced technical details.

## 10.6 Assets and external content

- hosted restricted profile: bundled SVG/tiny images and registered external providers; no general uploads;
- local rich profile: filesystem provider and one small rich-media reference;
- assets store metadata/hash/reference, not MongoDB blobs;
- only registered providers may embed media;
- generic URLs open as ordinary external links;
- missing external content shows fallback and never blocks the Lesson;
- no scraping or proxying by default.

## 10.7 Performance and document growth

Architectural targets are larger than the free hosted demo, but the implementation MUST avoid whole-collection loading and unbounded traversal.

- server-side paging/filter/sort;
- deliberate indexes;
- bounded graph traversal;
- no `allowDiskUse` dependency;
- Lessons reference reusable content and embed only contextual bounded values;
- exact content is copied only into explicit immutable delivery snapshots;
- enforce document-size limits well below MongoDB's maximum;
- compact live polling payloads and separate aggregate/detail queries.

## 10.8 Migrations

- fresh installations initialize the current schema;
- `schemaMigrations` records ordered idempotent forward migrations;
- migration compatibility is guaranteed beginning with the first tagged usable release;
- development may explicitly reset/reseed;
- production never silently resets;
- unsupported/destructive migration requires portable export and explicit failure.

---

# 11. Test and evidence matrix

| Requirement | Unit | Mongo Integration | API Integration | Browser E2E | Manual/Build |
|---|---:|---:|---:|---:|---:|
| Login/logout/session invalidation | R | R | R | R | - |
| Blank onboarding | R | R | R | R | - |
| Six Exercise editors | R | - | R | R | visual review |
| Relation editing | R | R | R | R | - |
| Cursor paging beyond first page | R | R | R | R | - |
| Lesson revision resolution | R | R | R | R | - |
| Presentation leave/resume/complete | R | R | R | R | projected review |
| Live join/submit/results/leaderboard | R | R | R | R | QR visual review |
| Assignment draft/resubmit | R | R | R | R | - |
| Assessment stable delivery | R | R | R | R | print review |
| Package transaction/rollback | R | R | R | staging E2E | - |
| Project disabled isolation | R | R | R | R | - |
| Crepe round trip | R | - | - | R | visual review |
| Localization no raw codes | R | - | R | R | - |
| OpenAPI/client alignment | R | - | R | - | generated artifact |
| Docker replica-set startup | - | R | smoke | - | R |
| Vercel adapter | - | - | smoke | - | `vercel build` or documented limitation |
| Render config | - | - | health smoke | - | config validation |
| README truthfulness | - | - | - | - | R |

## 11.1 Mandatory browser suite

At minimum:

1. bootstrap, navigate, logout, old-session rejection;
2. blank Course/learners/Concepts and all six Exercise types;
3. create/publish Lesson with multiple task types;
4. Presentation enter, Concept definition, task, live quiz, response table, leaderboard, solution, timer-to-homework, leave/resume/complete;
5. Assignment draft/reload/submit/return/resubmit;
6. Assessment generation/stable delivery/grading;
7. revision impact and historical pinning;
8. package reject/round-trip/reset/fork preservation;
9. weekly timetable with Location and overlap;
10. Project toggle isolation.

These tests MUST assert functional state, not only the existence of buttons or HTTP 200 responses.

## 11.2 Real MongoDB guidance

`docs/TESTING.md` MUST explain:

- starting the replica-set test database;
- exact Docker commands;
- per-run/worker database isolation;
- seed/reset and cleanup;
- retaining failed databases for debugging;
- interpreting transaction and replica-set failures;
- CI service configuration;
- how memory and Mongo repository tests differ.

## 11.3 Root commands

The repository MUST expose verified root commands equivalent to:

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

---

# 12. Complexity budgets and anti-overengineering rules

- No generic repository abstraction may replace a required domain-specific atomic command.
- No route or composition file should become the real application architecture. Split by feature when a file contains unrelated workflows or is no longer reviewable.
- No runtime executable plugin loading.
- No custom rich-text editor or deep ProseMirror customization.
- No universal state-machine, job, permission, graph-query, form-generation, or optimization framework.
- No raw internal ID fields in normal UX.
- No hardcoded closed enums for module-extensible type identifiers. Generate installed-build unions/registries.
- No page that silently limits collections to 100 records.
- No whole-document read/mutate/replace for active live aggregates without a version guard.
- No exact total count on every collection request unless the UI genuinely requires it.
- No automatic revision propagation in MVP.
- No optional foundation may be allowed to break core workflows.
- No feature may be claimed complete because seed data bypasses missing create/edit/delivery behavior.
- Prefer platform/native/library capabilities over custom glue.
- When scope must be reduced, preserve workflow and simplify sophistication.

---

# 13. Deployment and README contract

## 13.1 Runtime adapters

One Fastify application factory with thin adapters:

- local Node listener;
- Docker/Render listener binding `0.0.0.0:$PORT`;
- one Vercel Function entry point.

No business logic in adapters. Reuse Mongo clients safely in serverless environments. Do not rely on persistent local files, in-memory sessions, or in-memory locks in hosted runtime.

## 13.2 Docker, authoritative acceptance environment

Docker Compose MUST include:

- application image;
- MongoDB single-node replica set;
- automatic initialization/health checks;
- persistent volume;
- one-command startup;
- application and health URLs;
- migration/index startup behavior;
- demo seed/reset command;
- documented preserve-data and destructive-reset paths.

## 13.3 Vercel

The committed configuration and README MUST state actual verified values. Expected baseline:

- Framework Preset: `Other`;
- Root Directory: repository root;
- Install Command: `npm ci`;
- Build Command: `npm run build`;
- Output Directory: committed configuration, expected `apps/web/dist`;
- one Fastify Function for `/api`;
- SPA rewrite to frontend;
- MongoDB Atlas;
- hosted restricted asset profile;
- exact pinned Node version.

The README MUST explain Atlas user/network setup, environment variables, Preview isolation, health check, bootstrap, logs, ephemeral filesystem, and rollback/redeploy.

## 13.4 Render

Commit `render.yaml` and root Dockerfile. README MUST explain:

- New → Blueprint;
- connect repository;
- secret environment variables;
- Docker service, branch, region, health path;
- Atlas connection;
- `0.0.0.0:$PORT` binding;
- first-run bootstrap;
- free sleeping and ephemeral filesystem;
- redeploy/rollback;
- manual Web Service fallback.

## 13.5 Required environment documentation

The root README MUST include a table with required/optional, safe example, profile, and purpose for every environment variable, including at least:

- `MONGODB_URI`;
- `SESSION_SECRET`;
- `PUBLIC_APP_URL`;
- allowed origins;
- runtime/deployment profile;
- timezone/default locale;
- feature flags;
- asset profile and limits.

## 13.6 README truthfulness

Every command, path, preset, output directory, health route, port, and environment variable in README MUST match committed configuration. Generic copied provider instructions fail acceptance.

---

# 14. Documentation and licensing

Required docs:

```text
AGENTS.md
docs/ARCHITECTURE.md
docs/DOMAIN-MODEL.md
docs/FEATURE-SLICES.md
docs/EXTENSIONS-AND-CONTRACTS.md
docs/CONTENT-AUTHORING.md
docs/DEPLOYMENT-AND-OPERATIONS.md
docs/TESTING.md
docs/SECURITY.md
docs/VERIFICATION.md
docs/adr/
IMPLEMENTATION-DEVIATIONS.md
CONTENT-RIGHTS.md
STEWARDSHIP.md
```

Licensing:

- code, CLI, schemas, executable module examples: PolyForm Noncommercial 1.0.0;
- project-owned educational seed content and prose docs: CC BY-NC-SA 4.0;
- imported content: per-item rights metadata;
- logo/brand: all rights reserved unless separately licensed;
- include a nonbinding stewardship request for public authorities, national/regional systems, vendors, platform operators, and large institutions, explicitly stating it does not alter the license;
- source citation is not permission;
- public packages exclude unknown/unresolved/private-use rights.

---

# 15. Final instruction to the implementation agent

Build the repository, do not merely describe it. Favor complete vertical behavior over broad stubs. Begin with the Priority 0 usability gate and keep it green throughout implementation.

Before claiming success:

1. run every available verification command;
2. use real MongoDB for persistence-specific behavior;
3. run the browser paths that prove navigation, Logout, Exercise creation, Presentation exit/completion, learner submission, response table, leaderboard, Assignment drafts, and Assessment delivery;
4. build production frontend/server;
5. build/start Docker where available;
6. verify the Vercel adapter and Render configuration where tooling permits;
7. report exact unverified items without implying they passed;
8. record all deviations and why they preserve higher-priority behavior.

A polished demo with broken Logout, trapped Presentation Mode, uncreatable quiz Exercises, or nonfunctional student answers is not an MVP.

---

# Appendix A. Exact reference fixtures

## A.1 Grade 8 reference workspace

### A.1.1 Identity

- Hungarian Grade 8 Mathematics;
- right triangles and Pythagorean theorem;
- one Learner Group and Course;
- Teaching Location;
- five animal-pseudonymous Learners with varied profiles;
- fixed Demo Clock-relative schedule.

### A.1.2 Educational content

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

### A.1.3 Exact learner fixture

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

### A.1.4 Exact Concept catalogue

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

### A.1.5 Exact Resource catalogue

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

### A.1.6 Exact authored Exercise catalogue

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

### A.1.7 Exercise Family and pinned instances

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

### A.1.8 Exact Profiles, Blueprints, and Layouts

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

### A.1.9 Phase sequence

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

### A.1.10 Detailed Lesson examples

#### Lesson 2: Discovering the relationship

- Introduction Blueprint;
- right-triangle vocabulary Resource;
- identify-hypotenuse Activity;
- 3-4-5 discovery Activity;
- visual-proof Resource;
- short class discussion;
- confidence-vote closure;
- planned 45 minutes.

#### Lesson 3: Formal theorem and notation

- vocabulary recap;
- formal KaTeX theorem statement;
- worked example;
- true/false check;
- learner explanation prompt;
- homework Assignment.

#### Lesson 4: Missing hypotenuse

- completed LessonRun;
- standard worked example;
- generated integer-triple practice;
- scaffolded decimal task;
- live exit ticket;
- runtime note that one Activity ran long.

#### Lesson 9: Formative Assessment

- completed LessonRun;
- phone-based quiz;
- five Learners with real results;
- attractive distractor;
- weak-prerequisite Finding;
- learner follow-up Finding.

#### Lesson 11: Phase-closing Assessment

- meaningful A/B variants;
- printable and online delivery;
- manual grading override example;
- deferred coverage linked to a later smaller Assessment.

### A.1.11 Assignments and formative quizzes

Assignments:

1. hypotenuse practice with light evidence;
2. missing-leg correction cycle;
3. practical home measurement with optional local-profile photo and a written alternative always available.

Formative quizzes:

1. vocabulary and theorem recognition;
2. mixed missing-side calculation plus confidence vote.

### A.1.12 Assessment Blueprint fixture

Slots:

1. identify right-triangle elements, 2 points;
2. missing hypotenuse, 3 points;
3. missing leg, 3 points;
4. practical word problem, 4 points;
5. right-triangle validation, 3 points;
6. short reasoning item, 5 points.

Generate compatible A/B variants. The reduced fixture fills slots 1 to 3 and retains slots 4 to 6 as deferred coverage.

### A.1.13 Seeded result patterns

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

### A.1.14 Exercise variety

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

### A.1.15 Deliberate diagnostics

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

## A.2 Grade 11 editing workspace

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

## A.3 Project reference workspace

Include the isolated **Szökés a gombakertből / Escape from the Mushroom Yard** fixture defined in Appendix B.

It must be:

- enabled in demo/development;
- small and understandable;
- original;
- partly incomplete;
- detached from golden-path dependencies;
- documented as a student-contributor growth area.

---

# Appendix B. Mushroom Yard Project detail

The isolated Project fixture is **Szökés a gombakertből / Escape from the Mushroom Yard**.

It MUST use wholly original forest-animal characters, story text, art, and tasks. It may evoke the ensemble-adventure feeling of classic village fantasy stories without copying protected characters or plots.

The animals have distinct identities, strengths, and recurring roles. They encounter a short sequence of challenges while trying to escape a mushroom yard in the middle of a forest.

Include at least:

- a binary-number decoding or representation challenge;
- a visual/structural pattern-matching challenge;
- a fractions challenge;
- links to Mathematics and Informatics Subjects;
- relevant Concepts and Curriculum Requirements;
- one or more Courses/Learner Groups;
- Resources, Exercises, ActivityTemplates, Assignments, expected outputs, equipment, and preparation notes;
- deliberate incomplete sections marked as contributor opportunities for high-school Informatics students.

Use Bebras-style qualities only as general pedagogical inspiration: concise, accessible, story-framed computational-thinking puzzles. Do not copy or closely adapt Bebras tasks.

# Appendix C. Foundation package

A blank installation loads only a tiny built-in foundation package containing:

- selected school-system defaults;
- Hungarian 1-to-5 grade scale;
- one Balanced Teaching Profile;
- one 45-minute Lesson Blueprint;
- one compact Lesson Layout;
- canonical terminology;
- required core Relation contracts;
- no Grade 8/11 educational demo content.

The onboarding wizard then creates the teacher's first real organization and content. Full demo loading remains optional.

# Appendix D. Machine-readable requirement summary

The repository SHOULD copy this summary into `docs/requirements-v3.yaml` and map each ID to implementation evidence.

```yaml
requirements:
  P0-NAV:
    must: "Every full-screen or modal workflow has a working exit and safe return."
    evidence: [browser]
  P0-LOGOUT:
    must: "Logout invalidates the server session, clears client state, and rejects the old cookie."
    evidence: [api, browser]
  P0-EXERCISES:
    must: "Teacher can create and use manual, single-choice, multiple-choice, boolean, numeric, and accepted-text Exercises."
    evidence: [unit, api, browser]
  P0-PRESENTATION:
    must: "Presentation supports leave, resume, complete, concept/task/quiz/result/leaderboard/solution/homework sequence."
    evidence: [api, browser]
  P0-LIVE:
    must: "Learner answers are accepted idempotently and appear in teacher results without reload."
    evidence: [mongo, api, browser]
  CORE-BLANK:
    must: "Blank onboarding creates the first Course, learners, Concept, Exercise, and Lesson without demo IDs."
    evidence: [browser]
  CORE-RELATIONS:
    must: "Typed Relations are authorable through guided selectors."
    evidence: [mongo, api, browser]
  CORE-REVISIONS:
    must: "Scheduled and delivered content resolves exact revisions or immutable snapshots."
    evidence: [unit, mongo, api, browser]
  CORE-ASSIGNMENTS:
    must: "Server-side drafts, immutable attempts, correction, and resubmission work."
    evidence: [mongo, api, browser]
  CORE-ASSESSMENTS:
    must: "Blueprint generation, stable Deliveries, grading, and findings work."
    evidence: [unit, mongo, api, browser]
  CORE-PACKAGES:
    must: "Package staging and bounded transactional apply are atomic and reference fixtures use the same path."
    evidence: [mongo, api]
  OPS-DOCKER:
    must: "Docker Compose starts app plus MongoDB replica set."
    evidence: [build, smoke]
  OPS-DOCS:
    must: "README contains truthful step-by-step local, Docker, Vercel, and Render setup."
    evidence: [manual, config-test]
```

# Appendix E. Version 3 consolidation changes

Version 3 does not reopen the product design. It improves executability by:

- placing a compact implementation contract first;
- introducing Priority 0 usability release blockers;
- explicitly guarding Logout, Presentation escape/completion, Exercise authoring breadth, live submission, response tables, and leaderboard;
- defining a fixed demo Presentation acceptance sequence;
- using MUST/SHOULD/MAY language;
- adding authoritative screen, route, entity, folder, and contract inventories;
- providing representative data contracts;
- enforcing a staged vertical implementation order;
- attaching acceptance proof and exclusions to major features;
- centralizing complexity budgets;
- adding a requirement-to-test matrix and machine-readable summary;
- retaining exact reference fixtures in appendices rather than interrupting the main implementation path.
