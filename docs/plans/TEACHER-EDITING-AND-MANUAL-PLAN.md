# Teacher editing and manual plan

Status: implemented MVP baseline on 2026-07-16; remaining depth is tracked in `IMPLEMENTATION-DEVIATIONS.md`
Primary audience: product and engineering  
Scope: the first useful teacher journey and the editing surfaces required to repeat it safely

## Implementation record

The plan was delivered in focused vertical slices: rich-content hydration safety; onboarding and authoring; lesson and annual-plan editing; assignment and assessment workflows; the file-backed Markdown manual; and reusable unsaved-change protection for the core teacher editors. The current implementation covers the first teacher flow with named selectors and guided controls while preserving immutable submissions/deliveries and the existing logout, live-answer, and presentation-exit behavior.

The evidence table below records the state at planning time. The implemented result and honest residual gaps are maintained in `IMPLEMENTATION-DEVIATIONS.md`; the generated API reference is `docs/openapi.json`, and manual authoring rules are in `docs/CONTENT-AUTHORING.md`.

## 1. Outcome

Turn the current runnable demonstration into a teacher-usable MVP in which a new teacher can:

1. understand Fonat's vocabulary and mental model;
2. configure a real course, group, learners, and teaching location without demo identifiers;
3. author and revise learning materials and all six supported exercise types;
4. assemble, preview, publish, present, leave, and resume a lesson;
5. create a real assignment, review attempts, return work, and accept a correction;
6. create an assessment blueprint, choose recipients, generate stable variants, grade them, and understand the resulting findings;
7. find contextual, Markdown-authored guidance for every teacher-facing concept and workflow.

The plan preserves the already-working navigation, logout, presentation escape, live-answer acknowledgement, and immutable submission and assessment delivery snapshots.

## 2. Evidence and current-state assessment

This plan is based on the current React routes, Fastify collection routes, contracts, demo state, existing tests, Version 4 requirements, and a browser walkthrough of the teacher UI.

| Teacher need              | Current useful foundation                                                                           | Blocking gap                                                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Get oriented              | Login, stable shell, Today page, three-card Guide                                                   | No onboarding journey, checklist, contextual help, searchable manual, or sufficient terminology; the Guide mixes Hungarian UI with English naming and is hardcoded in the API.                                                                              |
| Configure classes         | Generic create-by-title lists exist for courses, groups, learners, and locations                    | Those routes are absent from primary navigation, rows do not open, and teachers cannot edit rosters, subject, location, recurrence, or most fields.                                                                                                         |
| Find and revise materials | Library search, Node detail rendering, Markdown renderer, relation selectors                        | Library rows are not links, creation only records a title and fixed `concept` type, Node detail exposes raw JSON, and no material editor exists.                                                                                                            |
| Author exercises          | A bespoke editor supports six exercise types, Crepe fields, preview, create, and patch              | No exercise library/list path; existing editor hydration is unsafe; concepts are discarded on save; choice correctness uses letter input; validation, rubric, evidence policy, archive, revision impact, and explicit draft/publish actions are incomplete. |
| Build a lesson            | Course selection, slide insertion, drag/drop, move, remove, save, publish status, presentation link | Existing slide content cannot be edited. New task/quiz slides silently use the first exercise. Several supported presentation slide types cannot be added. No duration, location, reusable-material picker, preview, or reliable diagnostics.               |
| Plan the year             | Annual-plan collection and phase fixtures exist                                                     | Only title creation is exposed; no plan detail, phase editor, calendar, ordering, coverage, or lesson projection.                                                                                                                                           |
| Assign practice           | Immutable attempts and return/resubmit/accept server workflow works                                 | Teacher creation uses fixed demo course, exercise, learners, deadline, and feedback. Review displays IDs and raw JSON and cannot edit feedback or compare attempts.                                                                                         |
| Assess learning           | Blueprint fixture, deterministic generation, stable deliveries, grading, and grades exist           | No blueprint editor. Generation uses fixed seed and two demo learners. No slot diagnostics, recipient selection, manual grading/override, result explanation, regrade preview, or print flow.                                                               |
| Interpret outcomes        | Findings, evidence, and grades are listed                                                           | Labels are detached from learners, concepts, exercises, and next actions; raw IDs and status codes remain visible.                                                                                                                                          |
| Recover from mistakes     | Optimistic version fields exist in data                                                             | The client does not consistently send or explain conflicts, has no unsaved-change guard, no save confirmation, and no archive/revision-impact workflow.                                                                                                     |

