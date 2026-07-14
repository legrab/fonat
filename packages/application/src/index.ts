import { err, ok, type Result } from '@fonat/contracts';

export type Versioned = { id: string; version: number };

export function assertExpectedVersion<T extends Versioned>(current: T, expectedVersion: number): Result<T> {
  return current.version === expectedVersion
    ? ok(current)
    : err({
        code: 'conflict',
        message: 'A rekord időközben megváltozott.',
        details: { id: current.id, expectedVersion, currentVersion: current.version },
        retryable: true
      });
}

export function transition<S extends string>(
  current: S,
  next: S,
  allowed: Readonly<Record<S, readonly S[]>>
): Result<S> {
  return allowed[current]?.includes(next)
    ? ok(next)
    : err({
        code: 'validation_failure',
        message: `Nem engedélyezett állapotváltás: ${current} → ${next}.`,
        details: { current, next }
      });
}

export function requireIdempotencyKey(value: string | undefined): Result<string> {
  if (!value || value.length < 8)
    return err({ code: 'validation_failure', message: 'Érvényes Idempotency-Key fejléc szükséges.' });
  return ok(value);
}

export const assignmentTransitions = {
  draft: ['assigned', 'cancelled', 'archived'],
  assigned: ['closed', 'cancelled'],
  closed: ['archived'],
  cancelled: ['archived'],
  archived: []
} as const;

export const deliveryTransitions = {
  assigned: ['started', 'cancelled'],
  started: ['submitted', 'cancelled'],
  submitted: ['graded', 'returned'],
  graded: ['returned', 'accepted'],
  returned: ['started', 'submitted', 'accepted'],
  accepted: [],
  cancelled: []
} as const;
