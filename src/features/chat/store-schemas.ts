import { z } from "zod"

import { agentModelConfigSchema } from "./schemas"

export const chatSettingsSchema = agentModelConfigSchema.extend({
  providerOptions: z.record(z.enum(["openai", "codex", "anthropic", "google"]), z.string()),
})
export const chatThreadSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(z.unknown()),
  settings: chatSettingsSchema,
})
export const threadsStoreSchema = z.object({
  version: z.literal(1),
  activeThreadId: z.string().min(1),
  threads: z.array(chatThreadSchema),
})
