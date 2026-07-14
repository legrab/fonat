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
  SESSION_SECRET: 'integration-test-session-secret',
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

function cookieFrom(response: { headers: Record<string, string | string[] | undefined> }) {
  const header = response.headers['set-cookie'];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.split(';')[0] ?? '';
}

describe('Fonat API golden workflow', () => {
  let repository: MemoryFonatRepository;
  beforeEach(async () => {
    repository = new MemoryFonatRepository();
    await repository.init();
  });

  it('bootstraps, recommends content, runs a quiz, and analyzes seeded results', async () => {
    const app = await createApp(config, repository);
    const bootstrap = await app.inject({
      method: 'POST',
      url: '/api/setup/bootstrap',
      payload: {
        username: 'admin',
        displayName: 'Teacher',
        password: 'very-secure-test-password',
        loadDemo: true
      }
    });
    expect(bootstrap.statusCode).toBe(200);
    const cookie = cookieFrom(bootstrap);

    const recommendation = await app.inject({
      method: 'GET',
      url: '/api/lessons/lesson.grade8.04/recommendations?sectionId=lesson.grade8.04.section.3',
      headers: { cookie }
    });
    expect(recommendation.statusCode).toBe(200);
    expect(recommendation.json().value.length).toBeGreaterThan(0);

    const createLive = await app.inject({
      method: 'POST',
      url: '/api/live-sessions',
      headers: { cookie },
      payload: {
        exerciseIds: ['exercise.missing-hypotenuse-6-8'],
        mode: 'teacher-paced',
        allowGuest: true,
        leaderboard: false
      }
    });
    const live = createLive.json().value as { code: string };
    await app.inject({
      method: 'PATCH',
      url: `/api/live-sessions/${live.code}`,
      headers: { cookie },
      payload: { action: 'open' }
    });
    const joined = await app.inject({
      method: 'POST',
      url: `/api/live-sessions/${live.code}/join`,
      payload: { guest: true }
    });
    const participantId = joined.json().value.participant.id as string;
    const participantToken = joined.json().value.participantToken as string;
    const answer = await app.inject({
      method: 'POST',
      url: `/api/live-sessions/${live.code}/answer`,
      payload: { participantId, participantToken, answer: 10, evidence: { confidence: 4 } }
    });
    expect(answer.statusCode).toBe(200);
    expect(answer.json().value.submission.automaticScore).toBe(1);

    const analysis = await app.inject({
      method: 'GET',
      url: '/api/assessments/assessment.grade8.formative/analysis',
      headers: { cookie }
    });
    expect(analysis.statusCode).toBe(200);
    expect(analysis.json().value.findings.length).toBeGreaterThanOrEqual(3);
    await app.close();
  });

  it('publishes revisions and reports lesson timing findings', async () => {
    const app = await createApp(config, repository);
    const bootstrap = await app.inject({
      method: 'POST',
      url: '/api/setup/bootstrap',
      payload: {
        username: 'admin',
        displayName: 'Teacher',
        password: 'very-secure-test-password',
        loadDemo: true
      }
    });
    const cookie = cookieFrom(bootstrap);
    const publish = await app.inject({
      method: 'POST',
      url: '/api/nodes/exercise.missing-hypotenuse-6-8/publish',
      headers: { cookie },
      payload: { compatibility: 'planning-impacting', reason: 'test' }
    });
    expect(publish.statusCode).toBe(200);
    const validation = await app.inject({
      method: 'GET',
      url: '/api/lessons/lesson.grade8.06/validate',
      headers: { cookie }
    });
    expect(
      validation.json().value.some((finding: { code: string }) => finding.code === 'lesson.duration-mismatch')
    ).toBe(true);
    await app.close();
  });
});
