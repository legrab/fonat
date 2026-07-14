import { randomUUID } from 'node:crypto';
import {
  answerDraftSchema,
  assignmentSchema,
  exercisePayloadSchema,
  gradeEntrySchema,
  ok,
  err,
  type AnswerDraft,
  type Assignment,
  type GradeEntry,
  type GraphNode,
  type NodeRevision,
  type Result
} from '@fonat/contracts';
import { assignmentTransitions, transition } from '@fonat/application';
import { gradeExercise } from '@fonat/domain';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  learnerId: string;
  attempt: number;
  answers: Record<string, unknown>;
  resolvedExercises: Array<{ nodeId: string; revision: number; title: unknown; payload: unknown }>;
  results: Array<{
    exerciseId: string;
    score: number;
    maxScore: number;
    explanation: string;
    manualReview: boolean;
  }>;
  status: 'submitted' | 'auto-checked' | 'reviewed' | 'returned' | 'accepted';
  feedback?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export class AssignmentService {
  constructor(
    private readonly repository: FonatRepository,
    private readonly clock: Clock
  ) {}

  list(courseId?: string) {
    return this.repository.listRecords<Assignment>('assignments', {
      filters: courseId ? { courseId } : {},
      limit: 100,
      sortField: 'updatedAt',
      sortDirection: 'desc'
    });
  }

  async create(value: unknown): Promise<Result<Assignment>> {
    const assignment = assignmentSchema.parse(value);
    if (await this.repository.getRecord('assignments', assignment.id))
      return err({ code: 'conflict', message: 'Az assignment már létezik.' });
    await this.repository.insertRecord('assignments', assignment);
    return ok(assignment);
  }

  async update(value: Assignment, expectedVersion: number): Promise<Result<Assignment>> {
    const current = await this.repository.getRecord<Assignment>('assignments', value.id);
    if (!current) return err({ code: 'not_found', message: 'Az assignment nem található.' });
    const next = { ...value, version: expectedVersion + 1, updatedAt: this.clock.iso() };
    if (!(await this.repository.compareAndSwapRecord('assignments', next, expectedVersion)))
      return err({
        code: 'conflict',
        message: 'Az assignment időközben megváltozott.',
        details: { current }
      });
    return ok(next);
  }

  async changeStatus(id: string, nextStatus: Assignment['status'], expectedVersion: number) {
    const current = await this.repository.getRecord<Assignment>('assignments', id);
    if (!current) return err({ code: 'not_found', message: 'Az assignment nem található.' });
    const allowed = transition(current.status, nextStatus, assignmentTransitions as never);
    if (!allowed.ok) return allowed;
    return this.update({ ...current, status: nextStatus }, expectedVersion);
  }

  async getDraft(assignmentId: string, learnerId: string) {
    return ok(
      (await this.repository.getRecord<AnswerDraft>('answerDrafts', `${assignmentId}:${learnerId}`)) ?? {
        id: `${assignmentId}:${learnerId}`,
        assignmentId,
        learnerId,
        answers: {},
        version: 0,
        updatedAt: this.clock.iso()
      }
    );
  }

  async saveDraft(value: unknown, expectedVersion: number): Promise<Result<AnswerDraft>> {
    const draft = answerDraftSchema.parse(value);
    const current = await this.repository.getRecord<AnswerDraft>('answerDrafts', draft.id);
    if (!current) {
      if (expectedVersion !== 0)
        return err({
          code: 'conflict',
          message: 'A piszkozat még nem létezik.',
          details: { expectedVersion }
        });
      await this.repository.insertRecord('answerDrafts', draft);
      return ok(draft);
    }
    const next = { ...draft, version: expectedVersion + 1, updatedAt: this.clock.iso() };
    if (!(await this.repository.compareAndSwapRecord('answerDrafts', next, expectedVersion)))
      return err({
        code: 'conflict',
        message: 'A piszkozat egy másik lapon megváltozott.',
        details: { current }
      });
    return ok(next);
  }

  private async resolveExercise(
    nodeId: string,
    revision: number
  ): Promise<Result<{ node: GraphNode; revision: NodeRevision | null }>> {
    const node = await this.repository.getNode(nodeId);
    if (!node) return err({ code: 'not_found', message: `A feladat nem található: ${nodeId}` });
    if (node.currentRevision === revision)
      return ok({ node, revision: await this.repository.getRevision(nodeId, revision) });
    const pinned = await this.repository.getRevision(nodeId, revision);
    if (!pinned)
      return err({ code: 'not_found', message: `A rögzített ${revision}. revízió nem található: ${nodeId}` });
    return ok({
      node: {
        ...node,
        title: pinned.title,
        summary: pinned.summary,
        payload: pinned.payload,
        currentRevision: pinned.revision
      },
      revision: pinned
    });
  }

  async submit(
    assignmentId: string,
    learnerId: string,
    answers: Record<string, unknown>
  ): Promise<Result<AssignmentSubmission>> {
    const assignment = await this.repository.getRecord<Assignment>('assignments', assignmentId);
    if (!assignment) return err({ code: 'not_found', message: 'Az assignment nem található.' });
    if (assignment.status !== 'assigned')
      return err({ code: 'validation_failure', message: 'Az assignment jelenleg nem adható be.' });
    const prior = await this.repository.listRecords<AssignmentSubmission>('assignmentSubmissions', {
      filters: { assignmentId, learnerId },
      limit: 100
    });
    const attempt = prior.items.length + 1;
    if (attempt > assignment.policy.maxAttempts)
      return err({ code: 'validation_failure', message: 'Nincs több engedélyezett próbálkozás.' });

    const resolvedExercises: AssignmentSubmission['resolvedExercises'] = [];
    const results: AssignmentSubmission['results'] = [];
    for (const reference of assignment.exerciseRefs) {
      const resolved = await this.resolveExercise(reference.nodeId, reference.revision);
      if (!resolved.ok) return resolved;
      const payload = exercisePayloadSchema.safeParse(resolved.value.node.payload);
      if (!payload.success)
        return err({
          code: 'validation_failure',
          message: `Érvénytelen feladatpayload: ${reference.nodeId}`,
          details: payload.error.flatten()
        });
      const graded = gradeExercise(payload.data, answers[reference.nodeId], 1);
      if (!graded.ok) return graded;
      resolvedExercises.push({
        nodeId: reference.nodeId,
        revision: reference.revision,
        title: resolved.value.node.title,
        payload: structuredClone(resolved.value.node.payload)
      });
      results.push({
        exerciseId: reference.nodeId,
        score: graded.value.score,
        maxScore: graded.value.maxScore,
        explanation: graded.value.explanation,
        manualReview: graded.value.manualReview
      });
    }
    const now = this.clock.iso();
    const submission: AssignmentSubmission = {
      id: `${assignmentId}:${learnerId}:${attempt}`,
      assignmentId,
      learnerId,
      attempt,
      answers,
      resolvedExercises,
      results,
      status: results.some((result) => result.manualReview) ? 'submitted' : 'auto-checked',
      version: 0,
      createdAt: now,
      updatedAt: now
    };
    await this.repository.insertRecord('assignmentSubmissions', submission);
    await this.repository.deleteRecord('answerDrafts', `${assignmentId}:${learnerId}`);
    return ok(submission);
  }

  listSubmissions(assignmentId: string) {
    return this.repository.listRecords<AssignmentSubmission>('assignmentSubmissions', {
      filters: { assignmentId },
      limit: 200,
      sortField: 'createdAt',
      sortDirection: 'desc'
    });
  }

  async confirmGrade(
    input: Omit<GradeEntry, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<GradeEntry>> {
    const now = this.clock.iso();
    const grade = gradeEntrySchema.parse({
      ...input,
      id: randomUUID(),
      version: 0,
      createdAt: now,
      updatedAt: now
    });
    await this.repository.insertRecord('gradeEntries', grade);
    return ok(grade);
  }
}
