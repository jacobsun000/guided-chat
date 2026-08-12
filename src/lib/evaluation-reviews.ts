import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import metricData from "../../evaluation/baseline-metrics.json"

import {
  evaluationReviewSchema,
  type EvaluationReview,
} from "@/features/tasks/evaluation-schemas"

export type ArtifactMetricDefinition = (typeof metricData.artifactQuality)[number]
export type SubjectiveMetricDefinition = (typeof metricData.subjectiveStudyMeasures)[number]

export const EVALUATION_METRICS = metricData

const TASKS_DIRECTORY = path.join(process.cwd(), "tasks")
const REVIEW_FILE_NAME = "evaluation.json"

function isSafePathSegment(value: string) {
  return Boolean(value) && value !== "." && value !== ".." &&
    !value.includes("/") && !value.includes("\\")
}

function getReviewPath(taskId: string, evaluationId: string) {
  if (!isSafePathSegment(taskId) || !isSafePathSegment(evaluationId)) {
    return null
  }

  return path.join(TASKS_DIRECTORY, taskId, evaluationId, REVIEW_FILE_NAME)
}

export function createEmptyEvaluationReview(): EvaluationReview {
  return {
    schemaVersion: 1,
    rubricVersion: EVALUATION_METRICS.rubricVersion,
    condition: "agent-alone",
    evaluationMode: "artifact-review",
    evaluator: "",
    evaluatedAt: "",
    summary: "",
    overallScore: null,
    artifactRatings: EVALUATION_METRICS.artifactQuality.map((metric) => ({
      metricId: metric.id,
      score: null,
      rationale: "",
    })),
    operationalMetrics: {
      taskSuccess: null,
      totalTimeSeconds: null,
      humanActiveTimeSeconds: null,
      inputTokens: null,
      outputTokens: null,
      toolCalls: null,
      estimatedCostUsd: null,
      predictedSuccessProbability: null,
      interventions: null,
      verificationActions: null,
      verificationCoverage: null,
      meaningfulSteeringRate: null,
      errorsCaughtByHuman: null,
      notes: "",
    },
    subjectiveRatings: [],
    learning: { preTaskScore: null, postTaskScore: null, notes: "" },
    strengths: [],
    concerns: [],
  }
}

export function calculateOverallScore(review: EvaluationReview) {
  const ratings = new Map(
    review.artifactRatings.map((rating) => [rating.metricId, rating.score])
  )
  let weightedScore = 0
  let availableWeight = 0

  for (const metric of EVALUATION_METRICS.artifactQuality) {
    const score = ratings.get(metric.id)
    if (score === null || score === undefined) {
      continue
    }

    weightedScore += (score / EVALUATION_METRICS.scoring.artifactScale.max) * metric.weight
    availableWeight += metric.weight
  }

  return availableWeight
    ? Math.round((weightedScore / availableWeight) * 1000) / 10
    : null
}

export async function getEvaluationReview(
  taskId: string,
  evaluationId: string
): Promise<EvaluationReview | null> {
  const reviewPath = getReviewPath(taskId, evaluationId)
  if (!reviewPath) {
    return null
  }

  try {
    const parsed = evaluationReviewSchema.safeParse(
      JSON.parse(await readFile(reviewPath, "utf-8"))
    )
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function saveEvaluationReview(
  taskId: string,
  evaluationId: string,
  input: unknown
): Promise<EvaluationReview> {
  const reviewPath = getReviewPath(taskId, evaluationId)
  if (!reviewPath) {
    throw new Error("Invalid task or evaluation path")
  }

  const parsed = evaluationReviewSchema.parse(input)
  const review: EvaluationReview = {
    ...parsed,
    overallScore: calculateOverallScore(parsed),
  }
  const temporaryPath = `${reviewPath}.${process.pid}.${Date.now()}.tmp`

  await writeFile(temporaryPath, `${JSON.stringify(review, null, 2)}\n`, "utf-8")
  await rename(temporaryPath, reviewPath)

  return review
}
