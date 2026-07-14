import { randomUUID } from 'node:crypto';
import type { ExercisePayload, Finding, Submission } from '@fonat/contracts';
import type { FonatRepository } from '../repository/index.js';

export type AssessmentAnalysis = {
  findings: Finding[];
  questionStats: Array<{
    exerciseId: string;
    attempts: number;
    average: number;
    omissions: number;
    optionCounts: Record<string, number>;
  }>;
  learnerStats: Array<{ learnerId: string; attempts: number; average: number }>;
};

export async function analyzeAssessment(
  repository: FonatRepository,
  assessmentId: string
): Promise<AssessmentAnalysis> {
  const submissions = await repository.listSubmissions({ assessmentId });
  const exerciseIds = [...new Set(submissions.map((submission) => submission.exerciseId))];
  const exercises = await repository.listNodes({ ids: exerciseIds, limit: 100 });
  const now = new Date().toISOString();
  const questionStats = exerciseIds.map((exerciseId) => {
    const values = submissions.filter((submission) => submission.exerciseId === exerciseId);
    const scores = values.map(
      (submission) => (submission.teacherScore ?? submission.automaticScore ?? 0) / submission.maxScore
    );
    const optionCounts: Record<string, number> = {};
    for (const submission of values) {
      const key = Array.isArray(submission.normalizedAnswer)
        ? submission.normalizedAnswer.join(',')
        : String(submission.normalizedAnswer ?? submission.answer ?? '');
      optionCounts[key] = (optionCounts[key] ?? 0) + 1;
    }
    return {
      exerciseId,
      attempts: values.length,
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      omissions: values.filter((submission) => String(submission.answer ?? '').trim() === '').length,
      optionCounts
    };
  });
  const learnerIds = [...new Set(submissions.map((submission) => submission.learnerId))];
  const learnerStats = learnerIds.map((learnerId) => {
    const values = submissions.filter((submission) => submission.learnerId === learnerId);
    const scores = values.map(
      (submission) => (submission.teacherScore ?? submission.automaticScore ?? 0) / submission.maxScore
    );
    return {
      learnerId,
      attempts: values.length,
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    };
  });
  const findings: Finding[] = [];
  if (questionStats.length) {
    const sorted = [...questionStats].sort((a, b) => a.average - b.average);
    const hardest = sorted[0]!;
    const easiest = sorted[sorted.length - 1]!;
    findings.push({
      id: randomUUID(),
      severity: 'information',
      code: 'assessment.hardest-question',
      title: 'Legnehezebb kérdés',
      message: `${hardest.exerciseId}: ${(hardest.average * 100).toFixed(0)}% átlagos eredmény.`,
      targetId: hardest.exerciseId,
      details: hardest,
      createdAt: now
    });
    findings.push({
      id: randomUUID(),
      severity: 'information',
      code: 'assessment.easiest-question',
      title: 'Legkönnyebb kérdés',
      message: `${easiest.exerciseId}: ${(easiest.average * 100).toFixed(0)}% átlagos eredmény.`,
      targetId: easiest.exerciseId,
      details: easiest,
      createdAt: now
    });
  }
  for (const stat of questionStats) {
    if (stat.omissions >= Math.max(2, Math.ceil(stat.attempts * 0.35)))
      findings.push({
        id: randomUUID(),
        severity: 'warning',
        code: 'assessment.high-omission',
        title: 'Sok kihagyott válasz',
        message: `${stat.exerciseId}: ${stat.omissions}/${stat.attempts} kihagyás.`,
        targetId: stat.exerciseId,
        details: stat,
        createdAt: now
      });
    const topOption = Object.entries(stat.optionCounts).sort((a, b) => b[1] - a[1])[0];
    if (topOption && topOption[1] >= Math.max(2, Math.ceil(stat.attempts * 0.4)) && stat.average < 0.7)
      findings.push({
        id: randomUUID(),
        severity: 'suggestion',
        code: 'assessment.attractive-distractor',
        title: 'Feltűnően vonzó válaszlehetőség',
        message: `${stat.exerciseId}: a(z) „${topOption[0]}” válasz ${topOption[1]} alkalommal jelent meg.`,
        targetId: stat.exerciseId,
        details: { ...stat, topOption },
        createdAt: now
      });
    const exercise = exercises.items.find((item) => item.id === stat.exerciseId);
    const expectedDifficulty =
      exercise?.type === 'exercise' ? (exercise.payload as ExercisePayload).difficulty.cognitive : undefined;
    if (expectedDifficulty && expectedDifficulty <= 2 && stat.average < 0.5)
      findings.push({
        id: randomUUID(),
        severity: 'warning',
        code: 'assessment.difficulty-mismatch',
        title: 'A vártnál nehezebbnek bizonyult',
        message: `${stat.exerciseId} beállított nehézsége ${expectedDifficulty}, az eredmény mégis ${(stat.average * 100).toFixed(0)}%.`,
        targetId: stat.exerciseId,
        details: { expectedDifficulty, ...stat },
        createdAt: now
      });
  }
  for (const learner of learnerStats.filter((item) => item.attempts >= 2 && item.average < 0.5))
    findings.push({
      id: randomUUID(),
      severity: 'suggestion',
      code: 'assessment.learner-follow-up',
      title: 'Érdemes ránézni erre a tanulóra',
      message: `${learner.learnerId}: ${(learner.average * 100).toFixed(0)}% átlag ${learner.attempts} próbálkozásból.`,
      targetId: learner.learnerId,
      details: learner,
      createdAt: now
    });
  const conceptScores = new Map<string, number[]>();
  for (const submission of submissions) {
    const exercise = exercises.items.find((item) => item.id === submission.exerciseId);
    if (!exercise || exercise.type !== 'exercise') continue;
    for (const conceptId of (exercise.payload as ExercisePayload).concepts) {
      const list = conceptScores.get(conceptId) ?? [];
      list.push((submission.teacherScore ?? submission.automaticScore ?? 0) / submission.maxScore);
      conceptScores.set(conceptId, list);
    }
  }
  const weakest = [...conceptScores.entries()]
    .map(([conceptId, values]) => ({ conceptId, average: values.reduce((a, b) => a + b, 0) / values.length }))
    .sort((a, b) => a.average - b.average)[0];
  if (weakest)
    findings.push({
      id: randomUUID(),
      severity: weakest.average < 0.55 ? 'warning' : 'information',
      code: 'assessment.weakest-concept',
      title: 'Leggyengébb fogalom',
      message: `${weakest.conceptId}: ${(weakest.average * 100).toFixed(0)}% összesített eredmény.`,
      targetId: weakest.conceptId,
      details: weakest,
      createdAt: now
    });
  return { findings, questionStats, learnerStats };
}

export function stableShuffle<T>(values: T[], seed: string): T[] {
  const result = [...values];
  let state = [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

export function assessmentScore(submissions: Submission[]): number {
  return submissions.reduce((sum, item) => sum + (item.teacherScore ?? item.automaticScore ?? 0), 0);
}
