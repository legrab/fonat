# Fonat

## Authoritative One-Shot MVP Implementation Specification

**Status:** Final concept specification after integrity, feasibility, and consolidation audits  
**Specification date:** 2026-07-13  
**Product motto:** **Szálról szálra.** / **Thread by thread.**  
**Separate About and README line:** **Az oktatás minden szála egy helyen.** / **Every thread of teaching in one place.**

> This document is the authoritative product and implementation specification for the first complete Fonat repository. Implement the application described here as a runnable, tested modular monolith. Do not reopen settled product decisions unless current official documentation reveals a genuine blocker. Resolve small implementation details pragmatically, prefer the simplest mature solution, and record every material deviation in `docs/IMPLEMENTATION-DEVIATIONS.md`.

---

# 1. Product promise

Fonat is a single-teacher educational workspace that connects reusable teaching material, curricula, annual plans, lessons, classroom execution, assessments, and student learning evidence.

It is not merely:

- an exercise database,
- a calendar,
- a gradebook,
- a learning-management-system shell,
- a presentation editor,
- or an AI wrapper.

Its defining value is the connected structure accumulated over years:

1. A teacher builds and improves reusable Concepts, Resources, Exercises, Profiles, Blueprints, and Assessments.
2. Fonat connects those materials to curriculum requirements and classroom context.
3. The teacher assembles lessons from transparent recommendations rather than starting from empty documents.
4. Fonat supports the lesson itself through Presentation Mode and simple phone-based participation.
5. Student answers, correction attempts, teacher observations, and assessment results become Learning Evidence.
6. That evidence helps the teacher understand what happened and prepare what comes next.
7. Reusable material improves without erasing the history of what was actually taught.

The MVP is for one teacher with multiple classrooms and many years of reuse. The architecture must remain open to other subjects, school systems, teachers, and institutional integrations without implementing a school administration suite now.

---

# 2. Non-negotiable design principles

## 2.1 Szálról szálra: incremental construction

Teaching, learning, planning, and authoring should work incrementally.

- A teacher may begin with one Concept and one lesson without configuring a curriculum.
- An Annual Plan may begin as a phase skeleton and gain concrete lessons during the year.
- An Exercise may begin as a Draft and later become reviewed and Published.
- A student may improve through attempts and corrections instead of being represented only by a final score.
- Complex configuration should be progressively disclosed.
- The application should always expose a clear next useful action.

## 2.2 Preserve engagement and flow

Flow is a product principle, not marketing language and not a synonym for screens or games.

For teachers:

- reduce context switches,
- minimize compulsory administration,
- preserve unfinished work,
- provide useful defaults,
- keep advanced settings out of the normal path,
- return users to the context they left,
- do not interrupt an active lesson with configuration.

For students:

- make joining and responding quick,
- keep instructions clear,
- reveal one useful step at a time where configured,
- avoid unnecessary authentication friction,
- avoid assuming that competition or phone use is automatically engaging.

Physical, collaborative, reflective, and quiet activities are as legitimate as digital quizzes.

## 2.3 Can you show how it was done?

Fonat should preserve and support the process behind an answer.

- Exercises may request intermediate steps, a short explanation, confidence, a correction, or a demonstration.
- Grading shows the rule that produced the automatic result.
- Recommendations show why an item was suggested.
- Coverage shows its contributing sources.
- Imports and revisions show diffs and impact.
- Settings show which layer supplied the effective value.

The application must not claim to detect AI use. It should instead make assignments more educationally useful even when students have access to AI.

## 2.4 The learning journey matters, while correctness still matters

Fonat must preserve:

- original attempts,
- feedback,
- corrections,
- resubmissions,
- evidence over time,
- teacher assertions,
- final results.

Do not replace the journey with one mutable mastery percentage or one final answer.

## 2.5 Assist the teacher, do not administer the teacher

Every workflow should maximize value per interaction.

- Post-lesson reflection should be optional and take seconds.
- Findings suggest actions but do not silently rewrite plans or grades.
- Evidence intensity is configurable.
- The system may be used without student accounts, curricula, or detailed progress tracking.
- No feature should force paperwork merely because the data model can store it.

## 2.6 Explainable and deterministic before clever

Prefer:

- registered choices over free-form magic strings,
- deterministic filtering over opaque inference,
- transparent weighted scoring over a black-box optimizer,
- warnings over silent plan rewriting,
- exact package contracts over heuristic parsing,
- explicit unsupported results over approximate fallback behavior.

## 2.7 Simple implementation before theoretical generality

The MVP must preserve extension points without building a platform whose main feature is configuring the platform.

- Use a modular monolith.
- Use one programming language across frontend and backend.
- Prefer mature libraries and native platform features.
- Avoid custom component systems, custom editors, generic job engines, event sourcing, microservices, and plugin marketplaces.
- Build one good reference implementation for each extension contract.
- Defer broad generalization until a real second implementation requires it.

## 2.8 Safe by default

- Expected failures use typed Results.
- Security-sensitive failures fail closed.
- Imports validate before mutation.
- Invalid packages are rejected rather than interpreted best-effort.
- Destructive actions show impact.
- Unsupported grading requires manual review.
- External content remains visibly external and may be unavailable.

---

# 3. Product identity and language

## 3.1 Name and brand

- Product name: `Fonat`
- Primary motto: `Szálról szálra.` / `Thread by thread.`
- Separate About and README line: `Az oktatás minden szála egy helyen.` / `Every thread of teaching in one place.`
- Do not place the motto and the separate line directly beside one another.
- Do not use `flow` as a tagline or campaign phrase.
- Keep application name, logo, favicon, instance title, and package namespace configurable.
- Do not embed the brand name into domain type names, MongoDB collection names, or CSS class names.

Use a replaceable npm scope such as `@fonat-edu` if available. Availability must be checked when the repository is created.

## 3.2 Product voice

- Clear, calm, direct, and teacher-oriented.
- Explain unfamiliar Fonat terminology in one or two sentences.
- Avoid childish styling in teacher surfaces.
- Student surfaces may be playful without becoming noisy.
- Never use unexplained technical language in normal teacher workflows.

---

# 4. Scope classification

Every capability belongs to exactly one implementation state.

## 4.1 Complete MVP

A user can perform the workflow from the UI. It uses real persistence, validation, authorization, and error handling. It has automated integration coverage and appears in the demo acceptance journey.

## 4.2 Functional foundation

The capability has stable contracts and one narrow working reference path. Advanced workflows or configuration may remain incomplete.

## 4.3 Deferred

The architecture and documentation acknowledge the capability. No fake interface, inert button, or misleading placeholder is required.

The machine-readable capability catalogue is the source of truth for these states and powers the Administration capability page and generated roadmap documentation.

---

# 5. Users, roles, and privacy modes

## 5.1 Site Admin

Capabilities include:

- bootstrap and manage teacher accounts,
- reset credentials,
- enable capability modules,
- manage administration settings,
- inspect deployment health,
- apply seeds and reset the demo,
- configure content sources,
- review destructive actions and imports.

The initial user may hold both Site Admin and Teacher roles.

## 5.2 Teacher

Capabilities include:

- manage classrooms and learners,
- author and publish content,
- manage curricula and annual plans,
- plan, run, and reflect on lessons,
- create assessments,
- review submissions and evidence,
- override automatic grading,
- import and export content.

## 5.3 Student

Capabilities include:

- access assigned or live activities,
- submit answers and homework,
- view released feedback,
- manage permitted display identity settings.

## 5.4 Guest Participant

A guest joins a live session without a permanent account.

- Receives a unique generated nickname and badge.
- Results remain attached to a temporary guest identity.
- A claim code may support later teacher-confirmed linking to a Learner Profile.
- Never link results automatically by nickname.

## 5.5 Capability-based authorization

Internally authorize against capabilities, not hardcoded role names.

Default roles bundle capabilities. Do not implement a full permission editor in the MVP.

---

# 6. Primary user workflows

The implementation must optimize these end-to-end workflows.

## 6.1 First run

1. Open Fonat.
2. Create the initial Site Admin.
3. Change the temporary or bootstrap password.
4. Choose `Start blank` or `Load demonstration workspace`.
5. Select the Hungarian school-system package.
6. Create or select a Teaching Profile.
7. Optionally create the first Classroom and Annual Plan.
8. Arrive on Today with one obvious next action.

## 6.2 Curriculum-free lesson

1. Select or quickly create a Concept.
2. Choose lesson intent, duration, and group characteristics.
3. Select a Teaching Profile and Lesson Blueprint.
4. Receive eligible, ranked Activities and Exercises.
5. Assemble the lesson.
6. Inspect diagnostics.
7. Save, publish, schedule, present, print, or later attach it to a Phase.

Curriculum configuration must never be mandatory for trying Fonat.

## 6.3 Annual planning

1. Select school year, Classroom, subject, and optional Curriculum.
2. Enter recurring weekly lesson availability and known exceptions.
3. Choose a Teaching Profile.
4. Create or import a phase skeleton.
5. Assign approximate lesson counts and milestones.
6. Schedule lessons gradually.
7. Inspect planned and completed coverage.
8. Adjust the plan throughout the year without rebuilding it.

## 6.4 Daily lesson preparation

1. Open Today.
2. Open the next Lesson.
3. Review warnings and context.
4. Review blueprint slots and ranked candidates.
5. Add preferred material to a candidate basket.
6. Generate a transparent proposal.
7. Pin, swap, reorder, or remove Activities.
8. Review duration, prerequisite, participation, and coverage findings.
9. Publish and start Presentation Mode or export the lesson guide.

## 6.5 In-class execution

1. Start a Lesson Run.
2. Open projected and teacher-control views.
3. Follow Sections and timers.
4. Launch a phone quiz or other configured activity.
5. Continue through loaded slides even if the connection briefly fails.
6. Add minimal runtime notes.
7. Finish the lesson.
8. Optionally choose one of:
   - Adjust for the next group
   - Plan a follow-up
   - Improve reusable material

## 6.6 Assessment cycle

1. Choose an Assessment Generation Profile and Blueprint.
2. Select source phases, lessons, homework, quizzes, alternatives, and date range.
3. Generate compatible A/B variants.
4. Review variant-equivalence diagnostics.
5. If content is insufficient, generate the strongest valid smaller assessment and retain deferred slots.
6. Deliver online or print.
7. Grade automatically where supported.
8. Review and override results.
9. Inspect deterministic findings.
10. Generate a later assessment from deferred coverage.
11. Use findings to prepare follow-up teaching.

## 6.7 Content package cycle

1. Upload a package ZIP or inspect a configured public GitHub source.
2. Select complete recognized packages.
3. Validate into staging.
4. Review additions, updates, conflicts, dependencies, unsupported capabilities, and skipped assets.
5. Apply or reject each package.
6. Export selected content back to the portable format.