### Safety issue to fix before expanding editors

`ContentEditor` is created once with the initial prop value. Existing data arrives later, but the editor instance is not synchronized. During the browser audit, an existing numeric exercise showed the placeholder prompt in the Crepe editor while its learner preview showed the persisted prompt. The adapter must be corrected and covered by a reload/edit/save test before teachers are asked to edit more entity types.

## 3. Product boundary for the core plan

### Included

- first real workspace onboarding;
- guided organization editors needed by the first course;
- Concept and Resource material editors;
- relation management through selectors;
- safe and complete editing of the six supported Exercise types;
- practical Annual Plan and Lesson editing;
- assignment authoring and teacher review;
- assessment blueprint authoring, delivery selection, grading, and findings explanation;
- a file-backed, Markdown-rendered internal manual;
- teacher-facing names in place of ordinary raw internal identifiers;
- focused API, integration, and browser coverage for the above journeys.

### Deferred from this plan

- multi-teacher collaboration and fine-grained capabilities;
- package ZIP import/update workflow;
- a visual graph canvas;
- AI generation;
- advanced project authoring;
- institutional timetable solving;
- full localization beyond a consistent Hungarian MVP;
- large-dataset and multi-tenant architecture work.

Deferred findings are recorded separately in [POST-CORE-MVP-FINDINGS-PLAN.md](./POST-CORE-MVP-FINDINGS-PLAN.md).

## 4. Implementation principles

1. Keep TypeScript end to end. Define schemas and DTOs for each editor rather than extending `any`-based generic forms.
2. Route handlers parse and authenticate, invoke feature workflows, and map typed `Result` values. New multi-step writes belong in the relevant feature slice.
3. Use selectors populated with teacher-facing names. Internal identifiers may appear in an advanced/debug view, never as the normal input mechanism.
4. Preserve history. Archive referenced content; publish revisions; retain immutable delivered snapshots.
5. Use one editor frame and common interaction language: Back/Cancel, save state, validation summary, Preview, Save draft, Publish, Archive.
6. Make empty states instructional and actionable.
7. Build the manual from Markdown source files. React components may provide navigation and rendering, but documentation prose must not be embedded in server or page component literals.
8. Add behavior in vertical slices with browser proof, not as disconnected CRUD screens.

## 5. Shared editor foundation

Complete this foundation before feature-specific editors.

### 5.1 Typed editor contracts

- Add explicit shared schemas and teacher-facing DTOs for Subject, Learner Group, Learner Profile, Enrollment/roster, Course, Location, educational Node variants, Relation, Annual Plan, Phase, Lesson, Assignment, Assessment Blueprint, and grading decisions.
- Separate create, draft-update, publish, archive, and delivered-read models where their rules differ.
- Replace open generic patching for these workflows with feature-owned commands. Keep the collection routes temporarily for read compatibility, then stop using them from normal editor UI.
- Return field errors, stale-write details, and reference diagnostics through typed `Result` values.

### 5.2 `ContentEditor` reliability

- Support asynchronous initial Markdown and documented replacement when the loaded value changes.
- Prevent replacement from overwriting local dirty edits.
- Add debounced change delivery, read-only behavior, focus, error state, theme integration, teardown, and optional Markdown source mode.
- Expose `ready`, `dirty`, and last-saved state to the parent editor.
- Cover Hungarian Unicode, headings, lists, tables, links, images, inline/block LaTeX, paste, undo/redo, source round-trip, read-only mode, and remount without duplicate editors.
- Add a regression test that loads an existing exercise after mount and proves an unchanged save retains its original Markdown.

### 5.3 Standard editor shell

