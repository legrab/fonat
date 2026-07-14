import { describe, expect, it } from "vitest";
import type { WorkspaceState } from "@fonat/application";
import {
  type StatePersistence,
  WorkspaceStore,
} from "@fonat/persistence-mongodb";

class SharedPersistence implements StatePersistence {
  state = { version: 1, value: 0 } as unknown as WorkspaceState;

  async load() {
    return structuredClone(this.state);
  }

  async save(expectedVersion: number, state: WorkspaceState) {
    if (this.state.version !== expectedVersion) return false;
    this.state = structuredClone(state);
    return true;
  }

  async close() {}
}

describe("WorkspaceStore", () => {
  it("reloads and retries after another instance advances shared state", async () => {
    const persistence = new SharedPersistence();
    const seed = async () => persistence.state;
    const first = await new WorkspaceStore(persistence, seed).init();
    const stale = await new WorkspaceStore(persistence, seed).init();

    await first.mutate((state) => {
      (state as WorkspaceState & { value: number }).value += 1;
    });
    await stale.mutate((state) => {
      (state as WorkspaceState & { value: number }).value += 1;
    });

    expect(
      (persistence.state as WorkspaceState & { value: number }).value,
    ).toBe(2);
    expect(persistence.state.version).toBe(3);
  });
});
