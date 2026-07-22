import { describe, expect, it } from "vitest"

import { getScaledHtmlOutputHeight } from "./html-output-block"

describe("getScaledHtmlOutputHeight", () => {
  it("preserves the full vertical content height instead of capping it", () => {
    expect(getScaledHtmlOutputHeight(1_400, 960)).toBe(1_400)
    expect(getScaledHtmlOutputHeight(1_400, 480)).toBe(700)
  })

  it("keeps an empty frame measurable", () => {
    expect(getScaledHtmlOutputHeight(0, 960)).toBe(1)
  })
})
