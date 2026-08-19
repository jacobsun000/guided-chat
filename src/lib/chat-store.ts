import type { UIMessage } from "ai"
import type { ScaffoldState } from "./scaffolding"

export type ProviderId = "openai" | "codex" | "anthropic" | "google"
export type AgentMode = "baseline" | "scaffolding"

export type ProviderOptionsJson = Record<ProviderId, string>

export type ChatSettings = {
  mode: AgentMode
  provider: ProviderId
  model: string
  thinkingEffort: string
  providerOptions: ProviderOptionsJson
}

export type ChatThread = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: UIMessage[]
  settings: ChatSettings
  scaffolding?: ScaffoldState
}

export type ThreadsStore = {
  version: 1
  activeThreadId: string
  threads: ChatThread[]
}

export const DEFAULT_PROVIDER_OPTIONS: ProviderOptionsJson = {
  openai: "{}",
  codex: "{}",
  anthropic: "{}",
  google: "{}",
}

export function createDefaultSettings(): ChatSettings {
  return {
    mode: "baseline",
    provider: "codex",
    model: "gpt-5.6-sol",
    thinkingEffort: "xhigh",
    providerOptions: { ...DEFAULT_PROVIDER_OPTIONS },
  }
}

export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createThread({
  id = createId(),
  timestamp = new Date().toISOString(),
}: {
  id?: string
  timestamp?: string
} = {}): ChatThread {
  const now = timestamp

  return {
    id,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
    settings: createDefaultSettings(),
  }
}

export function createDefaultStore(): ThreadsStore {
  const thread = createThread()

  return {
    version: 1,
    activeThreadId: thread.id,
    threads: [thread],
  }
}
