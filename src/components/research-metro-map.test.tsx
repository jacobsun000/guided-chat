// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ResearchMetroMap, buildMetroLayout } from "./research-metro-map"
import type { ResearchPlan } from "@/lib/research-plan"

const plan: ResearchPlan = {
  steps: [
    {
      name: "Start",
      description: "Frame the question.",
      next_steps: ["Evidence", "Risks"],
    },
    {
      name: "Evidence",
      description: "Inspect supporting evidence.",
      next_steps: ["Synthesis"],
    },
    {
      name: "Risks",
      description: "Inspect uncertainty and counterevidence.",
      next_steps: ["Synthesis"],
    },
    {
      name: "Synthesis",
      description: "Form a balanced conclusion.",
      next_steps: [],
    },
  ],
}

describe("ResearchMetroMap", () => {
  it("lays out every station and connection", () => {
    const layout = buildMetroLayout(plan)

    expect(layout.stations).toHaveLength(4)
    expect(layout.lines).toHaveLength(4)
    expect(new Set(layout.stations.map((station) => station.x))).toEqual(
      new Set([layout.centerX])
    )
    expect(layout.stations.map((station) => station.side)).toEqual([
      "left",
      "right",
      "left",
      "right",
    ])
    expect(layout.stations.find((station) => station.step.name === "Start")?.depth)
      .toBe(0)
    expect(
      layout.stations.find((station) => station.step.name === "Synthesis")
        ?.depth
    ).toBe(2)
  })

  it("sends the selected step when a station is clicked", () => {
    const onSelectStep = vi.fn()
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    })

    render(
      <ResearchMetroMap
        plan={plan}
        currentStepName="Evidence"
        visitedStepNames={new Set(["Risks"])}
        disabled={false}
        isUpdating={false}
        onSelectStep={onSelectStep}
      />
    )

    expect(screen.getByTestId("metro-spine")).toHaveAttribute(
      "stroke",
      "var(--primary)"
    )
    expect(screen.getByTestId("metro-spine")).toHaveAttribute(
      "stroke-width",
      "8"
    )
    expect(screen.queryByText(/01 · Go/i)).not.toBeInTheDocument()
    expect(screen.queryByText("Go")).not.toBeInTheDocument()
    expect(screen.getByText("Now")).toBeInTheDocument()
    expect(screen.getByText("Seen")).toBeInTheDocument()
    expect(screen.getByText("Inspect supporting evidence.").parentElement)
      .toHaveClass("duration-300", "ease-in-out")

    fireEvent.click(screen.getByRole("button", { name: "Explore Risks" }))

    expect(onSelectStep).toHaveBeenCalledWith(plan.steps[2])
  })
})
