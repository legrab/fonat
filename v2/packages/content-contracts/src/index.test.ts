import { expect, it } from 'vitest';
import { validateContentPackage } from './index.js';

it('rejects relations to missing nodes', () => {
  const result = validateContentPackage({
    manifest: {
      contractVersion: '1.0.0',
      packageId: 'test.package',
      name: 'Test',
      version: '1.0.0',
      language: 'hu',
      dependencies: {},
      capabilities: [],
      entrypoints: { nodes: ['nodes.json'], relations: ['relations.json'] }
    },
    nodes: [],
    relations: [
      {
        id: 'r1',
        type: 'covers',
        sourceId: 'missing',
        targetId: 'also-missing',
        dimensions: {},
        metadata: {},
        provenance: { origin: 'seed' },
        createdAt: new Date().toISOString()
      }
    ],
    markdown: {},
    assets: {}
  });
  expect(result.valid).toBe(false);
  expect(result.issues.some((issue) => issue.code === 'relation.source-missing')).toBe(true);
});
