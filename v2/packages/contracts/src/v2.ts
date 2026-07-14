import { z } from 'zod';

const localLocalizedTextSchema = z.object({
  canonicalLanguage: z.string().default('hu'),
  values: z.record(z.string(), z.string()).default({})
});

export const registeredIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9.-]+$/);
export const utcInstantSchema = z.string().datetime({ offset: true });
export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const wallTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const timezoneSchema = z.string().min(3);

export const subjectPayloadSchema = z.object({
  code: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  gradeApplicability: z.array(z.string()).default([]),
  conceptNamespace: z.string().min(1),
  terminology: z.record(z.string(), localLocalizedTextSchema).default({}),
  capabilityModuleIds: z.array(registeredIdSchema).default([])
});
export type SubjectPayload = z.infer<typeof subjectPayloadSchema>;

export const learnerProfileV2Schema = z.object({
  id: z.string(),
  nickname: z.string().min(1),
  badgeIcon: z.string().min(1),
  badgeColor: z.string().min(1),
  administrativeName: z.string().optional(),
  active: z.boolean().default(true),
  profile: z.record(z.string(), z.unknown()).default({}),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type LearnerProfileV2 = z.infer<typeof learnerProfileV2Schema>;

export const learnerGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  shortCode: z.string().min(1),
  schoolYear: z.string().min(4),
  ownerTeacherIds: z.array(z.string()).min(1),
  active: z.boolean().default(true),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type LearnerGroup = z.infer<typeof learnerGroupSchema>;

export const enrollmentSchema = z.object({
  id: z.string(),
  learnerId: z.string(),
  learnerGroupId: z.string(),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema.optional(),
  status: z.enum(['active', 'completed', 'withdrawn']),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type Enrollment = z.infer<typeof enrollmentSchema>;

export const teachingLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  shortCode: z.string().min(1),
  building: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().default(''),
  equipmentTags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type TeachingLocation = z.infer<typeof teachingLocationSchema>;

export const courseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  subjectId: z.string(),
  schoolYear: z.string().min(4),
  ownerTeacherIds: z.array(z.string()).min(1),
  learnerGroupIds: z.array(z.string()).default([]),
  includeLearnerIds: z.array(z.string()).default([]),
  excludeLearnerIds: z.array(z.string()).default([]),
  defaultLocationId: z.string().optional(),
  timezone: timezoneSchema,
  active: z.boolean().default(true),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type Course = z.infer<typeof courseSchema>;

export const recurringTimetableEntrySchema = z.object({
  id: z.string(),
  courseId: z.string(),
  weekday: z.number().int().min(1).max(7),
  startTime: wallTimeSchema,
  durationMinutes: z.number().int().positive(),
  timezone: timezoneSchema,
  locationId: z.string().optional(),
  effectiveFrom: dateOnlySchema,
  effectiveTo: dateOnlySchema.optional(),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type RecurringTimetableEntry = z.infer<typeof recurringTimetableEntrySchema>;

export const assignmentPolicySchema = z.object({
  maxAttempts: z.number().int().positive().default(1),
  feedbackRelease: z.enum(['immediate', 'after-submit', 'after-deadline', 'manual']).default('after-submit'),
  answerReveal: z.enum(['never', 'after-acceptance', 'after-deadline', 'manual']).default('after-acceptance'),
  allowDrafts: z.boolean().default(true),
  evidenceIntensity: z.enum(['none', 'light', 'standard', 'deep']).default('standard')
});
export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  courseId: z.string(),
  targetLearnerIds: z.array(z.string()).default([]),
  type: z.enum(['homework', 'practice', 'classwork', 'quiz', 'formal-assessment']),
  exerciseRefs: z.array(z.object({ nodeId: z.string(), revision: z.number().int().positive() })).default([]),
  assessmentId: z.string().optional(),
  startAt: utcInstantSchema.optional(),
  dueAt: utcInstantSchema.optional(),
  status: z.enum(['draft', 'assigned', 'closed', 'cancelled', 'archived']),
  policy: assignmentPolicySchema,
  version: z.number().int().nonnegative().default(0),
  createdBy: z.string(),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const answerDraftSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  learnerId: z.string(),
  answers: z.record(z.string(), z.unknown()).default({}),
  version: z.number().int().nonnegative().default(0),
  updatedAt: utcInstantSchema
});
export type AnswerDraft = z.infer<typeof answerDraftSchema>;

export const assessmentSlotSchema = z.object({
  id: z.string(),
  conceptIds: z.array(z.string()).min(1),
  points: z.number().positive(),
  difficultyMin: z.number().min(1).max(5).default(1),
  difficultyMax: z.number().min(1).max(5).default(5),
  sourceKinds: z.array(z.string()).default(['classwork', 'homework', 'alternative']),
  requiredExerciseType: registeredIdSchema.optional()
});
export type AssessmentSlot = z.infer<typeof assessmentSlotSchema>;

export const assessmentBlueprintPayloadV2Schema = z.object({
  courseId: z.string(),
  title: z.string(),
  durationMinutes: z.number().int().positive(),
  slots: z.array(assessmentSlotSchema).min(1),
  variantCount: z.number().int().min(1).max(4).default(2),
  familiarityMix: z.object({ repeated: z.number(), alternative: z.number(), transfer: z.number() }).optional()
});
export type AssessmentBlueprintPayloadV2 = z.infer<typeof assessmentBlueprintPayloadV2Schema>;

export const assessmentDeliverySchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  assignmentId: z.string().optional(),
  learnerId: z.string(),
  variantKey: z.string(),
  strategyId: z.string(),
  strategyVersion: z.string(),
  seed: z.string(),
  questions: z.array(
    z.object({
      slotId: z.string(),
      exerciseId: z.string(),
      revision: z.number().int().positive(),
      optionOrder: z.array(z.string()).default([]),
      snapshot: z.record(z.string(), z.unknown())
    })
  ),
  deferredSlotIds: z.array(z.string()).default([]),
  status: z.enum(['assigned', 'started', 'submitted', 'graded', 'returned', 'accepted', 'cancelled']),
  startedAt: utcInstantSchema.optional(),
  submittedAt: utcInstantSchema.optional(),
  version: z.number().int().nonnegative().default(0),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type AssessmentDelivery = z.infer<typeof assessmentDeliverySchema>;

export const gradeEntrySchema = z.object({
  id: z.string(),
  learnerId: z.string(),
  courseId: z.string(),
  sourceAssignmentId: z.string().optional(),
  sourceAssessmentDeliveryId: z.string().optional(),
  grade: z.number().int().min(1).max(5),
  scaleId: z.string().default('hu-1-5'),
  category: z.string().default('assessment'),
  weight: z.number().positive().default(1),
  note: z.string().default(''),
  status: z.enum(['draft', 'confirmed', 'corrected', 'void']),
  version: z.number().int().nonnegative().default(0),
  createdBy: z.string(),
  createdAt: utcInstantSchema,
  updatedAt: utcInstantSchema
});
export type GradeEntry = z.infer<typeof gradeEntrySchema>;

export const projectPayloadSchema = z.object({
  subjectIds: z.array(z.string()).default([]),
  courseIds: z.array(z.string()).default([]),
  learnerGroupIds: z.array(z.string()).default([]),
  conceptIds: z.array(z.string()).default([]),
  curriculumRequirementIds: z.array(z.string()).default([]),
  resourceIds: z.array(z.string()).default([]),
  activityTemplateIds: z.array(z.string()).default([]),
  assignmentIds: z.array(z.string()).default([]),
  expectedOutputs: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  preparationNotes: z.string().default(''),
  characters: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        species: z.string(),
        strength: z.string(),
        storyRole: z.string()
      })
    )
    .default([]),
  challengeSequence: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        kind: z.enum(['binary', 'pattern-matching', 'fractions', 'other']),
        summary: z.string(),
        exerciseId: z.string().optional(),
        status: z.enum(['ready', 'draft', 'planned']).default('draft')
      })
    )
    .default([]),
  contributorOpportunities: z.array(z.string()).default([])
});
export type ProjectPayload = z.infer<typeof projectPayloadSchema>;

export const concurrencyInputSchema = z.object({ expectedVersion: z.number().int().nonnegative() });
export const idempotencyKeySchema = z.string().min(8).max(128);

export const featureFlagsSchema = z.object({ projects: z.boolean().default(false) });
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export type CursorPage<T> = { items: T[]; nextCursor?: string; hasMore: boolean; total?: number };
