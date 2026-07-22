import { describe, expect, it } from "vitest"

import { getOpenHtmlFenceSource } from "./chat-workspace"

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
