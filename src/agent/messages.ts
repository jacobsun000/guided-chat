import { z } from "zod"

import {
  getResearchPlanStep,
  researchPlanSchema,
} from "@/lib/research-plan"

export const exploreResearchStepActionSchema = z.object({
  type: z.literal("explore_research_step"),
  stepName: z.string().min(1),
})
export type ExploreResearchStepAction = z.infer<
  typeof exploreResearchStepActionSchema
>

export const researchMessageMetadataSchema = z
  .object({ action: exploreResearchStepActionSchema.optional() })
  .optional()
export type ResearchMessageMetadata = z.infer<typeof researchMessageMetadataSchema>

export function recoverLatestResearchPlan(messages: unknown[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (!message || typeof message !== "object") continue
    const parts = (message as { parts?: unknown }).parts
    if (!Array.isArray(parts)) continue
    for (const part of parts) {
      if (!part || typeof part !== "object") continue
      const candidate = part as { type?: string; input?: unknown }
      if (candidate.type !== "tool-update_plan") continue
      const parsed = researchPlanSchema.safeParse(candidate.input)
      if (parsed.success) return parsed.data
    }
  }
  return null
}

export function prepareActionMessages(messages: unknown[]) {
  if (!messages.length) return messages
  const last = messages.at(-1)
  if (!last || typeof last !== "object") return messages
  const metadata = researchMessageMetadataSchema.safeParse((last as { metadata?: unknown }).metadata)
  const action = metadata.success ? metadata.data?.action : undefined
  if (!action) return messages
  const plan = recoverLatestResearchPlan(messages)
  if (!plan) {
    throw new Error("The selected research plan is not present in message history.")
  }
  const step = getResearchPlanStep(plan, action.stepName)
  if (!step) throw new Error("The selected research step does not exist.")
  const context = [
    "The user selected a station from the validated current research plan.",
    "Treat this as the user's direct instruction: I want to explore this step next. Generate the slide for this step.",
    `selected_step_name: ${step.name}`,
    `selected_step_description: ${step.description}`,
    `planned_next_steps: ${step.next_steps.join(", ") || "none"}`,
    "Generate exactly one focused slide for the selected step. Research further first if needed. Update the complete plan only if the research route materially changes.",
  ].join("\n")
  const transformed = structuredClone(messages)
  const transformedLast = transformed.at(-1) as { parts?: unknown[] }
  if (Array.isArray(transformedLast.parts)) {
    const textPart = transformedLast.parts.find((part) => part && typeof part === "object" && (part as { type?: string }).type === "text") as { text?: string } | undefined
    if (textPart) textPart.text = context
  }
  return transformed
}
