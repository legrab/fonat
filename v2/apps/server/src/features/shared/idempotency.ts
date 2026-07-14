import type { FonatRepository } from '../../repository/index.js';

export async function withIdempotency<T>(
  repository: FonatRepository,
  operation: string,
  key: string,
  now: string,
  work: () => Promise<T>
): Promise<T> {
  const existing = await repository.getIdempotency(operation, key);
  if (existing) return existing.result as T;
  const result = await work();
  const expires = new Date(new Date(now).getTime() + 24 * 60 * 60 * 1000).toISOString();
  await repository.putIdempotency({
    id: `${operation}:${key}`,
    operation,
    key,
    result,
    createdAt: now,
    expiresAt: expires
  });
  return result;
}
