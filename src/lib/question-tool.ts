import type { UIMessage } from "ai"
import { z } from "zod"

import type {
  OutputDependencyMapInput,
  OutputDependencyMapResult,
} from "@/lib/dependency-map"

export const askUserQuestionOptionSchema = z.object({
  label: z.string().min(1).describe("User-facing label for this option."),
  description: z
    .string()
    .min(1)
    .describe("Short explanation of the choice or tradeoff."),
})

export const askUserQuestionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/)
    .describe("Stable identifier for mapping the user's answer."),
  header: z.string().min(1).describe("Short label shown above the question."),
  question: z.string().min(1).describe("Question to show the user."),
  options: z
    .array(askUserQuestionOptionSchema)
    .min(2)
    .describe("Mutually exclusive choices to present."),
})

export const askUserQuestionsInputSchema = z.object({
  purpose: z
    .string()
    .min(1)
    .describe("Why this input is needed before continuing."),
  title: z
    .string()
    .min(1)
    .optional()
    .describe("Optional short title for the question group."),
  questions: z
    .array(askUserQuestionSchema)
    .min(1)
    .describe("Questions to show the user."),
})

export const askUserAnswerSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  selectedOption: z.string().min(1).optional(),
  customAnswer: z.string().min(1).optional(),
  answer: z.string().min(1),
})

export const askUserQuestionsOutputSchema = z.object({
  answers: z.array(askUserAnswerSchema).min(1),
})

export type AskUserQuestionsInput = z.infer<typeof askUserQuestionsInputSchema>
export type AskUserQuestionsOutput = z.infer<typeof askUserQuestionsOutputSchema>

export type ReadImageInput = {
  url: string
}

export type ReadImageOutput = {
  url: string
  mediaType: string
  base64: string
}

export type ResearchAssistantTools = {
  ask_user_questions: {
    input: AskUserQuestionsInput
    output: AskUserQuestionsOutput
  }
  read_image: {
    input: ReadImageInput
    output: ReadImageOutput
  }
  output_dependency_map: {
    input: OutputDependencyMapInput
    output: OutputDependencyMapResult
  }
}

export type ResearchAssistantMessage = UIMessage<
  unknown,
  Record<string, unknown>,
  ResearchAssistantTools
>
