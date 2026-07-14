import { readConfig } from './config.js';
import { getRuntime } from './runtime.js';

const config = readConfig();
const runtime = await getRuntime();
await runtime.app.listen({ port: config.PORT, host: '0.0.0.0' });

const shutdown = async () => {
  await runtime.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
