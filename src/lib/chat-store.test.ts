import { describe, expect, it } from "vitest"

import { createDefaultSettings, createThread } from "./chat-store"

describe("chat defaults", () => {
  it("uses Codex GPT-5.6 Sol with maximum reasoning effort", () => {
    expect(createDefaultSettings()).toMatchObject({
      mode: "baseline",
      provider: "codex",
      model: "gpt-5.6-sol",
      thinkingEffort: "xhigh",
    })
    expect(createThread().settings).toMatchObject({
      mode: "baseline",
      provider: "codex",
      model: "gpt-5.6-sol",
      thinkingEffort: "xhigh",
    })
  })
})
