import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { relationSchema } from '@fonat/contracts';
import { relationContracts } from '@fonat/core-module';
import { isRegisteredRelationType } from '@fonat/module-registry';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';
import { requireCapability, sendResult } from '../shared/http.js';

const projectRelationContract = {
  type: 'project-connects',
  source: ['project'],
  target: [
    'subject',
    'course',
    'learner-group',
    'concept',
    'curriculum-requirement',
    'phase',
    'activity-template',
    'resource',
    'assignment'
  ],
  directed: true,
  dimensions: []
} as const;

function relationContract(type: string) {
  return type === projectRelationContract.type
    ? projectRelationContract
    : relationContracts.find((contract) => contract.type === type);
}

function validateDimensions(
  contract: ReturnType<typeof relationContract>,
  dimensions: Record<string, number>
) {
  if (!contract) return false;
  const allowed = new Set('dimensions' in contract ? (contract.dimensions ?? []) : []);
  return Object.keys(dimensions).every((key) => allowed.has(key as never));
}

export async function registerRelationRoutes(
  app: FastifyInstance,
  repository: FonatRepository,
  clock: Clock
) {
  app.get('/api/v2/relation-contracts', async (_request, reply) =>
    sendResult(reply, { ok: true, value: [...relationContracts, projectRelationContract] })
  );
  app.post('/api/v2/relations', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const body = request.body as Record<string, unknown>;
    const source = typeof body.sourceId === 'string' ? await repository.getNode(body.sourceId) : null;
    const target = typeof body.targetId === 'string' ? await repository.getNode(body.targetId) : null;
    const type = String(body.type ?? '');
    const contract = relationContract(type);
    if (!source || !target)
      return sendResult(reply, {
        ok: false,
        error: { code: 'not_found', message: 'A kapcsolat egyik végpontja hiányzik.' }
      });
    if (!isRegisteredRelationType(type) || !contract)
      return sendResult(reply, {
        ok: false,
        error: { code: 'unsupported_capability', message: `Ismeretlen kapcsolattípus: ${type}` }
      });
    if (
      !(contract.source as readonly string[]).includes(source.type) ||
      !(contract.target as readonly string[]).includes(target.type)
    )
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: `A ${type} kapcsolat nem használható ${source.type} → ${target.type} között.`
        }
      });
    const dimensions = z.record(z.string(), z.number()).safeParse(body.dimensions ?? {});
    if (!dimensions.success || !validateDimensions(contract, dimensions.data))
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: `A ${type} kapcsolat dimenziói hibásak.`,
          details: dimensions.success
            ? { allowed: 'dimensions' in contract ? (contract.dimensions ?? []) : [] }
            : dimensions.error.flatten()
        }
      });
    const relation = relationSchema.parse({
      id: typeof body.id === 'string' ? body.id : `relation.${randomUUID()}`,
      type,
      sourceId: source.id,
      targetId: target.id,
      dimensions: dimensions.data,
      metadata: body.metadata ?? {},
      provenance: { origin: 'teacher', author: user.id },
      createdAt: clock.iso(),
      version: 0
    });
    await repository.upsertRelation(relation);
    return sendResult(reply, { ok: true, value: relation });
  });
  app.put('/api/v2/relations/:id', async (request, reply) => {
    const user = requireCapability(request, reply, 'content.manage');
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const current = await repository.getRelation(id);
    if (!current)
      return sendResult(reply, {
        ok: false,
        error: { code: 'not_found', message: 'A kapcsolat nem található.' }
      });
    const expected = Number(request.headers['if-match']);
    if (!Number.isInteger(expected))
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'If-Match verzió szükséges.' }
      });
    if (current.version !== expected)
      return sendResult(reply, {
        ok: false,
        error: { code: 'conflict', message: 'A kapcsolat megváltozott.', details: { current } }
      });
    const parsed = relationSchema.safeParse({
      ...current,
      ...(request.body as object),
      id,
      version: expected + 1
    });
    if (!parsed.success)
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: 'Hibás kapcsolat.', details: parsed.error.flatten() }
      });
    const source = await repository.getNode(parsed.data.sourceId);
    const target = await repository.getNode(parsed.data.targetId);
    const contract = relationContract(parsed.data.type);
    if (!source || !target)
      return sendResult(reply, {
        ok: false,
        error: { code: 'not_found', message: 'A kapcsolat egyik végpontja hiányzik.' }
      });
    if (!isRegisteredRelationType(parsed.data.type) || !contract)
      return sendResult(reply, {
        ok: false,
        error: { code: 'unsupported_capability', message: `Ismeretlen kapcsolattípus: ${parsed.data.type}` }
      });
    if (
      !(contract.source as readonly string[]).includes(source.type) ||
      !(contract.target as readonly string[]).includes(target.type)
    )
      return sendResult(reply, {
        ok: false,
        error: {
          code: 'validation_failure',
          message: `A ${parsed.data.type} kapcsolat nem használható ${source.type} → ${target.type} között.`
        }
      });
    if (!validateDimensions(contract, parsed.data.dimensions))
      return sendResult(reply, {
        ok: false,
        error: { code: 'validation_failure', message: `A ${parsed.data.type} kapcsolat dimenziói hibásak.` }
      });
    if (!(await repository.compareAndSwapRelation(parsed.data, expected)))
      return sendResult(reply, {
        ok: false,
        error: { code: 'conflict', message: 'A kapcsolat időközben megváltozott.' }
      });
    return sendResult(reply, { ok: true, value: parsed.data });
  });
  app.delete('/api/v2/relations/:id', async (request, reply) => {
    if (!requireCapability(request, reply, 'content.manage')) return;
    const deleted = await repository.deleteRelation((request.params as { id: string }).id);
    return sendResult(
      reply,
      deleted
        ? { ok: true, value: { deleted: true } }
        : { ok: false, error: { code: 'not_found', message: 'A kapcsolat nem található.' } }
    );
  });
}
