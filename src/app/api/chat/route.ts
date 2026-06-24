import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"

import {
  createModel,
  getChatSession,
  jsonError,
  verifyAccessToken,
} from "@/app/api/chat/session-store"
import { createAgentTools } from "@/app/api/chat/tools"

type ChatRequestBody = {
  accessToken?: string
  sessionId?: string
  messages?: UIMessage[]
}

const SYSTEM_PROMPT = `You are a helpful assistant. Answer clearly, accurately, and concisely. You can use tools when they are useful. Use web_search for current or source-backed web information when available. Use read_image to view an image URL whenever the user asks about an image or visual details, or when inspecting the image would materially improve the answer.

When a visual would make the answer materially clearer, include a standalone fenced \`\`\`html block in addition to normal markdown. HTML blocks are rendered as sandboxed 960x540 previews and work well for diagrams, dashboards, comparisons, timelines, visual summaries, calculators, and lightweight interactive views.

HTML block contract:
- Make each block self-contained and embed any data it needs directly in the block.
- Target a 960x540 viewport.
- Use static Tailwind class or className strings so styles can be compiled.
- Do not fetch external data or assets.
- For JSX, put code in <script type="text/html-block-jsx">. React, ReactDOM, Lucide, Recharts, and onHtmlBlockReady are available globally.
- Use icons as Lucide.IconName and charts from Recharts.
- Combine the visual with concise markdown before or after the block when explanation is useful.`

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
      tools: createAgentTools(),
      stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start chat request."

    return jsonError(message, 500)
  }
}
