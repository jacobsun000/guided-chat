// @vitest-environment jsdom

import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { SourceReferenceMention } from "@/lib/source-references"
import {
  SourceReferenceComposer,
  filterSourceReferenceOptions,
  findActiveReferenceQuery,
  reconcileReferenceMentions,
} from "./source-reference-composer"

afterEach(cleanup)

function ComposerHarness({ initial = "@" }: { initial?: string }) {
  const [value, setValue] = React.useState(initial)
  const [mentions, setMentions] = React.useState<SourceReferenceMention[]>([])

  return (
    <>
      <SourceReferenceComposer
        aria-label="Message"
        value={value}
        mentions={mentions}
        onValueChange={(next, nextMentions) => {
          setValue(next)
          setMentions(nextMentions)
        }}
      />
      <output data-testid="mention-count">{mentions.length}</output>
    </>
  )
}

describe("source reference composer utilities", () => {
  it("detects only a standalone active @ query", () => {
    expect(findActiveReferenceQuery("@mortgage", 9, [])).toEqual({
      start: 0,
      end: 9,
      query: "mortgage",
    })
    expect(findActiveReferenceQuery("email@host", 10, [])).toBeUndefined()
  })

  it("shifts mentions for outside edits and invalidates overlapping edits", () => {
    const mention = { type: "task" as const, id: "hmda-01", start: 6, end: 12 }
    expect(reconcileReferenceMentions("hello @task", "hello! @task", [mention]))
      .toEqual([{ ...mention, start: 7, end: 13 }])
    expect(reconcileReferenceMentions("hello @task", "hello @tusk", [mention]))
      .toEqual([])
  })

  it("filters by category, human name, and stable id", () => {
    expect(filterSourceReferenceOptions("dataset/IMDb")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "dataset",
          id: "imdb_non_commercial_datasets",
        }),
      ])
    )
    expect(filterSourceReferenceOptions("hmda-01")).toEqual([
      expect.objectContaining({ type: "task", id: "hmda-01" }),
    ])
  })
})

describe("SourceReferenceComposer", () => {
  it("selects a highlighted inline reference with Tab", () => {
    render(<ComposerHarness initial="@hmda-01" />)
    const textarea = screen.getByRole("textbox", { name: "Message" })
    textarea.setSelectionRange(8, 8)
    fireEvent.select(textarea)

    expect(screen.getByRole("listbox")).toBeVisible()
    fireEvent.keyDown(textarea, { key: "Tab" })

    expect((textarea as HTMLTextAreaElement).value).toBe(
      "@task/Where Mortgage Applications Succeed "
    )
    expect(screen.getByTestId("mention-count")).toHaveTextContent("1")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("leaves @ as ordinary text when the menu is dismissed", () => {
    render(<ComposerHarness />)
    const textarea = screen.getByRole("textbox", { name: "Message" })
    textarea.setSelectionRange(1, 1)
    fireEvent.select(textarea)
    fireEvent.keyDown(textarea, { key: "Escape" })

    expect((textarea as HTMLTextAreaElement).value).toBe("@")
    expect(screen.getByTestId("mention-count")).toHaveTextContent("0")
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
