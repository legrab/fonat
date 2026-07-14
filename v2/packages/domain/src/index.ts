import type {
  ExercisePayload,
  Finding,
  GraphNode,
  LessonPayload,
  Result,
  RevisionCompatibility,
  Submission
} from '@fonat/contracts';
import { err, ok } from '@fonat/contracts';

export function localize(node: Pick<GraphNode, 'title' | 'id'>, locale = 'hu'): string {
  return (
    node.title.values[locale] ??
    node.title.values[node.title.canonicalLanguage] ??
    Object.values(node.title.values)[0] ??
    node.id
  );
}

export function classifyRevision(previous: GraphNode, next: GraphNode): RevisionCompatibility {
  if (previous.type !== next.type) return 'contract-breaking';
  const before = previous.payload;
  const after = next.payload;
  const planningFields = [
    'durationMinutes',
    'difficulty',
    'concepts',
    'prerequisites',
    'grading',
    'exerciseType'
  ];
  if (planningFields.some((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])))
    return 'planning-impacting';
  if (
    JSON.stringify(previous.title) !== JSON.stringify(next.title) ||
    JSON.stringify(before) !== JSON.stringify(after)
  ) {
    return 'content-equivalent';
  }
  return 'presentation-only';
}

export function validateLesson(lesson: GraphNode, nodes: GraphNode[]): Finding[] {
  const payload = lesson.payload as LessonPayload;
  const findings: Finding[] = [];
  const now = new Date().toISOString();
  const planned = payload.sections.reduce((sum, section) => sum + section.durationMinutes, 0);
  if (planned !== payload.durationMinutes) {
    findings.push({
      id: `finding.duration.${lesson.id}`,
      severity: 'warning',
      code: 'lesson.duration-mismatch',
      title: 'Az időkeret nem egyezik',
      message: `A szakaszok összesen ${planned} percet tesznek ki a ${payload.durationMinutes} perces órában.`,
      targetId: lesson.id,
      details: { planned, available: payload.durationMinutes },
      createdAt: now
    });
  }
  for (const section of payload.sections) {
    if (section.activityIds.length === 0) {
      findings.push({
        id: `finding.empty.${lesson.id}.${section.id}`,
        severity: 'suggestion',
        code: 'lesson.empty-section',
        title: 'Üres óraszakasz',
        message: `A(z) „${section.title}” szakaszhoz még nincs tevékenység rendelve.`,
        targetId: lesson.id,
        details: { sectionId: section.id },
        createdAt: now
      });
    }
  }
  const exerciseIds = payload.sections.flatMap((section) => section.activityIds);
  for (const id of exerciseIds) {
    const exercise = nodes.find((node) => node.id === id);
    if (!exercise) {
      findings.push({
        id: `finding.missing.${lesson.id}.${id}`,
        severity: 'error',
        code: 'lesson.missing-resource',
        title: 'Hiányzó tartalom',
        message: `A(z) ${id} tartalom nem érhető el.`,
        targetId: lesson.id,
        details: { missingId: id },
        createdAt: now
      });
    }
  }
  return findings;
}

export type RecommendationCandidate = {
  node: GraphNode;
  score: number;
  reasons: string[];
  rejected: string[];
};

export function recommendExercises(input: {
  exercises: GraphNode[];
  conceptIds: string[];
  slotMinutes: number;
  targetDifficulty?: number;
  alreadySelected?: string[];
}): RecommendationCandidate[] {
  const selected = new Set(input.alreadySelected ?? []);
  return input.exercises
    .filter((node) => node.type === 'exercise' && node.lifecycle === 'published' && !selected.has(node.id))
    .map((node) => {
      const payload = node.payload as ExercisePayload;
      const reasons: string[] = [];
      const rejected: string[] = [];
      let score = 0;
      const overlap = payload.concepts.filter((id) => input.conceptIds.includes(id)).length;
      if (overlap > 0) {
        score += Math.min(45, overlap * 20);
        reasons.push(`${overlap} kapcsolódó fogalom`);
      } else {
        rejected.push('Nincs közvetlen fogalmi kapcsolat');
      }
      const durationGap = Math.abs(payload.durationMinutes - input.slotMinutes);
      score += Math.max(0, 25 - durationGap * 4);
      if (durationGap <= 2) reasons.push('Jól illeszkedik az időkerethez');
      if (payload.durationMinutes > input.slotMinutes + 4)
        rejected.push('Túl hosszú a rendelkezésre álló időhöz');
      if (input.targetDifficulty) {
        const difficultyGap = Math.abs(payload.difficulty.cognitive - input.targetDifficulty);
        score += Math.max(0, 20 - difficultyGap * 7);
        if (difficultyGap <= 1) reasons.push('Megfelelő nehézség');
      } else {
        score += 10;
      }
      if (payload.evidenceIntensity !== 'none') {
        score += 5;
        reasons.push('Tanulási bizonyítékot is ad');
      }
      return { node, score, reasons, rejected };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id));
}

