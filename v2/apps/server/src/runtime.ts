import type { FastifyInstance } from 'fastify';
import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createRepository } from './repository/index.js';
import { buildDemoSeed } from './seed.js';
import { hashPassword } from './auth.js';

let singleton: Promise<{ app: FastifyInstance; close: () => Promise<void> }> | undefined;

export function getRuntime() {
  singleton ??= (async () => {
    const config = readConfig();
    const repository = createRepository(config);
    await repository.init();
    if (
      (await repository.countUsers()) === 0 &&
      config.BOOTSTRAP_ADMIN_USERNAME &&
      config.BOOTSTRAP_ADMIN_PASSWORD
    ) {
      const now = new Date().toISOString();
      await repository.upsertUser({
        id: 'bootstrap-admin',
        username: config.BOOTSTRAP_ADMIN_USERNAME.toLocaleLowerCase(),
        displayName: 'Fonat Admin',
        passwordHash: await hashPassword(config.BOOTSTRAP_ADMIN_PASSWORD),
        roles: ['site-admin', 'teacher'],
        capabilities: [
          'users.manage',
          'settings.manage',
          'modules.manage',
          'seeds.manage',
          'content.import',
          'content.export',
          'health.read',
          'content.manage',
          'classrooms.manage',
          'lessons.manage',
          'assessments.manage',
          'submissions.review'
        ],
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now
      });
      await repository.resetAll(await buildDemoSeed(hashPassword));
    }
    const app = await createApp(config, repository);
    return {
      app,
      close: async () => {
        await app.close();
        await repository.close();
      }
    };
  })();
  return singleton;
}
