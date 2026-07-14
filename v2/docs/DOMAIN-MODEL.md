# Domain model

## Teaching organization

- **Subject:** versioned data-defined discipline. A subject-specific capability module is optional.
- **Learner Profile:** stable pseudonymous person record.
- **Learner Group:** cohort such as `8.A`.
- **Enrollment:** time-bounded membership connecting a Learner Profile to a Learner Group.
- **Course:** one Subject taught during one school year to one or more Learner Groups, with explicit learner inclusions or exclusions.
- **Teaching Location:** reusable room or place with short code and optional equipment tags.
- **Timetable Entry:** recurring local wall-clock Course occurrence with timezone and optional Location override.

## Educational content

- **Concept:** curriculum-independent knowledge, skill, method, representation, competency, or misconception.
- **Curriculum Requirement:** official expectation referencing one or more Concepts.
- **Resource:** reusable explanatory or supporting material.
- **Exercise:** reusable task requiring learner action or response.
- **Collection:** arbitrary teacher grouping without adding a vague Topic abstraction.
- **Activity Template:** reusable pattern referencing Resources or Exercises and default execution behavior.
- **Activity:** contextual execution embedded in one Lesson Section.
- **Rubric:** lightweight reusable criteria for manual grading.
- **Teaching Profile:** reusable pedagogical preferences.
- **Lesson Blueprint:** ordered lesson shape and timing expectations.
- **Lesson Layout:** printable or projected visual structure.

## Planning and execution

- **Annual Plan:** Course-specific school-year plan.
- **Phase:** bounded sequence of Lessons.
- **Lesson:** concrete planned or completed event.
- **Lesson Run:** actual execution snapshot, timers, section states, and notes.
- **Presentation Mode:** projection of a resolved Lesson Run rather than a separate slide-deck domain.
- **Project:** isolated optional cross-subject connection surface. It does not own a scheduling or progress engine in the MVP.

## Assignment and assessment

- **Assignment:** delivery container for homework, practice, classwork, quizzes, and formal assessment work. It owns targeting, dates, attempts, draft policy, feedback release, evidence, and grading policy.
- **Answer Draft:** server-side mutable learner work that is not yet evidence.
- **Submission:** immutable attempt snapshot created by final submission.
- **Assessment Blueprint:** constrained slots describing required Concepts, difficulty, sources, points, and duration.
- **Assessment:** reusable selected question structure and compatible variants.
- **Assessment Delivery:** stable learner-specific resolved variant with exact question revisions and option permutation.
- **Grade Entry:** teacher-confirmed official grade independent from automatic score and evidence.
- **Learning Evidence:** answer, explanation, correction, confidence, observation, project contribution, or demonstration.
- **Concept State:** explainable view derived from recent Evidence, never a canonical opaque mastery percentage.

## Revision semantics

Draft saves remain mutable. Publishing creates an immutable revision. Compatibility is presentation-only, content-equivalent, planning-impacting, or contract-breaking. Scheduled Lessons remain pinned and receive update notices. Completed Lessons and delivered Assessments never change. Package-owned updates use the same revision semantics. Teacher customization creates an independent local fork.

## Relations

Relations are registered, typed, directed unless their contract says otherwise, and editable through contextual selectors. Numeric dimensions are relation-specific. For example, `covers.contribution` and `alternative-to.similarity` are not interchangeable.
