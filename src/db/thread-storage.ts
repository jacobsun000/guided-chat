import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { threads, workspaceSettings } from "@/db/schema"
import {
  DEFAULT_PROVIDER_OPTIONS,
  createDefaultSettings,
  createDefaultStore,
  type ChatSettings,
  type ChatThread,
  type ThreadsStore,
} from "@/lib/chat-store"

const ACTIVE_THREAD_ID_KEY = "activeThreadId"

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeSettings(settings: Partial<ChatSettings>): ChatSettings {
  return {
    ...createDefaultSettings(),
    ...settings,
    providerOptions: {
      ...DEFAULT_PROVIDER_OPTIONS,
      ...settings.providerOptions,
    },
  }
}

function normalizeThread(thread: ChatThread): ChatThread {
  return {
    ...thread,
    title: thread.title || "New chat",
    messages: Array.isArray(thread.messages) ? thread.messages : [],
    settings: normalizeSettings(thread.settings ?? {}),
  }
}

export function getThreadsStore(): ThreadsStore {
  const storedThreads = db
    .select()
    .from(threads)
    .orderBy(desc(threads.updatedAt))
    .all()
    .map((thread): ChatThread => {
      return normalizeThread({
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: parseJson(thread.messagesJson, []),
        settings: parseJson(thread.settingsJson, createDefaultSettings()),
      })
    })

  if (!storedThreads.length) {
    return createDefaultStore()
  }

  const activeThreadId = db
    .select({ value: workspaceSettings.value })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.key, ACTIVE_THREAD_ID_KEY))
    .get()?.value

  const resolvedActiveThreadId =
    activeThreadId &&
    storedThreads.some((thread) => thread.id === activeThreadId)
      ? activeThreadId
      : storedThreads[0].id

  return {
    version: 1,
    activeThreadId: resolvedActiveThreadId,
    threads: storedThreads,
  }
}

export function saveThreadsStore(store: ThreadsStore): ThreadsStore {
  const normalizedThreads = store.threads.map(normalizeThread)

  if (!normalizedThreads.length) {
    return createDefaultStore()
  }

  const activeThreadId = normalizedThreads.some(
    (thread) => thread.id === store.activeThreadId
  )
    ? store.activeThreadId
    : normalizedThreads[0].id

  const normalizedStore: ThreadsStore = {
    version: 1,
    activeThreadId,
    threads: normalizedThreads,
  }

  db.transaction((tx) => {
    tx.delete(threads).run()

    tx.insert(threads)
      .values(
        normalizedThreads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          messagesJson: JSON.stringify(thread.messages),
          settingsJson: JSON.stringify(thread.settings),
        }))
      )
      .run()

    tx.insert(workspaceSettings)
      .values({
        key: ACTIVE_THREAD_ID_KEY,
        value: activeThreadId,
      })
      .onConflictDoUpdate({
        target: workspaceSettings.key,
        set: { value: activeThreadId },
      })
      .run()
  })

  return normalizedStore
}
