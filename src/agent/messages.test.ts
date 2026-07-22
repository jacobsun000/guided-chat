import { describe, expect, it } from "vitest"

import { prepareActionMessages } from "./messages"

describe("prepareActionMessages", () => {
  it("replaces a station click with validated slide-generation context", () => {
    const messages = [
      {
        id: "assistant-plan",
        role: "assistant",
        parts: [
          {
            type: "tool-update_plan",
            input: {
              steps: [
                {
                  name: "Evidence",
                  description: "Inspect the strongest sources.",
                  next_steps: ["Synthesis"],
                },
                {
                  name: "Synthesis",
                  description: "Build the answer.",
                  next_steps: [],
                },
              ],
            },
          },
        ],
      },
      {
        id: "user-selection",
        role: "user",
        metadata: {
          action: {
            type: "explore_research_step",
            stepName: "Evidence",
          },
        },
        parts: [{ type: "text", text: "Explore Evidence next." }],
      },
    ]

    const prepared = prepareActionMessages(messages) as typeof messages
    const text = (prepared[1].parts[0] as { type: string; text: string }).text

    expect(text).toContain("selected_step_name: Evidence")
    expect(text).toContain("Generate exactly one focused slide")
    expect(
      (messages[1].parts[0] as { type: string; text: string }).text
    ).toBe("Explore Evidence next.")
  })

  it("rejects a station that is absent from the latest plan", () => {
    expect(() =>
      prepareActionMessages([
        {
          role: "assistant",
          parts: [
            {
              type: "tool-update_plan",
              input: {
                steps: [
                  {
                    name: "Known",
                    description: "A known station.",
                    next_steps: [],
                  },
                ],
              },
            },
          ],
        },
        {
          role: "user",
          metadata: {
            action: {
              type: "explore_research_step",
              stepName: "Missing",
            },
          },
          parts: [{ type: "text", text: "Explore Missing next." }],
        },
      ])
    ).toThrow("The selected research step does not exist.")
  })
})