---

# 7. Canonical terminology

Use these terms consistently in code, UI, documentation, schemas, tests, and seeds.

## 7.1 Educational graph

### Graph

The network of educational and planning entities plus typed relationships between them.

### Node

A globally addressable educational or planning entity with stable identity, lifecycle, provenance, and a validated type-specific payload.

### Relation

A registered, directed connection between entities. A Relation may have dimensions whose meaning is defined by its Relation Type.

### Concept

Curriculum-independent knowledge, skill, method, competency, representation, misconception, or other teachable idea.

Required Concept subtypes:

- fact
- definition
- theorem
- method
- procedure
- skill
- competency
- representation
- misconception
- heuristic
- learning objective

Keep the subtype set registered, minimal, localized, and documented.

### Curriculum Requirement

A requirement imposed by a Curriculum. It references one or more Concepts and specifies expected depth, timing, sequence, or evidence.

### Curriculum

A versioned hierarchy of Curriculum Requirements for a subject and school-system context.

### Resource

Reusable material consumed during teaching, such as an explanation, Markdown text, diagram, image, video link, WolframAlpha link, or 2D plot.

### Exercise

A reusable task specification requiring student action or a response. It contains grading and evidence configuration where relevant.

### Exercise Family

A reproducible generator of Exercise Instances under a constrained parameter schema.

### Assessment

A reusable evaluation definition composed from constrained slots and Exercises.

## 7.2 Planning

### Teaching Profile

A reusable set of pedagogical preferences, differentiation expectations, participation preferences, and default policies.

### Lesson Blueprint

An ordered structure of Lesson Sections, timing ranges, slot requirements, and pedagogical purpose.

### Lesson Layout

A visual and printable representation of a Lesson. Multiple Layouts may render the same Lesson Blueprint.

### Annual Plan

A Classroom-specific plan for a school year, including Phases, schedule, curriculum mapping, milestones, and evolving Lesson content.

### Phase

A bounded sequence of Lessons, usually thematic, project-based, or pedagogical.

### Lesson

A concrete planned or completed teaching event.

### Lesson Section

An ordered timed part of a Lesson.

### Activity

A Lesson-specific execution of one or more Resources or Exercises. It adds duration, grouping, instructions, presentation behavior, and Evidence Policy.

Lesson Sections and Activities are embedded, stable-ID components of a Lesson revision. They are not independent global Nodes in the MVP.

## 7.3 Students and execution

### Classroom

A teacher-managed group and its settings.

### Learner Profile

The pseudonymous educational identity used for enrollment, evidence, and progress.

### Enrollment

A time-bounded membership of a Learner Profile in a Classroom.

### Lesson Run

The actual execution record of a Lesson, including timing, completed or skipped Activities, and runtime notes.

### Submission

A student's answer or work for an Exercise, Assignment, or Assessment Instance.

### Learning Evidence

A record that may support understanding of student progress, such as an answer, explanation, correction, observation, oral demonstration, or project contribution.

### Concept State

An explainable derived overview of a learner's current relationship to a Concept. It is not a permanently mutating mastery truth.

### Assessment Instance

The exact delivered version of an Assessment for a Classroom or learner, including question selection and presentation order.

## 7.4 Platform

### Revision

An immutable published version of a Node. Draft saves do not create Revisions.

### Content Package

A portable, versioned folder containing data, Markdown, optional assets, relations, schemas, metadata, and documentation.

### Capability Module

Trusted deployment code that registers schemas, renderers, editors, grading handlers, validators, analyzers, or other defined capabilities.

### Finding

A structured output from a validation or analysis pipeline.

---

# 8. In-application Fonat Guide

Add a permanent searchable `Fonat Guide` entry.

Main tabs:

1. Teaching structure
   - Annual Plan
   - Phase
   - Lesson
   - Lesson Section
   - Activity

2. Educational content
   - Concept
   - Curriculum Requirement
   - Curriculum
   - Resource
   - Exercise
   - Exercise Family
   - Assessment

3. Planning configuration
   - Teaching Profile
   - Lesson Blueprint
   - Lesson Layout

4. Students and progress
   - Learner Profile
   - Enrollment
   - Submission
   - Learning Evidence
   - Concept State

5. Platform concepts
   - Node
   - Relation
   - Revision
   - Content Package
   - Capability Module
   - Finding

Requirements:

- One or two concise teacher-readable sentences per term on the main guide.
- Contextual `(i)` help controls link to these canonical entries.
- Do not duplicate divergent descriptions across screens.
- Deeper developer documentation remains in the repository, not in the normal teacher guide.

---

# 9. Domain and persistence model

## 9.1 Composition over inheritance

Use a shared entity envelope and type-specific validated payloads.

Do not create a deep class hierarchy. Do not create a generic entity-attribute-value system.

## 9.2 Graph-addressable Nodes

Store educational and planning Nodes in one `nodes` collection.

Required MVP Node types:

- Concept
- CurriculumRequirement
- Curriculum
- Resource
- Exercise
- ExerciseFamily
- TeachingProfile
- LessonBlueprint
- LessonLayout
- AnnualPlan
- Phase
- Lesson
- Assessment

Classrooms, learners, submissions, evidence, lesson runs, and assessment instances use specialized collections because their privacy, volume, and lifecycle differ. They may still participate in Relations through a common `EntityRef`.

## 9.3 Node envelope

A Node should include, at minimum:

```ts
type NodeEnvelope<TType extends string, TPayload> = {
  id: string;
  stableKey: {
    packageId: string;
    localKey: string;
  };
  type: TType;
  lifecycle: 'draft' | 'published' | 'deprecated' | 'archived';
  editorialState: 'draft' | 'reviewed' | 'published' | 'deprecated';
  pedagogicalConfidence: 'experimental' | 'classroom-tested' | 'repeatedly-successful';
  canonicalLanguage: string;
  translations: Record<string, unknown>;
  provenance: Provenance;
  rights: RightsMetadata;
  currentDraft: TPayload;
  latestPublishedRevisionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};
```

Do not force all fields into one open dictionary. Module-defined optional metadata may live under a namespaced `extensions` object, but core behavior may depend only on registered validated fields.

## 9.4 Published revisions

Use a separate `nodeRevisions` collection.

A Revision contains:

- stable Node ID,
- monotonically increasing revision number,
- immutable payload snapshot,
- immutable translation snapshot,
- compatibility classification,
- classification source and optional teacher override reason,
- provenance and rights snapshot,
- published timestamp and publisher,
- content hash.

Completed Lessons, Lesson Runs, Assessment Instances, and Submissions must reference exact Revisions.

## 9.5 Operational collections

Use a minimal set:

- `nodes`
- `nodeRevisions`
- `relations`
- `users`
- `sessions`
- `classrooms`
- `learnerProfiles`
- `enrollments`
- `lessonRuns`
- `assessmentInstances`
- `submissions`
- `learningEvidence`
- `activityEvents`
- `notifications`
- `packageOperations`
- `auditEvents`

Merge or split only when a real implementation constraint justifies it. Do not create one collection per Node subtype.

## 9.6 Database driver

Use the official MongoDB Node.js driver behind repository contracts.

Do not use Mongoose unless an implementation spike proves that it materially reduces complexity without duplicating Zod contracts. The default decision is the official driver plus Zod.

## 9.7 Repository boundaries

Provide common infrastructure:

- NodeRepository
- RevisionRepository
- RelationRepository
- AssetRepository
- PageQuery and CursorPage contracts
- transaction helper
- typed filter and sort conversion
- index registration

Add domain-specific repositories only where query behavior genuinely differs, such as Lesson, Assessment, Submission, and Learner queries.

Capability modules must not issue MongoDB queries directly.

---

# 10. Stable identity and package ownership

Portable identity uses:

```text
packageId + localKey
```

Example:

```text
packageId: hu-grade8-pythagorean-reference
localKey: exercise.missing-hypotenuse-01
```

Requirements:

- `packageId` is immutable within the package history.
- `localKey` is immutable within the package.
- Database IDs remain internal generated IDs.
- Forking creates a new Node with new package ownership and provenance pointing to the source.
- Teacher-created local content belongs to a generated local package namespace.
- Imports are idempotent against the stable identity and revision metadata.

---

# 11. Relation model

## 11.1 Registered Relation Types

Relations are not arbitrary strings.

A Relation Type defines:

- key,
- localized labels,
- allowed source entity types,
- allowed target entity types,
- direction,
- inverse display label,
- duplicate rules,
- supported dimensions,
- validation rules,
- default Related-panel grouping.

## 11.2 Required MVP Relation Types

At minimum:

- `covers`
- `requires`
- `revises`
- `extends`
- `alternativeTo`
- `closeAlternativeTo`
- `uses`
- `instantiates`
- `belongsTo`
- `satisfies`
- `assesses`
- `demonstrates`
- `relatedTo`
- `derivedFrom`
- `translatedFrom`
- `forkedFrom`

## 11.3 Relation dimensions

Do not use one universal weight.

Examples:

- `covers.contribution`: 0 to 1
- `alternativeTo.similarity`: 0 to 1
- `requires.strength`: required, recommended, helpful
- `demonstrates.confidence`: 0 to 1

Every dimension must be named, validated, and explained by the Relation Type.

## 11.4 Related panel

Every graph-addressable detail page includes a consistent Related panel grouped by Relation Type.

An Exercise may show:

- covered Concepts,
- prerequisites,
- alternatives,
- Lessons using it,
- Assessments using it,
- newer Revision,
- source and provenance.

A visual graph canvas is deferred.

---

# 12. Provenance, quality, and rights

## 12.1 Provenance

Every published Node and Relation stores lightweight provenance:

- bundled seed,
- teacher-authored,
- imported package,
- external-AI-generated,
- translated,
- forked,
- generated alternative,
- derived from assessment analysis.

Include original package and key, creator or generator label, source Revision, creation method, optional source URL, and review state.

## 12.2 Quality states

Separate:

- technical validity,
- editorial lifecycle,
- pedagogical confidence.

Usage count must not automatically publish or promote content.

## 12.3 Rights metadata

Each Resource, Exercise, and Asset supports:

- author,
- source title,
- source URL or bibliographic reference,
- licence identifier,
- attribution text,
- modification status,
- redistribution permission,
- rights status.

Rights states:

- project-owned
- teacher-owned
- openly licensed
- permission granted
- public domain
- private-use only
- unknown
- unresolved

Public package validation must reject `private-use only`, `unknown`, and `unresolved` content.

---

# 13. Revision model

## 13.1 Lifecycle

- Draft edits autosave and remain mutable.
- Publishing creates an immutable Revision.
- Editing a published Node creates or resumes a Draft based on the latest Revision.
- Scheduled and completed Lessons pin exact Revisions.
- A Lesson shows when a newer Revision is available.

## 13.2 Compatibility classes

