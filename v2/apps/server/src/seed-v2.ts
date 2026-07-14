import { nodeSchema, type Assignment, type GraphNode } from '@fonat/contracts';
import type { AppConfig } from './config.js';
import type { Clock } from './clock.js';
import type { FonatRepository } from './repository/index.js';
import { collections } from './features/organization/service.js';

const rights = {
  status: 'project-owned' as const,
  license: 'CC BY-NC-SA 4.0',
  attribution: 'Fonat reference content',
  redistributionAllowed: true
};
const title = (hu: string, en?: string) => ({
  canonicalLanguage: 'hu',
  values: { hu, ...(en ? { en } : {}) }
});
function referenceNode(
  id: string,
  type: string,
  hu: string,
  payload: Record<string, unknown>,
  now: string,
  subjectIds: string[] = []
): GraphNode {
  return nodeSchema.parse({
    id,
    type,
    title: title(hu),
    lifecycle: 'published',
    quality: 'classroom-tested',
    currentRevision: 1,
    version: 0,
    subjectIds,
    searchText: `${hu} ${JSON.stringify(payload)}`,
    payload,
    extensions: {},
    provenance: { origin: 'seed', packageId: 'fonat.foundation', localKey: id },
    rights,
    tags: [],
    createdAt: now,
    updatedAt: now
  });
}

export async function applyFoundation(repository: FonatRepository, clock: Clock) {
  const now = clock.iso();
  const nodes = [
    referenceNode(
      'subject.math',
      'subject',
      'Matematika',
      {
        code: 'math',
        aliases: ['matek'],
        gradeApplicability: ['1-12'],
        conceptNamespace: 'concept.math',
        terminology: {},
        capabilityModuleIds: ['math']
      },
      now,
      ['subject.math']
    ),
    referenceNode(
      'profile.balanced',
      'teaching-profile',
      'Kiegyensúlyozott alapbeállítás',
      {
        participationVariety: true,
        evidenceIntensity: 'standard',
        difficultyTarget: 3,
        feedbackPolicy: 'scaffold-before-answer'
      },
      now
    ),
    referenceNode(
      'blueprint.default-45',
      'lesson-blueprint',
      '45 perces kiegyensúlyozott óra',
      {
        durationMinutes: 45,
        sections: [
          { id: 'opening', title: 'Indítás', min: 5, max: 8 },
          { id: 'work', title: 'Közös és önálló munka', min: 30, max: 35 },
          { id: 'close', title: 'Lezárás', min: 5, max: 8 }
        ]
      },
      now
    ),
    referenceNode(
      'layout.compact',
      'lesson-layout',
      'Kompakt egyoldalas elrendezés',
      { kind: 'compact-one-page', showSolutions: false, showTeacherNotes: true },
      now
    )
  ];
  for (const node of nodes) if (!(await repository.getNode(node.id))) await repository.upsertNode(node);
}

export async function applyV2Demo(repository: FonatRepository, config: AppConfig, clock: Clock) {
  await applyFoundation(repository, clock);
  const now = clock.iso();
  const learners = [
    ['learner.red-panda', 'Vörös Panda', '🐼', '#b45309'],
    ['learner.otter', 'Vidra', '🦦', '#0369a1'],
    ['learner.lynx', 'Hiúz', '🐈', '#7c3aed'],
    ['learner.hedgehog', 'Sün', '🦔', '#15803d'],
    ['learner.fox', 'Róka', '🦊', '#be123c']
  ] as const;
  await repository.upsertRecord(collections.groups, {
    id: 'group.grade8-a',
    name: '8.A',
    shortCode: '8.A',
    schoolYear: '2026/27',
    ownerTeacherIds: ['demo.teacher'],
    active: true,
    version: 0,
    createdAt: now,
    updatedAt: now
  });
  await repository.upsertRecord(collections.locations, {
    id: 'location.math-12',
    name: 'Matematika terem',
    shortCode: 'M-12',
    building: 'Főépület',
    notes: 'Projektor és mozgatható asztalok',
    equipmentTags: ['projector', 'grid-board'],
    archived: false,
    version: 0,
    createdAt: now,
    updatedAt: now
  });
  await repository.upsertRecord(collections.courses, {
    id: 'course.grade8.math',
    name: '8.A matematika',
    subjectId: 'subject.math',
    schoolYear: '2026/27',
    ownerTeacherIds: ['demo.teacher'],
    learnerGroupIds: ['group.grade8-a'],
    includeLearnerIds: [],
    excludeLearnerIds: [],
    defaultLocationId: 'location.math-12',
    timezone: config.SCHOOL_TIMEZONE,
    active: true,
    version: 0,
    createdAt: now,
    updatedAt: now
  });
  for (const [id, nickname, badgeIcon, badgeColor] of learners) {
    await repository.upsertRecord(collections.learners, {
      id,
      nickname,
      badgeIcon,
      badgeColor,
      active: true,
      profile: {},
      version: 0,
      createdAt: now,
      updatedAt: now
    });
    await repository.upsertRecord(collections.enrollments, {
      id: `enrollment.grade8.${id}`,
      learnerId: id,
      learnerGroupId: 'group.grade8-a',
      startDate: '2026-09-01',
      status: 'active',
      version: 0,
      createdAt: now,
      updatedAt: now
    });
  }
  for (const [id, weekday, startTime] of [
    ['tt.grade8.mon', 1, '08:00'],
    ['tt.grade8.wed', 3, '09:00'],
    ['tt.grade8.fri', 5, '08:00']
  ] as const)
    await repository.upsertRecord(collections.timetable, {
      id,
      courseId: 'course.grade8.math',
      weekday,
      startTime,
      durationMinutes: 45,
      timezone: config.SCHOOL_TIMEZONE,
      locationId: 'location.math-12',
      effectiveFrom: '2026-09-01',
      effectiveTo: '2027-06-15',
      version: 0,
      createdAt: now,
      updatedAt: now
    });
  const assignment: Assignment = {
    id: 'assignment.grade8.homework.1',
    title: 'Pitagorasz gyakorlás',
    courseId: 'course.grade8.math',
    targetLearnerIds: [],
    type: 'homework',
    exerciseRefs: [
      { nodeId: 'exercise.missing-hypotenuse-6-8', revision: 1 },
      { nodeId: 'exercise.rectangle-diagonal', revision: 1 }
    ],
    startAt: '2026-09-15T10:00:00Z',
    dueAt: '2026-09-18T18:00:00Z',
    status: 'assigned',
    policy: {
      maxAttempts: 2,
      feedbackRelease: 'after-submit',
      answerReveal: 'after-acceptance',
      allowDrafts: true,
      evidenceIntensity: 'standard'
    },
    version: 0,
    createdBy: 'demo.teacher',
    createdAt: now,
    updatedAt: now
  };
  await repository.upsertRecord('assignments', assignment);
}
