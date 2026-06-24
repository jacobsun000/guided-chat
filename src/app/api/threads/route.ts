import { getThreadsStore, saveThreadsStore } from "@/db/thread-storage"
import type { ThreadsStore } from "@/lib/chat-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

function isThreadsStore(value: unknown): value is ThreadsStore {
  if (!value || typeof value !== "object") {
    return false
  }

  const store = value as Partial<ThreadsStore>

  return (
    store.version === 1 &&
    typeof store.activeThreadId === "string" &&
    Array.isArray(store.threads) &&
    store.threads.every((thread) => {
      if (!thread || typeof thread !== "object") {
        return false
      }

      const candidate = thread as Partial<ThreadsStore["threads"][number]>

      return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.updatedAt === "string" &&
        Array.isArray(candidate.messages) &&
        Boolean(candidate.settings) &&
        typeof candidate.settings === "object"
      )
    })
  )
}

export async function GET() {
  return Response.json(getThreadsStore())
}

export async function PUT(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonError("Request body must be valid JSON.")
  }

  if (!isThreadsStore(body)) {
    return jsonError("Request body must be a threads store.")
  }

  return Response.json(saveThreadsStore(body))
}
