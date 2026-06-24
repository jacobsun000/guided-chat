import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  streamText,
  type LanguageModel,
  type ProviderMetadata,
  type UIMessage,
} from "ai"

type ProviderId = "openai" | "anthropic" | "google"

type ChatRequestBody = {
  messages?: UIMessage[]
  provider?: ProviderId
  model?: string
  apiKey?: string
  temperature?: number
  maxOutputTokens?: number
  providerOptions?: Record<string, unknown>
}

const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly, accurately, and concisely."

const PROVIDER_OPTION_KEYS: Record<ProviderId, string> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
}

export const maxDuration = 60

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

function isProviderId(value: unknown): value is ProviderId {
  return value === "openai" || value === "anthropic" || value === "google"
}

function createModel(provider: ProviderId, modelId: string, apiKey: string) {
  const factories: Record<ProviderId, () => LanguageModel> = {
    openai: () => createOpenAI({ apiKey })(modelId),
    anthropic: () => createAnthropic({ apiKey })(modelId),
    google: () => createGoogleGenerativeAI({ apiKey })(modelId),
  }

  return factories[provider]()
}

function normalizeProviderOptions(
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

export async function POST(request: Request) {
  let body: ChatRequestBody

  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return jsonError("Request body must be valid JSON.")
  }

  if (!Array.isArray(body.messages)) {
    return jsonError("Request body must include messages.")
  }

  if (!isProviderId(body.provider)) {
    return jsonError("Unsupported provider.")
  }

  const apiKey = body.apiKey?.trim()
  const modelId = body.model?.trim()

  if (!apiKey) {
    return jsonError("Missing API key.")
  }

  if (!modelId) {
    return jsonError("Missing model id.")
  }

  const temperature =
    typeof body.temperature === "number" && Number.isFinite(body.temperature)
      ? body.temperature
      : undefined
  const maxOutputTokens =
    typeof body.maxOutputTokens === "number" &&
    Number.isFinite(body.maxOutputTokens)
      ? Math.max(1, Math.floor(body.maxOutputTokens))
      : undefined

  try {
    const result = streamText({
      model: createModel(body.provider, modelId, apiKey),
      messages: await convertToModelMessages(body.messages),
      system: SYSTEM_PROMPT,
      temperature,
      maxOutputTokens,
      providerOptions: normalizeProviderOptions(
        body.provider,
        body.providerOptions
      ),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start chat request."

    return jsonError(message, 500)
  }
}
