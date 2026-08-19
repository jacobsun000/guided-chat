import { z } from "zod"

export const trajectoryStepSchema = z.object({
  step_id: z.number().int().positive(),
  role: z.enum(["system", "user", "assistant", "tool"]),
  type: z.string().min(1),
  content: z.unknown(),
})
export type TrajectoryStep = z.infer<typeof trajectoryStepSchema>

export const scaffoldNodeSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(160).describe("One very short, non-technical sentence of at most 12 words."),
  importance: z.number().int().min(1).max(100),
  uncertainty: z.number().int().min(1).max(100),
  review_suggestion: z.string().min(1).max(600),
  step_ids: z.string().min(1).max(500),
})
export const scaffoldEdgeSchema = z.object({
  from_node: z.string().min(1).max(60),
  to_node: z.string().min(1).max(60),
})
export const scaffoldMapResultSchema = z.object({
  map: z.object({
    nodes: z.array(scaffoldNodeSchema).min(4).max(8),
    edges: z.array(scaffoldEdgeSchema).max(20),
  }),
  trajectory_summary: z.string().min(1).max(4000),
  result_summary: z.string().min(1).max(2000),
})
export type ScaffoldNode = z.infer<typeof scaffoldNodeSchema>
export type ScaffoldMapResult = z.infer<typeof scaffoldMapResultSchema>

export const scaffoldQuestionSchema = z.object({
  question: z.string().min(1).max(600),
  choices: z.array(z.string().min(1).max(300)).min(2).max(6),
  trajectory_answer: z.string().min(1).max(1200),
  step_ids: z.string().min(1).max(300),
})
export const scaffoldReviewResultSchema = z.object({
  html_slide: z.string().min(1).max(100_000),
  questions: z.array(scaffoldQuestionSchema).max(3),
})
export type ScaffoldReviewResult = z.infer<typeof scaffoldReviewResultSchema>
export type ScaffoldRating = "agree" | "disagree" | "doubt"
export type ScaffoldSteering = {
  id: string
  node_name: string
  question: string
  user_choice: string
  rating: Extract<ScaffoldRating, "disagree" | "doubt">
  trajectory_answer: string
  step_ids: string
}

export type ScaffoldFollowupMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  quote?: string
  node_name: string
}

export type ScaffoldState = {
  status: "idle" | "generating" | "ready" | "error"
  sourceAssistantMessageId?: string
  mapResult?: ScaffoldMapResult
  trajectory?: TrajectoryStep[]
  reviews?: Record<string, ScaffoldReviewResult>
  ratings?: Record<string, Record<number, ScaffoldRating>>
  pendingSteering?: ScaffoldSteering[]
  followups?: Record<string, ScaffoldFollowupMessage[]>
  error?: string
}

export function parseStepIds(value: string): number[] {
  const ids = new Set<number>()
  for (const token of value.split(",").map((part) => part.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start > end || end - start > 10_000) throw new Error(`Invalid step range: ${token}`)
      for (let id = start; id <= end; id += 1) ids.add(id)
      continue
    }
    if (!/^\d+$/.test(token)) throw new Error(`Invalid step ID: ${token}`)
    ids.add(Number(token))
  }
  return [...ids].sort((a, b) => a - b)
}

export function validateScaffoldMap(result: ScaffoldMapResult, trajectory: TrajectoryStep[]): string[] {
  const errors: string[] = []
  const names = new Set(result.map.nodes.map((node) => node.name))
  if (names.size !== result.map.nodes.length) errors.push("Node names must be unique.")
  for (const edge of result.map.edges) {
    if (!names.has(edge.from_node)) errors.push(`Unknown edge source: ${edge.from_node}`)
    if (!names.has(edge.to_node)) errors.push(`Unknown edge target: ${edge.to_node}`)
    if (edge.from_node === edge.to_node) errors.push(`Self-edge is not allowed: ${edge.from_node}`)
  }
  const expected = new Set(trajectory.map((step) => step.step_id))
  const covered = new Map<number, string[]>()
  for (const node of result.map.nodes) {
    const descriptionWords = node.description.trim().split(/\s+/).filter(Boolean).length
    if (descriptionWords > 12) errors.push(`Node ${node.name} description must contain at most 12 words.`)
    try {
      for (const id of parseStepIds(node.step_ids)) {
        if (!expected.has(id)) errors.push(`Node ${node.name} references unknown step ${id}.`)
        covered.set(id, [...(covered.get(id) ?? []), node.name])
      }
    } catch (error) {
      errors.push(`Node ${node.name}: ${error instanceof Error ? error.message : "invalid step_ids"}`)
    }
  }
  const missing = [...expected].filter((id) => !covered.has(id))
  if (missing.length) errors.push(`The map does not cover step IDs: ${missing.join(", ")}`)
  const duplicates = [...covered].filter(([, nodes]) => nodes.length > 1)
  if (duplicates.length) errors.push(`Step IDs must belong to one node only: ${duplicates.map(([id]) => id).join(", ")}`)
  return errors
}

export function nodeAttentionScore(node: ScaffoldNode) {
  return (node.importance + node.uncertainty) / 2
}