Internal classes:

- `presentation-only`
- `content-equivalent`
- `planning-impacting`
- `contract-breaking`

Normal UI may show:

- Compatible
- Review required
- Breaking

The system proposes a class based on changed fields. The teacher may override it with an optional reason.

Examples:

- formatting-only change: presentation-only
- clearer wording with same task, duration, concepts, and grading: content-equivalent
- changed duration, difficulty, Concepts, prerequisites, or equipment: planning-impacting
- changed Exercise type or incompatible grading contract: contract-breaking

## 13.3 Propagation

MVP behavior:

- No automatic propagation through existing Lessons.
- Show a newer-Revision indicator.
- Offer an explicit update action.
- Preview changes and rerun diagnostics.
- Keep completed history unchanged.

Do not create a Revision for every autosave or snapshot the whole graph.

---

# 14. School-system and curriculum configuration

## 14.1 School System Package

Defines data, not custom national logic:

- grade naming and order,
- grading scale,
- school-year terminology,
- common lesson durations,
- age or grade bands,
- default student authentication policy,
- localized educational terminology,
- optional calendar conventions.

Initial package:

- Hungary
- grades configurable across primary and secondary education
- default official grade scale 1 to 5, where 5 is best

## 14.2 Curriculum Package

Defines:

- subject,
- version and validity,
- hierarchical Curriculum Requirements,
- Concept references,
- expected depth,
- sequencing constraints,
- target timing or semester,
- optional lesson-hour guidance.

Concepts are not owned by Curricula.

## 14.3 Requirement conflicts

Fonat should detect and explain:

- required Concept not planned before dependent Concept,
- external-subject prerequisite expected but not covered,
- requirement deadline missed,
- planned phase order conflict,
- intentionally omitted requirement.

The teacher remains responsible for the plan. Fonat provides datasets, warnings, and explainable constraints rather than claiming to optimize an entire curriculum.

---

# 15. Annual Plan

## 15.1 Three synchronized projections

One Annual Plan supports:

1. Coverage structure
   - Phases
   - Concepts
   - Curriculum Requirements
   - approximate Lesson counts
   - milestones and Assessments

2. Calendar schedule
   - recurring lesson availability
   - dated Lessons
   - holidays and unavailable dates
   - moved, cancelled, shortened, or extended Lessons

3. Concrete content
   - Blueprints
   - Lesson Sections
   - Activities
   - pinned content Revisions
   - completed Lesson Runs

A teacher may create the coverage structure before dates or content exist.

## 15.2 Creation wizard

Ask only:

1. school year
2. Classroom and subject
3. Curriculum or curriculum-free mode
4. recurring weekly availability and known exceptions
5. Teaching Profile
6. approximate phase structure

Generate an editable skeleton.

## 15.3 Complete MVP planning operations

- reorder Phases,
- reorder Lessons,
- move a Lesson,
- cancel a Lesson,
- shorten or extend duration,
- unschedule a Lesson,
- mark content intentionally omitted,
- drag and drop with accessible move-button alternatives.

Deferred or foundation:

- automated splitting,
- automated merging,
- automatic phase compression,
- bulk regeneration of dependent Lessons.

## 15.4 Coverage

Track separately:

- planned content coverage,
- completed content coverage,
- practice volume,
- assessment evidence,
- learner Concept State.

Do not collapse them into one percentage.

Normal teacher-facing contribution labels:

- introduces
- reinforces
- practises
- assesses
- strongly covers

Internally map these to configured numeric contribution values.

Teacher assertions are stored separately and displayed alongside derived coverage.

---

# 16. Teaching Profiles, Lesson Blueprints, and Layouts

## 16.1 Teaching Profile

Profile fields may include:

- preferred balance of explanation and activity,
- repetition tolerance,
- transfer-task preference,
- differentiation intensity,
- participation forms,
- evidence intensity defaults,
- homework load,
- feedback reveal policy,
- validation rule severity overrides,
- assessment source defaults.

Use this merge order:

```text
school-system defaults
-> selected Teaching Profile
-> Classroom or Annual Plan overrides
-> Lesson overrides
```

Effective settings must show their source.

## 16.2 Lesson Blueprint

Defines:

- ordered Section templates,
- timing ranges,
- purpose,
- required and optional Activity slots,
- compatible participation forms,
- allowed Resource and Exercise types,
- optional Presentation defaults.

## 16.3 Lesson Layout

Controls:

- print structure,
- teacher notes placement,
- compact or detailed output,
- headers and footers,
- section styling,
- page-break rules,
- identity labels,
- answer-key visibility.

Application theming and Lesson Layouts are separate concerns.

---

# 17. Lesson planning and recommendation

## 17.1 Normal flow

1. Choose intent.
2. Add optional Curriculum, Phase, and Classroom context.
3. Resolve effective Teaching Profile.
4. Select Lesson Blueprint.
5. Review slots.
6. Add preferred material to the candidate basket.
7. Generate a proposal.
8. Pin, swap, reorder, or remove Activities.
9. Review diagnostics and coverage.
10. Save, publish, schedule, present, or export.

## 17.2 Recommendation algorithm

MVP:

1. apply hard eligibility constraints,
2. calculate transparent weighted dimensions,
3. rank candidates,
4. explain the ranking.

Hard constraints may include:

- supported renderer installed,
- permitted age or grade,
- required equipment available,
- fits slot type,
- language available where required.

Weighted dimensions:

- Concept fit
- duration fit
- difficulty fit
- prerequisite relevance
- Classroom suitability
- participation variety
- differentiation support
- novelty or repetition balance

Do not implement whole-Lesson combinatorial optimization.

Provide a stable strategy interface for future algorithms.

## 17.3 Recommendation explanation

Example:

```text
Recommended because:
- covers the current objective
- fits the remaining eight minutes
- revises a weak prerequisite
- supports pair work requested by the Profile
- has a close alternative for differentiation

Caution:
- this Classroom previously found the task difficult
```

## 17.4 Candidate discovery

Normal order:

1. current Lesson context,
2. graph relations,
3. structured filters,
4. scoring,
5. text search for exceptional cases.

Search must remain available. Dropdown-only discovery will not scale.

---

# 18. Validation pipeline

## 18.1 Finding severities

- information
- suggestion
- warning
- error

Errors are reserved for invalid or impossible states, such as missing pinned Revision, malformed grading, or inaccessible required content.

A 55-minute plan in a 45-minute slot is usually a warning because the teacher may intentionally have extra time.

## 18.2 Rule policy

Teaching Profiles may disable or reclassify pedagogical rules.

They may not disable structural-integrity checks.

Automated generation may apply a stricter policy than manual planning, such as requiring no unresolved warnings of selected kinds.

## 18.3 Initial Lesson validators

- duration mismatch
- unfilled required Blueprint slot
- missing prerequisite
- unavailable Resource
- unsupported Exercise renderer
- difficulty mismatch
- repetitive participation form
- missing evidence requirement where explicitly required
- stale or breaking Revision available

## 18.4 Pipeline contract

A validator:

- declares supported entity types,
- receives immutable context,
- returns Findings,
- never mutates the Lesson,
- provides localization keys and structured evidence,
- has focused unit tests.

---

# 19. Presentation Mode

## 19.1 Source of truth

Presentation Mode is a projection of a Lesson Revision, not a separate presentation document.

Every Lesson Section produces a presentation segment.

## 19.2 MVP slide types

- section introduction
- Markdown content
- Exercise prompt
- image or sanitized SVG
- external video
- quiz launch
- solution or explanation
- blank discussion prompt
- closure and homework

Custom slides may contain a centered Markdown block.

No arbitrary free-position canvas.

## 19.3 Teacher and projected views

Projected view:

- student-safe content,
- large readable typography,
- current task,
- optional timer,
- no answers, private notes, diagnostics, or identifiable student data.

Teacher view:

- current and next slides,
- answers,
- teaching guidance,
- private runtime notes,
- timer controls,
- response summary,
- navigation.

Use separate tabs or windows synchronized through Lesson Run state.

## 19.4 Lesson Run

Starting Presentation Mode creates a Lesson Run with:

- exact Lesson Revision,
- actual start and finish,
- current Section and slide,
- timer state,
- completed, skipped, or replaced Activities,
- runtime notes,
- launched live sessions.

Teacher controls:

- start
- pause
- continue
- add or remove minutes
- next
- previous
- skip
- mark incomplete
- finish

## 19.5 Runtime notes

Separate:

- reusable teaching notes on Nodes,
- runtime observations on a Lesson Run.

MVP promotion actions:

- create a follow-up note,
- create a Lesson Draft adjustment,
- attach a warning to reusable material.

Do not automatically rewrite reusable content.

## 19.6 Limited connection resilience

Before starting:

- load required slides,
- load tiny local assets,
- verify external dependencies,
- warn about unavailable media.

During brief disconnection:

- already loaded slides remain navigable,
- local timers continue,
- clear connection status appears.

Reliable queued write reconciliation is deferred.

---

# 20. Live classroom sessions

## 20.1 Student mini-app

Use a responsive route in the same React application.

It supports:

- join live activity,
- answer quizzes,
- submit homework,
- view released feedback,
- manage permitted nickname and badge settings.

PWA installation may be enabled if cheap, but a native app is deferred.

## 20.2 Join paths

Per session, teacher may allow:

1. authenticated learner
2. Classroom code plus personal secret
3. guest participant

QR code opens the exact session URL.

## 20.3 Guest identity

Generate unique nickname and badge from configured word sets.

- Grade 8 demo uses animal names.
- Grade 11 demo uses astronomy names.
- Prevent duplicate nickname within the Classroom or session.
- Icon and color supplement identity but never serve as the sole identifier.
- Teacher may hide a participant from projected results.

## 20.4 MVP activity types

- single choice
- multiple choice
- true/false
- numeric answer
- accepted short text
- confidence vote
- exit ticket

Modes:

- teacher-paced
- student-paced
- optional question timer
- immediate or delayed reveal
- stable or reshuffled presentation according to policy

## 20.5 Polling

No WebSockets.

Adaptive defaults:

- active student session: every 4 to 5 seconds
- active teacher view: every 2 to 3 seconds
- slower when idle, completed, or backgrounded
- immediate request after submit or teacher advance

Use compact payloads, ETags or equivalent cache validators where useful, and separate aggregate queries from detailed answer queries.

## 20.6 Leaderboards

Default off.

Optional projected displays:

- connected count
- answered count
- answer distribution
- class success percentage
- generated nicknames

Never show incorrect identifiable answers publicly by default. Do not rank by speed unless explicitly enabled.

---

# 21. Student identity and authentication

## 21.1 Identity layers

Learner Profile:

- immutable internal learner ID
- nickname
- badge icon
- badge color

Optional Administrative Identity:

- full name
- school identifier
- official assessment label

