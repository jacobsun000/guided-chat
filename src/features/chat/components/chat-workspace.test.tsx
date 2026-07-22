// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ResearchAssistantMessage } from "@/lib/question-tool"
import { AskUserQuestionsPanel, AssistantActivity } from "./chat-workspace"

describe("AssistantActivity", () => {
  it("expands streaming reasoning and tool details on click", () => {
    const parts = [
      { type: "reasoning", text: "Reviewing the available sources", state: "streaming" },
      {
        type: "tool-update_plan",
        toolCallId: "plan-1",
        state: "input-available",
        input: {
          steps: [
            { name: "Foundations", description: "Core ideas", next_steps: [] },
          ],
        },
      },
    ] as ResearchAssistantMessage["parts"]

    render(<AssistantActivity parts={parts} streaming />)

    const trigger = screen.getByRole("button", { name: /thinking/i })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Reviewing the available sources")).toBeNull()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Reviewing the available sources")).toBeVisible()
    expect(screen.getByText("update_plan")).toBeVisible()
    const input = screen.getByText("Input")
    expect(input.parentElement).not.toHaveAttribute("open")
    fireEvent.click(input)
    expect(screen.getByText(/Foundations/)).toBeVisible()
  })

  it("renders ask-user questions inline and submits the selected answer", () => {
    const onSubmit = vi.fn()
    const part = {
      type: "tool-ask_user_questions",
      toolCallId: "questions-1",
      state: "input-available",
      input: {
        title: "Your background",
        purpose: "Tailor the research route.",
        questions: [
          {
            id: "experience",
            header: "Experience",
            question: "How familiar are you with this topic?",
            options: [
              { label: "New", description: "Start with foundations." },
              { label: "Experienced", description: "Skip the basics." },
            ],
          },
        ],
      },
    } as Extract<
      ResearchAssistantMessage["parts"][number],
      { type: "tool-ask_user_questions" }
    > & { state: "input-available" }

    render(
      <AskUserQuestionsPanel
        part={part}
        disabled={false}
        onSubmit={onSubmit}
      />
    )

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByText("How familiar are you with this topic?")).toBeVisible()
    fireEvent.click(screen.getByText("New"))
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onSubmit).toHaveBeenCalledWith("questions-1", {
      answers: [
        {
          id: "experience",
          question: "How familiar are you with this topic?",
          selectedOption: "New",
          customAnswer: undefined,
          answer: "New",
        },
      ],
    })
  })
})
