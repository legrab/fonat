import { AsyncLocalStorage } from 'node:async_hooks';
import {
  MongoClient,
  type ClientSession,
  type Collection,
  type Db,
  type Document,
  type Filter,
  type Sort
} from 'mongodb';
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
  RecordQuery,
  IdempotencyRecord,
  SessionRecord,
  UserRecord
} from './types.js';

type Identified = { id: string };
type Stored<T extends Identified> = T & { _id: string };

function store<T extends Identified>(value: T): Stored<T> {
  return { ...structuredClone(value), _id: value.id };
}
function restore<T extends Identified>(value: Stored<T> | null): T | null {
  if (!value) return null;
  const rest = { ...value } as Record<string, unknown>;
  delete rest._id;
  return rest as unknown as T;
}

export class MongoFonatRepository implements FonatRepository {
  private readonly client: MongoClient;
  private db?: Db;
  private readonly transactionSession = new AsyncLocalStorage<ClientSession>();

  constructor(
    uri: string,
    private readonly databaseName: string
  ) {
    this.client = new MongoClient(uri, { maxPoolSize: 20, minPoolSize: 0 });
  }

  async init() {
    await this.client.connect();
    this.db = this.client.db(this.databaseName);
    await this.runMigrations();
    await this.createIndexes();
  }
  async close() {
    await this.client.close();
  }
  private database(): Db {
    if (!this.db) throw new Error('Repository is not initialized.');
    return this.db;
  }
  private collection<T extends Identified>(name: string): Collection<Stored<T>> {
    return this.database().collection<Stored<T>>(name);
  }
  private async upsert<T extends Identified>(name: string, value: T) {
    await this.collection<T>(name).replaceOne({ _id: value.id } as Filter<Stored<T>>, store(value), {
      upsert: true,
      session: this.transactionSession.getStore()
    });
  }
  private async byId<T extends Identified>(name: string, id: string) {
    return restore(
      await this.collection<T>(name).findOne({ _id: id } as Filter<Stored<T>>, {
        session: this.transactionSession.getStore()
      })
    );
  }
  private async all<T extends Identified>(
    name: string,
    filter: Filter<Stored<T>> = {},
    sort: Sort = { createdAt: -1 }
  ) {
    const values = await this.collection<T>(name)
      .find(filter, { session: this.transactionSession.getStore() })
      .sort(sort)
      .toArray();
    return values.map((value) => restore(value) as T);
  }

  private async runMigrations() {
    const migrations = [
      {
        id: '0001-v2-baseline',
        up: async () => {
          await this.database()
            .collection<{ _id: string; version?: number; name?: string; updatedAt?: string }>('metadata')
            .updateOne(
              { _id: 'schema' },
              { $set: { version: 1, name: 'Fonat v2', updatedAt: new Date().toISOString() } },
              { upsert: true }
            );
        }
      }
    ];
    const applied = this.database().collection('schemaMigrations');
    await applied.createIndex({ id: 1 }, { unique: true, name: 'migration_id' });
    for (const migration of migrations) {
      if (await applied.findOne({ id: migration.id })) continue;
      await migration.up();
      await applied.insertOne({ id: migration.id, appliedAt: new Date().toISOString() });
    }
  }