Create reusable, accessible primitives rather than a generic JSON form:

- `EditorPage` with breadcrumb, title, status, Back/Cancel, Save draft, Publish, Preview, and overflow actions;
- validation summary that links to fields and preserves server field errors;
- dirty-state navigation guard and explicit discard action;
- visible saving/saved/failed state and retry;
- optimistic concurrency conflict panel offering reload or a field-level comparison where practical;
- archive confirmation showing references and consequences;
- responsive split preview that becomes a tab on narrow screens;
- query invalidation and return routes that consistently reopen the saved entity.

### 5.4 Shared selectors

Build searchable, keyboard-usable selectors for Course, Group, Learner, Location, Concept, Resource, Exercise, Lesson, and Relation target. They must support loading, empty, error, archived/unavailable, and selected states. Selection displays titles and useful context, while payloads retain stable IDs.

### 5.5 Revision and impact baseline

- Introduce the canonical revision resolver before publishing reusable content from new editors.
- Draft edits remain mutable with optimistic concurrency.
- Publishing creates a revision and records who/when.
- Scheduled lessons and assignments show impact notices and require an explicit update choice.
- Completed lessons, submissions, and assessment deliveries continue resolving their pinned revision or immutable snapshot.
- Package-owned content is read-only until explicitly forked into teacher ownership.

### Foundation exit criteria

- Existing Exercise Markdown loads identically in editor and preview.
- Back navigation warns only when data is dirty.
- Two stale browser edits produce a comprehensible conflict rather than silent overwrite.
- Save draft, publish, and archive behaviors are consistent across two pilot entity editors.

## 6. Release A: first-run workspace and teacher orientation

### 6.1 First-run checklist and onboarding wizard

Add an authenticated onboarding route that activates for a blank workspace and remains reopenable from Help.

Steps:

1. explain Workspace, Course, Group, Learner, and Lesson in plain Hungarian;
2. create or choose a Subject;
3. create the first Learner Group and school year;
4. add learners individually and by a reviewed paste/import table;
5. create a Location;
6. create a Course by selecting Subject, Group, default Location, and timezone;
7. optionally create a first Concept, Exercise, and Lesson through shortened versions of their real editors;
8. show a completion checklist with direct links to continue authoring or load the optional demo.

Onboarding must use the same workflows as later editors and must not create hidden demo IDs.

### 6.2 Organization editors

- Learner Group: name, school year, status, roster summary, edit/archive.
- Learner Profile: display name/pseudonym, badge, teacher note, active status; administrative identity remains optional and privacy-aware.
- Roster: searchable add/remove, effective dates, inclusion/exclusion, clear active/history distinction.
- Location: name, room/description, active status.
- Course: title, Subject, Groups, explicit learner adjustments, default Location, timezone, active/archive state.
- Timetable entry: recurring weekday/start/end, Course, Location override, effective dates, cancellation/move override, overlap diagnostics.

### 6.3 Today-page orientation

- Replace demo-specific hero actions with current teacher actions: Finish setup, Create material, Create exercise, Plan lesson, Resume lesson, Review submissions.
- Use names instead of lesson/course IDs.
- Show why a finding or pending item matters and provide a direct next action.
- Keep the known-good presentation and logout paths unchanged.

### Release A exit journey

Starting from a blank workspace, a teacher creates a subject, group, two learners, location, course, and timetable entry; reloads; sees the named course and group in Today and Timetable; and opens the next authoring action without encountering an internal identifier.

## 7. Release B: learning-material and exercise editors

### 7.1 Library information architecture

- Give the Library explicit filters/tabs for Concepts, Resources, Exercises, and optionally Collections.
- Add type, lifecycle, ownership, concept, and updated-date filters; teacher-facing sorting; and real cursor paging.
- Make the title and row actionable, with View, Edit/Fork, Duplicate, and Archive actions according to ownership and lifecycle.
- Replace the fixed create-by-title form with a Create menu that explains each material type.
- Keep internal IDs out of the default table. Offer them only in an advanced metadata panel.

### 7.2 Concept editor