export type GradeResult = {
  normalizedAnswer: unknown;
  score: number;
  maxScore: number;
  explanation: string;
  manualReview: boolean;
};

export function gradeExercise(payload: ExercisePayload, answer: unknown, maxScore = 1): Result<GradeResult> {
  switch (payload.exerciseType) {
    case 'single-choice':
    case 'true-false': {
      const normalized = String(answer);
      const correct = payload.options.find((option) => option.correct)?.id ?? String(payload.expected ?? '');
      return ok({
        normalizedAnswer: normalized,
        score: normalized === correct ? maxScore : 0,
        maxScore,
        explanation:
          normalized === correct
            ? 'A kiválasztott válasz helyes.'
            : 'A kiválasztott válasz nem egyezik a helyes opcióval.',
        manualReview: false
      });
    }
    case 'multi-select': {
      const normalized = Array.isArray(answer) ? answer.map(String).sort() : [];
      const correct = payload.options
        .filter((option) => option.correct)
        .map((option) => option.id)
        .sort();
      const isCorrect = JSON.stringify(normalized) === JSON.stringify(correct);
      return ok({
        normalizedAnswer: normalized,
        score: isCorrect ? maxScore : 0,
        maxScore,
        explanation: isCorrect
          ? 'Minden helyes opció ki lett választva.'
          : 'A kijelölések nem egyeznek a helyes halmazzal.',
        manualReview: false
      });
    }
    case 'numeric': {
      const text = String(answer).trim().replace(',', '.').replace(/\s+/g, '');
      const fraction = text.match(/^(-?\d+)\/(\d+)([a-zA-Z²³]*)$/);
      const numericText = fraction
        ? String(Number(fraction[1]) / Number(fraction[2]))
        : text.replace(/[a-zA-Z²³]+$/, '');
      const numeric = Number(numericText);
      const expected = Number(payload.expected);
      if (!Number.isFinite(numeric) || !Number.isFinite(expected)) {
        return err({
          code: 'validation_failure',
          message: 'A numerikus válasz nem értelmezhető.',
          retryable: false
        });
      }
      const tolerance = payload.tolerance ?? 0;
      const correct = Math.abs(numeric - expected) <= tolerance;
      return ok({
        normalizedAnswer: numeric,
        score: correct ? maxScore : 0,
        maxScore,
        explanation: correct
          ? `A válasz a megengedett ${tolerance} tűrésen belül van.`
          : `A várt érték ${expected}${payload.unit ? ` ${payload.unit}` : ''}.`,
        manualReview: false
      });
    }
    case 'short-text': {
      const normalized = String(answer).trim().toLocaleLowerCase('hu-HU');
      const accepted = [...payload.acceptedAnswers, String(payload.expected ?? '')]
        .map((value) => value.trim().toLocaleLowerCase('hu-HU'))
        .filter(Boolean);
      const correct = accepted.includes(normalized);
      return ok({
        normalizedAnswer: normalized,
        score: correct ? maxScore : 0,
        maxScore,
        explanation: correct
          ? 'A válasz az elfogadott változatok egyike.'
          : 'A válasz nem egyezik az elfogadott változatokkal.',
        manualReview: !correct
      });
    }
    case 'ordered': {
      const normalized = Array.isArray(answer) ? answer.map(String) : [];
      const expected = Array.isArray(payload.expected) ? payload.expected.map(String) : [];
      const correct = JSON.stringify(normalized) === JSON.stringify(expected);
      return ok({
        normalizedAnswer: normalized,
        score: correct ? maxScore : 0,
        maxScore,
        explanation: correct ? 'A sorrend helyes.' : 'A sorrend eltér a várt sorrendtől.',
        manualReview: false
      });
    }
    default:
      return ok({
        normalizedAnswer: answer,
        score: 0,
        maxScore,
        explanation: 'Ez a feladattípus kézi ellenőrzést igényel.',
        manualReview: true
      });
  }
}

export function deriveConceptState(submissions: Submission[]): {
  state: string;
  confidence: number;
  explanation: string;
} {
  const scored = submissions.filter(
    (submission) => typeof (submission.teacherScore ?? submission.automaticScore) === 'number'
  );
  if (scored.length === 0)
    return { state: 'not introduced', confidence: 0, explanation: 'Nincs még értékelhető bizonyíték.' };
  const ratio =
    scored.reduce(
      (sum, submission) =>
        sum + (submission.teacherScore ?? submission.automaticScore ?? 0) / submission.maxScore,
      0
    ) / scored.length;
  const state =
    ratio >= 0.9
      ? 'secure'
      : ratio >= 0.72
        ? 'mostly secure'
        : ratio >= 0.45
          ? 'practising'
          : 'needs revision';
  return {
    state,
    confidence: Math.min(0.95, 0.45 + scored.length * 0.08),
    explanation: `${scored.length} értékelt próbálkozás, ${(ratio * 100).toFixed(0)}% átlagos eredmény.`
  };
}
