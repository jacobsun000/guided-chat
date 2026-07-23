import { describe, expect, it } from "vitest"

import { getOpenHtmlFenceSource, getThreadUsage } from "./chat-workspace"

describe("getOpenHtmlFenceSource", () => {
  it("returns the source of an unfinished HTML fence", () => {
    expect(getOpenHtmlFenceSource("Intro\n```html\n<div>partial</div>"))
      .toBe("<div>partial</div>")
  })

  it("waits for a matching closing fence", () => {
    expect(getOpenHtmlFenceSource("```html\n<div />\n```"))
      .toBeNull()
    expect(getOpenHtmlFenceSource("~~~~html\n<div />\n~~~"))
      .toBe("<div />\n~~~")
  })

  it("ignores unfinished non-HTML fences", () => {
    expect(getOpenHtmlFenceSource("```ts\nconst value = 1"))
      .toBeNull()
  })
})

describe("getThreadUsage", () => {
  it("aggregates persisted assistant usage and uses the latest input as context", () => {
    const usage = getThreadUsage([
      { id: "1", role: "assistant", parts: [], metadata: { usage: { inputTokens: 100, cacheReadTokens: 40, cacheWriteTokens: 5, outputTokens: 20, totalTokens: 120 } } },
      { id: "2", role: "user", parts: [{ type: "text", text: "next" }] },
      { id: "3", role: "assistant", parts: [], metadata: { usage: { inputTokens: 180, cacheReadTokens: 120, cacheWriteTokens: 0, outputTokens: 30, totalTokens: 210 } } },
    ] as Parameters<typeof getThreadUsage>[0])

    expect(usage).toEqual({
      contextTokens: 180,
      inputTokens: 120,
      cacheReadTokens: 160,
      cacheWriteTokens: 5,
      outputTokens: 50,
      totalTokens: 330,
      responses: 2,
    })
  })
})
