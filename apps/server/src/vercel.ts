import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRuntime } from './runtime.js';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const runtime = await getRuntime();
  await runtime.app.ready();
  runtime.app.server.emit('request', request, response);
}
