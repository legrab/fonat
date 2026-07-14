import { randomInt, randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import AdmZip from 'adm-zip';
import { z } from 'zod';
import {
  exercisePayloadSchema,
  nodeSchema,
  ok,
  err,
  type ExercisePayload,
  type LessonPayload,
  type SessionUser,
  type Submission,
  type Result
} from '@fonat/contracts';
import { validateContentPackage, type ContentPackage } from '@fonat/content-contracts';
import {
  capabilityCatalogue,
  coreModuleManifest,
  relationContracts,
  runCoreLessonValidators
} from '@fonat/core-module';
import {
  classifyRevision,
  deriveConceptState,
  gradeExercise,
  localize,
  recommendExercises
} from '@fonat/domain';
import { mathModuleManifest } from '@fonat/math-module';
import type { AppConfig } from './config.js';
import { clearSession, createSession, hashPassword, resolveUser, verifyPassword } from './auth.js';
import type { FonatRepository, LiveSessionRecord, UserRecord } from './repository/index.js';
import { buildDemoSeed, newActivity } from './seed.js';
import { analyzeAssessment, stableShuffle } from './services/assessment.js';

const commonCapabilities = {
  admin: [
    'users.manage',
    'settings.manage',
    'modules.manage',
    'seeds.manage',
    'content.import',
    'content.export',
    'health.read'
  ],
  teacher: [
    'content.manage',
    'classrooms.manage',
    'lessons.manage',
    'assessments.manage',
    'submissions.review',
    'content.import',
    'content.export'
  ]
};

function sendResult<T>(reply: FastifyReply, result: Result<T>) {
  const status = result.ok
    ? 200
    : result.error.code === 'permission_denied'
      ? 403
      : result.error.code === 'not_found'
        ? 404
        : result.error.code === 'conflict'
          ? 409
          : result.error.code === 'validation_failure'
            ? 400
            : 500;
  return reply.code(status).send(result);
}

function requireUser(request: FastifyRequest, reply: FastifyReply): SessionUser | null {
  if (!request.user) {
    void sendResult(reply, err({ code: 'permission_denied', message: 'Bejelentkezés szükséges.' }));
    return null;
  }
  return request.user;
}

function requireCapability(
  request: FastifyRequest,
  reply: FastifyReply,
  capability: string
): SessionUser | null {
  const user = requireUser(request, reply);
  if (!user) return null;
  if (!user.capabilities.includes(capability)) {
    void sendResult(reply, err({ code: 'permission_denied', message: `Hiányzó jogosultság: ${capability}` }));
    return null;
  }
  return user;
}

function parseBody<T>(schema: z.ZodType<T>, request: FastifyRequest, reply: FastifyReply): T | null {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    void sendResult(
      reply,
      err({ code: 'validation_failure', message: 'A kérés adatai hibásak.', details: result.error.flatten() })
    );
    return null;
  }
  return result.data;
}

async function record(
  repository: FonatRepository,
  type: string,
  message: string,
  targetId?: string,
  severity: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  await repository.insertActivity(newActivity(type, message, targetId, severity));
}

function packageFromZip(buffer: Buffer): ContentPackage {
  const zip = new AdmZip(buffer);
  const readJson = <T>(name: string): T => {
    const entry = zip.getEntry(name);
    if (!entry) throw new Error(`Missing ${name}`);
    return JSON.parse(entry.getData().toString('utf8')) as T;
  };
  const manifest = readJson<ContentPackage['manifest']>('package.json');
  const nodes = manifest.entrypoints.nodes.flatMap((file) => readJson<ContentPackage['nodes']>(file));
  const relations = manifest.entrypoints.relations.flatMap((file) =>
    readJson<ContentPackage['relations']>(file)
  );
  const markdown: Record<string, string> = {};
  for (const entry of zip.getEntries())
    if (!entry.isDirectory && entry.entryName.startsWith('content/'))
      markdown[entry.entryName.slice('content/'.length)] = entry.getData().toString('utf8');
  return { manifest, nodes, relations, markdown, assets: {} };
}

function packageToZip(pkg: ContentPackage): Buffer {
  const zip = new AdmZip();
  zip.addFile('package.json', Buffer.from(JSON.stringify(pkg.manifest, null, 2)));
  zip.addFile('nodes.json', Buffer.from(JSON.stringify(pkg.nodes, null, 2)));
  zip.addFile('relations.json', Buffer.from(JSON.stringify(pkg.relations, null, 2)));
  zip.addFile(
    'README.md',
    Buffer.from(`# ${pkg.manifest.name}\n\nFonat content package ${pkg.manifest.version}.\n`)
  );
  zip.addFile(
    'AUTHORING.md',
    Buffer.from('Run `npm run validate` in a Fonat content repository before importing this package.\n')
  );
  for (const [name, content] of Object.entries(pkg.markdown))
    zip.addFile(`content/${name}`, Buffer.from(content));
  return zip.toBuffer();
}

function createGuestIdentity(existing: LiveSessionRecord['participants']) {
  const animals = ['Borz', 'Delfin', 'Hód', 'Kakukk', 'Mókus', 'Pelikán', 'Sas', 'Tukán', 'Vidra', 'Zerge'];
  const icons = ['🦡', '🐬', '🦫', '🐦', '🐿️', '🦤', '🦅', '🐧', '🦦', '🐐'];
  for (let attempt = 0; attempt < animals.length * 3; attempt++) {
    const index = randomInt(animals.length);
    const suffix = existing.some((item) => item.nickname === animals[index]) ? ` ${randomInt(10, 99)}` : '';
    const nickname = `${animals[index]}${suffix}`;
    if (!existing.some((item) => item.nickname === nickname))
      return {
        nickname,
        badgeIcon: icons[index]!,
        badgeColor: ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'][index % 5]!
      };
  }
  return { nickname: `Vendég ${randomInt(100, 999)}`, badgeIcon: '✦', badgeColor: '#475569' };
}

