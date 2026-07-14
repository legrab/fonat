import { describe, expect, it } from 'vitest';
import { assertExpectedVersion, transition, assignmentTransitions } from './index.js';

describe('application guards', () => {
  it('rejects stale versions with an explicit conflict', () => {
    const result = assertExpectedVersion({ id: 'x', version: 3 }, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('conflict');
  });
  it('centralizes lifecycle transitions', () => {
    expect(transition('draft', 'assigned', assignmentTransitions).ok).toBe(true);
    expect(transition('archived', 'assigned', assignmentTransitions).ok).toBe(false);
  });
});
