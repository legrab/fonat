import { randomUUID } from 'node:crypto';
import {
  exercisePayloadSchema,
  nodeSchema,
  ok,
  err,
  type GraphNode,
  type Result,
  type Assignment
} from '@fonat/contracts';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { OrganizationService, collections } from '../organization/service.js';

export type OnboardingInput = {
  teacherId: string;
  learnerGroupName: string;
  learnerGroupCode: string;
  courseName: string;
  subjectTitle: string;
  schoolYear: string;
  locationName: string;
  locationCode: string;
  learnerNicknames: string[];
  firstConceptTitle: string;
  firstExercisePrompt: string;
  firstLessonTitle: string;
  firstAssignmentTitle: string;
  timezone: string;
};

function localized(hu: string, en?: string) {
  return { canonicalLanguage: 'hu', values: { hu, ...(en ? { en } : {}) } };
}

function slug(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || randomUUID()
  );
}

export class OnboardingService {
  constructor(
    private readonly repository: FonatRepository,
    private readonly clock: Clock
  ) {}

  async status() {
    const [groups, courses, nodes] = await Promise.all([
      this.repository.listRecords(collections.groups, { limit: 1 }),
      this.repository.listRecords(collections.courses, { limit: 1 }),
      this.repository.countNodes()
    ]);
    return ok({ complete: groups.items.length > 0 && courses.items.length > 0 && nodes > 5 });
  }

