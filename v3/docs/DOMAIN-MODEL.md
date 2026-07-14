# Domain model

Core records include users, server sessions, subjects, learner profiles, learner groups, enrollments, courses, locations, educational nodes, typed relations, exercises, lessons, lesson runs, live sessions, participants, answers, assignments, mutable drafts, immutable submission attempts, evidence, assessment blueprints, assessments, immutable deliveries, findings, grade entries, and feature-toggled projects.

Published exercise revisions are represented by `currentRevision`. Delivered assessment questions are copied into `exerciseSnapshots`; later edits do not change historical delivery.
