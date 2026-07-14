import type { SessionUser } from '@fonat/contracts';

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null;
  }
}