Educational records reference only learner ID.

Administrative identity storage is disabled by default.

## 21.2 Credential policy

Teacher and Site Admin:

- username or email plus password
- secure server-side session
- mandatory first-login password change
- admin reset invalidates sessions

Student:

- Classroom code plus personal secret or password
- QR login card supported
- policy may require change at first login for older students
- teacher may reset credentials

No email service is required.

## 21.3 Password hashing

Prefer Node's built-in `crypto.scrypt` with per-user random salt, strong reviewed parameters, timing-safe verification, and optional deployment secret pepper.

This avoids native binary compatibility and supply-chain complexity while remaining a current password-hashing primitive.

Use Argon2id only if a maintained dependency passes Vercel, Docker, and supply-chain acceptance tests and clearly improves the implementation.

---

# 22. Learning Evidence and progress

## 22.1 Evidence types

- submitted answer
- automatically graded result
- intermediate reasoning
- confidence estimate
- teacher observation
- oral demonstration
- project contribution
- corrected resubmission
- self-assessment
- group activity result

## 22.2 Evidence intensity

- none
- light
- standard
- deep

Evidence may be required:

- for every learner,
- for selected learners,
- for selected questions,
- only after an incorrect answer,
- only for homework or Assessment.

## 22.3 Scaffolding

Exercise or Activity may define an ordered scaffold:

- first hint
- stronger hint
- relevant formula
- worked first step
- identify next operation
- inspect an incorrect step
- compare two approaches
- full explanation

Show one step at a time.

Record hint use as Evidence if configured. Do not reduce score unless the grading policy explicitly does so.

## 22.4 Submission lifecycle

Configurable workflow:

```text
Assigned
-> Submitted
-> Automatically checked where supported
-> Teacher reviewed
-> Returned for correction
-> Resubmitted
-> Accepted
```

Preserve attempt history:

- original response,
- feedback,
- correction,
- changes,
- grading changes,
- final state.

## 22.5 Concept State

Display sequence:

- not introduced
- introduced
- practising
- mostly secure
- secure
- needs revision

Derive it from recent Evidence using a simple explainable strategy.

Display:

- supporting Evidence,
- recency,
- direction of movement,
- uncertainty,
- teacher assertion or override.

Do not maintain a pseudo-precise canonical mastery percentage.

---

# 23. Exercise model and authoring

## 23.1 MVP Exercise types

- single choice
- multiple choice
- true/false
- numeric answer
- accepted short text
- ordered items
- manually graded explanation
- image or SVG prompt
- scaffolded Exercise

Capability modules register Exercise schemas, editors, renderers, grading handlers, and Presentation renderers.

## 23.2 Difficulty profile

Use a multidimensional profile, but keep the default editor approachable.

Possible dimensions:

- required prior knowledge
- cognitive difficulty
- expected duration
- teacher preparation
- collaboration requirement
- equipment requirement
- homework suitability
- independent-work suitability

Expose named levels and descriptions before raw numeric values.

## 23.3 Authoring depths

1. Quick create
   - title
   - type
   - current contextual Relation

2. Inline edit
   - selected common fields

3. Full editor
   - content
   - grading
   - translations
   - assets
   - Relations
   - rights
   - revision publishing

Drafts autosave. Publishing remains explicit.

## 23.4 Suggestions

MVP deterministic suggestions only:

- exact Concept name and aliases
- normalized token matching
- recent Concepts
- Concepts in current Phase
- duplicate-title warning
- near-identical normalized-text warning
- missing required grading configuration

Suggestions:

- load lazily,
- debounce changes,
- cancel stale requests,
- cap result count,
- never block editing,
- never apply automatically.

No embeddings.

## 23.5 Markdown and mathematics

Canonical content format:

- Markdown
- inline and block LaTeX
- separate asset references
- structured external links

Editor:

- use Milkdown Crepe behind a `ContentEditor` adapter if it passes acceptance fixtures,
- retain raw Markdown mode,
- render through a separate sanitized Markdown pipeline,
- use KaTeX for mathematics.

Required acceptance fixture:

- Hungarian Unicode
- inline and block LaTeX
- tables and lists
- images and external links
- autosave
- source-mode escape hatch
- lossless Markdown round trip
- preservation of unsupported source
- acceptable bundle and editing performance

Fallback:

- CodeMirror or textarea
- formatting helpers
- live preview
- KaTeX
- no custom rich-text engine

---

# 24. Mathematical capabilities

## 24.1 Rendering

Use KaTeX for standard notation:

- fractions
- powers and roots
- trigonometry
- matrices
- sums
- integrals
- polynomial expressions

Rendering and grading remain separate.

## 24.2 Numeric grading

Support:

- exact number
- tolerance
- decimal comma and decimal point where locale policy permits
- simple fractions
- accepted equivalent numeric forms
- optional unit suffix
- manual-review fallback

Grading Result includes:

- normalized submitted value
- expected value or accepted set
- awarded and maximum points
- rule used
- ambiguity or unsupported input
- manual-review recommendation

Do not implement symbolic algebraic equivalence in the MVP.

## 24.3 Exercise Family reference

Implement one deterministic Pythagorean Exercise Family:

- constrained integer triples
- reproducible random seed
- preview variants
- duplicate exclusion
- pinned exact instance
- clear insufficient-variant Result

No generic constraint solver.

## 24.4 2D plot

Use Mafs for a constrained `math.2d-plot` Resource.

Allowed schema:

- viewport
- coordinate axes
- points and labels
- lines, segments, vectors
- polynomial coefficients
- sine and cosine parameters
- optional controlled movable point
- static fallback description

Do not accept arbitrary JavaScript or arbitrary expression execution from content packages.

## 24.5 External tools

Structured link helpers:

- WolframAlpha
- YouTube
- ordinary URL

A WolframAlpha record stores purpose, label, and query expression. Generate the URL centrally.

External tools never become required for core Lesson operation.

---

# 25. Assessment model

## 25.1 Assessment Blueprint

Contains constrained slots.

Each slot may define:

- Concept or Curriculum Requirement
- difficulty range
- expected duration
- points
- allowed source kinds
- seen-state category
- accepted Exercise types
- alternative requirement
- evidence requirement

## 25.2 Familiarity categories

- repeated task
- close alternative
- transfer task
- unseen extension

Teaching Profile or Assessment Generation Profile supplies defaults. Teacher may override locally.

## 25.3 Generation

Use:

1. hard eligibility filters
2. transparent scoring
3. deterministic selection
4. explicit shortfall report

Never silently relax constraints.

Offer actions:

- add or generate Exercises
- allow more repeated tasks
- widen difficulty
- permit broader alternatives
- reduce variant count
- generate a smaller Assessment
- leave a slot empty

## 25.4 Smaller and deferred Assessments

When content is insufficient:

- preserve the original Blueprint,
- generate the strongest valid subset,
- show reduced coverage, duration, and points,
- allow one matching Exercise if that is the best valid subset,
- retain unmet slots as deferred coverage,
- later generate a second Assessment from deferred slots,
- show combined coverage across both Assessments.

Never claim the reduced Assessment satisfies the original Blueprint.

## 25.5 A/B variants

Fill the same Blueprint slots with compatible Exercises.

Variant report compares:

- Concepts
- expected difficulty
- expected duration
- point distribution
- cognitive demand
- equipment or calculator requirements
- repeated versus alternative ratio

## 25.6 Answer randomization

Store:

```text
canonical question
-> canonical answer IDs
-> learner-specific presentation order
-> submitted presentation answer
-> normalized canonical answer
```

Randomization must be deterministic and reproducible.

Retry policy separately configures:

- question set stability
- answer order stability
- parameter regeneration

## 25.7 Grading

Store separately:

Automatic evaluation:

- detected answer
- score
- rule and module version
- explanation

Teacher decision:

- accepted
- adjusted score
- accepted alternative solution
- note

Override reasons are optional normally and required for locked official Assessments if configured.

Regrading after answer-key correction must show a preview of affected submissions, points, and official grades before confirmation.

---

# 26. Assessment analysis pipeline

Implement approximately six deterministic analyzers:

1. easiest and hardest questions
2. strongest and weakest Concepts
3. high omission rate
4. unusually attractive distractor
5. learners needing follow-up
6. expected-difficulty versus observed-result mismatch

Optional seventh if cheap:

- prerequisite weakness pattern

Analyzer contract:

- immutable Assessment results input
- structured Findings output
- severity and confidence
- evidence references
- suggested actions
- no direct mutation

Possible suggested actions:

- inspect a question
- revise a Concept
- plan a recap
- mark learner for follow-up
- create differentiated homework
- lower confidence in a derived Concept State

Teacher decides whether to act.

---

# 27. Search and collection views

## 27.1 Search

MVP supports:

- title
- normalized content
- exact aliases
- Node type
- Concept
- Relations
- Curriculum and Phase context
- editorial and pedagogical states
- difficulty
- duration
- recent and frequent use

Use MongoDB indexes and bounded queries.

No Atlas Search requirement, vector search, or client-side full-collection loading.

## 27.2 Paging

Every potentially large collection uses stable server-side pagination, filtering, and sorting.

Prefer cursor paging. Offset paging is acceptable only for small stable administrative lists.

## 27.3 Tables

- Radix Themes Table for simple collections.
- TanStack Table for server-driven sorting, filtering, column state, and selection.
- Do not use TanStack Table for every list.
- Inline edit only carefully selected fields.
- Provide full editor for complex records.

---

# 28. Navigation and UX

## 28.1 Main navigation

- Today
- Planning
- Library
- Classes
- Assessments
- Insights
- Administration
- Fonat Guide

## 28.2 Today

Prioritized actions:

1. current or next Lesson
2. one-click Presentation Mode
3. unresolved Lesson diagnostics
4. submissions awaiting review
5. recent Assessment findings
6. upcoming planning gaps
7. curriculum-free quick planning

Avoid KPI-heavy dashboards.

## 28.3 Node detail pattern

Consistent structure:

- summary header
- common metadata
- type-specific content
- diagnostics
- Revision history
- incoming and outgoing Relations
- Related panel
- context-specific actions

## 28.4 In-place action progression

Preserve spatial memory when the next action is an obvious continuation.

Examples:

- Save -> Saved -> Publish
- Generate -> Review proposal -> Apply
- Import -> Review changes -> Confirm import
- Start lesson -> Continue lesson -> Finish lesson
- Submit -> Check answer -> Try again

Do not change a button into an unexpectedly destructive action. Destructive consequences still require a clear nearby preview or confirmation.

## 28.5 Recent Activity

Show the latest 30 meaningful domain events:

- Lesson published
- Revision created
- Assessment generated
- submissions graded
- package imported
- demo reset
- credential reset

Newest first, compact, timestamped, linked. Do not expose raw technical logs.

## 28.6 Notifications

