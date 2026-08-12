import { describe, expect, it } from "vitest"

import { getTaskEvaluation, getTaskEvaluations } from "@/lib/task-results"

describe("task result files", () => {
  it("includes plain-text-only evaluations", async () => {
    const evaluations = await getTaskEvaluations("tlc-05")
    const groundTruth = evaluations.find((evaluation) => evaluation.id === "ground-truth")

    expect(groundTruth?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "answer.txt", kind: "text" }),
      ])
    )
  })

  it("selects a plain-text file by default", async () => {
    const evaluation = await getTaskEvaluation("sec-03", "ground-truth")

    expect(evaluation?.file.name).toBe("answer.txt")
    expect(evaluation?.file.kind).toBe("text")
  })
})
