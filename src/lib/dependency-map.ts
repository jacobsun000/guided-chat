import { z } from "zod"

export const nodeKindSchema = z.enum([
  "term",
  "topic",
  "subquestion",
  "atomic_fact",
  "evidence",
  "method",
  "claim",
  "inference",
  "assumption",
  "uncertainty",
  "counterpoint",
  "decision_point",
  "final_synthesis",
])

export const viewModeSchema = z.enum([
  "slide",
  "glossary_card",
  "evidence_card",
  "claim_inspection",
  "comparison_view",
  "method_trace",
  "quiz_check",
  "synthesis_workspace",
])

export const edgeKindSchema = z.enum([
  "prerequisite",
  "supports",
  "contradicts",
  "evidence_for",
  "method_for",
  "part_of",
  "leads_to_final",
])

export const sourceRefSchema = z.object({
  source_id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  author: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  source_type: z.enum([
    "paper",
    "webpage",
    "dataset",
    "report",
    "documentation",
    "expert_source",
    "other",
  ]),
  reliability_note: z.string().min(1).optional(),
})

export const dependencyNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: nodeKindSchema,
  summary: z.string().min(1),
  why_it_matters: z.string().min(1),
  prerequisites: z.array(z.string().min(1)),
  verification_focus: z.string().min(1).optional(),
  evidence_node_ids: z.array(z.string().min(1)).optional(),
  assumption_node_ids: z.array(z.string().min(1)).optional(),
  counterpoint_node_ids: z.array(z.string().min(1)).optional(),
  view_mode: viewModeSchema,
  importance: z.enum(["core", "supporting", "optional"]),
  misunderstanding_risk: z.enum(["low", "medium", "high"]),
  status: z.enum([
    "definition",
    "observed_fact",
    "well_supported",
    "contested",
    "speculative",
    "unknown",
  ]),
  confidence: z
    .object({
      level: z.enum(["low", "medium", "high"]),
      rationale: z.string().min(1),
    })
    .optional(),
  source_refs: z.array(z.string().min(1)).optional(),
  check_understanding: z
    .object({
      prompt: z.string().min(1),
      expected_elements: z.array(z.string().min(1)).optional(),
    })
    .optional(),
})

export const dependencyEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: edgeKindSchema,
  rationale: z.string().min(1),
  strength: z.enum(["hard", "soft"]),
})

