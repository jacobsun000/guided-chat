import { randomUUID } from "node:crypto"

import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel, ProviderMetadata } from "ai"

import type { ProviderId } from "@/lib/chat-store"

export type ChatSessionConfig = {
  provider: ProviderId
  model: string
  providerOptions?: ProviderMetadata
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 6

const PROVIDER_OPTION_KEYS: Record<ProviderId, string> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
}

const API_KEY_ENV_KEYS: Record<ProviderId, string[]> = {
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  google: ["GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"],
}

type StoredChatSession = {
  expiresAt: number
  config: ChatSessionConfig
}

const globalForChatSessions = globalThis as typeof globalThis & {
  __guidedChatSessions?: Map<string, StoredChatSession>
}

const sessions =
  globalForChatSessions.__guidedChatSessions ??
  (globalForChatSessions.__guidedChatSessions = new Map())

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === "openai" || value === "anthropic" || value === "google"
}

export function verifyAccessToken(accessToken: unknown) {
  const expected = process.env.GUIDED_CHAT_ACCESS_TOKEN

  if (!expected) {
    return "Server access token is not configured."
  }

  if (typeof accessToken !== "string" || accessToken.trim() !== expected) {
    return "Invalid access token."
  }

  return null
}

export function createChatSession(config: ChatSessionConfig) {
  pruneExpiredSessions()

  const id = randomUUID()

  sessions.set(id, {
    expiresAt: Date.now() + SESSION_TTL_MS,
    config,
  })

  return id
}

export function getChatSession(id: unknown) {
  if (typeof id !== "string" || !id.trim()) {
    return null
  }

  const session = sessions.get(id)

  if (!session) {
    return null
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(id)
    return null
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS

  return session.config
}

export function createModel(provider: ProviderId, modelId: string) {
  const apiKey = getProviderApiKey(provider)

  if (!apiKey) {
    throw new Error(
      `Missing server API key. Set one of: ${API_KEY_ENV_KEYS[provider].join(", ")}.`
    )
  }

  const factories: Record<ProviderId, () => LanguageModel> = {
    openai: () => createOpenAI({ apiKey })(modelId),
    anthropic: () => createAnthropic({ apiKey })(modelId),
    google: () => createGoogleGenerativeAI({ apiKey })(modelId),
  }

  return factories[provider]()
}

export function normalizeProviderOptions(
  provider: ProviderId,
  providerOptions: Record<string, unknown> | undefined
): ProviderMetadata | undefined {
  if (!providerOptions || Object.keys(providerOptions).length === 0) {
    return undefined
  }

  const key = PROVIDER_OPTION_KEYS[provider]

  if (providerOptions[key] != null) {
    return providerOptions as ProviderMetadata
  }

  return {
    [key]: providerOptions,
  } as ProviderMetadata
}

function getProviderApiKey(provider: ProviderId) {
  for (const envKey of API_KEY_ENV_KEYS[provider]) {
    const value = process.env[envKey]?.trim()

    if (value) {
      return value
    }
  }

  return null
}

function pruneExpiredSessions() {
  const now = Date.now()

  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(id)
    }
  }
}
