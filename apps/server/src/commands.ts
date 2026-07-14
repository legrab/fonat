import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createApp } from './app.js';
import { createClock } from './clock.js';
import { readConfig } from './config.js';
import { createRepository } from './repository/index.js';
import { MemoryFonatRepository } from './repository/memory.js';
import { buildDemoSeed } from './seed.js';
import { applyV2Demo } from './seed-v2.js';
import { hashPassword } from './auth.js';

const command = process.argv[2];

if (command === 'openapi') {
  const config = readConfig({
    ...process.env,
    NODE_ENV: 'test',
    PERSISTENCE_MODE: 'memory',
    SESSION_SECRET: 'openapi-generation-secret-long-enough',
    WEB_ORIGIN: 'http://127.0.0.1:4173',
    PUBLIC_BASE_URL: 'http://127.0.0.1:3000',
    ENABLE_SWAGGER: 'true'
  });
  const repository = new MemoryFonatRepository();
  await repository.init();
  const app = await createApp(config, repository);
  try {
    await app.ready();
    const target = path.resolve(process.cwd(), '../..', 'docs/openapi.json');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(app.swagger(), null, 2)}\n`, 'utf8');
    console.log(`OpenAPI written to ${target}`);
  } finally {
    await app.close();
  }
} else {
  const config = readConfig();
  const repository = createRepository(config);
  await repository.init();
  try {
    if (command === 'demo-reset') {
      await repository.resetAll(await buildDemoSeed(hashPassword));
      await applyV2Demo(repository, config, createClock(config.NODE_ENV, config.DEMO_CLOCK));
      console.log(`Demo reset complete. ${await repository.countNodes()} nodes loaded.`);
    } else if (command === 'indexes') {
      await repository.createIndexes();
      console.log('Indexes are present.');
    } else {
      throw new Error(`Unknown command: ${command ?? '(missing)'}`);
    }
  } finally {
    await repository.close();
  }
}
