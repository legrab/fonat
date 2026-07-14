import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { nodeSchema, projectPayloadSchema } from '@fonat/contracts';
import type { AppConfig } from '../../config.js';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { requireCapability, sendResult } from '../shared/http.js';

export async function registerProjectRoutes(
  app: FastifyInstance,
  repository: FonatRepository,
  config: AppConfig,
  clock: Clock
) {
  app.get('/api/v2/projects', async (request, reply) => {
    if (!config.FEATURE_PROJECTS)
      return sendResult(reply, {
        ok: false,
        error: { code: 'unsupported_capability', message: 'A Project capability ki van kapcsolva.' }
      });
    if (!requireCapability(request, reply, 'content.manage')) return;
    return sendResult(reply, {
      ok: true,
      value: await repository.listNodes({ type: 'project', limit: 100 })
    });
  });
  app.post('/api/v2/projects', async (request, reply) => {
    if (!config.FEATURE_PROJECTS)
      return sendResult(reply, {
        ok: false,
        error: { code: 'unsupported_capability', message: 'A Project capability ki van kapcsolva.' }
      });
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const body = request.body as { id?: string; title?: string; summary?: string; payload?: unknown };
    const payload = projectPayloadSchema.safeParse(body.payload ?? {});
    if (!payload.success || !body.title)
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: 'Hibás Project.',
          details: payload.success ? undefined : payload.error.flatten()
        }
      });
    const now = clock.iso();
    const node = nodeSchema.parse({
      id: body.id ?? `project.${randomUUID()}`,
      type: 'project',
      title: { canonicalLanguage: 'hu', values: { hu: body.title } },
      summary: body.summary ? { canonicalLanguage: 'hu', values: { hu: body.summary } } : undefined,
      lifecycle: 'draft',
      quality: 'experimental',
      currentRevision: 1,
      version: 0,
      ownerId: user.id,
      subjectIds: payload.data.subjectIds,
      searchText: `${body.title} ${body.summary ?? ''}`,
      payload: payload.data,
      extensions: {},
      provenance: { origin: 'teacher', author: user.id },
      rights: { status: 'teacher-owned', redistributionAllowed: false },
      tags: ['project'],
      createdAt: now,
      updatedAt: now
    });
    await repository.upsertNode(node);
    return sendResult(reply, { ok: true, value: node });
  });
}
