import { z } from "zod"

export const providerIdSchema = z.enum(["openai", "codex", "anthropic", "google"])
export type ProviderId = z.infer<typeof providerIdSchema>

export const agentModelConfigSchema = z.object({
  provider: providerIdSchema,
  model: z.string().trim().min(1).max(200),
  thinkingEffort: z.string().trim().min(1).max(40).default("default"),
  providerOptions: z.record(z.string(), z.unknown()).default({}),
})
export type AgentModelConfig = z.infer<typeof agentModelConfigSchema>

export const apiErrorCodeSchema = z.enum([
  "INVALID_JSON",
  "INVALID_REQUEST",
  "UNAUTHORIZED",
  "SERVER_MISCONFIGURED",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorSchema = z.object({
  error: z.object({ code: apiErrorCodeSchema, message: z.string() }),
})
