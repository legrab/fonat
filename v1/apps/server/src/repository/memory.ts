import type { GraphNode, GraphRelation, LearnerProfile, NodeRevision, Submission } from '@fonat/contracts';
import type {
  ActivityRecord,
  AssessmentInstanceRecord,
  ClassroomAccess,
  EvidenceRecord,
  FonatRepository,
  LessonRunRecord,
  LiveSessionRecord,
  NotificationRecord,
  Paged,
  SessionRecord,
  UserRecord
} from './types.js';

function paginate<T>(items: T[], limit = 50, cursor?: string): Paged<T> {
  const start = cursor ? Number(Buffer.from(cursor, 'base64url').toString('utf8')) : 0;
  const page = items.slice(start, start + limit);
  const next =
    start + page.length < items.length
      ? Buffer.from(String(start + page.length)).toString('base64url')
      : undefined;
  return { items: structuredClone(page), total: items.length, nextCursor: next };
}

export class MemoryFonatRepository implements FonatRepository {
  private nodes = new Map<string, GraphNode>();
  private relations = new Map<string, GraphRelation>();
  private revisions = new Map<string, NodeRevision>();
  private users = new Map<string, UserRecord>();
  private sessions = new Map<string, SessionRecord>();
  private learners = new Map<string, LearnerProfile>();
  private classroomAccess = new Map<string, ClassroomAccess>();
  private lessonRuns = new Map<string, LessonRunRecord>();
  private liveSessions = new Map<string, LiveSessionRecord>();
  private submissions = new Map<string, Submission>();
  private evidence = new Map<string, EvidenceRecord>();
  private activities = new Map<string, ActivityRecord>();
  private notifications = new Map<string, NotificationRecord>();
  private assessmentInstances = new Map<string, AssessmentInstanceRecord>();

  async init() {}
  async close() {}
  async createIndexes() {}

  async getNode(id: string) {
    return structuredClone(this.nodes.get(id) ?? null);
  }
  async listNodes(input: {
    type?: string;
    query?: string;
    lifecycle?: string;
    ids?: string[];
    limit?: number;
    cursor?: string;
  }) {
    let items = [...this.nodes.values()];
    if (input.type) items = items.filter((node) => node.type === input.type);
    if (input.lifecycle) items = items.filter((node) => node.lifecycle === input.lifecycle);
    if (input.ids) {
      const ids = new Set(input.ids);
      items = items.filter((node) => ids.has(node.id));
    }
    if (input.query) {
      const q = input.query.toLocaleLowerCase('hu-HU');
      items = items.filter((node) =>
        JSON.stringify({ title: node.title, summary: node.summary, tags: node.tags, payload: node.payload })
          .toLocaleLowerCase('hu-HU')
          .includes(q)
      );
    }
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    return paginate(items, input.limit, input.cursor);
  }
  async upsertNode(node: GraphNode) {
    this.nodes.set(node.id, structuredClone(node));
  }
  async deleteNodesByPackage(packageId: string) {
    let count = 0;
    for (const [id, node] of this.nodes)
      if (node.provenance.packageId === packageId) {
        this.nodes.delete(id);
        count++;
      }
    return count;
  }
  async countNodes() {
    return this.nodes.size;
  }

  async getRevision(nodeId: string, revision: number) {
    return structuredClone(this.revisions.get(`${nodeId}:${revision}`) ?? null);
  }
  async listRevisions(nodeId: string) {
    return [...this.revisions.values()]
      .filter((revision) => revision.nodeId === nodeId)
      .sort((a, b) => b.revision - a.revision)
      .map((value) => structuredClone(value));
  }
  async insertRevision(revision: NodeRevision) {
    this.revisions.set(`${revision.nodeId}:${revision.revision}`, structuredClone(revision));
  }

  async listRelations(input: { sourceId?: string; targetId?: string; type?: string; nodeIds?: string[] }) {
    const nodeIds = input.nodeIds ? new Set(input.nodeIds) : undefined;
    return [...this.relations.values()]
      .filter(
        (relation) =>
          (!input.sourceId || relation.sourceId === input.sourceId) &&
          (!input.targetId || relation.targetId === input.targetId) &&
          (!input.type || relation.type === input.type) &&
          (!nodeIds || nodeIds.has(relation.sourceId) || nodeIds.has(relation.targetId))
      )
      .map((value) => structuredClone(value));
  }
  async upsertRelation(relation: GraphRelation) {
    this.relations.set(relation.id, structuredClone(relation));
  }
  async deleteRelationsByPackage(packageId: string) {
    let count = 0;
    for (const [id, relation] of this.relations)
      if (relation.provenance.packageId === packageId) {
        this.relations.delete(id);
        count++;
      }
    return count;
  }

  async getUserByUsername(username: string) {
    return structuredClone(
      [...this.users.values()].find(
        (user) => user.username.toLocaleLowerCase() === username.toLocaleLowerCase()
      ) ?? null
    );
  }
  async getUser(id: string) {
    return structuredClone(this.users.get(id) ?? null);
  }
  async listUsers() {
    return [...this.users.values()].map((value) => structuredClone(value));
  }
  async upsertUser(user: UserRecord) {
    this.users.set(user.id, structuredClone(user));
  }
  async countUsers() {
    return this.users.size;
  }

  async getSessionByHash(tokenHash: string) {
    const session = this.sessions.get(tokenHash);
    if (!session || session.expiresAt < new Date().toISOString()) return null;
    return structuredClone(session);
  }
  async insertSession(session: SessionRecord) {
    this.sessions.set(session.tokenHash, structuredClone(session));
  }
  async deleteSessionByHash(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }
  async deleteSessionsForUser(userId: string) {
    for (const [hash, session] of this.sessions) if (session.userId === userId) this.sessions.delete(hash);
  }

