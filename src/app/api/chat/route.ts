import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

import {
  createModel,
  getChatSession,
  jsonError,
  verifyAccessToken,
} from "@/app/api/chat/session-store"

type ChatRequestBody = {
  accessToken?: string
  sessionId?: string
  messages?: UIMessage[]
}

const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly, accurately, and concisely."

export const maxDuration = 60
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  const tokenError = verifyAccessToken(body.accessToken)

  if (tokenError) {
    return jsonError(tokenError, tokenError.includes("configured") ? 500 : 401)
  }

  const session = getChatSession(body.sessionId)

  if (!session) {
    return jsonError("Chat session is missing or expired.", 401)
  }

  try {
    const result = streamText({
      model: createModel(session.provider, session.model),
      messages: await convertToModelMessages(body.messages),
      system: SYSTEM_PROMPT,
      temperature: session.temperature,
      maxOutputTokens: session.maxOutputTokens,
      providerOptions: session.providerOptions,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start chat request."

    return jsonError(message, 500)
  }
}
