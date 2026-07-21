import { describe, expect, it } from "vitest"
import { normalizeProviderOptions } from "./provider"

describe("provider option normalization", () => {
  it("nests raw options under the selected provider", () => {
    expect(normalizeProviderOptions({ provider: "openai", model: "model", thinkingEffort: "high", providerOptions: { store: false } }))
      .toEqual({ openai: { store: false, reasoningEffort: "high" } })
  })
  it("merges Google thinking configuration", () => {
    expect(normalizeProviderOptions({ provider: "google", model: "model", thinkingEffort: "low", providerOptions: { thinkingConfig: { includeThoughts: true } } }))
      .toEqual({ google: { thinkingConfig: { includeThoughts: true, thinkingLevel: "low" } } })
  })
})
