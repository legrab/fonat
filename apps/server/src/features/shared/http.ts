import type { FastifyReply, FastifyRequest } from 'fastify';
import { err, type Result, type SessionUser } from '@fonat/contracts';
import type { z } from 'zod';

export function statusFor(result: Result<unknown>) {
  if (result.ok) return 200;
  return result.error.code === 'permission_denied'
    ? 403
    : result.error.code === 'not_found'
      ? 404
      : result.error.code === 'conflict'
        ? 409
        : result.error.code === 'validation_failure'
          ? 400
          : result.error.code === 'unsupported_capability'
            ? 422
            : 500;
}

export function sendResult<T>(reply: FastifyReply, result: Result<T>) {
  return reply.code(statusFor(result)).send(result);
}

export function requireUser(request: FastifyRequest, reply: FastifyReply): SessionUser | null {
  if (!request.user) {
    void sendResult(reply, err({ code: 'permission_denied', message: 'Bejelentkezés szükséges.' }));
    return null;
  }
  return request.user;
}

export function requireCapability(
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

export function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const parsed = schema.safeParse(value);
  return parsed.success
    ? ({ ok: true, value: parsed.data } as const)
    : ({
        ok: false,
        error: err({
          code: 'validation_failure',
          message: 'A kérés adatai hibásak.',
          details: parsed.error.flatten()
        })
      } as const);
}

export function idempotencyKey(request: FastifyRequest) {
  const value = request.headers['idempotency-key'];
  return Array.isArray(value) ? value[0] : value;
}
