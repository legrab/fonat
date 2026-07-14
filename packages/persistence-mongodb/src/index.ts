import { MongoClient } from "mongodb";
import type { WorkspaceState } from "@fonat/application";

export interface StatePersistence {
  load(): Promise<WorkspaceState | null>;
  save(expectedVersion: number, state: WorkspaceState): Promise<boolean>;
  close(): Promise<void>;
}
export class MemoryPersistence implements StatePersistence {
  private state: WorkspaceState | null = null;
  async load() {
    return this.state ? structuredClone(this.state) : null;
  }
  async save(expectedVersion: number, state: WorkspaceState) {
    if (this.state && this.state.version !== expectedVersion) return false;
    this.state = structuredClone(state);
    return true;
  }
  async close() {}
}
export class MongoStatePersistence implements StatePersistence {
  private readonly client: MongoClient;
  constructor(
    uri: string,
    private readonly dbName = "fonat",
  ) {
    this.client = new MongoClient(uri);
  }
  private collection() {
    return this.client
      .db(this.dbName)
      .collection<WorkspaceState & { _id: string }>("workspaceSnapshots");
  }
  async load() {
    await this.client.connect();
    const doc = await this.collection().findOne({ _id: "primary" });
    if (!doc) return null;
    const { _id, ...state } = doc;
    return state as WorkspaceState;
  }
  async save(expectedVersion: number, state: WorkspaceState) {
    await this.client.connect();
    const result = await this.collection().updateOne(
      { _id: "primary", version: expectedVersion },
      { $set: { ...state, _id: "primary" } },
      { upsert: expectedVersion === 0 },
    );
    return result.modifiedCount === 1 || result.upsertedCount === 1;
  }
  async close() {
    await this.client.close();
  }
}
export class WorkspaceStore {
  private static readonly maxSaveAttempts = 3;
  private state!: WorkspaceState;
  private queue = Promise.resolve();
  constructor(
    private readonly persistence: StatePersistence,
    private readonly seed: () => Promise<WorkspaceState>,
  ) {}
  async init() {
    this.state = (await this.persistence.load()) ?? (await this.seed());
    if (this.state.version === 1 && !(await this.persistence.load()))
      await this.persistence.save(0, this.state);
    return this;
  }
  snapshot() {
    return structuredClone(this.state);
  }
  async mutate<T>(fn: (draft: WorkspaceState) => T | Promise<T>): Promise<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.queue = this.queue.then(async () => {
      try {
        for (
          let attempt = 1;
          attempt <= WorkspaceStore.maxSaveAttempts;
          attempt++
        ) {
          const before = this.state.version;
          const draft = structuredClone(this.state);
          const value = await fn(draft);
          draft.version = before + 1;
          if (await this.persistence.save(before, draft)) {
            this.state = draft;
            resolve(value);
            return;
          }
          const latest = await this.persistence.load();
          if (!latest) throw new Error("Workspace disappeared during update");
          this.state = latest;
        }
        throw new Error("Concurrent workspace update");
      } catch (e) {
        reject(e);
      }
    });
    await this.queue;
    return result;
  }
  async replace(state: WorkspaceState) {
    const before = this.state.version;
    state.version = before + 1;
    if (!(await this.persistence.save(before, state)))
      throw new Error("Concurrent workspace update");
    this.state = structuredClone(state);
  }
  async close() {
    await this.persistence.close();
  }
}
