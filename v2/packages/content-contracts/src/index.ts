import {
  packageManifestSchema,
  relationSchema,
  nodeSchema,
  type GraphNode,
  type GraphRelation,
  type PackageManifest
} from '@fonat/contracts';
import { z } from 'zod';

export const contentPackageSchema = z.object({
  manifest: packageManifestSchema,
  nodes: z.array(nodeSchema),
  relations: z.array(relationSchema),
  markdown: z.record(z.string(), z.string()).default({}),
  assets: z.record(z.string(), z.string()).default({})
});
export type ContentPackage = z.infer<typeof contentPackageSchema>;

export type PackageIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  path?: string;
};

export type PackageValidation = {
  valid: boolean;
  issues: PackageIssue[];
  package?: ContentPackage;
};

export function validateContentPackage(
  input: unknown,
  options?: { maxAssetBytes?: number; allowedCapabilities?: string[] }
): PackageValidation {
  const parsed = contentPackageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        severity: 'error',
        code: 'schema.invalid',
        message: issue.message,
        path: issue.path.join('.')
      }))
    };
  }
  const pkg = parsed.data;
  const issues: PackageIssue[] = [];
  const nodeIds = new Set<string>();
  for (const node of pkg.nodes) {
    if (nodeIds.has(node.id))
      issues.push({ severity: 'error', code: 'node.duplicate', message: `Duplicate node ID: ${node.id}` });
    nodeIds.add(node.id);
    if (node.provenance.packageId && node.provenance.packageId !== pkg.manifest.packageId) {
      issues.push({
        severity: 'warning',
        code: 'provenance.package-mismatch',
        message: `${node.id} belongs to ${node.provenance.packageId}, not ${pkg.manifest.packageId}`
      });
    }
    if (!node.title.values[node.title.canonicalLanguage]) {
      issues.push({
        severity: 'error',
        code: 'translation.canonical-missing',
        message: `${node.id} has no canonical title translation.`
      });
    }
    if (node.rights.status === 'unknown' && node.lifecycle === 'published') {
      issues.push({
        severity: 'warning',
        code: 'rights.unresolved',
        message: `${node.id} is published with unresolved rights.`
      });
    }
  }
  for (const relation of pkg.relations) {
    if (!nodeIds.has(relation.sourceId) && !relation.sourceId.startsWith('external:')) {
      issues.push({
        severity: 'error',
        code: 'relation.source-missing',
        message: `${relation.id} source ${relation.sourceId} is missing.`
      });
    }
    if (!nodeIds.has(relation.targetId) && !relation.targetId.startsWith('external:')) {
      issues.push({
        severity: 'error',
        code: 'relation.target-missing',
        message: `${relation.id} target ${relation.targetId} is missing.`
      });
    }
  }
  for (const capability of pkg.manifest.capabilities) {
    if (options?.allowedCapabilities && !options.allowedCapabilities.includes(capability)) {
      issues.push({
        severity: 'error',
        code: 'capability.unsupported',
        message: `Unsupported capability: ${capability}`
      });
    }
  }
  if (options?.maxAssetBytes) {
    for (const [name, content] of Object.entries(pkg.assets)) {
      const bytes = Buffer.byteLength(content, 'base64');
      if (bytes > options.maxAssetBytes)
        issues.push({
          severity: 'error',
          code: 'asset.too-large',
          message: `${name} exceeds ${options.maxAssetBytes} bytes.`
        });
    }
  }
  return { valid: issues.every((issue) => issue.severity !== 'error'), issues, package: pkg };
}

export function normalizePackage(
  manifest: PackageManifest,
  nodes: GraphNode[],
  relations: GraphRelation[]
): ContentPackage {
  return { manifest, nodes, relations, markdown: {}, assets: {} };
}
