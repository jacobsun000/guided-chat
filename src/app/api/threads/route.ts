import { getThreadsStore, saveThreadsStore } from "@/db/thread-storage"
import { jsonError } from "@/features/chat/api-errors"
import { threadsStoreSchema } from "@/features/chat/store-schemas"
import type { ThreadsStore } from "@/lib/chat-store"
import { verifyAccessToken } from "@/agent/auth"
import { getSandboxManager } from "@/agent/sandbox/docker"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json(getThreadsStore())
}

export async function PUT(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.")
  }

  const parsed = z.object({ accessToken: z.string(), store: threadsStoreSchema }).safeParse(body)
  if (!parsed.success) {
    return jsonError("INVALID_REQUEST", "Request body must contain an access token and threads store.")
  }
  const verification = verifyAccessToken(parsed.data.accessToken)
  if (verification === "not-configured") return jsonError("SERVER_MISCONFIGURED", "Server access token is not configured.", 500)
  if (verification === "invalid") return jsonError("UNAUTHORIZED", "Invalid access token.", 401)
  const saved = saveThreadsStore(parsed.data.store as ThreadsStore)
  try {
    await getSandboxManager().reconcile(saved.threads.map((thread) => thread.id))
  } catch (error) {
    console.error("Sandbox reconciliation failed after saving thread store.", error)
    return jsonError("INTERNAL_ERROR", "Chat history was saved, but sandbox cleanup failed.", 500)
  }
  return Response.json(saved)
}
