import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ContentPackage } from '@fonat/content-contracts';
import { validateContentPackage } from '@fonat/content-contracts';

export async function loadPackageDirectory(directory: string): Promise<ContentPackage> {
  const manifestPath = path.join(directory, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ContentPackage['manifest'];
  const nodes = [] as ContentPackage['nodes'];
  const relations = [] as ContentPackage['relations'];
  for (const file of manifest.entrypoints.nodes)
    nodes.push(
      ...(JSON.parse(await readFile(path.join(directory, file), 'utf8')) as ContentPackage['nodes'])
    );
  for (const file of manifest.entrypoints.relations)
    relations.push(
      ...(JSON.parse(await readFile(path.join(directory, file), 'utf8')) as ContentPackage['relations'])
    );
  const markdown: Record<string, string> = {};
  const contentDirectory = path.join(directory, 'content');
  try {
    for (const file of await readdir(contentDirectory)) {
      const filePath = path.join(contentDirectory, file);
      if ((await stat(filePath)).isFile()) markdown[file] = await readFile(filePath, 'utf8');
    }
  } catch {
    // optional
  }
  return { manifest, nodes, relations, markdown, assets: {} };
}

export async function validateDirectory(directory: string) {
  const pkg = await loadPackageDirectory(directory);
  return validateContentPackage(pkg);
}