Fields and behavior:

- title, aliases/search terms, short summary, rich Markdown definition, lifecycle;
- optional subject/curriculum context supported by the current model;
- incoming/outgoing Relations separated and named;
- searchable relation target and relation-specific controls;
- duplicate, self-reference, invalid type, and archived-target prevention;
- preview with the same Markdown/KaTeX renderer used in lessons;
- Save draft, Publish, revision history/impact, Fork package content, Archive.

### 7.3 Resource editor

Support a deliberately bounded MVP set:

- Markdown learning material;
- external link with provider, URL, display text, learner-safe description, and link validation;
- bundled accessible SVG/image metadata where the current asset profile permits it.

Include title, summary, content/provider-specific fields, Concepts, intended use, learner/teacher visibility, rights/source metadata, preview, lifecycle, revision, fork, and archive. Do not accept executable HTML or scripts.

### 7.4 Relation editor

- Add, edit, and remove/archive `requires`, `covers`, `alternative-to`, and `extends` relations through localized selectors.
- Display both directions in material detail.
- Add any relation-specific contribution/similarity fields required by the schema.
- Explain relation meaning inline and link the term to the manual.

### 7.5 Exercise catalogue and editor completion

- Add an Exercises list route and make Exercises discoverable from Library and Lesson/Assignment/Assessment selectors.
- Begin creation with cards explaining the six supported types.
- Preserve the Crepe prompt and optional solution editors plus learner preview.
- Replace choice-option textareas and comma-separated correct letters with an option list editor: add/remove/reorder, stable option IDs, checkbox/radio correctness, and minimum-option rules.
- Manual response: response guidance, optional lightweight rubric, and teacher review behavior.
- Numeric: expected value, non-negative tolerance, optional unit, and examples of accepted/rejected answers.
- Accepted text: reorderable variants and explicit exact versus trim/case-fold normalization.
- Add Concept selector and contribution/evidence level; never reset `conceptIds` during an edit.
- Add expected duration, difficulty, evidence/feedback policy, validation summary, explicit Save draft/Publish, revision impact, duplicate, and archive.
- Changing exercise type must explain and confirm any answer data that would be discarded.
- Preview must use the same answer widgets and public projection rules as actual learner delivery.

### Release B exit journey

A teacher creates and publishes one Concept, one Markdown Resource, and all six Exercise types; relates the Resource and Exercises to the Concept; searches and reopens every item; edits and republishes one Exercise; and verifies the editor, preview, and persisted result retain identical content.

## 8. Release C: annual planning and complete lesson editing

### 8.1 Annual Plan editor

- Guided creation from Course, school year/calendar bounds, teaching profile/lesson blueprint defaults where available.
- Phase list with add, rename, rich description, date range, order, move buttons, and drag/drop.
- Coverage selector for Concepts/Resources and an understandable coverage summary.
- Lesson projections with named Course, date, Phase, duration, and status.
- Diagnostics for gaps, impossible date ranges, and unscheduled lessons.
- Save draft and Publish with reload-safe ordering.

### 8.2 Lesson editor redesign

Keep the existing ordering controls, but make each row open a type-specific Activity/slide editor.

Lesson-level fields:

- intent/title, Course, date/time, duration, Location override, Phase, status;
- optional Blueprint/Profile once those defaults are modeled;
- teacher notes that never reach projection;
- full lesson preview and diagnostic summary.

Supported insertion types for the MVP:

- section introduction;
- Concept/Markdown definition selected from Library or authored inline as a new Resource;
- accessible image/SVG;
- normal Exercise selected from published supported Exercises;
- live quiz selected from supported live-capable Exercises;
- response status;
- results/leaderboard;
- solution/explanation;
- discussion prompt;
- timer with duration and end behavior;
- closure/homework.

Every inserted item must be editable. Task/quiz insertion must require an explicit Exercise selection and never silently choose the first exercise. Unsupported types remain visible as unavailable with a reason.

### 8.3 Diagnostics and preview

