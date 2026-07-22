import { describe, expect, it } from "vitest"

import {
  type ResearchPlan,
  validateResearchPlan,
} from "./research-plan.ts"

const validPlan: ResearchPlan = {
  steps: [
    {
      name: "Frame the question",
      description: "Define the decision and the evidence needed to make it.",
      next_steps: ["Evidence", "Tradeoffs"],
    },
    {
      name: "Evidence",
      description: "Inspect the strongest observations and their provenance.",
      next_steps: ["Synthesis"],
    },
    {
      name: "Tradeoffs",
      description: "Compare the meaningful alternatives and uncertainties.",
      next_steps: ["Synthesis"],
    },
    {
      name: "Synthesis",
      description: "Combine the validated findings into a useful conclusion.",
      next_steps: [],
    },
  ],
}

describe("validateResearchPlan", () => {
  it("accepts a branching route that merges into synthesis", () => {
    expect(validateResearchPlan(validPlan)).toEqual({
      valid: true,
      errors: [],
      warnings: [],
      entrySteps: ["Frame the question"],
      terminalSteps: ["Synthesis"],
    })
  })

  it("rejects unknown next-step references", () => {
    const plan = structuredClone(validPlan)
    plan.steps[0].next_steps = ["Missing station"]

    expect(validateResearchPlan(plan)).toMatchObject({
      valid: false,
      errors: ["Unknown next step: Frame the question -> Missing station"],
    })
  })

  it("rejects cycles", () => {
    const plan = structuredClone(validPlan)
    plan.steps.at(-1)!.next_steps = ["Frame the question"]

    expect(validateResearchPlan(plan)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        "The research plan must not contain a cycle.",
      ]),
    })
  })

  it("rejects duplicate station names", () => {
    const plan = structuredClone(validPlan)
    plan.steps[1].name = "Tradeoffs"

    expect(validateResearchPlan(plan)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["Step names must be unique."]),
    })
  })
})
