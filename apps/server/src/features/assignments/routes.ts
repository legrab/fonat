import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { answerDraftSchema, assignmentSchema, gradeEntrySchema, type Assignment } from '@fonat/contracts';
import { hashToken, verifyPassword } from '../../auth.js';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { idempotencyKey, requireCapability, sendResult } from '../shared/http.js';
import { withIdempotency } from '../shared/idempotency.js';
import { AssignmentService } from './service.js';
import {
  learnerCanAccessCourse,
  requireStudentForLearner,
  resolveStudent,
  type StudentAccessToken
} from '../shared/student-access.js';

export async function registerAssignmentRoutes(
  app: FastifyInstance,
  repository: FonatRepository,
  clock: Clock
) {
  const service = new AssignmentService(repository, clock);

  app.post(
    '/api/v2/student/access',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = z
        .object({ classroomCode: z.string().min(1), learnerId: z.string().min(1), secret: z.string().min(1) })
        .safeParse(request.body);
      if (!parsed.success)
        return sendResult(reply, {
          ok: false,
          error: { code: 'validation_failure', message: 'Hiányos tanulói hozzáférés.' }
        });
      const accesses = await repository.findClassroomAccess(parsed.data.classroomCode, parsed.data.learnerId);
      if (!accesses[0] || !(await verifyPassword(accesses[0].secretHash, parsed.data.secret)))
        return sendResult(reply, {
          ok: false,
          error: {
            code: 'permission_denied',
            message: 'Hibás osztálykód, tanulói azonosító vagy személyes kód.'
          }
        });
      const token = randomBytes(32).toString('base64url');
      const now = clock.now();
      const expiresAt = now.add({ hours: 12 }).toString();
      await repository.upsertRecord<StudentAccessToken>('studentAccessTokens', {
        id: hashToken(token),
        learnerId: parsed.data.learnerId,
        createdAt: now.toString(),
        expiresAt
      });
      return sendResult(reply, { ok: true, value: { token, learnerId: parsed.data.learnerId, expiresAt } });
    }
  );

  app.get('/api/v2/student/assignments', async (request, reply) => {
    const student = await resolveStudent(request, repository);
    if (!student)
      return sendResult(reply, {
        ok: false,
        error: { code: 'permission_denied', message: 'Tanulói belépés szükséges.' }
      });
    const page = await service.list();
    const visible: Assignment[] = [];
    for (const assignment of page.items) {
      if (assignment.status !== 'assigned') continue;
      if (assignment.targetLearnerIds.length && !assignment.targetLearnerIds.includes(student.learnerId))
        continue;
      if (await learnerCanAccessCourse(repository, student.learnerId, assignment.courseId))
        visible.push(assignment);
    }
    return sendResult(reply, { ok: true, value: { items: visible, hasMore: false } });
  });

  app.get('/api/v2/student/assignments/:id', async (request, reply) => {
    const student = await resolveStudent(request, repository);
    if (!student)
      return sendResult(reply, {
        ok: false,
        error: { code: 'permission_denied', message: 'Tanulói belépés szükséges.' }
      });
    const assignment = await repository.getRecord<Assignment>(
      'assignments',
      (request.params as { id: string }).id
    );
    if (
      !assignment ||
      assignment.status !== 'assigned' ||
      !(await learnerCanAccessCourse(repository, student.learnerId, assignment.courseId))
    )
      return sendResult(reply, {
        ok: false,
        error: { code: 'not_found', message: 'A kiosztás nem található.' }
      });
    if (assignment.targetLearnerIds.length && !assignment.targetLearnerIds.includes(student.learnerId))
      return sendResult(reply, {
        ok: false,
        error: { code: 'permission_denied', message: 'Ez a kiosztás nem neked szól.' }
      });
    const exercises = [];
    for (const reference of assignment.exerciseRefs) {
      const node = await repository.getNode(reference.nodeId);
      const revision = await repository.getRevision(reference.nodeId, reference.revision);
      if (!node) continue;
      exercises.push({
        id: node.id,
        revision: reference.revision,
        title: revision?.title ?? node.title,
        payload: revision?.payload ?? node.payload
      });
    }
    return sendResult(reply, { ok: true, value: { assignment, exercises, learnerId: student.learnerId } });
  });
  app.get('/api/v2/assignments', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    const courseId = (request.query as { courseId?: string }).courseId;
    return sendResult(reply, { ok: true, value: await service.list(courseId) });
  });
  app.post('/api/v2/assignments', async (request, reply) => {
    const user = requireCapability(request, reply, 'assessments.manage');
    if (!user) return;
    const now = clock.iso();
    const parsed = assignmentSchema.safeParse({
      ...(request.body as object),
      createdBy: user.id,
      createdAt: (request.body as Assignment)?.createdAt ?? now,
      updatedAt: now
    });
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás assignment.', details: parsed.error.flatten() }
      });
    return sendResult(reply, await service.create(parsed.data));
  });
  app.put('/api/v2/assignments/:id', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    const parsed = assignmentSchema.safeParse({
      ...(request.body as object),
      id: (request.params as { id: string }).id
    });
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás assignment.', details: parsed.error.flatten() }
      });
    return sendResult(reply, await service.update(parsed.data, Number(request.headers['if-match'])));
  });
  app.post('/api/v2/assignments/:id/transition', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    const parsed = z
      .object({ status: assignmentSchema.shape.status, expectedVersion: z.number().int().nonnegative() })
      .safeParse(request.body);
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: 'Hibás állapotváltás.',
          details: parsed.error.flatten()
        }
      });
    return sendResult(
      reply,
      await service.changeStatus(
        (request.params as { id: string }).id,
        parsed.data.status,
        parsed.data.expectedVersion
      )
    );
  });
  app.get('/api/v2/assignments/:id/drafts/:learnerId', async (request, reply) => {
    const params = request.params as { id: string; learnerId: string };
    if (!(await requireStudentForLearner(request, reply, repository, params.learnerId))) return;
    return sendResult(reply, await service.getDraft(params.id, params.learnerId));
  });
  app.put('/api/v2/assignments/:id/drafts/:learnerId', async (request, reply) => {
    const params = request.params as { id: string; learnerId: string };
    if (!(await requireStudentForLearner(request, reply, repository, params.learnerId))) return;
    const parsed = answerDraftSchema.safeParse({
      ...(request.body as object),
      id: `${params.id}:${params.learnerId}`,
      assignmentId: params.id,
      learnerId: params.learnerId,
      updatedAt: clock.iso()
    });
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás piszkozat.', details: parsed.error.flatten() }
      });
    const key = idempotencyKey(request);
    if (!key)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Idempotency-Key szükséges.' }
      });
    const result = await withIdempotency(repository, 'assignment.draft', key, clock.iso(), () =>
      service.saveDraft(parsed.data, Number(request.headers['if-match'] ?? parsed.data.version))
    );
    return sendResult(reply, result);
  });
  app.post('/api/v2/assignments/:id/submit/:learnerId', async (request, reply) => {
    const params = request.params as { id: string; learnerId: string };
    if (!(await requireStudentForLearner(request, reply, repository, params.learnerId))) return;
    const parsed = z.object({ answers: z.record(z.string(), z.unknown()) }).safeParse(request.body);
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás válaszok.', details: parsed.error.flatten() }
      });
    const key = idempotencyKey(request);
    if (!key)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Idempotency-Key szükséges.' }
      });
    const result = await withIdempotency(repository, 'assignment.submit', key, clock.iso(), () =>
      service.submit(params.id, params.learnerId, parsed.data.answers)
    );
    return sendResult(reply, result);
  });
  app.get('/api/v2/assignments/:id/submissions', async (request, reply) => {
    if (!requireCapability(request, reply, 'submissions.review')) return;
    return sendResult(reply, {
      ok: true,
      value: await service.listSubmissions((request.params as { id: string }).id)
    });
  });
  app.post('/api/v2/grade-entries', async (request, reply) => {
    const user = requireCapability(request, reply, 'submissions.review');
    if (!user) return;
    const parsed = gradeEntrySchema
      .omit({ id: true, version: true, createdAt: true, updatedAt: true })
      .safeParse({ ...(request.body as object), createdBy: user.id });
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: 'Hibás hivatalos jegy.',
          details: parsed.error.flatten()
        }
      });
    return sendResult(reply, await service.confirmGrade(parsed.data));
  });
}