- Sum duration against target lesson length.
- Detect missing content, missing exercise references, prerequisites, unsupported renderers, repetitive participation, solution-before-task, live quiz without results/reveal path, timer without valid duration, and missing closure.
- Distinguish errors that block publish from suggestions.
- Preview projected learner content and teacher-only guidance separately.
- Verify scheduled and completed revision resolution before publish.

### Release C exit journey

A teacher builds a lesson with at least three sections, a Concept, Resource, four distinct Exercise types, live quiz, response/results, solution, timer, discussion, and homework; edits every inserted item; reorders with mouse and keyboard/move buttons; publishes; reloads with exact order; previews; presents; pauses/leaves; resumes; and completes.

## 9. Release D: assignments, review, assessments, and findings

### 9.1 Assignment editor

- Title/instructions in Markdown, Course or selected learner targets, one or more published Exercises or an Assessment, open/deadline date and local time, attempt limit, feedback release, evidence policy, status.
- Show recipient count and the resolved exercise revisions before assign.
- Save draft, preview learner view, assign, close/archive, and duplicate.
- Prevent deadlines before opening and unresolved/archived content.
- Replace all fixed demo course, learner, exercise, and deadline values.

### 9.2 Submission review workspace

- Queue filters by Course, Assignment, status, learner, and due state.
- Display learner, exercise, prompt snapshot, formatted answer, auto-check result, confidence/scaffold data when present, and attempt timeline.
- Compare returned and resubmitted attempts without modifying either snapshot.
- Teacher writes feedback, then returns or accepts; require a confirmation for status-changing actions.
- Where grading applies, create or confirm a Grade Entry with visible provenance.
- Replace raw answer JSON and internal IDs with teacher-facing rendering; keep technical metadata in an advanced panel.

### 9.3 Assessment Blueprint editor

- Title, Course, instructions, source filters, variant policy, and ordered slots.
- Slot editor for Concept, points, difficulty/source bounds, eligible exercise count, and deterministic shortfall explanation.
- Add/remove/reorder slots, total-points summary, Save draft, validate, Publish, duplicate, archive.
- Explain options when a slot is short: add content, allow repetition, widen criteria, reduce/defer the slot. Never relax silently.

### 9.4 Generate and deliver assessment wizard

- Choose Blueprint, target Course/learners, due window, A/B policy, and optional reproducible seed hidden under advanced settings.
- Preview selected questions, equivalence explanation, points, variant labels, and unresolved shortfalls before generation.
- Create stable learner-specific Deliveries through the canonical revision resolver.
- Provide online learner view and a print-ready preview.

### 9.5 Grading and findings

- Auto-grade supported types and queue manual responses.
- Show manual decision/override with required reason when it changes an automatic or official result.
- Preview regrade impact before changing Grade Entries.
- Explain easiest/hardest questions, strongest/weakest Concepts, omissions, attractive distractors, and follow-up learners.
- Findings recommend actions and link to supporting evidence; they never mutate plans or grades automatically.

### Release D exit journey

A teacher assigns two Exercises to the created Course, observes a learner draft survive reload, reviews a submitted immutable attempt, returns it with editable feedback, compares and accepts the resubmission; then creates a six-slot Blueprint, resolves any shortfall, generates stable A/B Deliveries for two selected learners, grades supported and manual items, records a Grade Entry, and opens an explained finding.

## 10. Markdown-backed internal manual

The manual is a product feature, not a single static help page. Establish its architecture early, then complete content alongside Releases A-D so the documentation never lags the UI.

### 10.1 Source architecture

- Store prose as UTF-8 Markdown under `apps/web/src/manual/hu/`, grouped by `getting-started`, `concepts`, `how-to`, `reference`, `troubleshooting`, and `tips`.
- Keep a small typed manifest for slug, order, category, title, summary, and keywords; import each `.md` body as raw build-time content. The prose itself must remain in Markdown files, not TSX, API route literals, fixture objects, or database seeds.
- Remove the hardcoded `/api/guide` response after the file-backed manual is in use. If an API is retained for future remote content, it must serve parsed Markdown documents from the same source rather than duplicate prose.
- Reuse the existing `Markdown` component, add GitHub-flavored Markdown support for tables/task lists, and keep KaTeX support.
- Do not enable raw HTML. Sanitize/validate URLs, distinguish external links, and provide accessible heading anchors and code/table overflow.
- Add a build/test check for duplicate slugs, broken internal links, missing titles/summaries, orphan pages, and terminology links.

