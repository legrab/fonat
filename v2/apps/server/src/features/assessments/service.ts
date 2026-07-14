import { createHash } from 'node:crypto';
import {
  assessmentDeliverySchema,
  exercisePayloadSchema,
  ok,
  err,
  type AssessmentDelivery,
  type Result
} from '@fonat/contracts';
import { gradeExercise } from '@fonat/domain';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';

function hash(seed: string) {
  return createHash('sha256').update(seed).digest('hex');
}
function stableShuffle<T>(values: readonly T[], seed: string): T[] {
  return values
    .map((value, index) => ({ value, key: hash(`${seed}:${index}:${JSON.stringify(value)}`) }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((entry) => entry.value);
}

export type DeliveryAnswer = {
  id: string;
  deliveryId: string;
  learnerId: string;
  answers: Record<string, unknown>;
  results: Array<{
    exerciseId: string;
    score: number;
    maxScore: number;
    explanation: string;
    manualReview: boolean;
  }>;
  totalScore: number;
  maxScore: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export class AssessmentDeliveryService {
  constructor(
    private readonly repository: FonatRepository,
    private readonly clock: Clock
  ) {}

  async generate(
    assessmentId: string,
    learnerId: string,
    variantKey?: string
  ): Promise<Result<AssessmentDelivery>> {
    const assessment = await this.repository.getNode(assessmentId);
    if (!assessment || assessment.type !== 'assessment')
      return err({ code: 'not_found', message: 'Az értékelés nem található.' });
    const payload = assessment.payload as {
      exerciseIds?: string[];
      variants?: Record<string, string[]>;
      blueprintSlots?: Array<{ id: string; conceptIds: string[]; points: number }>;
      deferredCoverage?: string[];
    };
    const variants = payload.variants ?? { A: payload.exerciseIds ?? [] };
    const keys = Object.keys(variants).sort();
    const selectedKey =
      variantKey && variants[variantKey]
        ? variantKey
        : keys[Number.parseInt(hash(`${assessmentId}:${learnerId}`).slice(0, 6), 16) % keys.length]!;
    const exerciseIds = variants[selectedKey] ?? [];
    if (!exerciseIds.length)
      return err({
        code: 'insufficient_candidates' as never,
        message: 'Nincs elég feladat az értékeléshez.'
      });
    const seed = hash(`${assessmentId}:${assessment.currentRevision}:${learnerId}:${selectedKey}`).slice(
      0,
      24
    );
    const questions: AssessmentDelivery['questions'] = [];
    for (const [index, exerciseId] of exerciseIds.entries()) {
      const node = await this.repository.getNode(exerciseId);
      if (!node) return err({ code: 'not_found', message: `Hiányzó feladat: ${exerciseId}` });
      const revision = node.currentRevision;
      const pinned = await this.repository.getRevision(exerciseId, revision);
      const snapshot = {
        title: pinned?.title ?? node.title,
        summary: pinned?.summary ?? node.summary,
        payload: pinned?.payload ?? node.payload
      };
      const parsed = exercisePayloadSchema.safeParse(snapshot.payload);
      const optionIds = parsed.success ? parsed.data.options.map((option) => option.id) : [];
      questions.push({
        slotId: payload.blueprintSlots?.[index]?.id ?? `slot-${index + 1}`,
        exerciseId,
        revision,
        optionOrder: stableShuffle(optionIds, `${seed}:${exerciseId}`),
        snapshot
      });
    }
    const now = this.clock.iso();
    const delivery = assessmentDeliverySchema.parse({
      id: `delivery.${assessmentId}.${learnerId}.${selectedKey}`,
      assessmentId,
      learnerId,
      variantKey: selectedKey,
      strategyId: 'fonat.deterministic-slots',
      strategyVersion: '1.0.0',
      seed,
      questions,
      deferredSlotIds: payload.deferredCoverage ?? [],
      status: 'assigned',
      version: 0,
      createdAt: now,
      updatedAt: now
    });
    const existing = await this.repository.getRecord<AssessmentDelivery>('assessmentDeliveries', delivery.id);
    if (existing) return ok(existing);
    await this.repository.insertRecord('assessmentDeliveries', delivery);
    return ok(delivery);
  }

  list(assessmentId?: string, learnerId?: string) {
    return this.repository.listRecords<AssessmentDelivery>('assessmentDeliveries', {
      filters: { ...(assessmentId ? { assessmentId } : {}), ...(learnerId ? { learnerId } : {}) },
      limit: 200,
      sortField: 'createdAt',
      sortDirection: 'desc'
    });
  }

  async submit(deliveryId: string, answers: Record<string, unknown>): Promise<Result<DeliveryAnswer>> {
    const delivery = await this.repository.getRecord<AssessmentDelivery>('assessmentDeliveries', deliveryId);
    if (!delivery) return err({ code: 'not_found', message: 'A kiosztott értékelés nem található.' });
    if (!['assigned', 'started', 'returned'].includes(delivery.status))
      return err({ code: 'validation_failure', message: 'Ez az értékelés jelenleg nem adható be.' });
    const results: DeliveryAnswer['results'] = [];
    for (const question of delivery.questions) {
      const parsed = exercisePayloadSchema.safeParse(question.snapshot.payload);
      if (!parsed.success)
        return err({
          code: 'validation_failure',
          message: `Érvénytelen feladat-snapshot: ${question.exerciseId}`
        });
      const graded = gradeExercise(parsed.data, answers[question.exerciseId], 1);
      if (!graded.ok) return graded;
      results.push({
        exerciseId: question.exerciseId,
        score: graded.value.score,
        maxScore: graded.value.maxScore,
        explanation: graded.value.explanation,
        manualReview: graded.value.manualReview
      });
    }
    const now = this.clock.iso();
    const answer: DeliveryAnswer = {
      id: `answer.${deliveryId}`,
      deliveryId,
      learnerId: delivery.learnerId,
      answers,
      results,
      totalScore: results.reduce((sum, result) => sum + result.score, 0),
      maxScore: results.reduce((sum, result) => sum + result.maxScore, 0),
      version: 0,
      createdAt: now,
      updatedAt: now
    };
    await this.repository.upsertRecord('assessmentAnswers', answer);
    const next = {
      ...delivery,
      status: 'submitted' as const,
      submittedAt: now,
      updatedAt: now,
      version: delivery.version + 1
    };
    if (!(await this.repository.compareAndSwapRecord('assessmentDeliveries', next, delivery.version)))
      return err({ code: 'conflict', message: 'Az értékelés állapota időközben megváltozott.' });
    return ok(answer);
  }

  async regradePreview(deliveryId: string) {
    const delivery = await this.repository.getRecord<AssessmentDelivery>('assessmentDeliveries', deliveryId);
    const answer = await this.repository.getRecord<DeliveryAnswer>(
      'assessmentAnswers',
      `answer.${deliveryId}`
    );
    if (!delivery || !answer) return err({ code: 'not_found', message: 'Nincs újraértékelhető beadás.' });
    const proposed: DeliveryAnswer['results'] = [];
    for (const question of delivery.questions) {
      const current = await this.repository.getNode(question.exerciseId);
      if (!current) continue;
      const parsed = exercisePayloadSchema.safeParse(current.payload);
      if (!parsed.success) continue;
      const graded = gradeExercise(parsed.data, answer.answers[question.exerciseId], 1);
      if (graded.ok)
        proposed.push({
          exerciseId: question.exerciseId,
          score: graded.value.score,
          maxScore: graded.value.maxScore,
          explanation: graded.value.explanation,
          manualReview: graded.value.manualReview
        });
    }
    return ok({
      current: answer.results,
      proposed,
      changed: JSON.stringify(answer.results) !== JSON.stringify(proposed)
    });
  }
}
