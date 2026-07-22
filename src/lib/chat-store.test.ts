import { describe, expect, it } from "vitest"

import { createDefaultSettings, createThread } from "./chat-store"

describe("chat defaults", () => {
  it("uses GPT-5.6 Sol with maximum reasoning effort", () => {
    expect(createDefaultSettings()).toMatchObject({
      provider: "openai",
      model: "gpt-5.6-sol",
      thinkingEffort: "xhigh",
    })
    expect(createThread().settings).toMatchObject({
      model: "gpt-5.6-sol",
      thinkingEffort: "xhigh",
    })
  })
})
