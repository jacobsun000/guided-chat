import "server-only"

import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel, ProviderMetadata } from "ai"

import type { AgentModelConfig, ProviderId } from "@/features/chat/schemas"

const PROVIDER_KEYS: Record<ProviderId, string> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
}
const API_KEY_ENV_KEYS: Record<ProviderId, string[]> = {
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  google: ["GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"],
}

export type AgentEnvironment = Readonly<Record<string, string | undefined>>

export function createModel(config: AgentModelConfig, env: AgentEnvironment = process.env) {
  const apiKey = API_KEY_ENV_KEYS[config.provider]
    .map((key) => env[key]?.trim())
    .find(Boolean)
  if (!apiKey) {
    throw new Error(`Missing server API key for ${config.provider}.`)
  }
  const factories: Record<ProviderId, () => LanguageModel> = {
    openai: () => createOpenAI({ apiKey })(config.model),
    anthropic: () => createAnthropic({ apiKey })(config.model),
    google: () => createGoogleGenerativeAI({ apiKey })(config.model),
  }
  return factories[config.provider]()
}

export function normalizeProviderOptions(config: AgentModelConfig): ProviderMetadata | undefined {
  const raw = { ...config.providerOptions }
  if (config.thinkingEffort !== "default") {
    if (config.provider === "openai") raw.reasoningEffort = config.thinkingEffort
    else if (config.provider === "anthropic") raw.effort = config.thinkingEffort
    else {
      const current = raw.thinkingConfig
      raw.thinkingConfig = {
        ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}),
        thinkingLevel: config.thinkingEffort,
      }
    }
  }
  if (Object.keys(raw).length === 0) return undefined
  const key = PROVIDER_KEYS[config.provider]
  return (raw[key] != null ? raw : { [key]: raw }) as ProviderMetadata
}