Small action-oriented in-app inbox:

- next Lesson has diagnostics
- submissions await review
- import has conflicts
- Assessment findings available
- newer compatible Revision available
- planning gap discovered

Email and push are deferred.

---

# 29. Visual system and accessibility

## 29.1 Component foundation

Use Radix Themes as the primary component system.

Use Radix Primitives only when Themes lacks necessary behavior.

Do not build a custom design system.

## 29.2 Styling

Use:

```text
styles/
  tokens.css
  theme.css
  print.css
  presentation.css
  utilities.css
```

- Radix Themes handles ordinary component styling.
- Central CSS variables handle instance branding and semantic application tokens.
- CSS Modules handle genuinely custom feature layouts.
- No Tailwind or CSS-in-JS framework in the MVP.
- Avoid hardcoded color, spacing, and radius magic.
- Theme values remain easy to replace later.

## 29.3 Appearance

Support:

- light and dark mode
- compact and comfortable density
- accessible contrast
- consistent Finding and lifecycle indicators
- limited instance branding
- separate print and Presentation styles

## 29.4 Accessibility

Required:

- keyboard navigation for primary workflows
- visible focus
- semantic HTML
- color never sole signal
- image alt text
- reduced motion support
- readable projection typography
- associated form errors
- screen-reader labels
- accessible drag alternatives
- formulas labelled where practical

Modules use shared accessible components.

---

# 30. Localization

## 30.1 UI localization

Use `i18next` and `react-i18next` with feature-namespaced JSON files.

Initial locales:

- Hungarian
- English

Example:

```text
locales/
  hu/
    common.json
    planning.json
    assessment.json
  en/
    common.json
    planning.json
    assessment.json
```

Requirements:

- no user-facing business text hardcoded in application logic,
- development missing-key warnings,
- modules own namespaces,
- JSON files remain manageable and versioned.

## 30.2 Educational content translation

Separate from UI localization.

A translatable Node has:

- canonical language,
- translation variants,
- shared stable structure and Relations,
- translated prompt and explanation,
- optional language-specific answer definitions or assets where necessary.

Representative seed content must demonstrate Hungarian canonical content and English translation.

## 30.3 Post-MVP localization overrides

Deferred:

- admin search by key or rendered text,
- cached exact-key MongoDB overrides,
- placeholder validation,
- stale-override detection,
- override history.

No runtime MongoDB query per translation key.

---

# 31. Content Packages

## 31.1 Folder format

```text
package/
  package.json
  README.md
  USAGE.md
  AUTHORING.md
  AI-GENERATION.md
  nodes/
    concepts.json
    exercises.json
    lessons.json
  content/
    explanation.hu.md
    explanation.en.md
  relations.json
  assets/
  tests/
  schemas/
```

Not every package needs every folder.

## 31.2 Contract requirements

- explicit contract version
- stable package ID
- stable local keys
- declared dependencies
- supported capability requirements
- rights and provenance
- deterministic import order
- JSON Schema
- semantic validation
- documentation
- no executable content

## 31.3 Validation

Check:

- schema validity
- unique local identifiers
- valid relation endpoints
- allowed Relation Type combinations
- dependency availability
- referenced Markdown and assets
- translation structure
- published lifecycle metadata
- grading contract compatibility
- external URL scheme
- no executable files
- no unresolved dependency cycles
- deployment asset-profile compatibility

## 31.4 Import

- Parse within configured package-size bounds.
- Validate all selected packages before writes.
- Apply at complete-package granularity.
- Use a MongoDB transaction.
- Local Docker MongoDB must run as a single-node replica set to support transactions.
- If apply fails, return a typed Result and leave no partial package state.
- Create one audit event and package operation record.

Trusted deterministic seed reapplication may bypass manual review after successful validation.

## 31.5 Staging UI

Show per package:

- additions
- updates
- conflicts
- invalid records
- missing dependencies
- unsupported capabilities
- skipped assets
- expected rights restrictions

Individual files may be previewed, but only whole recognized packages may be imported.

## 31.6 Export

Support:

- selected packages
- custom educational content
- selected Annual Plans and Lessons
- safe configuration
- optional pseudonymous learning history

Exclude:

- secrets
- password hashes
- sessions
- access tokens
- database connection strings

---

# 32. Content repository and CLI

Monorepo packages:

- `@fonat-edu/content-contracts`
- `@fonat-edu/content-cli`

They must be buildable and packable without requiring npm publication.

## 32.1 Content repository template

```text
templates/content-repository/
  AGENTS.md
  README.md
  CONTENT-RIGHTS.md
  package.json
  package-lock.json
  contracts.lock.json
  content/
  examples/
  scripts/
    validate.ps1
    validate.sh
  .github/
    ISSUE_TEMPLATE/
      content-rights-concern.yml
    workflows/
      validate-content.yml
```

Setup documentation asks whether the user wants:

- local folder only,
- Git repository without remote CI,
- public GitHub repository with CI.

## 32.2 Commands

```text
npm ci
npm run validate
npm run test
npm run package
npm run contracts:check
```

PowerShell and shell wrappers call the same npm commands. They must not implement separate validation logic.

## 32.3 Content tests

Declarative fixtures may verify:

- accepted numeric forms
- deterministic Exercise Family instances
- alternative compatibility
- import smoke
- required translations
- expected invalid error codes

Static packages need validation only. Capability-sensitive content requires tests.

## 32.4 Contract upgrades

MVP:

- detect outdated contracts,
- report affected packages and incompatible fields,
- link migration documentation,
- generate machine-readable report,
- optionally export an AI upgrade task bundle.

General automated migration is deferred.

---

# 33. GitHub Content Source

Functional foundation, read-only and public.

Configuration:

- owner
- repository
- branch, tag, or commit
- optional content root
- last inspected commit
- last imported commit

Flow:

1. download one repository snapshot,
2. inspect recognized complete packages,
3. display hierarchy,
4. select packages or folders containing packages,
5. stage through the normal importer.

Do not:

- clone history,
- accept arbitrary files,
- write to GitHub,
- support private repositories,
- require OAuth,
- auto-import changes.

Manual ZIP remains the guaranteed MVP import path.

---

# 34. External AI exchange

No built-in AI integration in the MVP.

Implement one real AI Task Bundle:

**Generate missing Exercises**

Bundle includes:

- README prompt
- task instructions
- selected Concepts
- selected Curriculum Requirements
- existing Exercises
- terminology
- relevant schemas
- expected output structure
- validation command
- instruction to ask the teacher a small number of necessary questions

Returned content enters normal staging.

Document example tasks for:

- alternatives
- Curriculum package
- Lesson proposal
- translation
- wording improvement
- classroom import
- contract upgrade

Do not heuristically parse arbitrary AI Markdown.

---

# 35. Assets and deployment profiles

## 35.1 Hosted restricted profile

For Vercel and free hosted deployment:

- bundled demo SVGs and tiny static assets
- sanitized inline SVG content under strict size limits
- external image URLs
- YouTube links
- no uploaded videos
- no dynamic package-owned binary assets
- no persistent filesystem assumption
- external media visibly marked as external

A broken external Resource displays a clear placeholder.

## 35.2 Local rich profile

For local or self-hosted Docker with mounted volume:

- local filesystem Asset Provider
- package-owned images and selected larger files
- one small video example to prove support
- configurable limits
- no need for a media-heavy seed library

## 35.3 Asset record

Store:

- provider
- stable asset ID
- content hash
- mime type
- size
- alt text
- rights metadata
- source
- external availability status

Do not store general binary assets in MongoDB.

## 35.4 Capability configuration

Environment sets hard limits:

- asset provider
- maximum package size
- maximum asset size
- allowed media types
- external URLs enabled
- local persistent storage available
- rich demo enabled

Admin may lower limits but not raise them above deployment capability.

---

# 36. Exports

Complete MVP:

- compact teacher Lesson sheet
- detailed teacher Lesson guide
- student worksheet
- Assessment paper
- answer key and grading guide
- homework sheet
- curriculum coverage summary
- Annual Plan overview

Use print-ready HTML and CSS as the canonical renderer.

Browser Print and Save as PDF is the guaranteed path.

A local Docker Chromium or Playwright PDF adapter is optional foundation work. Do not require server-side PDF on Vercel.

---

# 37. Settings

Three scopes:

## 37.1 Deployment settings

Environment only:

- database URI
- secrets
- public URL
- hard asset limits
- deployment profile
- trusted proxy configuration

## 37.2 Administration settings

- enabled modules
- default School System
- authentication policy
- seed configuration
- content sources
- soft asset limits
- demo settings

## 37.3 Teacher preferences

- appearance
- density
- dashboard behavior
- default Profiles
- preferred Layouts
- planning defaults

Module settings are registered with validated schemas and explicit scope.

---

# 38. Architecture

## 38.1 Stack

- TypeScript monorepo
- npm workspaces
- React
- Vite
- Fastify
- MongoDB official driver
- Zod
- React Hook Form
- Radix Themes
- React Router
- TanStack Query where valuable
- TanStack Table for complex server-driven tables
- dnd-kit for planner interactions
- Milkdown Crepe behind an adapter
- KaTeX
- Mafs
- i18next and react-i18next
- Vitest
- Playwright
- ESLint
- Prettier

Verify current exact versions before implementation. Pin the chosen Node and npm versions through repository configuration. npm remains the package manager.

## 38.2 Monorepo layout

```text
apps/
  web/
  server/

packages/
  domain/
  application/
  contracts/
  graph/
  persistence-mongodb/
  content-contracts/
  content-cli/
  ui/
  testing/
  modules/
    core-exercises/
    mathematics/
    math-2d-plot/

deployment/
  docker/
  vercel/
  render/

seeds/
  school-systems/
  subjects/
  curricula/
  concepts/
  resources/
  profiles/
  blueprints/
  layouts/
  workspaces/

templates/
  content-repository/

docs/
  ARCHITECTURE.md
  DOMAIN-MODEL.md
  EXTENSIONS-AND-CONTRACTS.md
  CONTENT-AUTHORING.md
  DEPLOYMENT-AND-OPERATIONS.md
  IMPLEMENTATION-DEVIATIONS.md
  adr/
```

Feature-slice folders may live within packages and apps. Avoid global `controllers`, `services`, and `components` dumping grounds.

## 38.3 Dependency direction

```text
domain
<- application
<- infrastructure and delivery adapters
<- composition roots
```

- Domain imports no React, Fastify, MongoDB, Vercel, or Render code.
- Application depends on ports.
- Infrastructure implements ports.
- Routes remain thin.
- UI uses typed API contracts.
- Modules depend on public contracts, not other modules' internals.

Enforce with ESLint boundary rules or a small dependency check.

## 38.4 Modular monolith

Capability Module manifest may register:

