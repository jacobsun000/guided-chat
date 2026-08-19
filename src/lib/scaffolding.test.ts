import { describe, expect, it } from "vitest"
import { parseStepIds, validateScaffoldMap, type ScaffoldMapResult, type TrajectoryStep } from "./scaffolding"

describe("scaffolding validation", () => {
  it("parses compact step ranges", () => {
    expect(parseStepIds("1-3, 5,7")).toEqual([1, 2, 3, 5, 7])
    expect(() => parseStepIds("5-2")).toThrow("Invalid step range")
  })

  it("requires every trajectory step exactly once and valid edge names", () => {
    const trajectory: TrajectoryStep[] = Array.from({ length: 5 }, (_, index) => ({
      step_id: index + 1,
      role: "assistant",
      type: "text",
      content: "x",
    }))
    const result: ScaffoldMapResult = {
      map: {
        nodes: [
          { name: "A", description: "A", importance: 50, uncertainty: 50, review_suggestion: "Check A", step_ids: "1-2" },
          { name: "B", description: "B", importance: 50, uncertainty: 50, review_suggestion: "Check B", step_ids: "3" },
          { name: "C", description: "C", importance: 50, uncertainty: 50, review_suggestion: "Check C", step_ids: "4" },
          { name: "D", description: "D", importance: 50, uncertainty: 50, review_suggestion: "Check D", step_ids: "5" },
        ],
        edges: [{ from_node: "A", to_node: "B" }],
      },
      trajectory_summary: "summary",
      result_summary: "result",
    }
    expect(validateScaffoldMap(result, trajectory)).toEqual([])
    result.map.nodes[1].step_ids = "2"
    expect(validateScaffoldMap(result, trajectory).join(" ")).toMatch(/does not cover step IDs: 3|one node only/)
  })
})