export const dependencyMapSchema = z.object({
  map_id: z.string().min(1),
  research_question: z.string().min(1),
  interaction_goal: z.literal("help_user_build_their_own_answer"),
  assumed_user_prior_knowledge: z.array(z.string().min(1)),
  detected_knowledge_gaps: z.array(z.string().min(1)),
  sources: z.array(sourceRefSchema),
  nodes: z.array(dependencyNodeSchema).min(1),
  edges: z.array(dependencyEdgeSchema),
  entry_node_ids: z.array(z.string().min(1)).min(1),
  recommended_first_node_ids: z.array(z.string().min(1)).min(1),
  final_node_id: z.string().min(1),
  global_uncertainties: z.array(z.string().min(1)),
  map_rendering_hints: z
    .object({
      suggested_layout: z.enum(["dungeon_dag", "layered_dag", "radial", "tree"]),
      cluster_labels: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
})

export const outputDependencyMapInputSchema = z.object({
  dependency_map: dependencyMapSchema.describe(
    "A DAG of inspectable terms, evidence, claims, uncertainties, and synthesis dependencies. Do not include private chain-of-thought."
  ),
})

export const outputDependencyMapResultSchema = z.object({
  map_id: z.string().min(1),
  rendered: z.boolean(),
  available_node_ids: z.array(z.string().min(1)),
  recommended_first_node_ids: z.array(z.string().min(1)),
  validation_warnings: z.array(z.string().min(1)).optional(),
})

export type NodeKind = z.infer<typeof nodeKindSchema>
export type ViewMode = z.infer<typeof viewModeSchema>
export type EdgeKind = z.infer<typeof edgeKindSchema>
export type SourceRef = z.infer<typeof sourceRefSchema>
export type DependencyNode = z.infer<typeof dependencyNodeSchema>
export type DependencyEdge = z.infer<typeof dependencyEdgeSchema>
export type DependencyMap = z.infer<typeof dependencyMapSchema>
export type OutputDependencyMapInput = z.infer<
  typeof outputDependencyMapInputSchema
>
export type OutputDependencyMapResult = z.infer<
  typeof outputDependencyMapResultSchema
>

export type UserNodeState =
  | "locked"
  | "available"
  | "visited"
  | "understood"
  | "flagged"

export type UserMapState = {
  map_id: string
  visited_node_ids: string[]
  understood_node_ids: string[]
  accepted_node_ids: string[]
  rejected_node_ids: string[]
  uncertain_node_ids: string[]
  flagged_node_ids: string[]
  user_notes: {
    node_id: string
    note: string
    timestamp: string
  }[]
  quiz_results: {
    node_id: string
    passed: boolean
    missed_elements?: string[]
  }[]
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type UserMapStateSummary = {
  visited: DependencyNode[]
  understood: DependencyNode[]
  accepted: DependencyNode[]
  rejected: DependencyNode[]
  uncertain: DependencyNode[]
  flagged: DependencyNode[]
  unresolved: DependencyNode[]
}

const LOCKING_EDGE_KINDS = new Set<EdgeKind>([
  "prerequisite",
  "supports",
  "evidence_for",
  "method_for",
  "part_of",
  "leads_to_final",
])

export function createInitialUserMapState(mapId: string): UserMapState {
  return {
    map_id: mapId,
    visited_node_ids: [],
    understood_node_ids: [],
    accepted_node_ids: [],
    rejected_node_ids: [],
    uncertain_node_ids: [],
    flagged_node_ids: [],
    user_notes: [],
    quiz_results: [],
  }
}

export function normalizeUserMapState(
  state: UserMapState | undefined,
  mapId: string
): UserMapState {
  const initial = createInitialUserMapState(mapId)

  if (!state || state.map_id !== mapId) {
    return initial
  }

  return {
    ...initial,
    ...state,
    visited_node_ids: dedupeStrings(state.visited_node_ids),
    understood_node_ids: dedupeStrings(state.understood_node_ids),
    accepted_node_ids: dedupeStrings(state.accepted_node_ids),
    rejected_node_ids: dedupeStrings(state.rejected_node_ids),
    uncertain_node_ids: dedupeStrings(state.uncertain_node_ids),
    flagged_node_ids: dedupeStrings(state.flagged_node_ids),
    user_notes: Array.isArray(state.user_notes) ? state.user_notes : [],
    quiz_results: Array.isArray(state.quiz_results) ? state.quiz_results : [],
  }
}

export function markNodeVisited(
  state: UserMapState,
  nodeId: string
): UserMapState {
  return {
    ...state,
    visited_node_ids: addUnique(state.visited_node_ids, nodeId),
  }
}

export function markNodeUnderstood(
  state: UserMapState,
  nodeId: string
): UserMapState {
  return {
    ...markNodeVisited(state, nodeId),
    understood_node_ids: addUnique(state.understood_node_ids, nodeId),
  }
}

export function flagNode(
  state: UserMapState,
  nodeId: string,
  reason?: string,
  timestamp = new Date().toISOString()
): UserMapState {
  return {
    ...markNodeVisited(state, nodeId),
    flagged_node_ids: addUnique(state.flagged_node_ids, nodeId),
    user_notes: reason?.trim()
      ? [
          ...state.user_notes,
          {
            node_id: nodeId,
            note: reason.trim(),
            timestamp,
          },
        ]
      : state.user_notes,
  }
}

export function acceptNode(
  state: UserMapState,
  nodeId: string
): UserMapState {
  return {
    ...markNodeUnderstood(state, nodeId),
    accepted_node_ids: addUnique(state.accepted_node_ids, nodeId),
    rejected_node_ids: state.rejected_node_ids.filter((id) => id !== nodeId),
    uncertain_node_ids: state.uncertain_node_ids.filter((id) => id !== nodeId),
  }
}

export function rejectNode(
  state: UserMapState,
  nodeId: string
): UserMapState {
  return {
    ...markNodeVisited(state, nodeId),
    rejected_node_ids: addUnique(state.rejected_node_ids, nodeId),
    accepted_node_ids: state.accepted_node_ids.filter((id) => id !== nodeId),
  }
}

export function validateDependencyMap(map: DependencyMap): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeIds = new Set(map.nodes.map((node) => node.id))
  const sourceIds = new Set(map.sources.map((source) => source.source_id))
  const entryNodeIds = new Set(map.entry_node_ids)

  if (nodeIds.size !== map.nodes.length) {
    errors.push("Duplicate node ids.")
  }

  for (const edge of map.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`Unknown edge.from: ${edge.from}`)
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`Unknown edge.to: ${edge.to}`)
    }
  }

  if (!nodeIds.has(map.final_node_id)) {
    errors.push("final_node_id does not exist.")
  }

  for (const id of map.entry_node_ids) {
    if (!nodeIds.has(id)) {
      errors.push(`Unknown entry node: ${id}`)
    }
  }

  for (const id of map.recommended_first_node_ids) {
    if (!nodeIds.has(id)) {
      errors.push(`Unknown recommended first node: ${id}`)
    }
  }

  for (const node of map.nodes) {
    checkNodeRefList(node.id, "prerequisites", node.prerequisites, nodeIds, errors)
    checkNodeRefList(
      node.id,
      "evidence_node_ids",
      node.evidence_node_ids,
      nodeIds,
      errors
    )
    checkNodeRefList(
      node.id,
      "assumption_node_ids",
      node.assumption_node_ids,
      nodeIds,
      errors
    )
    checkNodeRefList(
      node.id,
      "counterpoint_node_ids",
      node.counterpoint_node_ids,
      nodeIds,
      errors
    )

    for (const sourceRef of node.source_refs ?? []) {
      if (!sourceIds.has(sourceRef)) {
        warnings.push(`Node references unknown source: ${node.id} -> ${sourceRef}`)
      }
    }
  }

  const lockingEdges = getLockingDependencyEdges(map)

  if (hasCycle(lockingEdges, nodeIds)) {
    errors.push("Hard prerequisite graph contains a cycle.")
  }

  const incomingEdgesByNode = new Map<string, DependencyEdge[]>()

  for (const edge of map.edges) {
    incomingEdgesByNode.set(edge.to, [
      ...(incomingEdgesByNode.get(edge.to) ?? []),
      edge,
    ])
  }

  for (const node of map.nodes) {
    const incomingEdges = incomingEdgesByNode.get(node.id) ?? []

    if (
      node.importance === "core" &&
      !entryNodeIds.has(node.id) &&
      !node.prerequisites.length &&
      !incomingEdges.length
    ) {
      warnings.push(
        `Non-entry core node lacks prerequisites or incoming edge rationale: ${node.id}`
      )
    }

    if (
      node.kind === "claim" &&
      (!node.evidence_node_ids || node.evidence_node_ids.length === 0) &&
      node.status !== "speculative" &&
      !incomingEdges.some(
        (edge) => edge.kind === "evidence_for" || edge.kind === "contradicts"
      )
    ) {
      warnings.push(`Claim lacks evidence or speculative status: ${node.id}`)
    }

    if (
      node.misunderstanding_risk === "high" &&
      !node.verification_focus &&
      node.kind !== "term"
    ) {
      warnings.push(`High-risk node lacks verification_focus: ${node.id}`)
    }

    if (sentenceCount(node.summary) > 2 || node.summary.length > 260) {
      warnings.push(`Node summary may be too long: ${node.id}`)
    }
  }

  const finalPrerequisiteIds = new Set([
    ...getHardPrerequisiteIds(map, map.final_node_id),
    ...(incomingEdgesByNode.get(map.final_node_id) ?? []).map((edge) => edge.from),
  ])
  const finalDependsOnClaimOrUncertainty = map.nodes.some(
    (node) =>
      finalPrerequisiteIds.has(node.id) &&
      (node.kind === "claim" ||
        node.kind === "inference" ||
        node.kind === "uncertainty")
  )

  if (!finalDependsOnClaimOrUncertainty) {
    warnings.push("Final synthesis does not depend on a claim or uncertainty.")
  }

  const initialState = createInitialUserMapState(map.map_id)
  const initialNodeStates = calculateNodeStates(map, initialState)

  for (const id of map.recommended_first_node_ids) {
    if (initialNodeStates[id] === "locked") {
      warnings.push(`Recommended first node is locked at start: ${id}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function calculateNodeStates(
  map: DependencyMap,
  state: UserMapState
): Record<string, UserNodeState> {
  const normalizedState = normalizeUserMapState(state, map.map_id)
  const visited = new Set(normalizedState.visited_node_ids)
  const understood = new Set(normalizedState.understood_node_ids)
  const flagged = new Set(normalizedState.flagged_node_ids)
  const result: Record<string, UserNodeState> = {}

  for (const node of map.nodes) {
    if (flagged.has(node.id)) {
      result[node.id] = "flagged"
      continue
    }

    if (understood.has(node.id)) {
      result[node.id] = "understood"
      continue
    }

    if (visited.has(node.id)) {
      result[node.id] = "visited"
      continue
    }

    const hardPrerequisites = getHardPrerequisiteIds(map, node.id)
    const available = hardPrerequisites.every(
      (id) => understood.has(id) || visited.has(id)
    )

    result[node.id] = available ? "available" : "locked"
  }

  return result
}

export function getAvailableNodeIds(
  map: DependencyMap,
  state: UserMapState
): string[] {
  const nodeStates = calculateNodeStates(map, state)

  return map.nodes
    .filter((node) => nodeStates[node.id] !== "locked")
    .map((node) => node.id)
}

export function getHardPrerequisiteIds(
  map: DependencyMap,
  nodeId: string
): string[] {
  const node = map.nodes.find((candidate) => candidate.id === nodeId)
  const prerequisiteIds = new Set(node?.prerequisites ?? [])

  for (const edge of map.edges) {
    if (
      edge.to === nodeId &&
      edge.strength === "hard" &&
      LOCKING_EDGE_KINDS.has(edge.kind)
    ) {
      prerequisiteIds.add(edge.from)
    }
  }

  prerequisiteIds.delete(nodeId)

  return Array.from(prerequisiteIds)
}

export function summarizeUserMapState(
  map: DependencyMap,
  state: UserMapState
): UserMapStateSummary {
  const normalizedState = normalizeUserMapState(state, map.map_id)
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const understood = new Set(normalizedState.understood_node_ids)
  const accepted = new Set(normalizedState.accepted_node_ids)
  const rejected = new Set(normalizedState.rejected_node_ids)
  const uncertain = new Set(normalizedState.uncertain_node_ids)
  const flagged = new Set(normalizedState.flagged_node_ids)

  return {
    visited: nodesForIds(byId, normalizedState.visited_node_ids),
    understood: nodesForIds(byId, normalizedState.understood_node_ids),
    accepted: nodesForIds(byId, normalizedState.accepted_node_ids),
    rejected: nodesForIds(byId, normalizedState.rejected_node_ids),
    uncertain: nodesForIds(byId, normalizedState.uncertain_node_ids),
    flagged: nodesForIds(byId, normalizedState.flagged_node_ids),
    unresolved: map.nodes.filter(
      (node) =>
        node.importance === "core" &&
        node.id !== map.final_node_id &&
        !understood.has(node.id) &&
        !accepted.has(node.id) &&
        !rejected.has(node.id) &&
        !uncertain.has(node.id) &&
        !flagged.has(node.id)
    ),
  }
}

function getLockingDependencyEdges(map: DependencyMap) {
  const edges = map.edges
    .filter(
      (edge) => edge.strength === "hard" && LOCKING_EDGE_KINDS.has(edge.kind)
    )
    .map((edge) => ({ from: edge.from, to: edge.to }))

  for (const node of map.nodes) {
    for (const prerequisiteId of node.prerequisites) {
      edges.push({ from: prerequisiteId, to: node.id })
    }
  }

  return edges
}

function hasCycle(
  edges: { from: string; to: string }[],
  nodeIds: Set<string>
): boolean {
  const adjacency = new Map<string, string[]>()

  for (const id of nodeIds) {
    adjacency.set(id, [])
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      continue
    }

    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to])
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(id: string): boolean {
    if (visited.has(id)) {
      return false
    }

    if (visiting.has(id)) {
      return true
    }

    visiting.add(id)

    for (const nextId of adjacency.get(id) ?? []) {
      if (visit(nextId)) {
        return true
      }
    }

    visiting.delete(id)
    visited.add(id)
    return false
  }

  for (const id of nodeIds) {
    if (visit(id)) {
      return true
    }
  }

  return false
}

function checkNodeRefList(
  nodeId: string,
  field: string,
  ids: string[] | undefined,
  nodeIds: Set<string>,
  errors: string[]
) {
  for (const id of ids ?? []) {
    if (!nodeIds.has(id)) {
      errors.push(`Unknown ${field} reference on ${nodeId}: ${id}`)
    }
  }
}

function sentenceCount(value: string) {
  return value
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value]
}

function dedupeStrings(values: unknown) {
  return Array.isArray(values)
    ? Array.from(new Set(values.filter((value): value is string => typeof value === "string")))
    : []
}

function nodesForIds(
  byId: Map<string, DependencyNode>,
  ids: string[]
): DependencyNode[] {
  return ids.flatMap((id) => {
    const node = byId.get(id)
    return node ? [node] : []
  })
}
