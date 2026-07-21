import { getThreadsStore, saveThreadsStore } from "@/db/thread-storage"
import { jsonError } from "@/features/chat/api-errors"
import { threadsStoreSchema } from "@/features/chat/store-schemas"
import type { ThreadsStore } from "@/lib/chat-store"

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

  const parsed = threadsStoreSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("INVALID_REQUEST", "Request body must be a threads store.")
  }

  return Response.json(saveThreadsStore(parsed.data as ThreadsStore))
}
