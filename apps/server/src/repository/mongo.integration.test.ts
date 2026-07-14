import { describe, expect, it } from 'vitest';
import { MongoFonatRepository } from './mongo.js';

const uri = process.env.MONGODB_TEST_URI;
describe.skipIf(!uri)('MongoFonatRepository real replica-set integration', () => {
  it('creates indexes, performs compare-and-swap, cursor paging and transaction-backed atomic work', async () => {
    const repository = new MongoFonatRepository(uri!, `fonat-test-${Date.now()}`);
    await repository.init();
    try {
      const now = new Date().toISOString();
      await repository.insertRecord('courses', { id: 'course.1', name: 'A', version: 0, updatedAt: now });
      expect(
        await repository.compareAndSwapRecord(
          'courses',
          { id: 'course.1', name: 'B', version: 1, updatedAt: now },
          0
        )
      ).toBe(true);
      expect(
        await repository.compareAndSwapRecord(
          'courses',
          { id: 'course.1', name: 'C', version: 1, updatedAt: now },
          0
        )
      ).toBe(false);
      const page = await repository.listRecords<{ id: string }>('courses', {
        limit: 1,
        sortField: 'updatedAt'
      });
      expect(page.items).toHaveLength(1);
      await repository.runAtomic(async () => {
        await repository.insertRecord('courses', { id: 'course.2', name: 'D', version: 0, updatedAt: now });
      });
      expect(await repository.getRecord('courses', 'course.2')).not.toBeNull();
    } finally {
      await repository.close();
    }
  });
});
