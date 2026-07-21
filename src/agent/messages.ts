import { z } from "zod"

import { dependencyMapSchema, userMapStateSchema } from "@/features/dependency-map/schemas"
import { getHardPrerequisiteIds, summarizeUserMapState } from "@/lib/dependency-map"

export const inspectDependencyNodeActionSchema = z.object({
  type: z.literal("inspect_dependency_node"),
  mapId: z.string().min(1),
  nodeId: z.string().min(1),
  state: userMapStateSchema,
  overrideLocked: z.boolean().default(false),
})
export type InspectDependencyNodeAction = z.infer<typeof inspectDependencyNodeActionSchema>

export const researchMessageMetadataSchema = z.object({ action: inspectDependencyNodeActionSchema.optional() }).optional()
export type ResearchMessageMetadata = z.infer<typeof researchMessageMetadataSchema>

export function recoverDependencyMap(messages: unknown[], mapId: string) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (!message || typeof message !== "object") continue
    const parts = (message as { parts?: unknown }).parts
    if (!Array.isArray(parts)) continue
    for (const part of parts) {
      if (!part || typeof part !== "object") continue
      const candidate = part as { type?: string; input?: unknown }
      if (candidate.type !== "tool-output_dependency_map") continue
      const parsed = z.object({ dependency_map: dependencyMapSchema }).safeParse(candidate.input)
      if (parsed.success && parsed.data.dependency_map.map_id === mapId) return parsed.data.dependency_map
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
  const map = recoverDependencyMap(messages, action.mapId)
  if (!map) throw new Error("The selected dependency map is not present in message history.")
  const node = map.nodes.find((candidate) => candidate.id === action.nodeId)
  if (!node) throw new Error("The selected dependency node does not exist.")
  const known = new Set([...action.state.visited_node_ids, ...action.state.understood_node_ids])
  const missing = getHardPrerequisiteIds(map, node.id).filter((id) => !known.has(id))
  const summary = summarizeUserMapState(map, action.state)
  const context = [
    "Inspect the selected dependency-map node from the validated persisted tool call.",
    `map_id: ${map.map_id}`,
    `node_id: ${node.id}`,
    `node_label: ${node.label}`,
    `view_mode: ${node.view_mode}`,
    `override_locked: ${action.overrideLocked ? "yes" : "no"}`,
    `unreviewed_hard_prerequisites: ${missing.join(", ") || "none"}`,
    `visited: ${summary.visited.map(({ id }) => id).join(", ") || "none"}`,
    `understood: ${summary.understood.map(({ id }) => id).join(", ") || "none"}`,
  ].join("\n")
  const transformed = structuredClone(messages)
  const transformedLast = transformed.at(-1) as { parts?: unknown[] }
  if (Array.isArray(transformedLast.parts)) {
    const textPart = transformedLast.parts.find((part) => part && typeof part === "object" && (part as { type?: string }).type === "text") as { text?: string } | undefined
    if (textPart) textPart.text = context
  }
  return transformed
}