- Node schemas
- Relation Types
- editors
- renderers
- grading handlers
- validators
- analyzers
- Presentation renderers
- settings
- seed packages
- localization namespaces

Use convention-based module folders and a build-generated registry.

No runtime executable module installation.

## 38.5 Result pattern

Expected application outcomes use typed Results:

- Success
- PartialSuccess
- ValidationFailure
- Conflict
- UnsupportedCapability
- PermissionDenied
- DependencyUnavailable
- NotFound

Exceptions are reserved for programming defects and unexpected infrastructure failures.

At delivery boundaries:

- catch unexpected exceptions,
- log with correlation ID,
- convert to safe typed failure,
- do not expose stack traces.

---

# 39. API

Use conventional REST with OpenAPI generated from the same runtime schemas.

Requirements:

- explicit request and response schemas
- typed Result envelopes
- stable error codes
- cursor paging
- standardized filtering and sorting
- documented authorization
- thin route handlers
- generated or shared typed client

Do not use GraphQL or direct browser database access.

---

# 40. Server and client state

Use TanStack Query selectively for:

- server-owned data
- paging
- mutations
- lazy suggestions
- live-session polling
- invalidation

Do not:

- wrap every query in a custom architecture,
- prefetch large areas,
- duplicate query data in a global store,
- add Redux or Zustand without a concrete need.

Use ordinary React state, reducers, and URL parameters for local UI.

---

# 41. Deployment

## 41.1 Runtime adapters

One Fastify application factory.

Adapters:

- local persistent Node listener
- Docker listener
- Vercel serverless handler

No business logic in adapters.

## 41.2 Vercel

Primary hosted MVP profile:

- web static build
- one captured Fastify Function
- MongoDB Atlas
- restricted assets
- no Vercel cron dependency
- GitHub Actions for scheduled maintenance if needed
- reuse MongoDB client and connection pool

## 41.3 Docker

Authoritative runnable acceptance environment:

- web
- server
- single-node MongoDB replica set
- mounted local asset directory
- idempotent index setup
- seed and reset commands

## 41.4 Render

Use the same Docker image.

Document free-tier sleep and ephemeral filesystem constraints. A persistent disk or external asset provider is required for rich media on hosted Render.

## 41.5 No generic job framework

MVP operations are synchronous and bounded.

- package size limits
- explicit timeout-safe algorithms
- actionable failure if operation is too large
- GitHub Actions for scheduled maintenance

Persistent resumable jobs remain deferred.

---

# 42. Performance and indexes

Architectural target:

- 100,000 educational Nodes
- 500,000 Relations
- 10,000 Exercises
- 2,000 Lessons
- 500 Assessments
- 100 historical learners
- 100,000 Learning Evidence records

The free Atlas demo is not expected to physically reach this scale.

Requirements:

- no full collection loads
- bounded graph traversal
- stable paging
- indexed filters and sorts
- aggregation under Atlas Free memory limits
- no reliance on `allowDiskUse`
- compact polling payloads

Index examples:

- Node stable identity unique index
- Node type, lifecycle, updatedAt
- Node normalized title search support
- Relation source
- Relation target
- Relation type plus source or target
- Revision Node ID plus revision number unique
- Lesson schedule by Classroom and date
- Enrollment Classroom and school year
- Submission Assessment Instance and learner
- Learning Evidence learner, Concept, observedAt
- Session expiration TTL
- guest claim expiration TTL where applicable

Create indexes idempotently.

## 42.1 Archiving

MVP implements portable manual export and archival metadata only.

Post-MVP:

- suggest historical runtime candidates,
- export verified archive package,
- remove live detail,
- retain configured summaries,
- restore into staging.

Reusable Concepts, Exercises, Resources, and published Lessons are not automatic archival candidates.

---

# 43. Security

Minimum baseline:

- secure password hashing
- HTTP-only secure cookies
- SameSite policy
- CSRF protection for state-changing browser requests
- server-side authorization for every protected operation
- rate limits on authentication and student submission endpoints
- input validation
- sanitized Markdown
- sanitized inline SVG
- safe external URL schemes
- no executable package content
- secrets through environment variables only
- session invalidation after reset
- audit records for grading, publication, imports, credentials, and destructive actions
- no student answers in ordinary technical logs
- security failures fail closed

Capability Modules are trusted deployment code. Content Packages are untrusted data.

---

# 44. Licensing and stewardship

## 44.1 Application code

Use the exact unmodified PolyForm Noncommercial License 1.0.0 for:

- application source
- executable modules
- CLIs
- software schemas where applicable

Describe Fonat as source-available, not open source.

## 44.2 Project-owned educational content and prose

Use CC BY-NC-SA 4.0 for:

- project-authored seed content
- project-authored educational material
- prose documentation where clearly marked

Do not apply Creative Commons as the primary software-code licence.

## 44.3 Imported content

Retains its own rights metadata. A source citation does not establish redistribution permission.

## 44.4 Brand

Product name and logo remain all rights reserved under a separate brand notice.

## 44.5 Project Stewardship Request

Include a nonbinding README notice:

> Fonat is source-available under the PolyForm Noncommercial License 1.0.0.
>
> Teachers, students, schools, researchers, and educational communities are encouraged to use, study, modify, and contribute to Fonat within the permissions of that licence.
>
> If you represent a public authority, national or regional education system, commercial vendor, platform operator, or other large institution and plan to integrate, redistribute, white-label, or deploy Fonat at institutional scale, please contact the project maintainer before proceeding.
>
> This is a request for coordination, recognition, and responsible stewardship. It does not modify or restrict the legal permissions granted by the accompanying licence.

Use a contact placeholder until the maintainer supplies the final address.

## 44.6 External content notice

Public content repositories include `CONTENT-RIGHTS.md` and a GitHub issue template.

The notice should state that the maintainers do not intend to misrepresent ownership or redistribute protected material without permission, invite credible rights concerns, and explain that affected material may be removed, restricted, replaced, or corrected.

Do not imply that this notice overrides applicable law or item-level licences.

---

# 45. Supply-chain policy

- npm only
- committed `package-lock.json`
- `npm ci` in CI and deployment
- pinned Node version
- approved registry only
- installation scripts disabled by default where practical
- required script exceptions documented
- dependency additions reviewed for maintenance, licence, transitive impact, and bundle impact
- architecture-shaping dependencies recorded in ADRs
- vulnerability and licence checks
- secret scanning
- lockfile integrity
- isolated dependency update pull requests
- no automatic major upgrades
- SBOM for releases
- no unattended dependency update deployment
- critical relevant unresolved vulnerabilities block release

Prefer mature dependencies over custom implementation, but do not add adapters around every trivial library.

---

# 46. Testing

## 46.1 Strategy

Workflow-first integration tests plus focused unit tests.

Unit tests:

- scoring
- validation
- coverage aggregation
- Revision classification
- grading
- package validation
- permission checks
- analyzers

Integration tests:

- graph and Relations
- repositories
- authentication
- Lesson planning
- Presentation state
- live sessions
- submissions
- Assessment generation
- package import and export

Browser tests:

- complete golden journeys only

## 46.2 Required browser journeys

1. bootstrap admin and load demo
2. prepare and publish a Lesson
3. start Presentation Mode and launch a live quiz
4. join and answer as a student
5. generate, complete, grade, and analyze an Assessment
6. import and export a Content Package
7. publish an Exercise Revision and inspect affected Lesson
8. reset demo workspace

## 46.3 Test data

Use:

1. tiny unit fixtures
2. feature-slice integration fixtures
3. module conformance fixtures
4. Grade 8 reference workspace
5. Grade 11 editing workspace

Do not use the full demo for every test.

## 46.4 Change-aware CI

One main pull-request workflow:

1. detect changed areas
2. run common static checks
3. build applications once
4. upload reusable artifacts
5. run affected unit and integration slices
6. run relevant deployment smoke tests

Feature slices:

- content and graph
- Lesson planning
- Presentation Mode
- Assessment and grading
- Learning Evidence
- classrooms and identity
- live activities
- packages and GitHub source
- administration and deployment

Core contract changes expand transitively.

Static validation and at least one build always run.

Full suite:

- primary branch after merge
- release candidates
- significant lockfile changes
- core contract changes
- manual request

## 46.5 Required commands

```text
npm install
npm run dev
npm run validate
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run demo:reset
npm run package:validate
```

Use root scripts that delegate to workspaces.

---

# 47. Repository documentation

Required:

