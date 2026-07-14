import type { FastifyInstance } from 'fastify';
import {
  courseSchema,
  enrollmentSchema,
  learnerGroupSchema,
  learnerProfileV2Schema,
  recurringTimetableEntrySchema,
  teachingLocationSchema
} from '@fonat/contracts';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { requireCapability, sendResult } from '../shared/http.js';
import { OrganizationService, collections } from './service.js';

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  repository: FonatRepository,
  clock: Clock
) {
  const service = new OrganizationService(repository, clock);
  const definitions = [
    [
      'learner-groups',
      collections.groups,
      learnerGroupSchema,
      () => service.listGroups(),
      (body: unknown) => service.createGroup(body)
    ],
    [
      'learners-v2',
      collections.learners,
      learnerProfileV2Schema,
      () => service.listLearners(),
      (body: unknown) => service.createLearner(body)
    ],
    [
      'enrollments',
      collections.enrollments,
      enrollmentSchema,
      () => service.listEnrollments(),
      (body: unknown) => service.createEnrollment(body)
    ],
    [
      'courses',
      collections.courses,
      courseSchema,
      () => service.listCourses(),
      (body: unknown) => service.createCourse(body)
    ],
    [
      'teaching-locations',
      collections.locations,
      teachingLocationSchema,
      () => service.listLocations(),
      (body: unknown) => service.createLocation(body)
    ],
    [
      'timetable-entries',
      collections.timetable,
      recurringTimetableEntrySchema,
      () => service.listTimetableEntries(),
      (body: unknown) => service.createTimetableEntry(body)
    ]
  ] as const;

  for (const [path, collection, schema, list, create] of definitions) {
    app.get(`/api/v2/${path}`, async (request, reply) => {
      if (!requireCapability(request, reply, 'classrooms.manage')) return;
      return sendResult(reply, { ok: true, value: await list() });
    });
    app.post(`/api/v2/${path}`, async (request, reply) => {
      if (!requireCapability(request, reply, 'classrooms.manage')) return;
      const parsed = schema.safeParse(request.body);
      if (!parsed.success)
        return sendResult(reply, {
          ok: false,
          error: { code: 'validation_failure', message: 'Hibás adatok.', details: parsed.error.flatten() }
        });
      return sendResult(reply, (await create(parsed.data)) as never);
    });
    app.put(`/api/v2/${path}/:id`, async (request, reply) => {
      if (!requireCapability(request, reply, 'classrooms.manage')) return;
      const id = (request.params as { id: string }).id;
      const parsed = schema.safeParse({ ...(request.body as object), id });
      if (!parsed.success)
        return sendResult(reply, {
          ok: false,
          error: { code: 'validation_failure', message: 'Hibás adatok.', details: parsed.error.flatten() }
        });
      const expectedVersion = Number(request.headers['if-match']);
      if (!Number.isInteger(expectedVersion))
        return sendResult(reply, {
          ok: false,
          error: { code: 'validation_failure', message: 'If-Match verzió szükséges.' }
        });
      return sendResult(reply, await service.update(collection, parsed.data as never, expectedVersion));
    });
  }

  app.get('/api/v2/courses/:id/roster', async (request, reply) => {
    if (!requireCapability(request, reply, 'classrooms.manage')) return;
    return sendResult(reply, await service.courseRoster((request.params as { id: string }).id));
  });
  app.get('/api/v2/timetable/week', async (request, reply) => {
    if (!requireCapability(request, reply, 'classrooms.manage')) return;
    return sendResult(reply, await service.weeklyView((request.query as { anchor?: string }).anchor));
  });
}
