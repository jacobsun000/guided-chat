import { z } from "zod"

export const taskMetadataSchema = z.object({
  verifiable: z.boolean(),
  verificationMethod: z.string(),
  difficulty: z.enum(["low", "medium", "high"]),
})

export const researchTaskSchema = z.object({
  id: z.string().min(1),
  metadata: taskMetadataSchema,
  dataset: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
  deliverables: z.string(),
})

