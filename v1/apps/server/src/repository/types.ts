import type { GraphNode, GraphRelation, LearnerProfile, NodeRevision, Submission } from '@fonat/contracts';

export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  roles: string[];
  capabilities: string[];
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SessionRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type ClassroomAccess = {
  classroomId: string;
  classroomCode: string;
  learnerId: string;
  secretHash: string;
  mustChangePassword: boolean;
};

export type LessonRunRecord = {
  id: string;
  lessonId: string;
  startedAt: string;
  finishedAt?: string;
  currentSectionIndex: number;
  currentSlideIndex: number;
  status: 'running' | 'paused' | 'finished';
  sectionStartedAt: string;
  extraMinutes: number;
  completedSectionIds: string[];
  skippedSectionIds: string[];
  notes: Array<{ id: string; text: string; createdAt: string }>;
  updatedAt: string;
};

export type LiveSessionRecord = {
  id: string;
  code: string;
  lessonRunId?: string;
  assessmentId?: string;
  exerciseIds: string[];
  currentIndex: number;
  mode: 'teacher-paced' | 'student-paced';
  status: 'lobby' | 'open' | 'revealed' | 'closed';
  allowGuest: boolean;
  leaderboard: boolean;
  answerOrderPolicy: 'stable-session' | 'stable-attempt' | 'reshuffle-attempt';
  participants: Array<{
    id: string;
    learnerId?: string;
    nickname: string;
    badgeIcon: string;
    badgeColor: string;
    claimCode?: string;
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceRecord = {
  id: string;
  learnerId: string;
  conceptIds: string[];
  submissionId?: string;
  type: 'answer' | 'explanation' | 'confidence' | 'teacher-observation' | 'correction' | 'oral-demonstration';
  value: unknown;
  createdAt: string;
};

export type ActivityRecord = {
  id: string;
  actorId?: string;
  type: string;
  message: string;
  targetId?: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  message: string;
  targetId?: string;
  read: boolean;
  createdAt: string;
};

export type AssessmentInstanceRecord = {
  id: string;
  assessmentId: string;
  learnerId: string;
  variant: string;
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
  status: 'assigned' | 'submitted' | 'graded';
  createdAt: string;
};

export type ArchiveCandidate = {
  id: string;
  kind: string;
  reason: string;
  before: string;
};

export type Paged<T> = { items: T[]; total: number; nextCursor?: string };

export interface FonatRepository {
  init(): Promise<void>;
  close(): Promise<void>;
  createIndexes(): Promise<void>;

  getNode(id: string): Promise<GraphNode | null>;
  listNodes(input: {
    type?: string;
    query?: string;
    lifecycle?: string;
    ids?: string[];
    limit?: number;
    cursor?: string;
  }): Promise<Paged<GraphNode>>;
  upsertNode(node: GraphNode): Promise<void>;
  deleteNodesByPackage(packageId: string): Promise<number>;
  countNodes(): Promise<number>;

  getRevision(nodeId: string, revision: number): Promise<NodeRevision | null>;
  listRevisions(nodeId: string): Promise<NodeRevision[]>;
  insertRevision(revision: NodeRevision): Promise<void>;

  listRelations(input: {
    sourceId?: string;
    targetId?: string;
    type?: string;
    nodeIds?: string[];
  }): Promise<GraphRelation[]>;
  upsertRelation(relation: GraphRelation): Promise<void>;
  deleteRelationsByPackage(packageId: string): Promise<number>;

  getUserByUsername(username: string): Promise<UserRecord | null>;
  getUser(id: string): Promise<UserRecord | null>;
  listUsers(): Promise<UserRecord[]>;
  upsertUser(user: UserRecord): Promise<void>;
  countUsers(): Promise<number>;

  getSessionByHash(tokenHash: string): Promise<SessionRecord | null>;
  insertSession(session: SessionRecord): Promise<void>;
  deleteSessionByHash(tokenHash: string): Promise<void>;
  deleteSessionsForUser(userId: string): Promise<void>;

  listLearners(classroomId?: string): Promise<LearnerProfile[]>;
  getLearner(id: string): Promise<LearnerProfile | null>;
  upsertLearner(learner: LearnerProfile): Promise<void>;
  deleteLearnersByClassroom(classroomId: string): Promise<number>;

  upsertClassroomAccess(access: ClassroomAccess): Promise<void>;
  findClassroomAccess(classroomCode: string, learnerId?: string): Promise<ClassroomAccess[]>;

  getLessonRun(id: string): Promise<LessonRunRecord | null>;
  listLessonRuns(lessonId?: string): Promise<LessonRunRecord[]>;
  upsertLessonRun(run: LessonRunRecord): Promise<void>;

  getLiveSessionByCode(code: string): Promise<LiveSessionRecord | null>;
  getLiveSession(id: string): Promise<LiveSessionRecord | null>;
  upsertLiveSession(session: LiveSessionRecord): Promise<void>;

  getSubmission(id: string): Promise<Submission | null>;
  listSubmissions(input: {
    learnerId?: string;
    assessmentId?: string;
    liveSessionId?: string;
    exerciseId?: string;
  }): Promise<Submission[]>;
  upsertSubmission(submission: Submission): Promise<void>;
  deleteSubmissionsByAssessment(assessmentId: string): Promise<number>;

  listEvidence(input: { learnerId?: string; conceptId?: string }): Promise<EvidenceRecord[]>;
  upsertEvidence(evidence: EvidenceRecord): Promise<void>;

  listActivities(limit?: number): Promise<ActivityRecord[]>;
  insertActivity(activity: ActivityRecord): Promise<void>;

  listNotifications(userId: string): Promise<NotificationRecord[]>;
  upsertNotification(notification: NotificationRecord): Promise<void>;

  listAssessmentInstances(assessmentId?: string): Promise<AssessmentInstanceRecord[]>;
  upsertAssessmentInstance(instance: AssessmentInstanceRecord): Promise<void>;

  resetAll(data: {
    nodes: GraphNode[];
    relations: GraphRelation[];
    revisions: NodeRevision[];
    learners: LearnerProfile[];
    classroomAccess: ClassroomAccess[];
    lessonRuns: LessonRunRecord[];
    liveSessions: LiveSessionRecord[];
    submissions: Submission[];
    evidence: EvidenceRecord[];
    activities: ActivityRecord[];
    notifications: NotificationRecord[];
    assessmentInstances: AssessmentInstanceRecord[];
  }): Promise<void>;
}
