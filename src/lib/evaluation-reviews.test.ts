import { readFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { evaluationReviewSchema } from "@/features/tasks/evaluation-schemas"
import {
  calculateOverallScore,
  createEmptyEvaluationReview,
  EVALUATION_METRICS,
} from "@/lib/evaluation-reviews"

const evaluatedTaskIds = [
  "tlc-01",
  "tlc-02",
  "tlc-03",
  "tlc-04",
  "tlc-05",
  "sec-01",
  "sec-02",
  "sec-03",
  "sec-04",
  "sec-05",
]

describe("evaluation reviews", () => {
  it("creates an unscored review with every artifact metric", () => {
    const review = createEmptyEvaluationReview()

    expect(review.overallScore).toBeNull()
    expect(review.artifactRatings.map((rating) => rating.metricId)).toEqual(
      EVALUATION_METRICS.artifactQuality.map((metric) => metric.id)
    )
    expect(calculateOverallScore(review)).toBeNull()
  })

  it.each(evaluatedTaskIds)("validates and recomputes %s review", async (taskId) => {
    const content = await readFile(
      path.join(process.cwd(), "tasks", taskId, "ground-truth", "evaluation.json"),
      "utf-8"
    )
    const review = evaluationReviewSchema.parse(JSON.parse(content))

    expect(review.condition).toBe("reference")
    expect(review.artifactRatings).toHaveLength(
      EVALUATION_METRICS.artifactQuality.length
    )
    expect(review.overallScore).toBe(calculateOverallScore(review))
  })
})
