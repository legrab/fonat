import { mkdir, writeFile } from "node:fs/promises";
import { createDemoState, FixedClock } from "@fonat/application";
import { MongoStatePersistence } from "@fonat/persistence-mongodb";
const state = await createDemoState(new FixedClock());
if (process.env.MONGODB_URI) {
  const p = new MongoStatePersistence(
    process.env.MONGODB_URI,
    process.env.MONGODB_DB || "fonat",
  );
  const current = await p.load();
  state.version = (current?.version || 0) + 1;
  const ok = await p.save(current?.version || 0, state);
  await p.close();
  if (!ok) throw new Error("MongoDB reset lost an optimistic concurrency race");
  console.log("Demo workspace reset in MongoDB.");
} else {
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/demo-workspace.json",
    JSON.stringify(state, null, 2),
  );
  console.log(
    "No MONGODB_URI. Wrote artifacts/demo-workspace.json as a deterministic reset artifact.",
  );
}
