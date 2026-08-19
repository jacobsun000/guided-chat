import type { TrajectoryStep } from "@/lib/scaffolding"

function safeContent(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

export function buildBaselineTrajectory(systemPrompt: string, messages: unknown[]): TrajectoryStep[] {
  const steps: TrajectoryStep[] = [{
    step_id: 1,
    role: "system",
    type: "system_prompt",
    content: systemPrompt,
  }]

  for (const rawMessage of messages) {
    if (!rawMessage || typeof rawMessage !== "object") continue
    const message = rawMessage as { role?: unknown; parts?: unknown; content?: unknown; id?: unknown }
    const role = message.role === "user" || message.role === "assistant" || message.role === "tool"
      ? message.role
      : "assistant"
    const parts = Array.isArray(message.parts) ? message.parts : []
    if (!parts.length) {
      steps.push({
        step_id: steps.length + 1,
        role,
        type: "message",
        content: safeContent({ message_id: message.id, content: message.content }),
      })
      continue
    }
    for (const part of parts) {
      const type = part && typeof part === "object" && "type" in part
        ? String((part as { type: unknown }).type)
        : "message_part"
      if (type.startsWith("tool-") && part && typeof part === "object") {
        const toolPart = part as Record<string, unknown>
        steps.push({
          step_id: steps.length + 1,
          role: "assistant",
          type: "tool_call",
          content: safeContent({ message_id: message.id, tool: type.slice(5), toolCallId: toolPart.toolCallId, input: toolPart.input }),
        })
        if ("output" in toolPart || "errorText" in toolPart) {
          steps.push({
            step_id: steps.length + 1,
            role: "tool",
            type: "tool_result",
            content: safeContent({ message_id: message.id, tool: type.slice(5), toolCallId: toolPart.toolCallId, state: toolPart.state, output: toolPart.output, errorText: toolPart.errorText }),
          })
        }
        continue
      }
      steps.push({
        step_id: steps.length + 1,
        role,
        type,
        content: safeContent({ message_id: message.id, part }),
      })
    }
  }
  return steps
}

export function selectTrajectorySteps(trajectory: TrajectoryStep[], ids: number[]) {
  const selected = new Set(ids)
  return trajectory.filter((step) => selected.has(step.step_id))
}
