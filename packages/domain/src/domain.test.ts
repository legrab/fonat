import { describe, expect, it } from 'vitest';
import { gradeExercise, recommendExercises } from './index.js';
import type { ExercisePayload, GraphNode } from '@fonat/contracts';

const basePayload: ExercisePayload = {
  exerciseType: 'numeric',
  prompt: { canonicalLanguage: 'hu', values: { hu: 'Mennyi?' } },
  options: [],
  expected: 10,
  acceptedAnswers: [],
  tolerance: 0,
  durationMinutes: 5,
  difficulty: { cognitive: 2, prerequisites: 2, independence: 2, teacherPreparation: 1, collaboration: 1 },
  evidenceIntensity: 'none',
  concepts: ['concept.pythagoras'],
  purpose: ['practice'],
  scaffold: [],
  grading: {},
  presentation: {}
};

describe('grading', () => {
  it('accepts numeric fractions', () => {
    const result = gradeExercise({ ...basePayload, expected: 0.5 }, '1/2');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.score).toBe(1);
  });
});

describe('recommendations', () => {
  it('ranks matching exercises', () => {
    const now = new Date().toISOString();
    const node: GraphNode = {
      id: 'exercise.x',
      type: 'exercise',
      title: { canonicalLanguage: 'hu', values: { hu: 'X' } },
      lifecycle: 'published',
      quality: 'classroom-tested',
      currentRevision: 1,
      payload: basePayload,
      extensions: {},
      provenance: { origin: 'seed' },
      rights: { status: 'project-owned', license: 'CC BY-NC-SA 4.0', redistributionAllowed: true },
      tags: [],
      createdAt: now,
      updatedAt: now
    };
    const result = recommendExercises({
      exercises: [node],
      conceptIds: ['concept.pythagoras'],
      slotMinutes: 5
    });
    expect(result[0]?.node.id).toBe('exercise.x');
  });
});
