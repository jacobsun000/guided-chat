import { z } from "zod"

export const evaluationConditionSchema = z.enum([
  "agent-alone",
  "human-chat",
  "human-scaffold",
  "reference",
])

export const artifactRatingSchema = z.object({
  metricId: z.string().min(1),
  score: z.number().min(0).max(4).nullable(),
  rationale: z.string(),
})

export const subjectiveRatingSchema = z.object({
  metricId: z.string().min(1),
  score: z.number().min(0).max(100).nullable(),
  rationale: z.string(),
})

const nullableNonnegativeNumber = z.number().nonnegative().nullable()

export const evaluationReviewSchema = z.object({
  schemaVersion: z.literal(1),
  rubricVersion: z.string().min(1),
  condition: evaluationConditionSchema,
  evaluationMode: z.enum(["artifact-review", "study-observation"]),
  evaluator: z.string(),
  evaluatedAt: z.string(),
  summary: z.string(),
  overallScore: z.number().min(0).max(100).nullable(),
  artifactRatings: z.array(artifactRatingSchema),
  operationalMetrics: z.object({
    taskSuccess: z.boolean().nullable(),
    totalTimeSeconds: nullableNonnegativeNumber,
    humanActiveTimeSeconds: nullableNonnegativeNumber,
    inputTokens: nullableNonnegativeNumber,
    outputTokens: nullableNonnegativeNumber,
    toolCalls: nullableNonnegativeNumber,
    estimatedCostUsd: nullableNonnegativeNumber,
    predictedSuccessProbability: z.number().min(0).max(100).nullable(),
    interventions: nullableNonnegativeNumber,
    verificationActions: nullableNonnegativeNumber,
    verificationCoverage: z.number().min(0).max(1).nullable(),
    meaningfulSteeringRate: z.number().min(0).max(1).nullable(),
    errorsCaughtByHuman: nullableNonnegativeNumber,
    notes: z.string(),
  }),
  subjectiveRatings: z.array(subjectiveRatingSchema),
  learning: z.object({
    preTaskScore: z.number().min(0).max(100).nullable(),
    postTaskScore: z.number().min(0).max(100).nullable(),
    notes: z.string(),
  }),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
})

export type EvaluationReview = z.infer<typeof evaluationReviewSchema>
export type EvaluationCondition = z.infer<typeof evaluationConditionSchema>
