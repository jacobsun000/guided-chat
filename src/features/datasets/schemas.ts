import { z } from "zod"

export const datasetPreviewSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  rowCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
})
export const datasetMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  files: z.array(z.object({ path: z.string(), description: z.string(), preview: datasetPreviewSchema })),
})

