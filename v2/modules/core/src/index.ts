import {
  exercisePayloadSchema,
  lessonPayloadSchema,
  subjectPayloadSchema,
  assessmentBlueprintPayloadV2Schema,
  type GraphNode
} from '@fonat/contracts';
import { z } from 'zod';
import { validateLesson } from '@fonat/domain';

const genericPayloadSchema = z.object({}).passthrough();
const conceptPayloadSchema = z
  .object({
    aliases: z.array(z.string()).optional(),
    conceptSubtype: z.string().optional()
  })
  .passthrough();
const curriculumRequirementPayloadSchema = z
  .object({
    conceptIds: z.array(z.string()).default([]),
    requiredDepth: z.string().optional(),
    targetPeriod: z.string().optional(),
    weight: z.number().optional()
  })
  .passthrough();
const resourcePayloadSchema = z
  .object({
    kind: z.string().min(1),
    markdown: z.string().optional(),
    url: z.string().url().optional()
  })
  .passthrough();
const teachingProfilePayloadSchema = z
  .object({
    evidenceIntensity: z.string().optional()
  })
  .passthrough();
const lessonBlueprintPayloadSchema = z
  .object({
    durationMinutes: z.number().int().positive(),
    sections: z.array(z.record(z.string(), z.unknown())).default([])
  })
  .passthrough();
const annualPlanPayloadSchema = z
  .object({
    schoolYear: z.string().min(4),
    phaseIds: z.array(z.string()).default([])
  })
  .passthrough();
const phasePayloadSchema = z
  .object({
    annualPlanId: z.string(),
    conceptIds: z.array(z.string()).default([]),
    approximateLessons: z.number().int().nonnegative().optional()
  })
  .passthrough();

export type CapabilityState = 'stable' | 'preview' | 'experimental' | 'deferred' | 'rejected';
export type CapabilityEntry = {
  id: string;
  title: string;
  state: CapabilityState;
  owner: string;
  description: string;
  deploymentRestrictions?: string[];
};

export const capabilityCatalogue: CapabilityEntry[] = [
  {
    id: 'core.graph',
    title: 'Educational graph',
    state: 'stable',
    owner: 'core',
    description: 'Typed nodes, revisions, and registered relations.'
  },
  {
    id: 'planning.lesson',
    title: 'Lesson planning',
    state: 'stable',
    owner: 'core',
    description: 'Blueprint-based lesson assembly with transparent recommendations.'
  },
  {
    id: 'presentation.lesson-run',
    title: 'Presentation Mode',
    state: 'stable',
    owner: 'core',
    description: 'Teacher and projected lesson execution.'
  },
  {
    id: 'live.quiz',
    title: 'Live quizzes',
    state: 'stable',
    owner: 'core',
    description: 'Phone-friendly polling-based classroom quizzes.'
  },
  {
    id: 'assessment.analysis',
    title: 'Assessment findings',
    state: 'stable',
    owner: 'core',
    description: 'Deterministic class and question analysis.'
  },
  {
    id: 'content.github-public',
    title: 'Public GitHub content source',
    state: 'preview',
    owner: 'core',
    description: 'Read-only package discovery from public repositories.'
  },
  {
    id: 'math.symbolic-grading',
    title: 'Symbolic algebra grading',
    state: 'deferred',
    owner: 'math',
    description: 'Reliable algebraic equivalence checking.'
  },
  {
    id: 'platform.native-student-app',
    title: 'Native student application',
    state: 'deferred',
    owner: 'platform',
    description: 'Native phone application.'
  }
];

export const relationContracts = [
  { type: 'requires', source: ['concept', 'exercise', 'resource'], target: ['concept'], directed: true },
  {
    type: 'extends',
    source: ['concept', 'resource', 'exercise'],
    target: ['concept', 'resource', 'exercise'],
    directed: true
  },
  {
    type: 'covers',
    source: ['exercise', 'resource', 'activity', 'lesson'],
    target: ['concept', 'curriculum-requirement'],
    directed: true,
    dimensions: ['contribution']
  },
  {
    type: 'alternative-to',
    source: ['exercise'],
    target: ['exercise'],
    directed: false,
    dimensions: ['similarity']
  },
  { type: 'uses', source: ['activity', 'lesson'], target: ['resource', 'exercise'], directed: true },
  { type: 'instantiates', source: ['lesson'], target: ['lesson-blueprint'], directed: true },
  { type: 'belongs-to', source: ['phase', 'lesson'], target: ['annual-plan', 'phase'], directed: true },
  {
    type: 'satisfies',
    source: ['annual-plan', 'phase', 'lesson'],
    target: ['curriculum-requirement'],
    directed: true
  },
  { type: 'assesses', source: ['assessment', 'exercise'], target: ['concept'], directed: true },
  { type: 'demonstrates', source: ['exercise'], target: ['concept'], directed: true },
  {
    type: 'variant-of',
    source: ['lesson', 'exercise', 'assessment'],
    target: ['lesson', 'exercise', 'assessment'],
    directed: true
  },
  {
    type: 'contains',
    source: ['annual-plan', 'phase', 'assessment'],
    target: ['phase', 'lesson', 'exercise'],
    directed: true
  }
] as const;

export const coreModuleManifest = {
  id: 'core',
  version: '0.1.0',
  title: 'Fonat Core',
  nodeTypes: [
    'subject',
    'concept',
    'curriculum-requirement',
    'curriculum',
    'collection',
    'resource',
    'exercise',
    'teaching-profile',
    'lesson-blueprint',
    'lesson-layout',
    'annual-plan',
    'phase',
    'lesson',
    'activity-template',
    'rubric',
    'assessment',
    'assessment-blueprint',
    'exercise-family',
    'classroom',
    'learner-group',
    'course',
    'teaching-location'
  ],
  relationTypes: relationContracts.map((relation) => relation.type),
  validators: ['lesson.default'],
  capabilities: ['content.manage', 'planning.manage', 'assignments.manage', 'assessment.manage'],
  payloadSchemas: {
    subject: subjectPayloadSchema,
    concept: conceptPayloadSchema,
    'curriculum-requirement': curriculumRequirementPayloadSchema,
    curriculum: genericPayloadSchema,
    collection: genericPayloadSchema,
    resource: resourcePayloadSchema,
    exercise: exercisePayloadSchema,
    'exercise-family': genericPayloadSchema,
    classroom: genericPayloadSchema,
    'teaching-profile': teachingProfilePayloadSchema,
    'lesson-blueprint': lessonBlueprintPayloadSchema,
    'lesson-layout': genericPayloadSchema,
    'annual-plan': annualPlanPayloadSchema,
    phase: phasePayloadSchema,
    lesson: lessonPayloadSchema,
    'activity-template': genericPayloadSchema,
    rubric: genericPayloadSchema,
    assessment: genericPayloadSchema,
    'assessment-blueprint': assessmentBlueprintPayloadV2Schema,
    'learner-group': genericPayloadSchema,
    course: genericPayloadSchema,
    'teaching-location': genericPayloadSchema
  },
  exerciseTypes: [
    'single-choice',
    'multi-select',
    'true-false',
    'numeric',
    'short-text',
    'ordered',
    'manual-explanation',
    'confidence-vote',
    'exit-ticket'
  ]
};

export function runCoreLessonValidators(lesson: GraphNode, allNodes: GraphNode[]) {
  return validateLesson(lesson, allNodes);
}
