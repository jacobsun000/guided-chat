import { z } from "zod"

export { dependencyMapSchema } from "@/lib/dependency-map"

export const userMapStateSchema = z.object({
  map_id: z.string(),
  visited_node_ids: z.array(z.string()),
  understood_node_ids: z.array(z.string()),
  accepted_node_ids: z.array(z.string()),
  rejected_node_ids: z.array(z.string()),
  uncertain_node_ids: z.array(z.string()),
  flagged_node_ids: z.array(z.string()),
  user_notes: z.array(z.object({ node_id: z.string(), note: z.string(), timestamp: z.string() })),
  quiz_results: z.array(z.object({ node_id: z.string(), passed: z.boolean(), missed_elements: z.array(z.string()).optional() })),
})

