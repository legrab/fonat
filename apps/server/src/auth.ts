import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SessionUser } from '@fonat/contracts';
import type { FonatRepository, UserRecord } from './repository/index.js';

type ScryptPolicy = { N: number; r: number; p: number; keyLength: number };
const SCRYPT_POLICY: ScryptPolicy = { N: 16_384, r: 8, p: 1, keyLength: 64 };
export const SESSION_COOKIE = 'fonat_session';

async function derivePassword(
  value: string,
  salt: Buffer,
  policy: ScryptPolicy = SCRYPT_POLICY
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      value,
      salt,
      policy.keyLength,
      { N: policy.N, r: policy.r, p: policy.p, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(Buffer.from(derivedKey));
      }
    );
  });
}

export async function hashPassword(value: string): Promise<string> {
  if (value.length > 256) throw new Error('Secret length must not exceed 256 characters.');
  const salt = randomBytes(16);
  const derived = await derivePassword(value, salt);
  return `scrypt-v1$N=${SCRYPT_POLICY.N},r=${SCRYPT_POLICY.r},p=${SCRYPT_POLICY.p},l=${SCRYPT_POLICY.keyLength}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function passwordNeedsRehash(hashValue: string) {
  return !hashValue.startsWith(
    `scrypt-v1$N=${SCRYPT_POLICY.N},r=${SCRYPT_POLICY.r},p=${SCRYPT_POLICY.p},l=${SCRYPT_POLICY.keyLength}$`
  );
}

export async function verifyPassword(hashValue: string, value: string): Promise<boolean> {
  if (value.length > 256) return false;
  try {
    const parts = hashValue.split('$');
    let salt: Buffer;
    let expected: Buffer;
    let actual: Buffer;
    if (parts[0] === 'scrypt-v1' && parts[1] && parts[2] && parts[3]) {
      const parameters = Object.fromEntries(parts[1].split(',').map((item) => item.split('='))) as Record<
        string,
        string
      >;
      const policy = {
        N: Number(parameters.N),
        r: Number(parameters.r),
        p: Number(parameters.p),
        keyLength: Number(parameters.l)
      };
      if (!policy.N || !policy.r || !policy.p || !policy.keyLength) return false;
      salt = Buffer.from(parts[2], 'base64url');
      expected = Buffer.from(parts[3], 'base64url');
      actual = await derivePassword(value, salt, policy);
    } else if (parts[0] === 'scrypt' && parts[1] && parts[2]) {
      salt = Buffer.from(parts[1], 'base64url');
      expected = Buffer.from(parts[2], 'base64url');
      actual = await derivePassword(value, salt, { ...SCRYPT_POLICY, keyLength: expected.length });
    } else return false;
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
  return user && !user.disabled ? toSessionUser(user) : null;
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
