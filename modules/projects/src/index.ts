import { projectPayloadSchema } from '@fonat/contracts';

export const projectsModuleManifest = {
  id: 'fonat.projects',
  version: '0.2.0',
  title: 'Projects',
  featureFlag: 'projects',
  nodeTypes: ['project'],
  relationTypes: ['project-connects'],
  exerciseTypes: [],
  payloadSchemas: { project: projectPayloadSchema },
  capabilities: ['projects.read', 'projects.manage']
} as const;
