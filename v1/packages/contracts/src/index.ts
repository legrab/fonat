import { z } from 'zod';

export const resultCodeSchema = z.enum([
  'ok',
  'validation_failure',
  'conflict',
  'unsupported_capability',
  'permission_denied',
  'not_found',
  'dependency_unavailable',
  'partial_success',
  'unexpected_failure'
]);
export type ResultCode = z.infer<typeof resultCodeSchema>;

export type AppError = {
  code: Exclude<ResultCode, 'ok'>;
  message: string;
  details?: unknown;
  reference?: string;
  retryable?: boolean;
};

export type Result<T> = { ok: true; value: T; warnings?: AppError[] } | { ok: false; error: AppError };
export const ok = <T>(value: T, warnings?: AppError[]): Result<T> => ({ ok: true, value, warnings });
export const err = <T = never>(error: AppError): Result<T> => ({ ok: false, error });

export const lifecycleSchema = z.enum(['draft', 'published', 'deprecated', 'archived']);
export type Lifecycle = z.infer<typeof lifecycleSchema>;

export const qualitySchema = z.enum(['experimental', 'classroom-tested', 'repeatedly-successful']);
export type QualityState = z.infer<typeof qualitySchema>;

export const revisionCompatibilitySchema = z.enum([
  'presentation-only',
  'content-equivalent',
  'planning-impacting',
  'contract-breaking'
]);
export type RevisionCompatibility = z.infer<typeof revisionCompatibilitySchema>;

export const nodeTypeSchema = z.enum([
  'concept',
  'curriculum-requirement',
  'curriculum',
  'resource',
  'exercise',
  'exercise-family',
  'teaching-profile',
  'lesson-blueprint',
  'lesson-layout',
  'annual-plan',
  'phase',
  'lesson',
  'activity',
  'assessment',
  'classroom'
]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const provenanceSchema = z.object({
  origin: z.enum(['seed', 'teacher', 'import', 'external-ai', 'translation', 'fork', 'derived']),
  packageId: z.string().optional(),
  localKey: z.string().optional(),
  author: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceRevision: z.number().int().positive().optional(),
  generatorLabel: z.string().optional()
});
export type Provenance = z.infer<typeof provenanceSchema>;

export const rightsSchema = z.object({
  status: z.enum([
    'project-owned',
    'teacher-owned',
    'openly-licensed',
    'permission-granted',
    'public-domain',
    'private-use-only',
    'unknown'
  ]),
  license: z.string().optional(),
  source: z.string().optional(),
  attribution: z.string().optional(),
  redistributionAllowed: z.boolean().default(false)
});
export type RightsMetadata = z.infer<typeof rightsSchema>;

export const localizedTextSchema = z.object({
  canonicalLanguage: z.string().default('hu'),
  values: z.record(z.string(), z.string()).default({})
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const nodeSchema = z.object({
  id: z.string().min(1),
  type: nodeTypeSchema,
  title: localizedTextSchema,
  summary: localizedTextSchema.optional(),
  lifecycle: lifecycleSchema.default('draft'),
  quality: qualitySchema.default('experimental'),
  currentRevision: z.number().int().positive().default(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  extensions: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
  provenance: provenanceSchema,
  rights: rightsSchema,
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().optional()
});
export type GraphNode = z.infer<typeof nodeSchema>;

export const revisionSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  revision: z.number().int().positive(),
  compatibility: revisionCompatibilitySchema,
  compatibilityReason: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  title: localizedTextSchema,
  summary: localizedTextSchema.optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string().optional()
});
export type NodeRevision = z.infer<typeof revisionSchema>;

export const relationTypeSchema = z.enum([
  'requires',
  'extends',
  'covers',
  'alternative-to',
  'uses',
  'instantiates',
  'belongs-to',
  'satisfies',
  'assesses',
  'demonstrates',
  'follows',
  'variant-of',
  'contains'
]);
export type RelationType = z.infer<typeof relationTypeSchema>;

export const relationSchema = z.object({
  id: z.string(),
  type: relationTypeSchema,
  sourceId: z.string(),
  targetId: z.string(),
  dimensions: z.record(z.string(), z.number()).default({}),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  provenance: provenanceSchema,
  createdAt: z.string().datetime()
});
export type GraphRelation = z.infer<typeof relationSchema>;

export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['information', 'suggestion', 'warning', 'error']),
  code: z.string(),
  title: z.string(),
  message: z.string(),
  targetId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime()
});
export type Finding = z.infer<typeof findingSchema>;

export const difficultySchema = z.object({
  cognitive: z.number().min(1).max(5).default(3),
  prerequisites: z.number().min(1).max(5).default(3),
  independence: z.number().min(1).max(5).default(3),
  teacherPreparation: z.number().min(1).max(5).default(2),
  collaboration: z.number().min(1).max(5).default(2)
});
export type DifficultyProfile = z.infer<typeof difficultySchema>;

