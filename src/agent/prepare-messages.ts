import "server-only"

import {
  getResearchPlanStep,
  researchPlanSchema,
} from "@/lib/research-plan"
import { researchMessageMetadataSchema } from "./messages"
import { buildSourceReferencesContext } from "./references"

function recoverLatestResearchPlan(messages: unknown[]) {
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

export function prepareBaselineMessages(messages: unknown[]) {
  return prepareMessages(messages, false)
}

export function prepareActionMessages(messages: unknown[]) {
  return prepareMessages(messages, true)
}

function prepareMessages(messages: unknown[], includeActions: boolean) {
  if (!messages.length) return messages
  const transformed = structuredClone(messages)

  for (let index = 0; index < transformed.length; index += 1) {
    const original = messages[index]
    const message = transformed[index]
    if (
      !original ||
      typeof original !== "object" ||
      !message ||
      typeof message !== "object" ||
      (original as { role?: unknown }).role !== "user"
    ) {
      continue
    }
    const parsed = researchMessageMetadataSchema.safeParse(
      (original as { metadata?: unknown }).metadata
    )
    if (!parsed.success) continue
    const transformedMessage = message as { parts?: unknown[] }
    if (!Array.isArray(transformedMessage.parts)) continue
    const textPart = transformedMessage.parts.find(
      (part) =>
        part &&
        typeof part === "object" &&
        (part as { type?: string }).type === "text"
    ) as { text?: string } | undefined
    if (!textPart || typeof textPart.text !== "string") continue

    let text = textPart.text
    const action = parsed.data?.action
    if (includeActions && action && index === transformed.length - 1) {
      const plan = recoverLatestResearchPlan(messages)
      if (!plan) {
        throw new Error(
          "The selected research plan is not present in message history."
        )
      }
      const step = getResearchPlanStep(plan, action.stepName)
      if (!step) throw new Error("The selected research step does not exist.")
      text = [
        "The user selected a station from the validated current research plan.",
        "Treat this as the user's direct instruction: I want to explore this step next. Generate the slide for this step.",
        `selected_step_name: ${step.name}`,
        `selected_step_description: ${step.description}`,
        `planned_next_steps: ${step.next_steps.join(", ") || "none"}`,
        "Generate exactly one focused slide for the selected step. Research further first if needed. Update the complete plan only if the research route materially changes.",
      ].join("\n")
    }

    const references = parsed.data?.references ?? []
    const referenceContext = buildSourceReferencesContext(textPart.text, references)
    const steering = parsed.data?.steering ?? []
    const steeringContext = steering.length
      ? `<completion_review_steering>\nThe user reviewed these parts of the prior trajectory. Address all items in one response. For doubt, explain the reasoning and evidence more clearly. For disagree, propose a correction and rework the affected result when feasible.\n${JSON.stringify(steering)}\n</completion_review_steering>`
      : ""
    textPart.text = [text, referenceContext, steeringContext].filter(Boolean).join("\n\n")
  }

  return transformed
}
