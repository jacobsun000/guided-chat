import "server-only"

import { tool } from "ai"

import {
  updateResearchPlanInputSchema,
  updateResearchPlanResultSchema,
  validateResearchPlan,
} from "@/lib/research-plan"

export function createUpdatePlanTool() {
  return tool({
    description:
      "Publish or replace the complete user-facing learning route after source reconnaissance, high-level synthesis, deep research of every candidate subtopic, audience calibration, and curriculum design are complete. Do not use this as a research to-do list. List researched, slide-sized stations in presentation order with concise unique names, useful descriptions, and exact step-name references in next_steps. Keep existing names stable when revising the route. Each step may have at most three next steps; one is normal, two is a meaningful branch, and three should be rare.",
    inputSchema: updateResearchPlanInputSchema,
    outputSchema: updateResearchPlanResultSchema,
    execute: async (plan) => {
      const validation = validateResearchPlan(plan)

      if (!validation.valid) {
        throw new Error(
          `Research plan validation failed: ${validation.errors.join("; ")}`
        )
      }

      return {
        updated: true as const,
        step_count: plan.steps.length,
        entry_steps: validation.entrySteps,
        terminal_steps: validation.terminalSteps,
        warnings: validation.warnings.length
          ? validation.warnings
          : undefined,
      }
    },
  })
}
