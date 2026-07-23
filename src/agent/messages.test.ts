import { describe, expect, it } from "vitest"

import { prepareActionMessages } from "./prepare-messages"

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

  it("appends validated task and related dataset paths without mutating history", () => {
    const mention = "@task/Where Mortgage Applications Succeed"
    const messages = [
      {
        id: "user-task",
        role: "user",
        metadata: {
          references: [
            {
              type: "task",
              id: "hmda-01",
              start: 0,
              end: mention.length,
            },
          ],
        },
        parts: [{ type: "text", text: `${mention} Compare regions.` }],
      },
    ]

    const prepared = prepareActionMessages(messages) as typeof messages
    const text = (prepared[0].parts[0] as { type: string; text: string }).text

    expect(text).toContain("path: /tasks/hmda-01/task.md")
    expect(text).toContain("related_dataset_path: /datasets/hmda_mortgage")
    expect((messages[0].parts[0] as { type: string; text: string }).text)
      .toBe(`${mention} Compare regions.`)
  })

  it("keeps unselected and malformed @ text as ordinary text", () => {
    const text = "Email analyst@example.com about @task/hmda-01."
    const prepared = prepareActionMessages([
      {
        role: "user",
        metadata: {
          references: [
            { type: "task", id: "hmda-01", start: 0, end: 5 },
          ],
        },
        parts: [{ type: "text", text }],
      },
    ]) as Array<{ parts: Array<{ type: string; text: string }> }>

    expect(prepared[0].parts[0].text).toBe(text)
  })

  it("resolves dataset references in earlier messages and deduplicates paths", () => {
    const mention = "@dataset/HMDA Mortgage Data"
    const prepared = prepareActionMessages([
      {
        role: "user",
        metadata: {
          references: [
            {
              type: "dataset",
              id: "hmda_mortgage",
              start: 0,
              end: mention.length,
            },
            {
              type: "dataset",
              id: "hmda_mortgage",
              start: 0,
              end: mention.length,
            },
          ],
        },
        parts: [{ type: "text", text: mention }],
      },
      {
        role: "assistant",
        parts: [{ type: "text", text: "Earlier response" }],
      },
      {
        role: "user",
        parts: [{ type: "text", text: "Continue." }],
      },
    ]) as Array<{ parts: Array<{ type: string; text: string }> }>

    expect(prepared[0].parts[0].text.match(/path: \/datasets\/hmda_mortgage/g))
      .toHaveLength(1)
    expect(prepared[2].parts[0].text).toBe("Continue.")
  })
})
