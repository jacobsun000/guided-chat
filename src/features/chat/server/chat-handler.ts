import "server-only"

import { z } from "zod"
import { verifyAccessToken } from "@/agent/auth"
import type { ResearchAgentService } from "@/agent/service"
import { jsonError } from "../api-errors"
import { agentModelConfigSchema } from "../schemas"

const chatRequestSchema = z.object({
  accessToken: z.string(),
  agentConfig: agentModelConfigSchema,
  messages: z.array(z.unknown()),
})

export function createChatPost(service: ResearchAgentService) {
  return async function POST(request: Request) {
    let json: unknown
    try { json = await request.json() } catch {
      return jsonError("INVALID_JSON", "Request body must be valid JSON.")
    }
    const parsed = chatRequestSchema.safeParse(json)
    if (!parsed.success) return jsonError("INVALID_REQUEST", "Request body is invalid.")
    const verification = verifyAccessToken(parsed.data.accessToken)
    if (verification === "not-configured") return jsonError("SERVER_MISCONFIGURED", "Server access token is not configured.", 500)
    if (verification === "invalid") return jsonError("UNAUTHORIZED", "Invalid access token.", 401)
    try {
      return await service.stream({ agentConfig: parsed.data.agentConfig, messages: parsed.data.messages, abortSignal: request.signal })
    } catch {
      return jsonError("INTERNAL_ERROR", "Unable to start chat request.", 500)
    }
  }
}
