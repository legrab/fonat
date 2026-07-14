import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SessionUser } from '@fonat/contracts';
import type { FonatRepository, UserRecord } from './repository/index.js';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'fonat_session';

export async function hashPassword(value: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(value, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(hashValue: string, value: string): Promise<boolean> {
  try {
    const [algorithm, saltEncoded, expectedEncoded] = hashValue.split('$');
    if (algorithm !== 'scrypt' || !saltEncoded || !expectedEncoded) return false;
    const salt = Buffer.from(saltEncoded, 'base64url');
    const expected = Buffer.from(expectedEncoded, 'base64url');
    const actual = (await scrypt(value, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: user.roles,
    capabilities: user.capabilities,
    mustChangePassword: user.mustChangePassword
  };
}

export async function createSession(
  repository: FonatRepository,
  user: UserRecord,
  reply: FastifyReply,
  secure: boolean
): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);
  await repository.insertSession({
    id: randomUUID(),
    tokenHash: hashToken(token),
    userId: user.id,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  });
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: expiresAt
  });
}

export async function resolveUser(
  repository: FonatRepository,
  request: FastifyRequest
): Promise<SessionUser | null> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = await repository.getSessionByHash(hashToken(token));
  if (!session) return null;
  const user = await repository.getUser(session.userId);
  return user ? toSessionUser(user) : null;
}

export async function clearSession(
  repository: FonatRepository,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies[SESSION_COOKIE];
  if (token) await repository.deleteSessionByHash(hashToken(token));
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}
