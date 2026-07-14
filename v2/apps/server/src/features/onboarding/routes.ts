import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { idempotencyKey, requireCapability, sendResult } from '../shared/http.js';
import { withIdempotency } from '../shared/idempotency.js';
import { OnboardingService } from './service.js';

const inputSchema = z.object({
  learnerGroupName: z.string().min(1),
  learnerGroupCode: z.string().min(1),
  courseName: z.string().min(1),
  subjectTitle: z.string().min(1),
  schoolYear: z.string().min(4),
  locationName: z.string().min(1),
  locationCode: z.string().min(1),
  learnerNicknames: z.array(z.string().min(1)).min(1).max(40),
  firstConceptTitle: z.string().min(1),
  firstExercisePrompt: z.string().min(3),
  firstLessonTitle: z.string().min(1),
  firstAssignmentTitle: z.string().min(1),
  timezone: z.string().min(3)
});

export async function registerOnboardingRoutes(
  app: FastifyInstance,
  repository: FonatRepository,
  clock: Clock
) {
  const service = new OnboardingService(repository, clock);
  app.get('/api/v2/onboarding/status', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.manage')) return;
    return sendResult(reply, await service.status());
  });
  app.post('/api/v2/onboarding/complete', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const parsed = inputSchema.safeParse(request.body);
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: 'A bevezető adatai hibásak.',
          details: parsed.error.flatten()
        }
      });
    const key = idempotencyKey(request);
    if (!key)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Idempotency-Key fejléc szükséges.' }
      });
    const result = await withIdempotency(repository, 'onboarding.complete', key, clock.iso(), () =>
      service.complete({ ...parsed.data, teacherId: user.id })
    );
    return sendResult(reply, result);
  });
}
