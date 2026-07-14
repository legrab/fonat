import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app.js";
let contextPromise: ReturnType<typeof createApp> | undefined;
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  contextPromise ??= createApp();
  const { app } = await contextPromise;
  app.server.emit("request", req, res);
}
