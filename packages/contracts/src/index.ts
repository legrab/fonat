import { z } from "zod";

export type Result<T, C extends string = string> =
  | { ok: true; value: T; meta?: Record<string, unknown> }
  | {
      ok: false;
      error: {
        code: C;
        messageKey: string;
        fieldErrors?: Record<string, string[]>;
        technicalReference?: string;
        retryable: boolean;
      };
    };

export const ok = <T>(value: T, meta?: Record<string, unknown>): Result<T> => ({
  ok: true,
  value,
  ...(meta ? { meta } : {}),
});
export const err = <C extends string>(
  code: C,
  messageKey: string,
  retryable = false,
  fieldErrors?: Record<string, string[]>,
): Result<never, C> => ({
  ok: false,
  error: {
    code,
    messageKey,
    retryable,
    ...(fieldErrors ? { fieldErrors } : {}),
  },
});

export const exerciseTypes = [
  "manual-response",
  "single-choice",
  "multiple-choice",
  "boolean",
  "numeric",
  "accepted-text",
] as const;
export type ExerciseType = (typeof exerciseTypes)[number];
export const exerciseSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(2),
    exerciseType: z.enum(exerciseTypes),
    promptMarkdown: z.string().min(2),
    solutionMarkdown: z.string().optional().default(""),
    expectedMinutes: z.number().int().min(1).max(120),
    difficulty: z.number().min(1).max(5),
    lifecycle: z.enum(["draft", "published", "archived"]).default("draft"),
    conceptIds: z.array(z.string()).default([]),
    options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
    correctOptionIds: z.array(z.string()).optional(),
    correctValue: z.boolean().optional(),
    expectedValue: z.number().optional(),
    absoluteTolerance: z.number().min(0).optional(),
    acceptedUnit: z.string().optional(),
    acceptedVariants: z.array(z.string()).optional(),
    normalization: z.enum(["trim-casefold", "exact"]).optional(),
    responseGuidance: z.string().optional(),
    rubricMarkdown: z.string().optional(),
    evidencePolicy: z.enum(["none", "light", "deep"]).default("light"),
    contributionLevel: z
      .enum(["introduces", "practices", "assesses"])
      .default("practices"),
    concurrencyVersion: z.number().int().default(1),
    currentRevision: z.number().int().default(0),
  })
  .superRefine((exercise, context) => {
    if (
      exercise.exerciseType === "single-choice" ||
      exercise.exerciseType === "multiple-choice"
    ) {
      if (!exercise.options || exercise.options.length < 2)
        context.addIssue({
          code: "custom",
          path: ["options"],
          message: "At least two options are required",
        });
      const correctCount = exercise.correctOptionIds?.length ?? 0;
      if (
        (exercise.exerciseType === "single-choice" && correctCount !== 1) ||
        (exercise.exerciseType === "multiple-choice" && correctCount < 1)
      )
        context.addIssue({
          code: "custom",
          path: ["correctOptionIds"],
          message: "Select the required correct option count",
        });
    }
    if (exercise.exerciseType === "numeric" && exercise.expectedValue == null)
      context.addIssue({
        code: "custom",
        path: ["expectedValue"],
        message: "Expected value is required",
      });
    if (
      exercise.exerciseType === "accepted-text" &&
      !exercise.acceptedVariants?.length
    )
      context.addIssue({
        code: "custom",
        path: ["acceptedVariants"],
        message: "At least one accepted variant is required",
      });
  });
export type Exercise = z.infer<typeof exerciseSchema> & { id: string };

export type Entity = {
  id: string;
  title?: string;
  name?: string;
  lifecycle?: string;
  concurrencyVersion?: number;
  [key: string]: unknown;
};
export type LessonSlide = {
  id: string;
  type: string;
  title: string;
  body?: string;
  exerciseId?: string;
  durationSeconds?: number;
  timerEndBehavior?: "stay" | "reveal-next" | "advance";
  imageSvg?: string;
};
export type Lesson = Entity & {
  title: string;
  courseId: string;
  locationId?: string;
  status: "draft" | "published" | "archived";
  slides: LessonSlide[];
  scheduledDate?: string;
  durationMinutes?: number;
  teacherNotes?: string;
};
export type LiveAnswer = {
  id: string;
  participantId: string;
  sessionId: string;
  answer: unknown;
  acceptedAt: string;
  correct?: boolean;
};