export const exerciseTypeSchema = z.enum([
  'single-choice',
  'multi-select',
  'true-false',
  'numeric',
  'short-text',
  'ordered',
  'manual-explanation',
  'confidence-vote',
  'exit-ticket'
]);
export type ExerciseType = z.infer<typeof exerciseTypeSchema>;

export const evidenceIntensitySchema = z.enum(['none', 'light', 'standard', 'deep']);
export type EvidenceIntensity = z.infer<typeof evidenceIntensitySchema>;

export const exercisePayloadSchema = z.object({
  exerciseType: exerciseTypeSchema,
  prompt: localizedTextSchema,
  options: z
    .array(z.object({ id: z.string(), text: localizedTextSchema, correct: z.boolean().default(false) }))
    .default([]),
  expected: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  acceptedAnswers: z.array(z.string()).default([]),
  tolerance: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  durationMinutes: z.number().positive().default(5),
  difficulty: difficultySchema,
  evidenceIntensity: evidenceIntensitySchema.default('none'),
  concepts: z.array(z.string()).default([]),
  purpose: z.array(z.string()).default([]),
  scaffold: z
    .array(z.object({ level: z.number().int().positive(), label: z.string(), content: localizedTextSchema }))
    .default([]),
  grading: z.record(z.string(), z.unknown()).default({}),
  presentation: z.record(z.string(), z.unknown()).default({})
});
export type ExercisePayload = z.infer<typeof exercisePayloadSchema>;

export const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMinutes: z.number().positive(),
  purpose: z.string(),
  requiredActivityKinds: z.array(z.string()).default([]),
  activityIds: z.array(z.string()).default([]),
  slides: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          'section-intro',
          'markdown',
          'exercise',
          'image',
          'external-video',
          'quiz-launch',
          'solution',
          'discussion',
          'closure'
        ]),
        title: z.string().optional(),
        content: z.string().optional(),
        resourceId: z.string().optional(),
        exerciseId: z.string().optional(),
        teacherOnly: z.boolean().default(false)
      })
    )
    .default([])
});
export type LessonSection = z.infer<typeof sectionSchema>;

export const lessonPayloadSchema = z.object({
  classroomId: z.string().optional(),
  annualPlanId: z.string().optional(),
  phaseId: z.string().optional(),
  date: z.string().optional(),
  durationMinutes: z.number().positive().default(45),
  intent: z.string(),
  teachingProfileId: z.string().optional(),
  blueprintId: z.string().optional(),
  layoutId: z.string().optional(),
  conceptIds: z.array(z.string()).default([]),
  sections: z.array(sectionSchema).default([]),
  pinnedRevisions: z.record(z.string(), z.number().int().positive()).default({}),
  status: z.enum(['draft', 'scheduled', 'completed', 'cancelled']).default('draft'),
  teacherNotes: z.string().default(''),
  runtimeSummary: z.record(z.string(), z.unknown()).default({})
});
export type LessonPayload = z.infer<typeof lessonPayloadSchema>;

export const learnerSchema = z.object({
  id: z.string(),
  classroomId: z.string(),
  nickname: z.string(),
  badgeIcon: z.string(),
  badgeColor: z.string(),
  administrativeName: z.string().optional(),
  profile: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type LearnerProfile = z.infer<typeof learnerSchema>;

export const submissionSchema = z.object({
  id: z.string(),
  learnerId: z.string(),
  exerciseId: z.string(),
  assessmentId: z.string().optional(),
  liveSessionId: z.string().optional(),
  attempt: z.number().int().positive(),
  answer: z.unknown(),
  normalizedAnswer: z.unknown().optional(),
  automaticScore: z.number().optional(),
  teacherScore: z.number().optional(),
  maxScore: z.number().positive().default(1),
  status: z.enum(['submitted', 'auto-checked', 'reviewed', 'returned', 'resubmitted', 'accepted']),
  feedback: z.string().optional(),
  evidence: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Submission = z.infer<typeof submissionSchema>;

export const packageManifestSchema = z.object({
  contractVersion: z.literal('1.0.0'),
  packageId: z.string().regex(/^[a-z0-9][a-z0-9.-]+$/),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  language: z.string().default('hu'),
  license: z.string().optional(),
  dependencies: z.record(z.string(), z.string()).default({}),
  capabilities: z.array(z.string()).default([]),
  entrypoints: z.object({
    nodes: z.array(z.string()).default(['nodes.json']),
    relations: z.array(z.string()).default(['relations.json'])
  })
});
export type PackageManifest = z.infer<typeof packageManifestSchema>;

export type Page<T> = {
  items: T[];
  nextCursor?: string;
  total?: number;
};

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  capabilities: string[];
  mustChangePassword: boolean;
};
