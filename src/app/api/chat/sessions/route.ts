import {
  createChatSession,
  isProviderId,
  jsonError,
  normalizeProviderOptions,
  verifyAccessToken,
} from "@/app/api/chat/session-store"

type ChatSessionRequestBody = {
  accessToken?: string
  provider?: unknown
  model?: unknown
  temperature?: unknown
  maxOutputTokens?: unknown
  providerOptions?: Record<string, unknown>
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: ChatSessionRequestBody

  try {
    body = (await request.json()) as ChatSessionRequestBody
  } catch {
    return jsonError("Request body must be valid JSON.")
  }

  const tokenError = verifyAccessToken(body.accessToken)

  if (tokenError) {
    return jsonError(tokenError, tokenError.includes("configured") ? 500 : 401)
  }

  if (!isProviderId(body.provider)) {
    return jsonError("Unsupported provider.")
  }

  const modelId = typeof body.model === "string" ? body.model.trim() : ""

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

  const sessionId = createChatSession({
    provider: body.provider,
    model: modelId,
    temperature,
    maxOutputTokens,
    providerOptions: normalizeProviderOptions(body.provider, body.providerOptions),
  })

  return Response.json({ sessionId })
}
