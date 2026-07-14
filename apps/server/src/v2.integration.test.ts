import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import type { AppConfig } from './config.js';
import { MemoryFonatRepository } from './repository/memory.js';

const config: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3100,
  WEB_ORIGIN: 'http://127.0.0.1:4173',
  PUBLIC_BASE_URL: 'http://127.0.0.1:3100',
  MONGODB_URI: 'mongodb://unused',
  MONGODB_DB: 'fonat-test',
  SESSION_SECRET: 'v2-integration-test-session-secret',
  PERSISTENCE_MODE: 'memory',
  ASSET_PROFILE: 'hosted-restricted',
  LOCAL_ASSET_DIR: './local-assets',
  MAX_PACKAGE_BYTES: 4_194_304,
  MAX_UPLOAD_BYTES: 2_097_152,
  DEMO_CLOCK: '2026-09-15T08:00:00+02:00',
  SCHOOL_TIMEZONE: 'Europe/Budapest',
  DEFAULT_LOCALE: 'hu',
  FEATURE_PROJECTS: true,
  ENABLE_SWAGGER: false,
  BOOTSTRAP_ADMIN_USERNAME: undefined,
  BOOTSTRAP_ADMIN_PASSWORD: undefined
};
function cookie(response: { headers: Record<string, string | string[] | undefined> }) {
  const value = response.headers['set-cookie'];
  return (Array.isArray(value) ? value[0] : value)?.split(';')[0] ?? '';
}
async function bootstrap(app: Awaited<ReturnType<typeof createApp>>, loadDemo: boolean) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/setup/bootstrap',
    payload: { username: 'admin', displayName: 'Tanár', password: 'very-secure-test-password', loadDemo }
  });
  expect(response.statusCode).toBe(200);
  return cookie(response);
}

describe('Fonat v2 workflows', () => {
  let repository: MemoryFonatRepository;
  beforeEach(async () => {
    repository = new MemoryFonatRepository();
    await repository.init();
  });

  it('creates a complete first teaching thread from a blank instance', async () => {
    const app = await createApp(config, repository);
    const auth = await bootstrap(app, false);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v2/onboarding/complete',
      headers: { cookie: auth, 'idempotency-key': 'blank-onboarding-001' },
      payload: {
        learnerGroupName: '9.B',
        learnerGroupCode: '9B',
        courseName: '9.B matematika',
        subjectTitle: 'Matematika',
        schoolYear: '2026/27',
        locationName: 'Kék terem',
        locationCode: 'K-1',
        learnerNicknames: ['Róka', 'Bagoly'],
        firstConceptTitle: 'Arányosság',
        firstExercisePrompt: 'Mutasd be egy példán az arányosságot.',
        firstLessonTitle: 'Arányosság indítása',
        firstAssignmentTitle: 'Első arányossági gyakorlás',
        timezone: 'Europe/Budapest'
      }
    });
    expect(response.statusCode).toBe(200);
    const ids = response.json().value as Record<string, string>;
    expect(await repository.getNode(ids.lessonId!)).not.toBeNull();
    const course = await repository.getRecord('courses', ids.courseId!);
    expect(course).not.toBeNull();
    const status = await app.inject({
      method: 'GET',
      url: '/api/v2/onboarding/status',
      headers: { cookie: auth }
    });
    expect(status.json().value.complete).toBe(true);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/v2/onboarding/complete',
      headers: { cookie: auth, 'idempotency-key': 'blank-onboarding-001' },
      payload: {
        learnerGroupName: 'ignored',
        learnerGroupCode: 'x',
        courseName: 'ignored',
        subjectTitle: 'Matematika',
        schoolYear: '2026/27',
        locationName: 'x',
        locationCode: 'x',
        learnerNicknames: ['x'],
        firstConceptTitle: 'x',
        firstExercisePrompt: 'xxx',
        firstLessonTitle: 'x',
        firstAssignmentTitle: 'x',
        timezone: 'Europe/Budapest'
      }
    });
    expect(duplicate.json().value.courseId).toBe(ids.courseId);
    await app.close();
  });

  it('provides locations, assignments, drafts, exact submissions, projects and stable assessment delivery', async () => {
    const app = await createApp(config, repository);
    const auth = await bootstrap(app, true);
    const timetable = await app.inject({
      method: 'GET',
      url: '/api/v2/timetable/week?anchor=2026-09-15',
      headers: { cookie: auth }
    });
    expect(timetable.json().value.items).toHaveLength(3);
    expect(timetable.json().value.items[0].locationName).toBe('Matematika terem');
    const projects = await app.inject({ method: 'GET', url: '/api/v2/projects', headers: { cookie: auth } });
    const mushroomProject = projects
      .json()
      .value.items.find((item: { id: string }) => item.id === 'project.mushroom-yard');
    expect(mushroomProject).toBeDefined();
    expect(mushroomProject.payload.characters).toHaveLength(4);
    expect(
      mushroomProject.payload.challengeSequence.map((challenge: { kind: string }) => challenge.kind)
    ).toEqual(['binary', 'pattern-matching', 'fractions']);
    const access = await app.inject({
      method: 'POST',
      url: '/api/v2/student/access',
      payload: { classroomCode: 'FONAT8', learnerId: 'learner.fox', secret: 'demo5' }
    });
    expect(access.statusCode).toBe(200);
    const studentAuth = { authorization: `Bearer ${access.json().value.token}` };
    const draft = await app.inject({
      method: 'PUT',
      url: '/api/v2/assignments/assignment.grade8.homework.1/drafts/learner.fox',
      headers: { ...studentAuth, 'idempotency-key': 'draft-save-001', 'if-match': '0' },
      payload: { answers: { 'exercise.missing-hypotenuse-6-8': 10 }, version: 0 }
    });
    expect(draft.statusCode).toBe(200);
    const update = await app.inject({
      method: 'PUT',
      url: '/api/v2/assignments/assignment.grade8.homework.1/drafts/learner.fox',
      headers: { ...studentAuth, 'idempotency-key': 'draft-save-002', 'if-match': '0' },
      payload: { answers: { 'exercise.missing-hypotenuse-6-8': 9 }, version: 0 }
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().value.version).toBe(1);
    const stale = await app.inject({
      method: 'PUT',
      url: '/api/v2/assignments/assignment.grade8.homework.1/drafts/learner.fox',
      headers: { ...studentAuth, 'idempotency-key': 'draft-save-003', 'if-match': '0' },
      payload: { answers: { 'exercise.missing-hypotenuse-6-8': 8 }, version: 0 }
    });
    expect(stale.statusCode).toBe(409);
    const submission = await app.inject({
      method: 'POST',
      url: '/api/v2/assignments/assignment.grade8.homework.1/submit/learner.fox',
      headers: { ...studentAuth, 'idempotency-key': 'assignment-submit-001' },
      payload: { answers: { 'exercise.missing-hypotenuse-6-8': 10, 'exercise.rectangle-diagonal': 10 } }
    });
    expect(submission.statusCode).toBe(200);
    expect(submission.json().value.resolvedExercises[0].revision).toBe(1);
    const delivery = await app.inject({
      method: 'POST',
      url: '/api/v2/assessments/assessment.grade8.phase-closing/deliveries',
      headers: { cookie: auth, 'idempotency-key': 'delivery-generate-001' },
      payload: { learnerId: 'learner.fox' }
    });
    expect(delivery.statusCode).toBe(200);
    expect(delivery.json().value.questions.length).toBeGreaterThan(3);
    expect(delivery.json().value.strategyVersion).toBe('1.0.0');
    await app.close();
  });
});
