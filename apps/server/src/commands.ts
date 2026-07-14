import { readConfig } from './config.js';
import { createRepository } from './repository/index.js';
import { buildDemoSeed } from './seed.js';
import { hashPassword } from './auth.js';

const command = process.argv[2];
const repository = createRepository(readConfig());
await repository.init();
try {
  if (command === 'demo-reset') {
    await repository.resetAll(await buildDemoSeed(hashPassword));
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