export async function createApp(config: AppConfig, repository: FonatRepository): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.NODE_ENV === 'test' ? 'silent' : 'info' },
    bodyLimit: config.MAX_PACKAGE_BYTES
  });
  await app.register(cookie, { secret: config.SESSION_SECRET });
  await app.register(cors, {
    origin: config.WEB_ORIGIN.split(',').map((value) => value.trim()),
    credentials: true
  });
  await app.register(multipart, { limits: { fileSize: config.MAX_PACKAGE_BYTES, files: 1 } });
  app.decorateRequest('user', null);
  app.addHook('onRequest', async (request) => {
    request.user = await resolveUser(repository, request);
  });
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return payload;
  });

  app.get('/api/health', async () =>
    ok({
      status: 'ok',
      persistence: config.PERSISTENCE_MODE,
      assetProfile: config.ASSET_PROFILE,
      time: new Date().toISOString()
    })
  );
  app.get('/api/setup/status', async () => ok({ requiresBootstrap: (await repository.countUsers()) === 0 }));

  app.post('/api/setup/bootstrap', async (request, reply) => {
    if ((await repository.countUsers()) > 0)
      return sendResult(reply, err({ code: 'conflict', message: 'A kezdeti adminisztrátor már létrejött.' }));
    const body = parseBody(
      z.object({
        username: z.string().min(3),
        displayName: z.string().min(2),
        password: z.string().min(10),
        loadDemo: z.boolean().default(true)
      }),
      request,
      reply
    );
    if (!body) return;
    const user: UserRecord = {
      id: randomUUID(),
      username: body.username.toLocaleLowerCase(),
      displayName: body.displayName,
      passwordHash: await hashPassword(body.password),
      roles: ['site-admin', 'teacher'],
      capabilities: [...new Set([...commonCapabilities.admin, ...commonCapabilities.teacher])],
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await repository.upsertUser(user);
    if (body.loadDemo) await repository.resetAll(await buildDemoSeed(hashPassword));
    await createSession(repository, user, reply, config.NODE_ENV === 'production');
    await record(repository, 'user.bootstrap', 'A Fonat első adminisztrátora létrejött.', user.id, 'success');
    return ok({ user: { ...user, passwordHash: undefined }, demoLoaded: body.loadDemo });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = parseBody(z.object({ username: z.string(), password: z.string() }), request, reply);
    if (!body) return;
    const user = await repository.getUserByUsername(body.username);
    if (!user || !(await verifyPassword(user.passwordHash, body.password)))
      return sendResult(
        reply,
        err({ code: 'permission_denied', message: 'Hibás felhasználónév vagy jelszó.' })
      );
    await createSession(repository, user, reply, config.NODE_ENV === 'production');
    return ok({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roles: user.roles,
        capabilities: user.capabilities,
        mustChangePassword: user.mustChangePassword
      }
    });
  });
  app.post('/api/auth/logout', async (request, reply) => {
    await clearSession(repository, request, reply);
    return ok({ loggedOut: true });
  });
  app.get('/api/me', async (request, reply) =>
    request.user
      ? ok(request.user)
      : sendResult(reply, err({ code: 'permission_denied', message: 'Nincs aktív munkamenet.' }))
  );
  app.post('/api/auth/change-password', async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    const body = parseBody(
      z.object({ currentPassword: z.string(), newPassword: z.string().min(10) }),
      request,
      reply
    );
    if (!body) return;
    const recordUser = await repository.getUser(user.id);
    if (!recordUser || !(await verifyPassword(recordUser.passwordHash, body.currentPassword)))
      return sendResult(reply, err({ code: 'permission_denied', message: 'A jelenlegi jelszó hibás.' }));
    recordUser.passwordHash = await hashPassword(body.newPassword);
    recordUser.mustChangePassword = false;
    recordUser.updatedAt = new Date().toISOString();
    await repository.upsertUser(recordUser);
    await repository.deleteSessionsForUser(user.id);
    await createSession(repository, recordUser, reply, config.NODE_ENV === 'production');
    return ok({ changed: true });
  });

  app.get('/api/today', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const lessons = await repository.listNodes({ type: 'lesson', limit: 100 });
    const upcoming = lessons.items
      .filter((item) => (item.payload as LessonPayload).status === 'scheduled')
      .sort((a, b) =>
        String((a.payload as LessonPayload).date ?? '').localeCompare(
          String((b.payload as LessonPayload).date ?? '')
        )
      )
      .slice(0, 5);
    const submissions = await repository.listSubmissions({});
    const reviewCount = submissions.filter(
      (item) => item.status === 'submitted' || item.status === 'auto-checked' || item.status === 'returned'
    ).length;
    const activities = await repository.listActivities(10);
    return ok({
      nextLesson: upcoming[0] ?? null,
      upcoming,
      reviewCount,
      activities,
      quickActions: ['curriculum-free-lesson', 'new-exercise', 'generate-assessment']
    });
  });

  app.get('/api/nodes', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    const query = z
      .object({
        type: z.string().optional(),
        q: z.string().optional(),
        lifecycle: z.string().optional(),
        ids: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      })
      .safeParse(request.query);
    if (!query.success)
      return sendResult(
        reply,
        err({
          code: 'validation_failure',
          message: 'Hibás keresési paraméterek.',
          details: query.error.flatten()
        })
      );
    return ok(
      await repository.listNodes({
        type: query.data.type,
        query: query.data.q,
        lifecycle: query.data.lifecycle,
        ids: query.data.ids?.split(','),
        limit: query.data.limit,
        cursor: query.data.cursor
      })
    );
  });
  app.get('/api/nodes/:id', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    const id = (request.params as { id: string }).id;
    const item = await repository.getNode(id);
    if (!item) return sendResult(reply, err({ code: 'not_found', message: 'A tartalom nem található.' }));
    const [relations, revisions] = await Promise.all([
      repository.listRelations({ nodeIds: [id] }),
      repository.listRevisions(id)
    ]);
    const relatedIds = [
      ...new Set(
        relations
          .flatMap((relation) => [relation.sourceId, relation.targetId])
          .filter((value) => value !== id)
      )
    ];
    const related = relatedIds.length
      ? (await repository.listNodes({ ids: relatedIds, limit: 100 })).items
      : [];
    return ok({ node: item, relations, revisions, related });
  });
  app.post('/api/nodes', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const parsed = nodeSchema.safeParse(request.body);
    if (!parsed.success)
      return sendResult(
        reply,
        err({ code: 'validation_failure', message: 'A tartalom hibás.', details: parsed.error.flatten() })
      );
    if (await repository.getNode(parsed.data.id))
      return sendResult(reply, err({ code: 'conflict', message: 'Ez az azonosító már létezik.' }));
    await repository.upsertNode(parsed.data);
    await record(
      repository,
      'content.created',
      `${localize(parsed.data)} létrejött.`,
      parsed.data.id,
      'success'
    );
    return ok(parsed.data);
  });
  app.put('/api/nodes/:id', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const existing = await repository.getNode(id);
    if (!existing) return sendResult(reply, err({ code: 'not_found', message: 'A tartalom nem található.' }));
    const parsed = nodeSchema.safeParse({ ...(request.body as object), id });
    if (!parsed.success)
      return sendResult(
        reply,
        err({ code: 'validation_failure', message: 'A tartalom hibás.', details: parsed.error.flatten() })
      );
    parsed.data.updatedAt = new Date().toISOString();
    await repository.upsertNode(parsed.data);
    await record(repository, 'content.updated', `${localize(parsed.data)} mentve.`, id);
    return ok(parsed.data);
  });
  app.post('/api/nodes/:id/publish', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const existing = await repository.getNode(id);
    if (!existing) return sendResult(reply, err({ code: 'not_found', message: 'A tartalom nem található.' }));
    const body = parseBody(
      z.object({
        compatibility: z
          .enum(['presentation-only', 'content-equivalent', 'planning-impacting', 'contract-breaking'])
          .optional(),
        reason: z.string().optional()
      }),
      request,
      reply
    );
    if (!body) return;
    const previousRevision = await repository.getRevision(id, existing.currentRevision);
    const suggested = previousRevision
      ? classifyRevision(
          { ...existing, payload: previousRevision.payload, title: previousRevision.title },
          existing
        )
      : 'presentation-only';
    const revisionNumber = previousRevision ? existing.currentRevision + 1 : existing.currentRevision;
    existing.lifecycle = 'published';
    existing.currentRevision = revisionNumber;
    existing.updatedAt = new Date().toISOString();
    await repository.upsertNode(existing);
    await repository.insertRevision({
      id: `${id}:${revisionNumber}`,
      nodeId: id,
      revision: revisionNumber,
      compatibility: body.compatibility ?? suggested,
      compatibilityReason: body.reason,
      payload: structuredClone(existing.payload),
      title: existing.title,
      summary: existing.summary,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    });
    await record(
      repository,
      'content.published',
      `${localize(existing)} ${revisionNumber}. változata közzétéve.`,
      id,
      'success'
    );
    return ok({ node: existing, compatibility: body.compatibility ?? suggested });
  });

  app.get('/api/lessons/:id/validate', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    const lesson = await repository.getNode((request.params as { id: string }).id);
    if (!lesson || lesson.type !== 'lesson')
      return sendResult(reply, err({ code: 'not_found', message: 'Az óra nem található.' }));
    const ids = (lesson.payload as LessonPayload).sections.flatMap((section) => section.activityIds);
    const nodes = (await repository.listNodes({ ids, limit: 100 })).items;
    return ok(runCoreLessonValidators(lesson, nodes));
  });
  app.get('/api/lessons/:id/recommendations', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const lesson = await repository.getNode((request.params as { id: string }).id);
    if (!lesson || lesson.type !== 'lesson')
      return sendResult(reply, err({ code: 'not_found', message: 'Az óra nem található.' }));
    const query = z
      .object({ sectionId: z.string(), limit: z.coerce.number().min(1).max(20).default(10) })
      .safeParse(request.query);
    if (!query.success)
      return sendResult(reply, err({ code: 'validation_failure', message: 'Hiányzó óraszakasz.' }));
    const payload = lesson.payload as LessonPayload;
    const section = payload.sections.find((item) => item.id === query.data.sectionId);
    if (!section)
      return sendResult(reply, err({ code: 'not_found', message: 'Az óraszakasz nem található.' }));
    const exercises = await repository.listNodes({ type: 'exercise', lifecycle: 'published', limit: 100 });
    return ok(
      recommendExercises({
        exercises: exercises.items,
        conceptIds: payload.conceptIds,
        slotMinutes: section.durationMinutes,
        targetDifficulty: 3,
        alreadySelected: payload.sections.flatMap((item) => item.activityIds)
      }).slice(0, query.data.limit)
    );
  });

  app.post('/api/lesson-runs', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const body = parseBody(z.object({ lessonId: z.string() }), request, reply);
    if (!body) return;
    const lesson = await repository.getNode(body.lessonId);
    if (!lesson || lesson.type !== 'lesson')
      return sendResult(reply, err({ code: 'not_found', message: 'Az óra nem található.' }));
    const first = (lesson.payload as LessonPayload).sections[0];
    const run = {
      id: randomUUID(),
      lessonId: lesson.id,
      startedAt: new Date().toISOString(),
      currentSectionIndex: 0,
      currentSlideIndex: 0,
      status: 'running' as const,
      sectionStartedAt: new Date().toISOString(),
      extraMinutes: 0,
      completedSectionIds: [],
      skippedSectionIds: [],
      notes: [],
      updatedAt: new Date().toISOString()
    };
    await repository.upsertLessonRun(run);
    await record(
      repository,
      'lesson.started',
      `${localize(lesson)} elindult${first ? `: ${first.title}` : ''}.`,
      lesson.id,
      'success'
    );
    return ok(run);
  });
  app.get('/api/lesson-runs/:id', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    const run = await repository.getLessonRun((request.params as { id: string }).id);
    return run
      ? ok(run)
      : sendResult(reply, err({ code: 'not_found', message: 'Az órafutás nem található.' }));
  });
  app.patch('/api/lesson-runs/:id', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const id = (request.params as { id: string }).id;
    const run = await repository.getLessonRun(id);
    if (!run) return sendResult(reply, err({ code: 'not_found', message: 'Az órafutás nem található.' }));
    const body = parseBody(
      z.object({
        action: z.enum(['next', 'previous', 'pause', 'resume', 'extend', 'skip', 'finish', 'note']),
        minutes: z.number().optional(),
        note: z.string().optional()
      }),
      request,
      reply
    );
    if (!body) return;
    const lesson = await repository.getNode(run.lessonId);
    const sections = lesson?.type === 'lesson' ? (lesson.payload as LessonPayload).sections : [];
    if (body.action === 'next') {
      const current = sections[run.currentSectionIndex];
      if (current && !run.completedSectionIds.includes(current.id)) run.completedSectionIds.push(current.id);
      run.currentSectionIndex = Math.min(sections.length - 1, run.currentSectionIndex + 1);
      run.currentSlideIndex = 0;
      run.sectionStartedAt = new Date().toISOString();
    }
    if (body.action === 'previous') {
      run.currentSectionIndex = Math.max(0, run.currentSectionIndex - 1);
      run.currentSlideIndex = 0;
      run.sectionStartedAt = new Date().toISOString();
    }
    if (body.action === 'pause') run.status = 'paused';
    if (body.action === 'resume') run.status = 'running';
    if (body.action === 'extend') run.extraMinutes += body.minutes ?? 1;
    if (body.action === 'skip') {
      const current = sections[run.currentSectionIndex];
      if (current && !run.skippedSectionIds.includes(current.id)) run.skippedSectionIds.push(current.id);
      run.currentSectionIndex = Math.min(sections.length - 1, run.currentSectionIndex + 1);
      run.currentSlideIndex = 0;
    }
    if (body.action === 'note' && body.note)
      run.notes.push({ id: randomUUID(), text: body.note, createdAt: new Date().toISOString() });
    if (body.action === 'finish') {
      run.status = 'finished';
      run.finishedAt = new Date().toISOString();
      if (lesson?.type === 'lesson') {
        const payload = lesson.payload as LessonPayload;
        payload.status = 'completed';
        payload.runtimeSummary = {
          lessonRunId: run.id,
          completedSections: run.completedSectionIds.length,
          skippedSections: run.skippedSectionIds.length,
          extraMinutes: run.extraMinutes
        };
        lesson.payload = payload;
        lesson.updatedAt = new Date().toISOString();
        await repository.upsertNode(lesson);
      }
    }
    run.updatedAt = new Date().toISOString();
    await repository.upsertLessonRun(run);
    return ok(run);
  });

  app.post('/api/live-sessions', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const body = parseBody(
      z.object({
        lessonRunId: z.string().optional(),
        assessmentId: z.string().optional(),
        exerciseIds: z.array(z.string()).min(1),
        mode: z.enum(['teacher-paced', 'student-paced']).default('teacher-paced'),
        allowGuest: z.boolean().default(true),
        leaderboard: z.boolean().default(false)
      }),
      request,
      reply
    );
    if (!body) return;
    let code = String(randomInt(100000, 999999));
    while (await repository.getLiveSessionByCode(code)) code = String(randomInt(100000, 999999));
    const session: LiveSessionRecord = {
      id: randomUUID(),
      code,
      lessonRunId: body.lessonRunId,
      assessmentId: body.assessmentId,
      exerciseIds: body.exerciseIds,
      currentIndex: 0,
      mode: body.mode,
      status: 'lobby',
      allowGuest: body.allowGuest,
      leaderboard: body.leaderboard,
      answerOrderPolicy: 'stable-session',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await repository.upsertLiveSession(session);
    return ok({ ...session, joinUrl: `${config.WEB_ORIGIN.split(',')[0]}/student/join/${code}` });
  });
  app.post('/api/live-sessions/:code/join', async (request, reply) => {
    const code = (request.params as { code: string }).code;
    const session = await repository.getLiveSessionByCode(code);
    if (!session || session.status === 'closed')
      return sendResult(reply, err({ code: 'not_found', message: 'A munkamenet nem érhető el.' }));
    const body = parseBody(
      z.object({
        learnerId: z.string().optional(),
        classroomCode: z.string().optional(),
        secret: z.string().optional(),
        guest: z.boolean().default(false)
      }),
      request,
      reply
    );
    if (!body) return;
    let participant: LiveSessionRecord['participants'][number];
    if (body.learnerId && body.classroomCode && body.secret) {
      const accesses = await repository.findClassroomAccess(body.classroomCode, body.learnerId);
      const learner = await repository.getLearner(body.learnerId);
      if (!accesses[0] || !learner || !(await verifyPassword(accesses[0].secretHash, body.secret)))
        return sendResult(
          reply,
          err({ code: 'permission_denied', message: 'A tanulói azonosítás sikertelen.' })
        );
      participant = {
        id: randomUUID(),
        learnerId: learner.id,
        nickname: learner.nickname,
        badgeIcon: learner.badgeIcon,
        badgeColor: learner.badgeColor,
        joinedAt: new Date().toISOString()
      };
    } else {
      if (!session.allowGuest || !body.guest)
        return sendResult(
          reply,
          err({ code: 'permission_denied', message: 'Vendégként nem lehet csatlakozni.' })
        );
      const identity = createGuestIdentity(session.participants);
      participant = {
        id: randomUUID(),
        ...identity,
        claimCode: String(randomInt(100000, 999999)),
        joinedAt: new Date().toISOString()
      };
    }
    session.participants.push(participant);
    session.updatedAt = new Date().toISOString();
    await repository.upsertLiveSession(session);
    return ok({ participant, session: { code: session.code, status: session.status, mode: session.mode } });
  });
  app.get('/api/live-sessions/:code/poll', async (request, reply) => {
    const session = await repository.getLiveSessionByCode((request.params as { code: string }).code);
    if (!session)
      return sendResult(reply, err({ code: 'not_found', message: 'A munkamenet nem található.' }));
    const currentExerciseId = session.exerciseIds[session.currentIndex];
    const exercise = currentExerciseId ? await repository.getNode(currentExerciseId) : null;
    const submissions = await repository.listSubmissions({
      liveSessionId: session.id,
      exerciseId: currentExerciseId
    });
    const distribution: Record<string, number> = {};
    for (const submission of submissions) {
      const key = Array.isArray(submission.normalizedAnswer)
        ? submission.normalizedAnswer.join(',')
        : String(submission.normalizedAnswer ?? submission.answer);
      distribution[key] = (distribution[key] ?? 0) + 1;
    }
    return ok({
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        mode: session.mode,
        currentIndex: session.currentIndex,
        total: session.exerciseIds.length,
        participantCount: session.participants.length,
        leaderboard: session.leaderboard
      },
      exercise: exercise
        ? {
            ...exercise,
            payload:
              session.status === 'revealed'
                ? exercise.payload
                : {
                    ...(exercise.payload as object),
                    expected: undefined,
                    options: (exercise.payload as ExercisePayload).options.map((option) => ({
                      id: option.id,
                      text: option.text
                    }))
                  }
          }
        : null,
      answerCount: submissions.length,
      distribution: session.status === 'revealed' ? distribution : undefined
    });
  });
  app.patch('/api/live-sessions/:code', async (request, reply) => {
    if (!requireCapability(request, reply, 'lessons.manage')) return;
    const session = await repository.getLiveSessionByCode((request.params as { code: string }).code);
    if (!session)
      return sendResult(reply, err({ code: 'not_found', message: 'A munkamenet nem található.' }));
    const body = parseBody(
      z.object({
        action: z.enum(['open', 'reveal', 'next', 'previous', 'close']),
        leaderboard: z.boolean().optional()
      }),
      request,
      reply
    );
    if (!body) return;
    if (body.action === 'open') session.status = 'open';
    if (body.action === 'reveal') session.status = 'revealed';
    if (body.action === 'next') {
      session.currentIndex = Math.min(session.exerciseIds.length - 1, session.currentIndex + 1);
      session.status = 'open';
    }
    if (body.action === 'previous') {
      session.currentIndex = Math.max(0, session.currentIndex - 1);
      session.status = 'open';
    }
    if (body.action === 'close') session.status = 'closed';
    if (typeof body.leaderboard === 'boolean') session.leaderboard = body.leaderboard;
    session.updatedAt = new Date().toISOString();
    await repository.upsertLiveSession(session);
    return ok(session);
  });
  app.post('/api/live-sessions/:code/answer', async (request, reply) => {
    const session = await repository.getLiveSessionByCode((request.params as { code: string }).code);
    if (!session || session.status !== 'open')
      return sendResult(
        reply,
        err({ code: 'conflict', message: 'Erre a kérdésre most nem fogadunk választ.' })
      );
    const body = parseBody(
      z.object({
        participantId: z.string(),
        answer: z.unknown(),
        evidence: z.record(z.string(), z.unknown()).default({})
      }),
      request,
      reply
    );
    if (!body) return;
    const participant = session.participants.find((item) => item.id === body.participantId);
    if (!participant)
      return sendResult(
        reply,
        err({ code: 'permission_denied', message: 'A résztvevő nem tartozik ehhez a munkamenethez.' })
      );
    const exerciseId = session.exerciseIds[session.currentIndex];
    const exerciseNode = await repository.getNode(exerciseId!);
    if (!exerciseNode || exerciseNode.type !== 'exercise')
      return sendResult(reply, err({ code: 'not_found', message: 'A kérdés nem érhető el.' }));
    const existing = (
      await repository.listSubmissions({
        liveSessionId: session.id,
        exerciseId,
        learnerId: participant.learnerId ?? participant.id
      })
    ).length;
    const graded = gradeExercise(exercisePayloadSchema.parse(exerciseNode.payload), body.answer);
    const submission: Submission = {
      id: randomUUID(),
      learnerId: participant.learnerId ?? participant.id,
      exerciseId: exerciseId!,
      assessmentId: session.assessmentId,
      liveSessionId: session.id,
      attempt: existing + 1,
      answer: body.answer,
      normalizedAnswer: graded.ok ? graded.value.normalizedAnswer : body.answer,
      automaticScore: graded.ok ? graded.value.score : undefined,
      maxScore: graded.ok ? graded.value.maxScore : 1,
      status: graded.ok && graded.value.manualReview ? 'submitted' : 'auto-checked',
      feedback: graded.ok ? graded.value.explanation : graded.error.message,
      evidence: body.evidence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await repository.upsertSubmission(submission);
    if (participant.learnerId)
      for (const conceptId of (exerciseNode.payload as ExercisePayload).concepts)
        await repository.upsertEvidence({
          id: randomUUID(),
          learnerId: participant.learnerId,
          conceptIds: [conceptId],
          submissionId: submission.id,
          type: 'answer',
          value: { score: submission.automaticScore, evidence: body.evidence },
          createdAt: new Date().toISOString()
        });
    return ok({ submission, immediateFeedback: undefined });
  });

  app.get('/api/classrooms/:id/learners', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    return ok(await repository.listLearners((request.params as { id: string }).id));
  });
  app.get('/api/learners/:id/overview', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    const learner = await repository.getLearner((request.params as { id: string }).id);
    if (!learner) return sendResult(reply, err({ code: 'not_found', message: 'A tanuló nem található.' }));
    const [submissions, evidence] = await Promise.all([
      repository.listSubmissions({ learnerId: learner.id }),
      repository.listEvidence({ learnerId: learner.id })
    ]);
    const conceptIds = [...new Set(evidence.flatMap((item) => item.conceptIds))];
    const states = conceptIds.map((conceptId) => {
      const relevant = submissions.filter((submission) => {
        const evidenceItem = evidence.find((item) => item.submissionId === submission.id);
        return evidenceItem?.conceptIds.includes(conceptId);
      });
      return { conceptId, ...deriveConceptState(relevant) };
    });
    return ok({ learner, submissions, evidence, conceptStates: states });
  });

  app.post('/api/assessments/generate', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    const body = parseBody(
      z.object({
        title: z.string(),
        classroomId: z.string(),
        phaseId: z.string().optional(),
        conceptIds: z.array(z.string()).min(1),
        questionCount: z.number().int().min(1).max(20),
        variants: z.number().int().min(1).max(4).default(2),
        allowAlternatives: z.boolean().default(true),
        allowReduced: z.boolean().default(true)
      }),
      request,
      reply
    );
    if (!body) return;
    const candidates = await repository.listNodes({ type: 'exercise', lifecycle: 'published', limit: 100 });
    const ranked = recommendExercises({
      exercises: candidates.items,
      conceptIds: body.conceptIds,
      slotMinutes: 7,
      targetDifficulty: 3
    });
    if (!ranked.length)
      return sendResult(
        reply,
        err({
          code: 'validation_failure',
          message: 'Nem található megfelelő feladat. Adj hozzá vagy szélesítsd a feltételeket.'
        })
      );
    const selected = ranked.slice(0, Math.min(body.questionCount, ranked.length)).map((item) => item.node.id);
    const deferred =
      selected.length < body.questionCount
        ? Array.from(
            { length: body.questionCount - selected.length },
            (_, index) => `unfilled-${selected.length + index + 1}`
          )
        : [];
    if (deferred.length && !body.allowReduced)
      return sendResult(
        reply,
        err({
          code: 'validation_failure',
          message: `${deferred.length} kérdéshelyet nem lehet kitölteni.`,
          details: { available: selected.length, requested: body.questionCount }
        })
      );
    const assessmentId = `assessment.teacher.${randomUUID()}`;
    const variants: Record<string, string[]> = {};
    for (let index = 0; index < body.variants; index++)
      variants[String.fromCharCode(65 + index)] = stableShuffle(selected, `${assessmentId}:${index}`);
    const assessment = nodeSchema.parse({
      id: assessmentId,
      type: 'assessment',
      title: { canonicalLanguage: 'hu', values: { hu: body.title } },
      lifecycle: 'published',
      quality: 'experimental',
      currentRevision: 1,
      payload: {
        classroomId: body.classroomId,
        phaseId: body.phaseId,
        conceptIds: body.conceptIds,
        variants,
        deferredCoverage: deferred,
        reduced: deferred.length > 0,
        disclaimer: deferred.length ? 'A létrehozott értékelés rövidebb az eredeti kérésnél.' : undefined
      },
      extensions: {},
      provenance: { origin: 'teacher' },
      rights: { status: 'teacher-owned', redistributionAllowed: false },
      tags: ['értékelés'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await repository.upsertNode(assessment);
    await repository.insertRevision({
      id: `${assessmentId}:1`,
      nodeId: assessmentId,
      revision: 1,
      compatibility: 'presentation-only',
      payload: assessment.payload,
      title: assessment.title,
      createdAt: new Date().toISOString(),
      createdBy: request.user!.id
    });
    await record(
      repository,
      'assessment.generated',
      `${body.title} létrejött ${selected.length} kérdéssel.`,
      assessmentId,
      deferred.length ? 'warning' : 'success'
    );
    return ok({
      assessment,
      selected,
      deferred,
      ranking: ranked
        .slice(0, body.questionCount)
        .map((item) => ({ id: item.node.id, score: item.score, reasons: item.reasons }))
    });
  });
  app.get('/api/assessments/:id/analysis', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    return ok(await analyzeAssessment(repository, (request.params as { id: string }).id));
  });
  app.post('/api/submissions/:id/review', async (request, reply) => {
    if (!requireCapability(request, reply, 'submissions.review')) return;
    const submission = await repository.getSubmission((request.params as { id: string }).id);
    if (!submission) return sendResult(reply, err({ code: 'not_found', message: 'A beadás nem található.' }));
    const body = parseBody(
      z.object({
        teacherScore: z.number().min(0),
        feedback: z.string().optional(),
        status: z.enum(['reviewed', 'returned', 'accepted'])
      }),
      request,
      reply
    );
    if (!body) return;
    submission.teacherScore = Math.min(body.teacherScore, submission.maxScore);
    submission.feedback = body.feedback;
    submission.status = body.status;
    submission.updatedAt = new Date().toISOString();
    await repository.upsertSubmission(submission);
    await record(
      repository,
      'submission.reviewed',
      'Egy beadás tanári ellenőrzése elkészült.',
      submission.id,
      'success'
    );
    return ok(submission);
  });

  app.get('/api/activity', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    return ok(await repository.listActivities(30));
  });
  app.get('/api/notifications', async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    return ok(await repository.listNotifications(user.id));
  });

  app.get('/api/admin/health', async (request, reply) => {
    if (!requireCapability(request, reply, 'health.read')) return;
    return ok({
      application: { name: 'Fonat', version: '0.1.0', node: process.version },
      persistence: { mode: config.PERSISTENCE_MODE, nodeCount: await repository.countNodes() },
      deployment: {
        assetProfile: config.ASSET_PROFILE,
        maxPackageBytes: config.MAX_PACKAGE_BYTES,
        maxUploadBytes: config.MAX_UPLOAD_BYTES
      },
      modules: [coreModuleManifest, mathModuleManifest],
      capabilities: capabilityCatalogue,
      relationContracts
    });
  });
  app.post('/api/admin/demo/reset', async (request, reply) => {
    if (!requireCapability(request, reply, 'seeds.manage')) return;
    await repository.resetAll(await buildDemoSeed(hashPassword));
    await record(
      repository,
      'demo.reset',
      'A demonstrációs munkatér visszaállt az eredeti állapotba.',
      undefined,
      'success'
    );
    return ok({ reset: true, nodes: await repository.countNodes() });
  });

  app.get('/api/packages/export', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.export')) return;
    const query = z.object({ packageId: z.string().optional() }).safeParse(request.query);
    if (!query.success)
      return sendResult(reply, err({ code: 'validation_failure', message: 'Hibás csomagazonosító.' }));
    const nodes = (await repository.listNodes({ limit: 100 })).items.filter(
      (item) => !query.data.packageId || item.provenance.packageId === query.data.packageId
    );
    const ids = new Set(nodes.map((item) => item.id));
    const relations = (await repository.listRelations({ nodeIds: [...ids] })).filter(
      (item) => ids.has(item.sourceId) && ids.has(item.targetId)
    );
    const packageId = query.data.packageId ?? `fonat.export.${new Date().toISOString().slice(0, 10)}`;
    const pkg: ContentPackage = {
      manifest: {
        contractVersion: '1.0.0',
        packageId,
        name: `Fonat export ${packageId}`,
        version: '1.0.0',
        language: 'hu',
        license: 'Per-item metadata',
        dependencies: {},
        capabilities: [],
        entrypoints: { nodes: ['nodes.json'], relations: ['relations.json'] }
      },
      nodes,
      relations,
      markdown: {},
      assets: {}
    };
    const buffer = packageToZip(pkg);
    reply.header('Content-Type', 'application/zip');
    reply.header('Content-Disposition', `attachment; filename="${packageId}.zip"`);
    return reply.send(buffer);
  });
  app.post('/api/packages/stage', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.import')) return;
    const file = await request.file();
    if (!file)
      return sendResult(reply, err({ code: 'validation_failure', message: 'Hiányzik a ZIP csomag.' }));
    const buffer = await file.toBuffer();
    let pkg: ContentPackage;
    try {
      pkg = packageFromZip(buffer);
    } catch (error) {
      return sendResult(
        reply,
        err({
          code: 'validation_failure',
          message: 'A ZIP nem olvasható Fonat csomagként.',
          details: error instanceof Error ? error.message : String(error)
        })
      );
    }
    const validation = validateContentPackage(pkg, {
      maxAssetBytes: config.MAX_UPLOAD_BYTES,
      allowedCapabilities: ['math.katex', 'math.2d-plot', 'math.numeric-grading']
    });
    const existing = await repository.listNodes({ ids: pkg.nodes.map((item) => item.id), limit: 100 });
    const existingIds = new Set(existing.items.map((item) => item.id));
    return ok({
      validation,
      summary: {
        additions: pkg.nodes.filter((item) => !existingIds.has(item.id)).length,
        updates: pkg.nodes.filter((item) => existingIds.has(item.id)).length,
        relations: pkg.relations.length
      },
      stagedPackage: validation.valid ? pkg : undefined
    });
  });
  app.post('/api/packages/apply', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.import')) return;
    const body = parseBody(z.object({ package: z.unknown() }), request, reply);
    if (!body) return;
    const validation = validateContentPackage(body.package, {
      maxAssetBytes: config.MAX_UPLOAD_BYTES,
      allowedCapabilities: ['math.katex', 'math.2d-plot', 'math.numeric-grading']
    });
    if (!validation.valid || !validation.package)
      return sendResult(
        reply,
        err({ code: 'validation_failure', message: 'A csomag már nem érvényes.', details: validation.issues })
      );
    for (const item of validation.package.nodes) await repository.upsertNode(item);
    for (const relation of validation.package.relations) await repository.upsertRelation(relation);
    await record(
      repository,
      'package.imported',
      `${validation.package.manifest.name} importálva.`,
      validation.package.manifest.packageId,
      'success'
    );
    return ok({
      applied: true,
      nodes: validation.package.nodes.length,
      relations: validation.package.relations.length
    });
  });

  app.get('/api/ai-bundles/missing-exercises', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.export')) return;
    const query = z.object({ conceptIds: z.string().min(1) }).safeParse(request.query);
    if (!query.success)
      return sendResult(
        reply,
        err({ code: 'validation_failure', message: 'Adj meg legalább egy fogalmat.' })
      );
    const conceptIds = query.data.conceptIds.split(',');
    const concepts = (await repository.listNodes({ ids: conceptIds, limit: 100 })).items;
    const exercises = (await repository.listNodes({ type: 'exercise', limit: 100 })).items.filter((item) =>
      (item.payload as ExercisePayload).concepts.some((id) => conceptIds.includes(id))
    );
    const zip = new AdmZip();
    zip.addFile(
      'README-PROMPT.md',
      Buffer.from(
        `# Fonat AI task: missing exercises\n\nAsk the teacher at most 5 focused questions, then generate a valid Fonat content package. Preserve the pinned contract version.\n\nConcepts: ${conceptIds.join(', ')}\n`
      )
    );
    zip.addFile('selected-concepts.json', Buffer.from(JSON.stringify(concepts, null, 2)));
    zip.addFile('existing-exercises.json', Buffer.from(JSON.stringify(exercises, null, 2)));
    zip.addFile(
      'expected-output.md',
      Buffer.from(
        'Return package.json, nodes.json, relations.json, README.md and AUTHORING.md. Do not include executable code.\n'
      )
    );
    reply.header('Content-Type', 'application/zip');
    reply.header('Content-Disposition', 'attachment; filename="fonat-missing-exercises-ai-bundle.zip"');
    return reply.send(zip.toBuffer());
  });

  app.get('/api/github/source', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.import')) return;
    const query = z
      .object({
        owner: z.string(),
        repo: z.string(),
        ref: z.string().default('main'),
        root: z.string().default('')
      })
      .safeParse(request.query);
    if (!query.success)
      return sendResult(reply, err({ code: 'validation_failure', message: 'Hibás GitHub forrás.' }));
    const url = `https://api.github.com/repos/${encodeURIComponent(query.data.owner)}/${encodeURIComponent(query.data.repo)}/zipball/${encodeURIComponent(query.data.ref)}`;
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Fonat/0.1' },
        redirect: 'follow'
      });
      if (!response.ok)
        return sendResult(
          reply,
          err({
            code: 'dependency_unavailable',
            message: `A GitHub ${response.status} választ adott.`,
            retryable: response.status >= 500
          })
        );
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > config.MAX_PACKAGE_BYTES * 4)
        return sendResult(
          reply,
          err({
            code: 'validation_failure',
            message: 'A repository pillanatkép túl nagy ehhez a telepítéshez.'
          })
        );
      const zip = new AdmZip(buffer);
      const packageEntries = zip
        .getEntries()
        .filter(
          (entry) =>
            entry.entryName.endsWith('/package.json') &&
            (!query.data.root || entry.entryName.includes(`/${query.data.root.replace(/^\/+|\/+$/g, '')}/`))
        );
      return ok({
        source: { owner: query.data.owner, repo: query.data.repo, ref: query.data.ref },
        packages: packageEntries.map((entry) => ({
          path: entry.entryName.replace(/\/package.json$/, ''),
          manifest: JSON.parse(entry.getData().toString('utf8')) as unknown
        }))
      });
    } catch (error) {
      return sendResult(
        reply,
        err({
          code: 'dependency_unavailable',
          message: 'A GitHub forrás nem érhető el.',
          details: error instanceof Error ? error.message : String(error),
          retryable: true
        })
      );
    }
  });

  app.get('/api/guide', async (request, reply) => {
    if (!requireUser(request, reply)) return;
    return ok({
      tabs: [
        {
          id: 'structure',
          title: 'Tanítási szerkezet',
          terms: [
            {
              term: 'Éves terv',
              description: 'Egy osztály tanévre szóló, fokozatosan részletezhető lefedettségi és óraterve.'
            },
            { term: 'Fázis', description: 'Összetartozó órák tematikus vagy projektalapú csoportja.' },
            { term: 'Óra', description: 'Konkrét tervezett vagy megtartott tanórai esemény.' },
            { term: 'Óraszakasz', description: 'Az óra időzített szerkezeti része.' },
            {
              term: 'Tevékenység',
              description: 'Amit a tanár vagy a tanulók egy óraszakaszban ténylegesen végeznek.'
            }
          ]
        },
        {
          id: 'content',
          title: 'Oktatási tartalom',
          terms: [
            { term: 'Fogalom', description: 'Tantervtől független tudás, készség, módszer vagy tévképzet.' },
            {
              term: 'Tantervi elvárás',
              description:
                'Megadja, hogy egy tantervben egy vagy több fogalmat milyen mélységben és mikorra kell feldolgozni.'
            },
            {
              term: 'Forrás',
              description: 'Tanítás közben használt újrafelhasználható magyarázat, ábra vagy hivatkozás.'
            },
            { term: 'Feladat', description: 'Tanulói cselekvést vagy választ kérő, értékelhető tartalom.' },
            {
              term: 'Értékelés',
              description: 'Fogalmak és készségek ellenőrzésére összeállított feladatsor.'
            }
          ]
        },
        {
          id: 'planning',
          title: 'Tervezési beállítások',
          terms: [
            {
              term: 'Tanítási profil',
              description:
                'A tanári stílus, csoportigények és differenciálási preferenciák újrafelhasználható beállítása.'
            },
            {
              term: 'Óravázlat',
              description: 'Az óra szakaszait, időkereteit és betöltendő helyeit leíró szerkezet.'
            },
            {
              term: 'Óraelrendezés',
              description: 'A nyomtatható vagy vetített tanári anyag vizuális megjelenése.'
            }
          ]
        },
        {
          id: 'progress',
          title: 'Tanulók és haladás',
          terms: [
            {
              term: 'Tanulói profil',
              description: 'A tanuló állandó belső azonosítója, beceneve, jelvénye és fejlődési adatai.'
            },
            {
              term: 'Tanulási bizonyíték',
              description:
                'Válasz, magyarázat, javítás, megfigyelés vagy más adat, amely egy tanulási folyamatot mutat.'
            },
            {
              term: 'Fogalomállapot',
              description:
                'A friss bizonyítékokból magyarázhatóan levezetett, tanár által felülírható áttekintő állapot.'
            }
          ]
        },
        {
          id: 'platform',
          title: 'Platform',
          terms: [
            {
              term: 'Csomópont',
              description: 'A tudásgráfban kapcsolható oktatási vagy tervezési objektum.'
            },
            {
              term: 'Kapcsolat',
              description:
                'Két csomópont között regisztrált jelentésű, irányított vagy szimmetrikus összeköttetés.'
            },
            {
              term: 'Változat',
              description: 'Egy közzétett tartalom azonosítható állapota, amelyhez órák rögzíthetők.'
            },
            {
              term: 'Tartalomcsomag',
              description:
                'Verziózott, ellenőrizhető mappa vagy ZIP csomópontokkal, kapcsolatokkal és kísérő fájlokkal.'
            },
            {
              term: 'Képességmodul',
              description:
                'Megbízható fejlesztői kódcsomag új feladattípusokkal, megjelenítőkkel vagy ellenőrzőkkel.'
            }
          ]
        }
      ]
    });
  });

  const webDist = path.resolve(process.cwd(), 'apps/web/dist');
  try {
    await access(webDist);
    await app.register(fastifyStatic, { root: webDist, wildcard: false });
    app.get('/*', async (_request, reply) => reply.sendFile('index.html'));
  } catch {
    // Development runs Vite separately.
  }

  return app;
}