  async complete(input: OnboardingInput): Promise<Result<Record<string, string>>> {
    const organization = new OrganizationService(this.repository, this.clock);
    const now = this.clock.iso();
    const stem = slug(input.courseName);
    const subjectId = `subject.${slug(input.subjectTitle)}`;
    const groupId = `group.${stem}`;
    const locationId = `location.${slug(input.locationCode)}`;
    const courseId = `course.${stem}`;
    const conceptId = `concept.${stem}.${slug(input.firstConceptTitle)}`;
    const exerciseId = `exercise.${stem}.first`;
    const planId = `annual-plan.${stem}`;
    const phaseId = `phase.${stem}.first`;
    const lessonId = `lesson.${stem}.first`;
    const assignmentId = `assignment.${stem}.first`;

    if (await this.repository.getRecord(collections.courses, courseId))
      return err({ code: 'conflict', message: 'Ez a kezdő kurzus már létrejött.' });

    const common = {
      lifecycle: 'published' as const,
      quality: 'experimental' as const,
      currentRevision: 1,
      version: 0,
      ownerId: input.teacherId,
      extensions: {},
      provenance: { origin: 'teacher' as const, author: input.teacherId },
      rights: { status: 'teacher-owned' as const, redistributionAllowed: false },
      tags: [],
      createdAt: now,
      updatedAt: now
    };

    const nodes: GraphNode[] = [
      nodeSchema.parse({
        ...common,
        id: subjectId,
        type: 'subject',
        title: localized(input.subjectTitle),
        subjectIds: [subjectId],
        searchText: input.subjectTitle,
        payload: {
          code: slug(input.subjectTitle),
          aliases: [],
          gradeApplicability: [],
          conceptNamespace: conceptId,
          terminology: {},
          capabilityModuleIds: []
        }
      }),
      nodeSchema.parse({
        ...common,
        id: conceptId,
        type: 'concept',
        title: localized(input.firstConceptTitle),
        subjectIds: [subjectId],
        searchText: input.firstConceptTitle,
        payload: { description: localized('Első, a bevezetés során létrehozott fogalom.'), aliases: [] }
      }),
      nodeSchema.parse({
        ...common,
        id: exerciseId,
        type: 'exercise',
        title: localized(input.firstExercisePrompt.slice(0, 70)),
        subjectIds: [subjectId],
        searchText: input.firstExercisePrompt,
        payload: exercisePayloadSchema.parse({
          exerciseType: 'manual-explanation',
          prompt: localized(input.firstExercisePrompt),
          options: [],
          acceptedAnswers: [],
          durationMinutes: 8,
          difficulty: {
            cognitive: 2,
            prerequisites: 1,
            independence: 2,
            teacherPreparation: 1,
            collaboration: 1
          },
          evidenceIntensity: 'light',
          concepts: [conceptId],
          purpose: ['introduction'],
          scaffold: [],
          grading: {},
          presentation: {}
        })
      }),
      nodeSchema.parse({
        ...common,
        id: planId,
        type: 'annual-plan',
        title: localized(`${input.courseName} éves terv`),
        subjectIds: [subjectId],
        searchText: `${input.courseName} éves terv`,
        payload: { courseId, schoolYear: input.schoolYear, phaseIds: [phaseId], status: 'draft' }
      }),
      nodeSchema.parse({
        ...common,
        id: phaseId,
        type: 'phase',
        title: localized('Első szakasz'),
        subjectIds: [subjectId],
        searchText: 'Első szakasz',
        payload: {
          annualPlanId: planId,
          lessonIds: [lessonId],
          conceptIds: [conceptId],
          approximateLessonCount: 1
        }
      }),
      nodeSchema.parse({
        ...common,
        lifecycle: 'draft',
        id: lessonId,
        type: 'lesson',
        title: localized(input.firstLessonTitle),
        subjectIds: [subjectId],
        searchText: input.firstLessonTitle,
        payload: {
          courseId,
          annualPlanId: planId,
          phaseId,
          date: this.clock.today(input.timezone).toString(),
          durationMinutes: 45,
          intent: input.firstLessonTitle,
          conceptIds: [conceptId],
          sections: [
            {
              id: `${lessonId}.section.1`,
              title: 'Indítás és első feladat',
              durationMinutes: 45,
              purpose: 'introduction',
              requiredActivityKinds: [],
              activityIds: [exerciseId],
              activities: [
                {
                  id: `${lessonId}.activity.1`,
                  exerciseIds: [exerciseId],
                  resourceIds: [],
                  durationMinutes: 8,
                  grouping: 'individual',
                  teacherInstructions: '',
                  evidencePolicy: 'light',
                  presentation: {},
                  differentiation: {},
                  notes: ''
                }
              ],
              slides: [{ id: `${lessonId}.slide.1`, type: 'exercise', exerciseId, teacherOnly: false }]
            }
          ],
          pinnedRevisions: { [exerciseId]: 1 },
          status: 'draft',
          teacherNotes: '',
          runtimeSummary: {}
        }
      })
    ];

    const learnerIds = input.learnerNicknames.map((nickname) => `learner.${stem}.${slug(nickname)}`);
    await this.repository.runAtomic(async () => {
      await organization.createGroup({
        id: groupId,
        name: input.learnerGroupName,
        shortCode: input.learnerGroupCode,
        schoolYear: input.schoolYear,
        ownerTeacherIds: [input.teacherId],
        active: true,
        version: 0,
        createdAt: now,
        updatedAt: now
      });
      await organization.createLocation({
        id: locationId,
        name: input.locationName,
        shortCode: input.locationCode,
        notes: '',
        equipmentTags: [],
        archived: false,
        version: 0,
        createdAt: now,
        updatedAt: now
      });
      await organization.createCourse({
        id: courseId,
        name: input.courseName,
        subjectId,
        schoolYear: input.schoolYear,
        ownerTeacherIds: [input.teacherId],
        learnerGroupIds: [groupId],
        includeLearnerIds: [],
        excludeLearnerIds: [],
        defaultLocationId: locationId,
        timezone: input.timezone,
        active: true,
        version: 0,
        createdAt: now,
        updatedAt: now
      });
      for (const [index, nickname] of input.learnerNicknames.entries()) {
        const learnerId = learnerIds[index]!;
        await organization.createLearner({
          id: learnerId,
          nickname,
          badgeIcon: ['🦊', '🦉', '🦔', '🐿️', '🦡'][index % 5],
          badgeColor: ['#486B91', '#A9571E', '#6B5B7A'][index % 3],
          active: true,
          profile: {},
          version: 0,
          createdAt: now,
          updatedAt: now
        });
        await organization.createEnrollment({
          id: `enrollment.${groupId}.${learnerId}`,
          learnerId,
          learnerGroupId: groupId,
          startDate: this.clock.today(input.timezone).toString(),
          status: 'active',
          version: 0,
          createdAt: now,
          updatedAt: now
        });
      }
      for (const node of nodes) await this.repository.upsertNode(node);
      await this.repository.upsertRelation({
        id: `relation.covers.${exerciseId}.${conceptId}`,
        type: 'covers',
        sourceId: exerciseId,
        targetId: conceptId,
        dimensions: { contribution: 1 },
        metadata: {},
        provenance: { origin: 'teacher', author: input.teacherId },
        createdAt: now,
        version: 0
      });
      const assignment: Assignment = {
        id: assignmentId,
        title: input.firstAssignmentTitle,
        courseId,
        targetLearnerIds: [],
        type: 'homework',
        exerciseRefs: [{ nodeId: exerciseId, revision: 1 }],
        status: 'draft',
        policy: {
          maxAttempts: 2,
          feedbackRelease: 'after-submit',
          answerReveal: 'after-acceptance',
          allowDrafts: true,
          evidenceIntensity: 'light'
        },
        version: 0,
        createdBy: input.teacherId,
        createdAt: now,
        updatedAt: now
      };
      await this.repository.insertRecord('assignments', assignment);
    });

    return ok({
      subjectId,
      learnerGroupId: groupId,
      courseId,
      locationId,
      conceptId,
      exerciseId,
      annualPlanId: planId,
      phaseId,
      lessonId,
      assignmentId
    });
  }
}
