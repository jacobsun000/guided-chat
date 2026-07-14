import assert from "node:assert/strict"
import test from "node:test"

import {
  calculateNodeStates,
  createInitialUserMapState,
  flagNode,
  markNodeUnderstood,
  summarizeUserMapState,
  validateDependencyMap,
  type DependencyMap,
} from "./dependency-map.ts"
import { demoDependencyMap } from "./dependency-map.fixture.ts"

function cloneMap(patch?: Partial<DependencyMap>): DependencyMap {
  return {
    ...structuredClone(demoDependencyMap),
    ...patch,
  }
}

test("schema validation accepts valid maps", () => {
  const result = validateDependencyMap(demoDependencyMap)

  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
})

test("schema validation rejects duplicate node ids", () => {
  const map = cloneMap({
    nodes: [
      ...demoDependencyMap.nodes,
      {
        ...demoDependencyMap.nodes[0],
        label: "Duplicate primary outcome",
      },
    ],
  })

  const result = validateDependencyMap(map)

  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /Duplicate node ids/)
})

test("schema validation rejects missing edge endpoints", () => {
  const map = cloneMap({
    edges: [
      ...demoDependencyMap.edges,
      {
        from: "missing-node",
        to: "claim-main-result",
        kind: "supports",
        rationale: "Broken test edge.",
        strength: "hard",
      },
    ],
  })

  const result = validateDependencyMap(map)

  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /Unknown edge\.from: missing-node/)
})

test("schema validation rejects missing final node", () => {
  const result = validateDependencyMap(
    cloneMap({
      final_node_id: "missing-final-node",
    })
  )

  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /final_node_id does not exist/)
})

test("cycle detection catches hard-prerequisite cycles", () => {
  const map = cloneMap({
    edges: [
      ...demoDependencyMap.edges,
      {
        from: "claim-main-result",
        to: "term-primary-outcome",
        kind: "prerequisite",
        rationale: "Creates a hard cycle for testing.",
        strength: "hard",
      },
    ],
  })

  const result = validateDependencyMap(map)

  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /Hard prerequisite graph contains a cycle/)
})

test("availability logic locks nodes with incomplete hard prerequisites", () => {
  const state = createInitialUserMapState(demoDependencyMap.map_id)
  const nodeStates = calculateNodeStates(demoDependencyMap, state)

  assert.equal(nodeStates["term-primary-outcome"], "available")
  assert.equal(nodeStates["topic-study-design"], "available")
  assert.equal(nodeStates["evidence-results-table"], "locked")
  assert.equal(nodeStates["claim-main-result"], "locked")
  assert.equal(nodeStates["final-user-synthesis"], "locked")
})

test("availability logic unlocks nodes after prerequisites are understood", () => {
  const state = markNodeUnderstood(
    createInitialUserMapState(demoDependencyMap.map_id),
    "term-primary-outcome"
  )
  const nodeStates = calculateNodeStates(demoDependencyMap, state)

  assert.equal(nodeStates["term-primary-outcome"], "understood")
  assert.equal(nodeStates["evidence-results-table"], "available")
  assert.equal(nodeStates["claim-main-result"], "locked")
})

test("final synthesis can read user state", () => {
  const understoodState = markNodeUnderstood(
    createInitialUserMapState(demoDependencyMap.map_id),
    "topic-study-design"
  )
  const state = flagNode(
    understoodState,
    "uncertainty-selection-bias",
    "Sample representativeness may be weak.",
    "2026-07-07T00:00:00.000Z"
  )
  const summary = summarizeUserMapState(demoDependencyMap, state)

  assert.deepEqual(
    summary.understood.map((node) => node.id),
    ["topic-study-design"]
  )
  assert.deepEqual(summary.flagged.map((node) => node.id), [
    "uncertainty-selection-bias",
  ])
  assert.equal(
    summary.unresolved.some((node) => node.id === "claim-main-result"),
    true
  )
})