### 10.2 Manual UI

- `/guide` becomes a searchable manual landing page with category navigation, beginner path, recently relevant topics, and terminology index.
- `/guide/:slug` renders a Markdown article with breadcrumb, table of contents, previous/next links, related terms, and links back to the relevant feature.
- Add contextual Help links to onboarding and every core editor. Links should open the precise article/heading, not the manual home.
- Search title, summary, keywords, headings, and body text locally at MVP scale.
- Add copy-link anchors and a print-friendly article view.
- Empty/error states remain usable if one article fails to load.

### 10.3 Required terminology coverage

The terminology section must define the Hungarian UI term, canonical English/domain term where useful, what it means to a teacher, how it differs from nearby terms, and a concrete example. Cover at least:

- Workspace, Admin, teacher account, role, session;
- Subject, Course, Learner Profile, Learner Group, Enrollment, roster, explicit inclusion/exclusion, Teaching Location, timetable entry, override;
- Library, Node, Concept, Resource, Collection, owner, package-owned content, teacher fork;
- Relation and each supported type: requires, covers, alternative-to, extends;
- draft, published, archived, revision, pinned revision, immutable snapshot, optimistic conflict;
- Exercise, the six Exercise types, prompt, solution/explanation, option, accepted answer, tolerance, normalization, difficulty, expected duration, rubric, evidence policy;
- Annual Plan, Phase, Lesson, Lesson Blueprint, Lesson Layout, Activity/slide, diagnostic, prerequisite, teaching profile;
- Presentation Mode, projected view, Lesson Run, pause/leave, resume, complete, live session, join code, participant, reveal, response status, leaderboard;
- Assignment, learner draft, Submission, attempt, returned, resubmitted, accepted, feedback release;
- Learning Evidence, confidence, scaffold use, Finding, Grade Entry;
- Assessment, Assessment Blueprint, slot, source filter, shortfall, A/B variant, Delivery, automatic grading, manual override, regrade;
- content package, import/apply, update, Project, feature flag.

Terms not yet implemented must be marked as planned or unavailable rather than described as usable.

### 10.4 Required how-to coverage

Write task-oriented articles with prerequisites, numbered steps, expected result, recovery notes, and related terminology:

1. Start with a blank workspace.
2. Create a Course, Group, learners, roster, Location, and timetable entry.
3. Create, relate, publish, revise, fork, and archive a Concept or Resource.
4. Create and preview each of the six Exercise types.
5. Choose tolerance, accepted-text normalization, and correct choice options.
6. Build, diagnose, preview, publish, present, pause, resume, and complete a Lesson.
7. Start an anonymous live session, share the join code, reveal results safely, and recover from disconnection.
8. Create an Assignment, review attempts, return with feedback, accept a correction, and understand immutable history.
9. Build an Assessment Blueprint, resolve a shortfall, generate A/B Deliveries, grade, override with a reason, and review findings.
10. Understand revisions and why previously delivered work does not change.
11. Recover from validation errors, stale edits, missing content, session expiry, and disabled features.

### 10.5 Required tips coverage

Add short, cross-linked teacher tips, including:

- draft first and publish only after learner preview;
- write measurable prompts and useful solutions;
- use Concepts and Relations to make reuse and assessment selection stronger;
- choose plausible distractors and avoid trick wording;
- use tolerance and units intentionally;
- balance lesson duration and participation modes;
- keep teacher notes out of projected content;
- reveal live results only when pedagogically appropriate;
- return work with one actionable correction target;
- interpret findings as prompts for judgment, not automatic decisions;
- duplicate/fork before making a context-specific variation;
- archive referenced content instead of deleting history.

### 10.6 Documentation definition of done

