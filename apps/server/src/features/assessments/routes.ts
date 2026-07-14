import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AssessmentDelivery } from '@fonat/contracts';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { idempotencyKey, requireCapability, sendResult } from '../shared/http.js';
import { requireStudentForLearner, resolveStudent } from '../shared/student-access.js';
import { withIdempotency } from '../shared/idempotency.js';
import { AssessmentDeliveryService } from './service.js';

export async function registerAssessmentV2Routes(
  app: FastifyInstance,
  repository: FonatRepository,
  clock: Clock
) {
  const service = new AssessmentDeliveryService(repository, clock);
  app.post('/api/v2/assessments/:id/deliveries', async (request, reply) => {
    if (!requireCapability(request, reply, 'assessments.manage')) return;
    const body = z
      .object({ learnerId: z.string(), variantKey: z.string().optional() })
      .safeParse(request.body);
    if (!body.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás kiosztás.', details: body.error.flatten() }
      });
    const key = idempotencyKey(request);
    if (!key)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Idempotency-Key szükséges.' }
      });
    const result = await withIdempotency(repository, 'assessment.delivery', key, clock.iso(), () =>
      service.generate((request.params as { id: string }).id, body.data.learnerId, body.data.variantKey)
    );
    return sendResult(reply, result);
  });
  app.get('/api/v2/assessment-deliveries', async (request, reply) => {
    const query = request.query as { assessmentId?: string; learnerId?: string };
    if (request.user?.capabilities.includes('submissions.review'))
      return sendResult(reply, { ok: true, value: await service.list(query.assessmentId, query.learnerId) });
    const student = await resolveStudent(request, repository);
    if (!student)
      return sendResult(reply, {
        ok: false,
        error: { code: 'permission_denied', message: 'Tanulói vagy tanári belépés szükséges.' }
      });
    return sendResult(reply, { ok: true, value: await service.list(query.assessmentId, student.learnerId) });
  });
  app.post('/api/v2/assessment-deliveries/:id/submit', async (request, reply) => {
    const deliveryId = (request.params as { id: string }).id;
    const delivery = await repository.getRecord<AssessmentDelivery>('assessmentDeliveries', deliveryId);
    if (!delivery)
      return sendResult(reply, {
        ok: false,
        error: { code: 'not_found', message: 'A kiosztott értékelés nem található.' }
      });
    if (!(await requireStudentForLearner(request, reply, repository, delivery.learnerId))) return;
    const body = z.object({ answers: z.record(z.string(), z.unknown()) }).safeParse(request.body);
    if (!body.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás válaszok.', details: body.error.flatten() }
      });
    const key = idempotencyKey(request);
    if (!key)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Idempotency-Key szükséges.' }
      });
    const result = await withIdempotency(repository, 'assessment.submit', key, clock.iso(), () =>
      service.submit(deliveryId, body.data.answers)
    );
    return sendResult(reply, result);
  });
  app.get('/api/v2/assessment-deliveries/:id/regrade-preview', async (request, reply) => {
    if (!requireCapability(request, reply, 'submissions.review')) return;
    return sendResult(reply, await service.regradePreview((request.params as { id: string }).id));
  });
}
