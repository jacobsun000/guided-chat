import { z } from "zod"
import { scaffoldingService } from "@/agent/scaffolding-service"
import { verifyAccessToken } from "@/agent/auth"
import { jsonError } from "@/features/chat/api-errors"
import { agentModelConfigSchema } from "@/features/chat/schemas"
import { trajectoryStepSchema } from "@/lib/scaffolding"

export const maxDuration = 1800
export const runtime = "nodejs"

const requestSchema = z.object({
  accessToken: z.string(),
  threadId: z.string().min(1).max(512),
  agentConfig: agentModelConfigSchema,
  trajectory: z.array(trajectoryStepSchema).min(1),
  trajectorySummary: z.string().min(1).max(4000),
  nodeName: z.string().min(1).max(60),
  stepIds: z.string().min(1).max(500),
  quote: z.string().max(2000).default(""),
  question: z.string().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(8000) })).max(30).optional(),
})

export async function POST(request: Request) {
  let json: unknown
  try { json = await request.json() } catch { return jsonError("INVALID_JSON", "Request body must be valid JSON.") }
  const parsed = requestSchema.safeParse(json)
  if (!parsed.success) return jsonError("INVALID_REQUEST", "Request body is invalid.")
  const verification = verifyAccessToken(parsed.data.accessToken)
  if (verification === "not-configured") return jsonError("SERVER_MISCONFIGURED", "Server access token is not configured.", 500)
  if (verification === "invalid") return jsonError("UNAUTHORIZED", "Invalid access token.", 401)
  try {
    return Response.json(await scaffoldingService.createFollowup({ ...parsed.data, abortSignal: request.signal }))
  } catch (error) {
    console.error("Completion review follow-up failed", error)
    return jsonError("INTERNAL_ERROR", "Unable to answer the review follow-up.", 500)
  }
}
