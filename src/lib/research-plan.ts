import { z } from "zod"

export const researchPlanStepSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .describe(
      "A unique, concise station name. Keep this stable when updating an existing plan."
    ),
  description: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "What the user will learn or decide at this step, scoped to one focused slide."
    ),
  next_steps: z
    .array(z.string().min(1).max(80))
    .max(3)
    .describe(
      "Exact names of the steps that may follow this one. Usually include one or two; never more than three."
    ),
})

export const researchPlanSchema = z.object({
  steps: z
    .array(researchPlanStepSchema)
    .min(1)
    .max(24)
    .describe(
      "The complete current research route in intended presentation order. Include every step referenced by next_steps. Publish only after researching every included topic."
    ),
})

export const updateResearchPlanInputSchema = researchPlanSchema

export const updateResearchPlanResultSchema = z.object({
  updated: z.literal(true),
  step_count: z.number().int().positive(),
  entry_steps: z.array(z.string().min(1)),
  terminal_steps: z.array(z.string().min(1)),
  warnings: z.array(z.string().min(1)).optional(),
})

export type ResearchPlanStep = z.infer<typeof researchPlanStepSchema>
export type ResearchPlan = z.infer<typeof researchPlanSchema>
export type UpdateResearchPlanInput = z.infer<
  typeof updateResearchPlanInputSchema
>
export type UpdateResearchPlanResult = z.infer<
  typeof updateResearchPlanResultSchema
>

export type ResearchPlanValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
  entrySteps: string[]
  terminalSteps: string[]
}

export function validateResearchPlan(
  plan: ResearchPlan
): ResearchPlanValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const names = plan.steps.map((step) => step.name)
  const nameSet = new Set(names)
  const incoming = new Map(names.map((name) => [name, 0]))

  if (nameSet.size !== names.length) {
    errors.push("Step names must be unique.")
  }

  for (const step of plan.steps) {
    const uniqueNextSteps = new Set(step.next_steps)

    if (uniqueNextSteps.size !== step.next_steps.length) {
      errors.push(`Step has duplicate next_steps: ${step.name}`)
    }

    for (const nextStep of step.next_steps) {
      if (!nameSet.has(nextStep)) {
        errors.push(`Unknown next step: ${step.name} -> ${nextStep}`)
        continue
      }

      if (nextStep === step.name) {
        errors.push(`Step cannot point to itself: ${step.name}`)
        continue
      }

      incoming.set(nextStep, (incoming.get(nextStep) ?? 0) + 1)
    }
  }

  if (hasCycle(plan)) {
    errors.push("The research plan must not contain a cycle.")
  }

  const entrySteps = names.filter((name) => incoming.get(name) === 0)
  const terminalSteps = plan.steps
    .filter((step) => step.next_steps.length === 0)
    .map((step) => step.name)

  if (!entrySteps.length) {
    errors.push("The research plan needs at least one entry step.")
  }

  if (!terminalSteps.length) {
    errors.push("The research plan needs at least one terminal step.")
  }

  if (entrySteps.length > 3) {
    warnings.push(
      "More than three entry steps can make the starting choice unclear."
    )
  }

  if (plan.steps.length > 14) {
    warnings.push(
      "A route longer than fourteen steps may be difficult to scan at once."
    )
  }

  const threeWayBranches = plan.steps.filter(
    (step) => step.next_steps.length === 3
  ).length

  if (threeWayBranches > 2) {
    warnings.push(
      "Several three-way branches may make the route harder to navigate."
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entrySteps,
    terminalSteps,
  }
}

export function getResearchPlanStep(
  plan: ResearchPlan,
  stepName: string
) {
  return plan.steps.find((step) => step.name === stepName)
}

function hasCycle(plan: ResearchPlan) {
  const adjacency = new Map(
    plan.steps.map((step) => [step.name, step.next_steps])
  )
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(name: string): boolean {
    if (visited.has(name)) return false
    if (visiting.has(name)) return true

    visiting.add(name)

    for (const nextStep of adjacency.get(name) ?? []) {
      if (adjacency.has(nextStep) && visit(nextStep)) return true
    }

    visiting.delete(name)
    visited.add(name)
    return false
  }

  return plan.steps.some((step) => visit(step.name))
}
