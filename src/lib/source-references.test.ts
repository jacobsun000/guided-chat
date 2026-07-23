import { describe, expect, it } from "vitest"

import {
  getChatReferenceHref,
  getSourceReferenceText,
  parseChatReference,
} from "./source-references"

describe("source references", () => {
  it("round-trips a detail-page chat reference", () => {
    const href = getChatReferenceHref({ type: "dataset", id: "hmda_mortgage" })
    const value = new URL(href, "http://localhost").searchParams.get("reference")
    expect(parseChatReference(value)).toEqual(
      expect.objectContaining({
        type: "dataset",
        id: "hmda_mortgage",
        name: "HMDA Mortgage Data",
      })
    )
  })

  it("uses the human-readable name for inline display", () => {
    expect(
      getSourceReferenceText({
        type: "task",
        name: "Where Mortgage Applications Succeed",
      })
    ).toBe("@task/Where Mortgage Applications Succeed")
  })

  it("rejects unknown reference parameters", () => {
    expect(parseChatReference("task:missing")).toBeUndefined()
    expect(parseChatReference("file:hmda-01")).toBeUndefined()
  })
})