- root `AGENTS.md`
- local `AGENTS.md` in major feature or module folders where local guidance adds value
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN-MODEL.md`
- `docs/EXTENSIONS-AND-CONTRACTS.md`
- `docs/CONTENT-AUTHORING.md`
- `docs/DEPLOYMENT-AND-OPERATIONS.md`
- `docs/IMPLEMENTATION-DEVIATIONS.md`
- focused ADRs

Root `AGENTS.md` explains:

- product goals
- non-negotiable principles
- commands
- architecture direction
- documentation map
- rule to inspect parent and nearest nested guidance before changing a path

Nested files:

- explain local concepts
- list common change paths
- state local tests and pitfalls
- do not duplicate global rules

No generated AGENTS index or CI hierarchy validator in the MVP.

Create ADRs only for meaningful forks:

- persistence
- authentication
- module loading
- editor
- PDF strategy
- assets
- deployment
- Revision semantics
- package compatibility

---

# 48. Grade 8 detailed reference workspace

## 48.1 Identity

- School system: Hungary
- Subject: Mathematics
- Grade: 8
- Phase: Right triangles and the Pythagorean theorem
- Classroom size: 5 pseudonymous learners
- Canonical language: Hungarian
- Representative English translations
- Style: approachable and moderately playful

Learners:

1. `learner.red-panda` - Vörös Panda
   - advanced
   - fast numeric work
   - sometimes omits explanation

2. `learner.otter` - Vidra
   - broadly on level
   - strong collaborative participation

3. `learner.lynx` - Hiúz
   - broadly on level
   - inconsistent confidence

4. `learner.hedgehog` - Sün
   - needs scaffolding
   - benefits from visual and step-by-step support

5. `learner.fox` - Róka
   - inconsistent participation
   - capable when engaged

Each has a unique badge icon and color. Do not rely on color alone.

## 48.2 Concepts

At least these 24 Concepts:

1. natural-number square
2. exponent with exponent two
3. square root
4. approximate square root
5. length and units
6. unit conversion
7. triangle
8. right angle
9. right triangle
10. leg of a right triangle
11. hypotenuse
12. square area
13. Pythagorean theorem
14. identify the hypotenuse
15. calculate a missing hypotenuse
16. calculate a missing leg
17. validate triangle side lengths
18. converse of the Pythagorean theorem
19. estimation and plausibility check
20. mathematical modelling from text
21. rectangle diagonal
22. coordinate plane
23. distance between two points
24. visual area interpretation of the theorem

Relations must include prerequisites, extensions, and cross-links.

Examples:

- square root requires natural-number square
- Pythagorean theorem requires right triangle, square area, and exponent two
- missing leg requires Pythagorean theorem and square root
- distance between two points extends Pythagorean theorem and coordinate plane
- rectangle diagonal applies Pythagorean theorem

## 48.3 Resources

1. `resource.right-triangle-vocabulary`
   - Hungarian Markdown explanation
   - representative English translation
   - labelled tiny bundled SVG
   - leg and hypotenuse terminology

2. `resource.pythagorean-visual-proof`
   - area-based explanation
   - tiny bundled SVG with squares on triangle sides
   - alt text
   - no external dependency

3. `resource.missing-hypotenuse-worked-example`
   - worked example
   - step-by-step scaffold
   - KaTeX formulas

4. `resource.missing-leg-worked-example`
   - worked example
   - common sign and subtraction mistake warning

5. `resource.coordinate-distance-bridge`
   - connects coordinate differences to a right triangle
   - tiny SVG
   - optional Mafs representation

6. `resource.wolfram-pythagorean-exploration`
   - structured WolframAlpha link
   - clearly marked external

Optional local-rich Resource:

7. `resource.local-video-demo`
   - one short small video proving local Asset Provider support
   - not required by core demo acceptance

## 48.4 Authored Exercises

Each Exercise must include real Hungarian prompt, expected answer or grading guidance, duration, difficulty profile, Concepts, purpose, rights, and evidence policy where relevant.

1. `exercise.identify-hypotenuse-01`
   - single choice
   - choose hypotenuse from labelled triangle
   - 2 minutes
   - introductory

2. `exercise.identify-hypotenuse-02`
   - image-based single choice
   - rotated triangle
   - close alternative to 01

3. `exercise.square-values-recap`
   - accepted short text or ordered matching
   - connect 3, 4, 5, 6 to squares
   - 4 minutes

4. `exercise.square-root-recap`
   - numeric multi-item
   - simple perfect squares
   - 4 minutes

5. `exercise.discover-3-4-5`
   - manually guided explanation
   - compare square areas for a 3-4-5 triangle
   - 8 minutes
   - light evidence

6. `exercise.theorem-true-false`
   - true or false statements about right triangles
   - 4 minutes

7. `exercise.missing-hypotenuse-6-8`
   - numeric answer
   - 6 and 8 legs
   - exact result 10
   - 5 minutes
   - scaffold available

8. `exercise.missing-hypotenuse-decimal`
   - numeric tolerance
   - non-integer result
   - plausibility check required
   - 6 minutes

9. `exercise.missing-leg-13-5`
   - numeric answer
   - hypotenuse 13 and leg 5
   - result 12
   - 6 minutes
   - scaffold available

10. `exercise.missing-leg-common-mistake`
    - inspect deliberately incorrect solution
    - identify the first invalid step
    - 6 minutes
    - standard evidence

11. `exercise.rectangle-diagonal`
    - word problem
    - rectangle dimensions
    - 7 minutes

12. `exercise.ladder-wall`
    - practical word problem
    - determine height
    - 8 minutes
    - unit handling

13. `exercise.is-right-triangle`
    - multi-select
    - select side triples that form right triangles
    - 7 minutes

14. `exercise.converse-explanation`
    - manually graded explanation
    - explain why a selected triple represents a right triangle
    - 8 minutes
    - deep evidence

15. `exercise.coordinate-distance-01`
    - numeric
    - two points with integer distance
    - 7 minutes

16. `exercise.coordinate-distance-02`
    - numeric tolerance
    - non-integer distance
    - 8 minutes

17. `exercise.choose-method`
    - single choice plus light explanation
    - decide whether missing hypotenuse, missing leg, or theorem not applicable
    - 6 minutes

18. `exercise.exit-ticket`
    - one numeric item
    - one confidence vote
    - one short reflection
    - 4 minutes

## 48.5 Exercise Family and generated instances

`family.pythagorean-integer-triples`

Allowed triples include selected primitive and scaled triples, for example:

- 3, 4, 5
- 5, 12, 13
- 6, 8, 10
- 8, 15, 17
- 9, 12, 15
- 7, 24, 25

Generated forms:

- missing hypotenuse
- missing first leg
- missing second leg
- short practical context

Require reproducible seed and duplicate exclusion.

Seed at least six pinned generated instances used as alternatives or Assessment variants.

## 48.6 Teaching Profiles

### Balanced standard class

- moderate explanation and activity
- moderate repetition
- short evidence checks
- mixed participation
- ordinary homework
- warnings for major difficulty mismatch

### Small advanced group

- reduced repetition
- more transfer tasks
- faster pacing
- independent work
- deeper explanations on selected tasks
- broader alternative allowance

### Support-focused class

- prerequisite recap
- smaller steps
- guided examples
- frequent low-stakes checks
- fewer simultaneous demands
- scaffold-first feedback

## 48.7 Lesson Blueprints

### Standard 45-minute introduction

- 5 min preparation and recap
- 8 min problem introduction
- 12 min guided discovery
- 10 min formalization
- 7 min practice
- 3 min closure

### Standard 45-minute practice and consolidation

- 5 min recap
- 8 min worked example
- 20 min differentiated practice
- 7 min interactive check
- 5 min closure and homework

### Short 20-minute recap or formative check

- 3 min retrieval
- 10 min quiz or selected Exercises
- 5 min correction
- 2 min exit ticket

## 48.8 Lesson Layouts

### Compact one-page teacher sheet

- Lesson objective
- section timeline
- key prompts
- required Resources
- expected answers
- tiny note area

### Detailed teacher guide

- full Section instructions
- differentiation
- answers
- misconceptions
- Presentation slide outline
- follow-up notes

## 48.9 Phase plan

Twelve planned positions:

1. prerequisite revision
2. discovering the relationship
3. formal theorem and notation
4. missing hypotenuse
5. missing leg
6. practical word problems
7. coordinate geometry connection
8. differentiated practice
9. formative Assessment
10. correction and targeted recap
11. phase-closing Assessment
12. follow-up from findings

At least Lessons 2, 3, 4, 9, and 11 must be fully authored. At least Lessons 4 and 9 must have completed Lesson Runs.

## 48.10 Detailed Lesson examples

### Lesson 2: Discovering the relationship

- Blueprint: Introduction
- Resource: right-triangle vocabulary
- Activity: identify hypotenuse
- Activity: discover 3-4-5
- Resource: visual proof
- Activity: short class discussion
- Closure: confidence vote
- Planned 45 minutes

### Lesson 3: Formal theorem and notation

- recap vocabulary
- formal KaTeX theorem statement
- worked example
- true or false check
- student explanation prompt
- homework assignment

### Lesson 4: Missing hypotenuse

- completed Lesson Run
- standard worked example
- generated integer-triple practice
- scaffolded decimal task
- live exit ticket
- one runtime note about an Activity running long

### Lesson 9: Formative Assessment

- completed Lesson Run
- phone-based quiz
- five learners with real results
- unusually attractive distractor
- one weak prerequisite Finding
- one learner follow-up Finding

### Lesson 11: Phase-closing Assessment

- A/B variants
- printed and online render
- manual grading override example
- deferred coverage example linked to later smaller Assessment

## 48.11 Homework

1. hypotenuse practice with light evidence
2. missing-leg correction cycle
3. practical home measurement task with photo optional only in local profile and written alternative always available

## 48.12 Formative quizzes

1. vocabulary and theorem recognition
2. mixed missing-side calculation and confidence vote

## 48.13 Assessment Blueprint

Slots:

1. identify right-triangle elements, 2 points
2. missing hypotenuse, 3 points
3. missing leg, 3 points
4. practical word problem, 4 points
5. right-triangle validation, 3 points
6. short reasoning item, 5 points

Generate A/B variants.

Reduced Assessment example fills only slots 1, 2, and 3 and retains 4, 5, and 6 as deferred coverage.

## 48.14 Seeded result patterns

Create realistic results that deterministically yield:

- easiest question
- hardest question
- high omission on reasoning item
- attractive distractor on missing-leg error
- weak square-root prerequisite
- Vörös Panda correct but missing explanation
- Sün improves after scaffold and correction
- Róka has inconsistent participation
- Hiúz has low confidence despite correct answers
- Vidra performs steadily

## 48.15 Deliberate demo diagnostics

Include and document:

- one 55-minute Lesson in a 45-minute slot
- one content-equivalent newer Revision
- one planning-impacting newer Revision
- one missing prerequisite
- one unavailable external Resource
- one ambiguous Draft Exercise
- one Assessment Blueprint with insufficient alternatives
- one reduced Assessment with deferred coverage
- one attractive distractor
- one weak Concept result
- one inconsistent learner evidence pattern
- one parallel-class Lesson variant improvement
- one intentionally omitted Curriculum Requirement with teacher justification

These are expected demo states, not accidental defects.

---

# 49. Grade 11 editing workspace

## 49.1 Identity

- Hungary
- Grade 11 Mathematics
- Phase: Classical probability
- 8 pseudonymous learners
- restrained visual treatment
- intentionally incomplete

Learners:

- Vega
- Orion
- Lyra
- Kepler
- Nova
- Atlas
- Cygnus
- Andromeda

## 49.2 Concepts

At least:

1. random experiment
2. outcome
3. sample space
4. event
5. favorable outcomes
6. classical probability
7. complementary event
8. mutually exclusive events
9. addition rule
10. repeated experiment
11. tree diagram
12. independence as upcoming
13. combinatorics as prerequisite connection

## 49.3 Content

- 6 to 8 real Exercises
- 2 Resources
- one partially complete Teaching Profile adaptation
- one Blueprint reuse
- two partially authored Lessons
- visible missing coverage
- one polynomial Mafs graph and one trigonometric Mafs graph as capability demonstrations in the mathematics library, not falsely presented as probability material
- a probability-specific simple tree diagram may remain SVG or Markdown

The workspace exists to demonstrate editing, gap discovery, and different tone, not to match Grade 8 depth.

---

# 50. Demo workspace behavior

First run offers:

- Start blank
- Load demonstration workspace

Demo must be isolated and visibly labelled.

One-click reset restores original seeded state without affecting real content.

Seed packages may contain Draft and Published states.

During MVP and alpha development, dropping and reseeding the database is normal. Seeds are part of the evolving source of truth until persistent migration guarantees are introduced.

---

# 51. Acceptance journeys

The repository must document and support:

1. Open Today and prepare the next Lesson.
2. Replace one boring Activity with a ranked alternative.
3. Compare the updated Lesson with the original.
4. Publish an Exercise Revision and inspect affected Lessons.
5. Generate an A/B Assessment from completed Phase content.
6. Generate a reduced Assessment and retain deferred coverage.
7. Complete a quiz as a pseudonymous learner.
8. Review automatic grading and adjust one result.
9. Inspect deterministic Assessment findings.
10. Record minimal post-Lesson reflection.
11. Generate a follow-up Lesson from weak Concepts.
12. Print a compact teacher sheet and student Assessment.
13. Export an AI Task Bundle for missing Exercises.
14. Import a reviewed generated package.
15. Reset the demo workspace.
16. Inspect the incomplete Grade 11 workspace and fill one missing Lesson slot.
17. Start a curriculum-free Lesson from one Concept.

Automate the eight golden browser journeys defined in the testing section. Keep the full list as human verification.

---

# 52. Complete MVP, foundation, deferred

## 52.1 Complete MVP

- bootstrap and authentication
- roles and capability authorization
- graph Nodes and Relations
- content authoring
- Hungarian School System
- Grade 8 and Grade 11 Curriculum packages
- Annual Plans and Phases
- Teaching Profiles, Lesson Blueprints, Lesson Layouts
- Lesson planning and recommendation
- validation Findings
- Revisions and impact indicators
- Presentation Mode
- phone-based live quiz
- pseudonymous learners
- submissions, correction, and Learning Evidence
- numeric and basic deterministic grading
- Assessment generation
- A/B variants
- smaller Assessments and deferred coverage
- deterministic Assessment analysis
- Concept State overview
- package ZIP import and export
- print-ready HTML
- Fonat Guide
- demo workspaces
- Docker, Vercel adapter, Render Docker compatibility
- required tests and documentation

## 52.2 Functional foundation

- Capability Module registry
- mathematics module
- 2D plot capability
- one Exercise Family
- public GitHub Content Source
- content CLI and repository template
- one AI Task Bundle
- local filesystem rich-media profile
- guest-result claiming
- optional local server-side PDF
- archiving metadata
- multilingual educational-content example

## 52.3 Deferred

- built-in AI
- embeddings and vector search
- full Lesson optimizer
- barycentric or route optimization
- symbolic algebra grading
- arbitrary expression execution
- dynamic geometry editor
- collaborative canvas
- full multiplayer games
- WebSockets
- native apps
- full offline sync
- cloud file uploads and object storage
- private GitHub repositories
- GitHub App or OAuth
- automatic contract migration
- generic checkpoint restoration
- automatic archival deletion and restore
- school-wide timetable optimization
- institutional administration
- multitenancy
- visual graph canvas
- runtime executable module installation
- admin localization overrides
- automatic content promotion
- mutable mastery engine
- event sourcing
- persistent job framework
- multiple databases
- SQLite
- Vercel server-side PDF
- automatic Lesson rewriting
- automatic Git imports
- automatic Revision propagation
- internal contributor issue tracker

---

# 53. Implementation order

Build thin vertical slices.

1. repository foundation, npm workspaces, tooling, Docker Mongo replica set
2. Result contracts, schemas, API shell, authentication
3. generic Nodes, Revisions, Relations, Related panel
4. content package validation, seeds, demo reset
5. Concepts, Resources, Exercises, Markdown and math rendering
6. Classrooms, learners, enrollment, pseudonymous access
7. Curricula, Phases, Annual Plans, calendar basics
8. Teaching Profiles, Blueprints, Layouts
9. Lesson planning, recommendation, validation
10. Presentation Mode and Lesson Runs
11. live quiz and student route
12. submissions, grading, scaffolds, correction, Evidence
13. Assessment generation, A/B variants, reduced coverage
14. analyzer pipeline and learner overview
15. print exports, package export, AI Task Bundle
16. GitHub Content Source foundation
17. Grade 11 editing demo
18. administration, help, activity, notifications
19. security hardening, supply-chain checks, accessibility
20. deployment smoke tests, documentation, final acceptance

Every slice must leave the application demonstrably usable and include tests.

---

# 54. Scope reduction rule

If implementation difficulty appears, preserve the end-to-end workflow and simplify sophistication.

Examples:

- fewer analyzers instead of no analysis
- fewer Exercise types instead of broken module contracts
- browser print instead of no export
- simple scoring instead of no recommendation explanation
- public GitHub snapshots instead of full Git integration
- polling instead of removing live sessions
- one strong Profile and Blueprint path before extra variations
- raw Markdown fallback instead of a custom editor
- external URLs instead of cloud media storage

Record every reduction in `docs/IMPLEMENTATION-DEVIATIONS.md`.

Do not fill gaps with fake analytics, inert buttons, or misleading placeholders.

---

# 55. Completion definition

The agent may claim completion only when:

- `npm ci` succeeds
- formatting succeeds
- linting succeeds
- TypeScript compilation succeeds
- unit tests succeed
- integration tests succeed
- required browser journeys succeed
- web production build succeeds
- server production build succeeds
- Docker Compose starts Fonat
- MongoDB replica set initializes
- indexes create idempotently
- Grade 8 demo loads
- Grade 11 demo loads
- Lesson planning works
- Presentation Mode works
- live quiz works
- Assessment generation and analysis work
- package export and reimport work
- demo reset works
- Vercel adapter build or smoke test succeeds
- Render-compatible image builds
- no normal workflow button is inert
- unsupported capabilities return explicit Results
- deviations are documented honestly

Hosted deployment failure caused only by missing user credentials is not a repository failure. Failure to build the adapter is.

---

# 56. Validated technical baseline

Verified on 2026-07-13. Revalidate version-sensitive details before implementation.

## 56.1 Vercel

Current official documentation states:

- Fluid Compute Hobby Functions have a 300-second default and maximum duration.
- Function request and response bodies are limited to 4.5 MB.
- Standard Function bundles have size limits.
- Hobby is limited to 12 Vercel Functions per deployment for the relevant runtime approach.
- Legacy projects without Fluid Compute may retain older duration limits.

Design consequence:

- one Fastify entry point,
- small packages,
- no dynamic binary assets,
- bounded operations,
- no dependence on cron,
- Docker remains authoritative.

Sources:

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/functions/runtimes
- https://vercel.com/docs/limits

## 56.2 Fastify

Fastify's official serverless guide documents running an existing Fastify application on Vercel through an adapter and recommends keeping the local application conventional.

Source:

- https://fastify.io/docs/latest/Guides/Serverless/

## 56.3 MongoDB Atlas Free

Current official documentation states:

- 0.5 GB storage including indexes,
- 500 connection maximum,
- 500 collections maximum,
- 100 operations per second limit,
- 32 MB in-memory sort limit,
- `allowDiskUse` ignored,
- no configured backups,
- idle free clusters may pause.

Design consequence:

- deliberate indexes,
- minimal collections,
- bounded aggregation,
- external or local assets,
- portable export,
- no claim that free deployment reaches architectural scale.

Source:

- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/

## 56.4 Selected UI and educational libraries

- Radix Themes provides pre-styled React components and theme configuration with vanilla CSS.
- Milkdown Crepe provides a Markdown editor with inline and block math support through KaTeX.
- Mafs provides declarative React components for interactive 2D mathematics.

Sources:

- https://www.radix-ui.com/themes/docs/overview/getting-started
- https://www.radix-ui.com/themes/docs/overview/styling
- https://milkdown.dev/docs/guide/using-crepe
- https://mafs.dev/
- https://katex.org/

## 56.5 Licensing

- PolyForm Noncommercial 1.0.0 permits noncommercial use and explicitly permits educational and government-institution use.
- Creative Commons recommends against using CC licences as the primary software licence.
- CC BY-NC-SA 4.0 is appropriate for project-owned educational and prose content where the project owns the rights.

Sources:

- https://polyformproject.org/licenses/noncommercial/1.0.0
- https://creativecommons.org/faq/
- https://creativecommons.org/licenses/by-nc-sa/4.0/

## 56.6 GitHub public source

Unauthenticated GitHub REST usage is rate limited. Design the integration around one repository snapshot, caching, and manual refresh rather than file-by-file repeated API access.

Source:

- https://docs.github.com/rest/using-the-rest-api/rate-limits-for-the-rest-api

---

# 57. Pass 3 consolidation revisions

The consolidation made these final changes or clarifications compared with the earlier Q&A.

1. **Graph storage was narrowed.**  
   Lesson Sections and Activities are embedded stable-ID components of a Lesson Revision rather than global Nodes. High-volume and privacy-sensitive entities use specialized collections. The conceptual graph remains intact through Entity References and Relations.

2. **The official MongoDB driver was selected by default.**  
   Zod remains the contract system. Mongoose is not added unless a concrete spike proves a net reduction in complexity.

3. **Password hashing was simplified.**  
   Node's built-in `scrypt` is the default to avoid native dependency and deployment risk. Argon2id remains an allowed researched alternative, not a requirement.

4. **Package atomicity was made concrete.**  
   Imports apply at complete-package granularity inside MongoDB transactions. Local Docker therefore runs a single-node replica set.

5. **Hosted assets were clarified.**  
   Vercel does not accept dynamic package-owned binary assets in the MVP. Hosted packages use Markdown, JSON, external URLs, and strictly sanitized inline SVG. Bundled demo assets ship with the application. Local Docker proves file assets.

6. **No generic checkpoint system remains.**  
   Safety comes from immutable published Revisions, package staging, transactions, audit, export, seed reapplication, and deterministic demo reset.

7. **Presentation offline behavior was explicitly limited.**  
   Loaded slides and timers continue. General offline write reconciliation remains deferred.

8. **Student progress was kept descriptive.**  
   Concept State derives from evidence and teacher assertions. It is not a continuously mutated mastery score.

9. **The Grade 8 dataset was fully enumerated.**  
   The final seed target is 18 authored Exercises plus generated and close alternatives, not an arbitrary larger count.

10. **The Grade 11 dataset was kept intentionally incomplete.**  
    It validates editing and gap discovery without doubling the main seed-authoring project.

11. **Flow was removed from branding.**  
    It remains a design principle expressed through low-friction behavior.

12. **Brand usage was separated.**  
    `Szálról szálra.` is the primary motto. `Az oktatás minden szála egy helyen.` is reserved for a separate About or README context.

13. **The final specification avoids extra infrastructure for principles.**  
    Principles become acceptance checks and behavior requirements, not a new engine or CI system.

---

# 58. Final instruction to the implementation agent

Implement Fonat as one coherent product, not as a set of disconnected CRUD pages.

Prioritize the golden path:

```text
connected material
-> annual or quick planning
-> transparent Lesson assembly
-> Presentation and participation
-> answers and reasoning
-> Assessment and findings
-> follow-up planning
```

Use the Grade 8 workspace as both pedagogical reference content and an executable acceptance fixture.

Keep extension points real but narrow.

Do not overbuild deferred systems.

Do not hide failures.

Do not invent custom infrastructure where a mature dependency or simpler native feature is sufficient.

Do not declare completion until the repository runs, the golden workflows pass, and every deviation is documented.
