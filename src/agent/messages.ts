import { z } from "zod"

export const exploreResearchStepActionSchema = z.object({
  type: z.literal("explore_research_step"),
  stepName: z.string().min(1),
})
export type ExploreResearchStepAction = z.infer<
  typeof exploreResearchStepActionSchema
>

export const sourceReferenceMentionSchema = z.object({
  type: z.enum(["task", "dataset"]),
  id: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
})

export const scaffoldSteeringSchema = z.object({
  id: z.string().min(1),
  node_name: z.string().min(1).max(60),
  question: z.string().min(1).max(600),
  user_choice: z.string().min(1).max(300),
  rating: z.enum(["disagree", "doubt"]),
  trajectory_answer: z.string().min(1).max(1200),
  step_ids: z.string().min(1).max(300),
})

export const researchMessageMetadataSchema = z
  .object({
    action: exploreResearchStepActionSchema.optional(),
    steering: z.array(scaffoldSteeringSchema).max(20).optional(),
    references: z.array(sourceReferenceMentionSchema).optional(),
    usage: z.object({
      inputTokens: z.number().nonnegative(),
      cacheReadTokens: z.number().nonnegative(),
      cacheWriteTokens: z.number().nonnegative(),
      outputTokens: z.number().nonnegative(),
      totalTokens: z.number().nonnegative(),
    }).optional(),
  })
  .optional()
export type ResearchMessageMetadata = z.infer<typeof researchMessageMetadataSchema>