- Every primary navigation destination and core editor has an article and contextual link.
- Every visible teacher-facing domain term is present in the terminology index or links to a definition.
- No article claims a deferred feature is available.
- A browser test proves search, article rendering, table/task list/KaTeX output, anchor navigation, related links, and return to the editor.
- A content test catches broken manual links and missing glossary entries referenced by the UI.

## 11. API and data changes by feature slice

The exact route shape may evolve during implementation, but normal editor workflows should converge on feature-owned commands such as:

- onboarding: workspace status and atomic step commands;
- organization: group, learner, roster, course, location, timetable create/update/archive;
- graph: Concept/Resource create/update/publish/archive/fork and Relation commands;
- exercises: draft update, publish revision, duplicate/fork, archive;
- planning: Annual Plan/Phase commands and Lesson draft/publish/preview diagnostics;
- assignments: draft, assign, close, recipient resolution, review commands;
- assessments: Blueprint validation/publish, generation preview/commit, grading decision, regrade preview;
- manual: build-time content index, with no mutable server workflow in the MVP.

Each multi-record command must be atomic at the current store boundary, return a typed Result, and record enough audit/revision metadata for later migration away from the workspace snapshot.

## 12. Verification strategy

### Unit and component coverage

- editor DTO validation and type-specific field rules;
- ContentEditor async hydration and dirty-value protection;
- stable option IDs and answer normalization;
- relation validity and duplicate prevention;
- revision resolution and impact calculation;
- lesson diagnostics and duration calculation;
- assessment slot eligibility/shortfall and deterministic generation;
- Markdown manifest, link, glossary, and renderer fixtures.

### API/integration coverage

- create/update/conflict/publish/archive/fork per reusable entity;
- blank onboarding without demo IDs;
- historical roster resolution and timetable overlap;
- assignment draft/submit/return/resubmit/accept snapshots;
- assessment generation, delivery immutability, grading, override, regrade preview, and findings;
- authorization and field-error mapping for every new command.

### Browser journeys

1. blank teacher onboarding and first course;
2. material plus six-exercise authoring, reload, edit, publish, and relation management;
3. full lesson build, diagnostics, preview, presentation escape/resume/complete;
4. assignment draft persistence and correction loop;
5. assessment blueprint through findings;
6. manual search, terminology, contextual help, and return to work;
7. regression journey for logout and live answer acknowledgement.

Use at least two browser contexts where learner/teacher separation matters. Test keyboard ordering and a narrow viewport for core editors.

### Required commands per implementation slice

1. targeted unit/component tests;
2. targeted API integration tests;
3. targeted browser journey;
4. `npm run validate`;
5. record any unverified behavior in `IMPLEMENTATION-DEVIATIONS.md`.

## 13. Delivery sequence and gates

| Gate | Deliverable                                  | May proceed when                                                                                                             |
| ---- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| G0   | Editor safety foundation                     | Existing content hydrates correctly, dirty navigation and conflicts are safe, and revision resolution has a tested baseline. |
| G1   | Blank-workspace orientation and organization | A new teacher completes Release A without demo IDs or raw-ID input.                                                          |
| G2   | Materials and exercises                      | Release B browser journey passes for all supported types and reloads.                                                        |
| G3   | Planning and lesson authoring                | Release C passes while preserving presentation leave/resume/complete behavior.                                               |
| G4   | Assignment and assessment operations         | Release D proves immutable history and stable deliveries end to end.                                                         |
| G5   | Manual completeness and MVP acceptance       | Documentation definition of done and all regression journeys pass; remaining deviations are truthful.                        |

Work on the manual source architecture in G0 and add/update articles in the same change set as each feature. Do not postpone all documentation writing until G5.

## 14. Core MVP definition of done

The core plan is complete only when a teacher unfamiliar with the repository can start from blank state and complete the setup → author → plan → teach → assign → assess → interpret loop using names and guided controls, can recover from validation and stale edits, and can find accurate in-product guidance for every step. Existing delivery and submission history must remain immutable, and all previously protected navigation/logout/live/presentation journeys must still pass.