  async listLearners(classroomId?: string) {
    return [...this.learners.values()]
      .filter((learner) => !classroomId || learner.classroomId === classroomId)
      .map((value) => structuredClone(value));
  }
  async getLearner(id: string) {
    return structuredClone(this.learners.get(id) ?? null);
  }
  async upsertLearner(learner: LearnerProfile) {
    this.learners.set(learner.id, structuredClone(learner));
  }
  async deleteLearnersByClassroom(classroomId: string) {
    let count = 0;
    for (const [id, learner] of this.learners)
      if (learner.classroomId === classroomId) {
        this.learners.delete(id);
        count++;
      }
    return count;
  }

  async upsertClassroomAccess(access: ClassroomAccess) {
    this.classroomAccess.set(`${access.classroomId}:${access.learnerId}`, structuredClone(access));
  }
  async findClassroomAccess(classroomCode: string, learnerId?: string) {
    return [...this.classroomAccess.values()]
      .filter(
        (access) => access.classroomCode === classroomCode && (!learnerId || access.learnerId === learnerId)
      )
      .map((value) => structuredClone(value));
  }

  async getLessonRun(id: string) {
    return structuredClone(this.lessonRuns.get(id) ?? null);
  }
  async listLessonRuns(lessonId?: string) {
    return [...this.lessonRuns.values()]
      .filter((run) => !lessonId || run.lessonId === lessonId)
      .map((value) => structuredClone(value));
  }
  async upsertLessonRun(run: LessonRunRecord) {
    this.lessonRuns.set(run.id, structuredClone(run));
  }

  async getLiveSessionByCode(code: string) {
    return structuredClone([...this.liveSessions.values()].find((session) => session.code === code) ?? null);
  }
  async getLiveSession(id: string) {
    return structuredClone(this.liveSessions.get(id) ?? null);
  }
  async upsertLiveSession(session: LiveSessionRecord) {
    this.liveSessions.set(session.id, structuredClone(session));
  }

  async getSubmission(id: string) {
    return structuredClone(this.submissions.get(id) ?? null);
  }
  async listSubmissions(input: {
    learnerId?: string;
    assessmentId?: string;
    liveSessionId?: string;
    exerciseId?: string;
  }) {
    return [...this.submissions.values()]
      .filter(
        (submission) =>
          (!input.learnerId || submission.learnerId === input.learnerId) &&
          (!input.assessmentId || submission.assessmentId === input.assessmentId) &&
          (!input.liveSessionId || submission.liveSessionId === input.liveSessionId) &&
          (!input.exerciseId || submission.exerciseId === input.exerciseId)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((value) => structuredClone(value));
  }
  async upsertSubmission(submission: Submission) {
    this.submissions.set(submission.id, structuredClone(submission));
  }
  async deleteSubmissionsByAssessment(assessmentId: string) {
    let count = 0;
    for (const [id, submission] of this.submissions)
      if (submission.assessmentId === assessmentId) {
        this.submissions.delete(id);
        count++;
      }
    return count;
  }

  async listEvidence(input: { learnerId?: string; conceptId?: string }) {
    return [...this.evidence.values()]
      .filter(
        (evidence) =>
          (!input.learnerId || evidence.learnerId === input.learnerId) &&
          (!input.conceptId || evidence.conceptIds.includes(input.conceptId))
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((value) => structuredClone(value));
  }
  async upsertEvidence(evidence: EvidenceRecord) {
    this.evidence.set(evidence.id, structuredClone(evidence));
  }

  async listActivities(limit = 30) {
    return [...this.activities.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((value) => structuredClone(value));
  }
  async insertActivity(activity: ActivityRecord) {
    this.activities.set(activity.id, structuredClone(activity));
  }

  async listNotifications(userId: string) {
    return [...this.notifications.values()]
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((value) => structuredClone(value));
  }
  async upsertNotification(notification: NotificationRecord) {
    this.notifications.set(notification.id, structuredClone(notification));
  }

  async listAssessmentInstances(assessmentId?: string) {
    return [...this.assessmentInstances.values()]
      .filter((instance) => !assessmentId || instance.assessmentId === assessmentId)
      .map((value) => structuredClone(value));
  }
  async upsertAssessmentInstance(instance: AssessmentInstanceRecord) {
    this.assessmentInstances.set(instance.id, structuredClone(instance));
  }

  async resetAll(data: Parameters<FonatRepository['resetAll']>[0]) {
    this.nodes = new Map(data.nodes.map((value) => [value.id, structuredClone(value)]));
    this.relations = new Map(data.relations.map((value) => [value.id, structuredClone(value)]));
    this.revisions = new Map(
      data.revisions.map((value) => [`${value.nodeId}:${value.revision}`, structuredClone(value)])
    );
    this.learners = new Map(data.learners.map((value) => [value.id, structuredClone(value)]));
    this.classroomAccess = new Map(
      data.classroomAccess.map((value) => [`${value.classroomId}:${value.learnerId}`, structuredClone(value)])
    );
    this.lessonRuns = new Map(data.lessonRuns.map((value) => [value.id, structuredClone(value)]));
    this.liveSessions = new Map(data.liveSessions.map((value) => [value.id, structuredClone(value)]));
    this.submissions = new Map(data.submissions.map((value) => [value.id, structuredClone(value)]));
    this.evidence = new Map(data.evidence.map((value) => [value.id, structuredClone(value)]));
    this.activities = new Map(data.activities.map((value) => [value.id, structuredClone(value)]));
    this.notifications = new Map(data.notifications.map((value) => [value.id, structuredClone(value)]));
    this.assessmentInstances = new Map(
      data.assessmentInstances.map((value) => [value.id, structuredClone(value)])
    );
  }
}