  async createIndexes() {
    const db = this.database();
    await Promise.all([
      db.collection('nodes').createIndexes([
        { key: { type: 1, lifecycle: 1, updatedAt: -1 }, name: 'type_lifecycle_updated' },
        { key: { tags: 1 }, name: 'tags' },
        { key: { 'provenance.packageId': 1 }, name: 'package' },
        {
          key: { searchText: 'text', 'title.values.hu': 'text', 'title.values.en': 'text', tags: 'text' },
          name: 'node_text',
          default_language: 'none'
        }
      ]),
      db.collection('relations').createIndexes([
        { key: { sourceId: 1, type: 1 }, name: 'source_type' },
        { key: { targetId: 1, type: 1 }, name: 'target_type' },
        { key: { 'provenance.packageId': 1 }, name: 'package' }
      ]),
      db
        .collection('revisions')
        .createIndex({ nodeId: 1, revision: -1 }, { unique: true, name: 'node_revision' }),
      db.collection('users').createIndex({ username: 1 }, { unique: true, name: 'username' }),
      db.collection('sessions').createIndexes([
        { key: { tokenHash: 1 }, unique: true, name: 'token_hash' },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'expires' }
      ]),
      db.collection('learners').createIndex({ classroomId: 1, nickname: 1 }, { name: 'classroom_nickname' }),
      db
        .collection('classroomAccess')
        .createIndex({ classroomCode: 1, learnerId: 1 }, { unique: true, name: 'classroom_learner' }),
      db.collection('lessonRuns').createIndex({ lessonId: 1, startedAt: -1 }, { name: 'lesson_started' }),
      db.collection('liveSessions').createIndexes([
        { key: { code: 1 }, unique: true, name: 'code' },
        { key: { updatedAt: -1 }, name: 'updated' }
      ]),
      db.collection('submissions').createIndexes([
        { key: { learnerId: 1, createdAt: -1 }, name: 'learner_created' },
        { key: { assessmentId: 1, exerciseId: 1 }, name: 'assessment_exercise' },
        { key: { liveSessionId: 1, exerciseId: 1 }, name: 'live_exercise' }
      ]),
      db.collection('evidence').createIndexes([
        { key: { learnerId: 1, createdAt: -1 }, name: 'learner_created' },
        { key: { conceptIds: 1 }, name: 'concepts' }
      ]),
      db.collection('activity').createIndex({ createdAt: -1 }, { name: 'created' }),
      db.collection('idempotency').createIndexes([
        { key: { operation: 1, key: 1 }, unique: true, name: 'operation_key' },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'expires' }
      ]),
      db
        .collection('notifications')
        .createIndex({ userId: 1, read: 1, createdAt: -1 }, { name: 'user_read_created' }),
      db
        .collection('assessmentInstances')
        .createIndex({ assessmentId: 1, learnerId: 1 }, { unique: true, name: 'assessment_learner' })
    ]);
  }

  async getNode(id: string) {
    return this.byId<GraphNode>('nodes', id);
  }
  async listNodes(input: {
    type?: string;
    query?: string;
    lifecycle?: string;
    ids?: string[];
    limit?: number;
    cursor?: string;
  }): Promise<Paged<GraphNode>> {
    const filter: Document = {};
    if (input.cursor) {
      const cursor = JSON.parse(Buffer.from(input.cursor, 'base64url').toString('utf8')) as {
        updatedAt: string;
        id: string;
      };
      filter.$or = [
        { updatedAt: { $lt: cursor.updatedAt } },
        { updatedAt: cursor.updatedAt, _id: { $gt: cursor.id } }
      ];
    }
    if (input.type) filter.type = input.type;
    if (input.lifecycle) filter.lifecycle = input.lifecycle;
    if (input.ids) filter.id = { $in: input.ids };
    if (input.query) filter.$text = { $search: input.query };
    const limit = Math.min(input.limit ?? 50, 100);
    const collection = this.collection<GraphNode>('nodes');
    const documents = await collection
      .find(filter as Filter<Stored<GraphNode>>)
      .sort({ updatedAt: -1, _id: 1 })
      .limit(limit + 1)
      .toArray();
    const hasNext = documents.length > limit;
    const page = documents.slice(0, limit).map((value) => restore(value) as GraphNode);
    const nextCursor =
      hasNext && page.length
        ? Buffer.from(
            JSON.stringify({ updatedAt: page[page.length - 1]!.updatedAt, id: page[page.length - 1]!.id })
          ).toString('base64url')
        : undefined;
    const total = await collection.countDocuments(filter as Filter<Stored<GraphNode>>);
    return { items: page, total, nextCursor };
  }
  async upsertNode(node: GraphNode) {
    await this.upsert('nodes', node);
  }
  async compareAndSwapNode(node: GraphNode, expectedVersion: number) {
    const next = { ...node, version: expectedVersion + 1 };
    const result = await this.collection<GraphNode>('nodes').replaceOne(
      { _id: node.id, version: expectedVersion } as never,
      store(next),
      { upsert: false, session: this.transactionSession.getStore() }
    );
    return result.modifiedCount === 1;
  }
  async deleteNodesByPackage(packageId: string) {
    const result = await this.collection<GraphNode>('nodes').deleteMany({
      'provenance.packageId': packageId
    } as Filter<Stored<GraphNode>>);
    return result.deletedCount;
  }
  async countNodes() {
    return this.collection<GraphNode>('nodes').countDocuments();
  }

  async getRevision(nodeId: string, revision: number) {
    return restore(
      await this.collection<NodeRevision>('revisions').findOne({ nodeId, revision } as Filter<
        Stored<NodeRevision>
      >)
    );
  }
  async listRevisions(nodeId: string) {
    return this.all<NodeRevision>('revisions', { nodeId } as Filter<Stored<NodeRevision>>, { revision: -1 });
  }
  async insertRevision(revision: NodeRevision) {
    await this.upsert('revisions', revision);
  }

  async getRelation(id: string) {
    return this.byId<GraphRelation>('relations', id);
  }
  async listRelations(input: { sourceId?: string; targetId?: string; type?: string; nodeIds?: string[] }) {
    const filter: Document = {};
    if (input.sourceId) filter.sourceId = input.sourceId;
    if (input.targetId) filter.targetId = input.targetId;
    if (input.type) filter.type = input.type;
    if (input.nodeIds)
      filter.$or = [{ sourceId: { $in: input.nodeIds } }, { targetId: { $in: input.nodeIds } }];
    return this.all<GraphRelation>('relations', filter as Filter<Stored<GraphRelation>>, { createdAt: 1 });
  }
  async upsertRelation(relation: GraphRelation) {
    await this.upsert('relations', relation);
  }
  async compareAndSwapRelation(relation: GraphRelation, expectedVersion: number) {
    const { id, ...value } = relation;
    const result = await this.collection<GraphRelation>('relations').replaceOne(
      { _id: id, version: expectedVersion } as never,
      { _id: id, ...value } as never,
      { session: this.transactionSession.getStore() }
    );
    return result.modifiedCount === 1;
  }
  async deleteRelation(id: string) {
    const result = await this.collection<GraphRelation>('relations').deleteOne({ _id: id } as never, {
      session: this.transactionSession.getStore()
    });
    return result.deletedCount === 1;
  }
  async deleteRelationsByPackage(packageId: string) {
    const result = await this.collection<GraphRelation>('relations').deleteMany({
      'provenance.packageId': packageId
    } as Filter<Stored<GraphRelation>>);
    return result.deletedCount;
  }

  async getUserByUsername(username: string) {
    return restore(
      await this.collection<UserRecord>('users').findOne({ username: username.toLocaleLowerCase() } as Filter<
        Stored<UserRecord>
      >)
    );
  }
  async getUser(id: string) {
    return this.byId<UserRecord>('users', id);
  }
  async listUsers() {
    return this.all<UserRecord>('users', {}, { createdAt: 1 });
  }
  async upsertUser(user: UserRecord) {
    await this.upsert('users', { ...user, username: user.username.toLocaleLowerCase() });
  }
  async countUsers() {
    return this.collection<UserRecord>('users').countDocuments();
  }

  async getSessionByHash(tokenHash: string) {
    return restore(
      await this.collection<SessionRecord>('sessions').findOne({
        tokenHash,
        expiresAt: { $gt: new Date().toISOString() }
      } as Filter<Stored<SessionRecord>>)
    );
  }
  async insertSession(session: SessionRecord) {
    await this.upsert('sessions', session);
  }
  async deleteSessionByHash(tokenHash: string) {
    await this.collection<SessionRecord>('sessions').deleteOne({ tokenHash } as Filter<
      Stored<SessionRecord>
    >);
  }
  async deleteSessionsForUser(userId: string) {
    await this.collection<SessionRecord>('sessions').deleteMany({ userId } as Filter<Stored<SessionRecord>>);
  }

  async listLearners(classroomId?: string) {
    return this.all<LearnerProfile>(
      'learners',
      (classroomId ? { classroomId } : {}) as Filter<Stored<LearnerProfile>>,
      { nickname: 1 }
    );
  }
  async getLearner(id: string) {
    return this.byId<LearnerProfile>('learners', id);
  }
  async upsertLearner(learner: LearnerProfile) {
    await this.upsert('learners', learner);
  }
  async deleteLearnersByClassroom(classroomId: string) {
    const result = await this.collection<LearnerProfile>('learners').deleteMany({ classroomId } as Filter<
      Stored<LearnerProfile>
    >);
    return result.deletedCount;
  }

  async upsertClassroomAccess(access: ClassroomAccess) {
    await this.upsert('classroomAccess', {
      ...access,
      id: `${access.classroomId}:${access.learnerId}`
    } as ClassroomAccess & { id: string });
  }
  async findClassroomAccess(classroomCode: string, learnerId?: string) {
    const filter: Document = { classroomCode };
    if (learnerId) filter.learnerId = learnerId;
    const records = await this.database()
      .collection<Stored<ClassroomAccess & { id: string }>>('classroomAccess')
      .find(filter as Filter<Stored<ClassroomAccess & { id: string }>>)
      .toArray();
    return records.map((value) => {
      const restored = restore(value)!;
      const access = { ...restored };
      delete (access as Partial<typeof access>).id;
      return access;
    });
  }

  async getLessonRun(id: string) {
    return this.byId<LessonRunRecord>('lessonRuns', id);
  }
  async listLessonRuns(lessonId?: string) {
    return this.all<LessonRunRecord>(
      'lessonRuns',
      (lessonId ? { lessonId } : {}) as Filter<Stored<LessonRunRecord>>,
      { startedAt: -1 }
    );
  }
  async upsertLessonRun(run: LessonRunRecord) {
    await this.upsert('lessonRuns', run);
  }

  async getLiveSessionByCode(code: string) {
    return restore(
      await this.collection<LiveSessionRecord>('liveSessions').findOne({ code } as Filter<
        Stored<LiveSessionRecord>
      >)
    );
  }
  async getLiveSession(id: string) {
    return this.byId<LiveSessionRecord>('liveSessions', id);
  }
  async upsertLiveSession(session: LiveSessionRecord) {
    await this.upsert('liveSessions', session);
  }

  async getSubmission(id: string) {
    return this.byId<Submission>('submissions', id);
  }
  async listSubmissions(input: {
    learnerId?: string;
    assessmentId?: string;
    liveSessionId?: string;
    exerciseId?: string;
  }) {
    const filter: Document = {};
    for (const [key, value] of Object.entries(input)) if (value) filter[key] = value;
    return this.all<Submission>('submissions', filter as Filter<Stored<Submission>>, { createdAt: 1 });
  }
  async upsertSubmission(submission: Submission) {
    await this.upsert('submissions', submission);
  }
  async deleteSubmissionsByAssessment(assessmentId: string) {
    const result = await this.collection<Submission>('submissions').deleteMany({ assessmentId } as Filter<
      Stored<Submission>
    >);
    return result.deletedCount;
  }

  async listEvidence(input: { learnerId?: string; conceptId?: string }) {
    const filter: Document = {};
    if (input.learnerId) filter.learnerId = input.learnerId;
    if (input.conceptId) filter.conceptIds = input.conceptId;
    return this.all<EvidenceRecord>('evidence', filter as Filter<Stored<EvidenceRecord>>, { createdAt: -1 });
  }
  async upsertEvidence(evidence: EvidenceRecord) {
    await this.upsert('evidence', evidence);
  }

  async listActivities(limit = 30) {
    const values = await this.collection<ActivityRecord>('activity')
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return values.map((value) => restore(value) as ActivityRecord);
  }
  async insertActivity(activity: ActivityRecord) {
    await this.upsert('activity', activity);
  }

  async listNotifications(userId: string) {
    return this.all<NotificationRecord>('notifications', { userId } as Filter<Stored<NotificationRecord>>, {
      createdAt: -1
    });
  }
  async upsertNotification(notification: NotificationRecord) {
    await this.upsert('notifications', notification);
  }

  async listAssessmentInstances(assessmentId?: string) {
    return this.all<AssessmentInstanceRecord>(
      'assessmentInstances',
      (assessmentId ? { assessmentId } : {}) as Filter<Stored<AssessmentInstanceRecord>>,
      { createdAt: 1 }
    );
  }
  async upsertAssessmentInstance(instance: AssessmentInstanceRecord) {
    await this.upsert('assessmentInstances', instance);
  }

  private safeCollectionName(name: string) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{1,60}$/.test(name)) throw new Error(`Invalid collection name: ${name}`);
    return name;
  }

  async getRecord<T>(collection: string, id: string): Promise<T | null> {
    return restore(
      await this.collection<T & Identified>(this.safeCollectionName(collection)).findOne(
        { _id: id } as never,
        { session: this.transactionSession.getStore() }
      )
    ) as T | null;
  }

  async listRecords<T>(collection: string, input: RecordQuery = {}): Promise<Paged<T>> {
    const name = this.safeCollectionName(collection);
    const filter: Document = {};
    for (const [key, expected] of Object.entries(input.filters ?? {})) {
      filter[key] =
        typeof expected === 'object' && expected && '$in' in expected ? { $in: expected.$in } : expected;
    }
    if (input.query)
      filter.searchText = { $regex: input.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const field = input.sortField ?? 'updatedAt';
    const direction = input.sortDirection === 'asc' ? 1 : -1;
    if (input.cursor) {
      const cursor = JSON.parse(Buffer.from(input.cursor, 'base64url').toString('utf8')) as {
        value: string;
        id: string;
      };
      filter.$or =
        direction === 1
          ? [{ [field]: { $gt: cursor.value } }, { [field]: cursor.value, _id: { $gt: cursor.id } }]
          : [{ [field]: { $lt: cursor.value } }, { [field]: cursor.value, _id: { $gt: cursor.id } }];
    }
    const limit = Math.min(input.limit ?? 50, 200);
    const values = await this.collection<T & Identified>(name)
      .find(filter as never, { session: this.transactionSession.getStore() })
      .sort({ [field]: direction, _id: 1 })
      .limit(limit + 1)
      .toArray();
    const hasMore = values.length > limit;
    const page = values.slice(0, limit).map((value) => restore(value) as T);
    const last = page.at(-1) as Record<string, unknown> | undefined;
    const nextCursor =
      hasMore && last
        ? Buffer.from(JSON.stringify({ value: String(last[field] ?? ''), id: String(last.id) })).toString(
            'base64url'
          )
        : undefined;
    return { items: page, nextCursor, total: page.length };
  }

  async insertRecord<T extends { id: string }>(collection: string, value: T): Promise<void> {
    await this.collection<T>(this.safeCollectionName(collection)).insertOne(store(value) as never, {
      session: this.transactionSession.getStore()
    });
  }

  async upsertRecord<T extends { id: string }>(collection: string, value: T): Promise<void> {
    await this.upsert(this.safeCollectionName(collection), value);
  }

  async compareAndSwapRecord<T extends { id: string; version: number }>(
    collection: string,
    value: T,
    expectedVersion: number
  ) {
    const next = { ...value, version: expectedVersion + 1 };
    const result = await this.collection<T>(this.safeCollectionName(collection)).replaceOne(
      { _id: value.id, version: expectedVersion } as never,
      store(next as T),
      { upsert: false, session: this.transactionSession.getStore() }
    );
    return result.modifiedCount === 1;
  }

  async deleteRecord(collection: string, id: string) {
    const result = await this.collection<Identified>(this.safeCollectionName(collection)).deleteOne(
      { _id: id } as never,
      { session: this.transactionSession.getStore() }
    );
    return result.deletedCount === 1;
  }

  async getIdempotency(operation: string, key: string) {
    const value = await this.database()
      .collection<IdempotencyRecord>('idempotency')
      .findOne({ operation, key, expiresAt: { $gt: new Date().toISOString() } });
    return value ? structuredClone(value) : null;
  }

  async putIdempotency(record: IdempotencyRecord) {
    await this.database()
      .collection<IdempotencyRecord>('idempotency')
      .updateOne(
        { operation: record.operation, key: record.key },
        { $setOnInsert: record },
        { upsert: true, session: this.transactionSession.getStore() }
      );
  }

  async runAtomic<T>(work: () => Promise<T>): Promise<T> {
    const session = this.client.startSession();
    try {
      let output!: T;
      await session.withTransaction(async () => {
        output = await this.transactionSession.run(session, work);
      });
      return output;
    } finally {
      await session.endSession();
    }
  }

  async resetAll(data: Parameters<FonatRepository['resetAll']>[0]) {
    const collections = [
      'nodes',
      'relations',
      'revisions',
      'learners',
      'classroomAccess',
      'lessonRuns',
      'liveSessions',
      'submissions',
      'evidence',
      'activity',
      'notifications',
      'assessmentInstances'
    ];
    await Promise.all(collections.map((name) => this.database().collection(name).deleteMany({})));
    const insert = async <T extends Identified>(name: string, values: T[]) => {
      if (values.length)
        await this.collection<T>(name).insertMany(values.map(store) as never[], { ordered: true });
    };
    await insert('nodes', data.nodes);
    await insert('relations', data.relations);
    await insert('revisions', data.revisions);
    await insert('learners', data.learners);
    if (data.classroomAccess.length)
      await this.database()
        .collection('classroomAccess')
        .insertMany(
          data.classroomAccess.map((access) =>
            store({ ...access, id: `${access.classroomId}:${access.learnerId}` })
          ) as never[]
        );
    await insert('lessonRuns', data.lessonRuns);
    await insert('liveSessions', data.liveSessions);
    await insert('submissions', data.submissions);
    await insert('evidence', data.evidence);
    await insert('activity', data.activities);
    await insert('notifications', data.notifications);
    await insert('assessmentInstances', data.assessmentInstances);
  }
}
