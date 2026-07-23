import { describe, expect, it } from "vitest"

import { RESEARCH_SYSTEM_PROMPT } from "./prompts"

describe("RESEARCH_SYSTEM_PROMPT", () => {
  it("gates plan publication behind the complete research workflow", () => {
    const stages = [
      "Stage 1 — Source reconnaissance",
      "Stage 2 — High-level internal overview",
      "Stage 3 — Deep subtopic research",
      "Stage 4 — Audience and background calibration",
      "Stage 5 — Curriculum and presentation design",
      "Stage 6 — Publish the route and stop",
    ]
    const positions = stages.map((stage) =>
      RESEARCH_SYSTEM_PROMPT.indexOf(stage)
    )

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual(positions.toSorted((left, right) => left - right))
    expect(RESEARCH_SYSTEM_PROMPT).toContain(
      "DO NOT provide a direct answer"
    )
    expect(RESEARCH_SYSTEM_PROMPT).toContain(
      "Do not call update_plan until every applicable stage is complete."
    )
  })

  it("requires the shared canvas component system for HTML slides", () => {
    expect(RESEARCH_SYSTEM_PROMPT).toContain("`CanvasUI` component kit")
    expect(RESEARCH_SYSTEM_PROMPT).toContain(
      "Use static Tailwind classes only for layout"
    )
    expect(RESEARCH_SYSTEM_PROMPT).toContain(
      "do not add a scrollable outer canvas"
    )
  })

  it("documents validated @ references and read-only source roots", () => {
    expect(RESEARCH_SYSTEM_PROMPT).toContain("selected @task and @dataset")
    expect(RESEARCH_SYSTEM_PROMPT).toContain("<references> block")
    expect(RESEARCH_SYSTEM_PROMPT).toContain("/tasks")
    expect(RESEARCH_SYSTEM_PROMPT).toContain("/datasets")
  })
})
