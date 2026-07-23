"use client"

import * as React from "react"
import type { UIMessage } from "ai"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { useChat } from "@ai-sdk/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircleIcon,
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  KeyRoundIcon,
  Loader2Icon,
  RefreshCwIcon,
  RouteIcon,
  SendIcon,
  XIcon,
  TerminalIcon,
  FilePenLineIcon,
  BrainIcon,
  InfoIcon,
  WrenchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { HtmlOutputBlock } from "@/components/html-output-block"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { useTheme, type Theme } from "@/components/theme-provider"
import { ResearchMetroMap } from "@/components/research-metro-map"
import {
  DEFAULT_PROVIDER_OPTIONS,
  createDefaultSettings,
  createDefaultStore,
  createThread,
  type ChatSettings,
  type ChatThread,
  type ProviderId,
  type ThreadsStore,
} from "@/lib/chat-store"
import type {
  AskUserQuestionsInput,
  AskUserQuestionsOutput,
  ResearchAssistantMessage,
} from "@/lib/question-tool"
import {
  researchPlanSchema,
  type ResearchPlanStep,
  type UpdateResearchPlanResult,
} from "@/lib/research-plan"
import { cn } from "@/lib/utils"
import {
  researchMessageMetadataSchema,
  type ResearchMessageMetadata,
} from "@/agent/messages"

const ACCESS_TOKEN_STORAGE_KEY = "guided-chat.access-token.v1"
const THREADS_STORAGE_KEY = "guided-chat.threads.v1"

const PROVIDERS: Record<
  ProviderId,
  {
    label: string
    defaultModel: string
    defaultThinkingEffort: string
    models: { label: string; value: string; description: string }[]
    thinkingEffortOptions: { label: string; value: string; description: string }[]
  }
> = {
  codex: {
    label: "Codex OAuth",
    defaultModel: "gpt-5.6-sol",
    defaultThinkingEffort: "xhigh",
    models: [
      { label: "GPT-5.6 Sol", value: "gpt-5.6-sol", description: "Deep research" },
      { label: "GPT-5.6 Terra", value: "gpt-5.6-terra", description: "Coding model" },
      { label: "GPT-5.6 Luna", value: "gpt-5.6-luna", description: "Fast coding model" },
      { label: "GPT-5.5", value: "gpt-5.5", description: "Flagship" },
      { label: "GPT-5.4", value: "gpt-5.4", description: "Previous generation" },
    ],
    thinkingEffortOptions: [
      { label: "Default", value: "default", description: "Provider default" },
      { label: "Low", value: "low", description: "Light reasoning" },
      { label: "Medium", value: "medium", description: "Balanced reasoning" },
      { label: "High", value: "high", description: "Deep reasoning" },
      { label: "X High", value: "xhigh", description: "Maximum reasoning" },
    ],
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5.6-sol",
    defaultThinkingEffort: "xhigh",
    models: [
      {
        label: "GPT-5.6 Sol",
        value: "gpt-5.6-sol",
        description: "Deep research",
      },
      {
        label: "GPT-5.5",
        value: "gpt-5.5",
        description: "Flagship",
      },
      {
        label: "GPT-5.4 mini",
        value: "gpt-5.4-mini",
        description: "Faster",
      },
      {
        label: "GPT-5.4 nano",
        value: "gpt-5.4-nano",
        description: "Lowest cost",
      },
    ],
    thinkingEffortOptions: [
      { label: "Default", value: "default", description: "Provider default" },
      { label: "None", value: "none", description: "Disable reasoning" },
      { label: "Minimal", value: "minimal", description: "Smallest reasoning" },
      { label: "Low", value: "low", description: "Light reasoning" },
      { label: "Medium", value: "medium", description: "Balanced reasoning" },
      { label: "High", value: "high", description: "Deeper reasoning" },
      { label: "X High", value: "xhigh", description: "Maximum OpenAI effort" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-6",
    defaultThinkingEffort: "default",
    models: [
      {
        label: "Claude Haiku 4.5",
        value: "claude-haiku-4-5",
        description: "Fastest",
      },
      {
        label: "Claude Sonnet 4.6",
        value: "claude-sonnet-4-6",
        description: "Balanced",
      },
      {
        label: "Claude Opus 4.8",
        value: "claude-opus-4-8",
        description: "Most capable",
      },
    ],
    thinkingEffortOptions: [
      { label: "Default", value: "default", description: "Provider default" },
      { label: "Low", value: "low", description: "Light thinking" },
      { label: "Medium", value: "medium", description: "Balanced thinking" },
      { label: "High", value: "high", description: "Deeper thinking" },
      { label: "X High", value: "xhigh", description: "Very deep thinking" },
      { label: "Max", value: "max", description: "Maximum Anthropic effort" },
    ],
  },
  google: {
    label: "Google",
    defaultModel: "gemini-3.5-flash",
    defaultThinkingEffort: "default",
    models: [
      {
        label: "Gemini 3.1 Flash-Lite",
        value: "gemini-3.1-flash-lite",
        description: "Fastest",
      },
      {
        label: "Gemini 3.5 Flash",
        value: "gemini-3.5-flash",
        description: "Stable",
      },
      {
        label: "Gemini 3.1 Pro",
        value: "gemini-3.1-pro",
        description: "Advanced",
      },
    ],
    thinkingEffortOptions: [
      { label: "Default", value: "default", description: "Provider default" },
      { label: "Minimal", value: "minimal", description: "Smallest thinking" },
      { label: "Low", value: "low", description: "Light thinking" },
      { label: "Medium", value: "medium", description: "Balanced thinking" },
      { label: "High", value: "high", description: "Deeper thinking" },
    ],
  },
}

const THEMES: { label: string; value: Theme }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
]

const HYDRATION_THREAD_TIMESTAMP = "1970-01-01T00:00:00.000Z"
const HYDRATION_THREAD_ID = "hydration-thread"
const OTHER_ANSWER_VALUE = "__other__"

type AskUserQuestionsPart = Extract<
  ResearchAssistantMessage["parts"][number],
  { type: "tool-ask_user_questions" }
>

type UpdatePlanPart = Extract<
  ResearchAssistantMessage["parts"][number],
  { type: "tool-update_plan" }
>
type SandboxToolPart = Extract<
  ResearchAssistantMessage["parts"][number],
  { type: "tool-exec" | "tool-apply_patch" }
>

function createHydrationStore(): ThreadsStore {
  const thread = createThread({
    id: HYDRATION_THREAD_ID,
    timestamp: HYDRATION_THREAD_TIMESTAMP,
  })

  return {
    version: 1,
    activeThreadId: thread.id,
    threads: [thread],
  }
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function getPendingQuestionPart(messages: ResearchAssistantMessage[]) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex]

    if (message.role !== "assistant") {
      continue
    }

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex]

      if (
        part.type === "tool-ask_user_questions" &&
        part.state === "input-available"
      ) {
        return part
      }
    }
  }

  return null
}

function getLatestResearchPlan(messages: ResearchAssistantMessage[]) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex]

    if (message.role !== "assistant") continue

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex]
      if (part.type !== "tool-update_plan" || !("input" in part)) continue

      const parsed = researchPlanSchema.safeParse(part.input)
      if (parsed.success) return parsed.data
    }
  }

  return null
}

function getResearchStepProgress(messages: ResearchAssistantMessage[]) {
  const visitedStepNames = new Set<string>()
  let currentStepName: string | undefined

  for (const message of messages) {
    if (message.role !== "user") continue

    const parsed = researchMessageMetadataSchema.safeParse(message.metadata)
    const action = parsed.success ? parsed.data?.action : undefined
    if (!action) continue

    visitedStepNames.add(action.stepName)
    currentStepName = action.stepName
  }

  return { currentStepName, visitedStepNames }
}

export function getThreadUsage(messages: ResearchAssistantMessage[]) {
  const totals = {
    contextTokens: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    responses: 0,
  }

  for (const message of messages) {
    if (message.role !== "assistant") continue
    const parsed = researchMessageMetadataSchema.safeParse(message.metadata)
    const usage = parsed.success ? parsed.data?.usage : undefined
    if (!usage) continue
    totals.contextTokens = usage.inputTokens
    totals.inputTokens += Math.max(0, usage.inputTokens - usage.cacheReadTokens)
    totals.cacheReadTokens += usage.cacheReadTokens
    totals.cacheWriteTokens += usage.cacheWriteTokens
    totals.outputTokens += usage.outputTokens
    totals.totalTokens += usage.totalTokens
    totals.responses += 1
  }

  return totals
}

function formatTokenCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function isResearchPlanUpdating(messages: ResearchAssistantMessage[]) {
  const message = messages.at(-1)
  if (!message || message.role !== "assistant") return false

  return message.parts.some(
    (part) =>
      part.type === "tool-update_plan" &&
      part.state !== "output-available" &&
      part.state !== "output-error"
  )
}

function shouldSendAutomaticallyAfterToolCalls({
  messages,
}: {
  messages: ResearchAssistantMessage[]
}) {
  if (!lastAssistantMessageIsCompleteWithToolCalls({ messages })) {
    return false
  }

  const message = messages[messages.length - 1]

  if (!message || message.role !== "assistant") {
    return false
  }

  const lastStepStartIndex = message.parts.reduce((lastIndex, part, index) => {
    return part.type === "step-start" ? index : lastIndex
  }, -1)
  const lastStepParts = message.parts.slice(lastStepStartIndex + 1)

  return !lastStepParts.some((part) => part.type === "tool-update_plan")
}

function isVisibleAssistantPart(part: ResearchAssistantMessage["parts"][number]) {
  return (
    part.type === "text" ||
    (part.type === "tool-ask_user_questions" &&
      (part.state === "input-available" ||
        part.state === "output-available" ||
        part.state === "output-error")) ||
    (part.type === "tool-update_plan" &&
      (part.state === "output-available" || part.state === "output-error"))
  )
}

function isAssistantActivityPart(
  part: ResearchAssistantMessage["parts"][number]
) {
  return part.type === "reasoning" || part.type.startsWith("tool-")
}

function titleFromText(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim()

  if (!trimmed) {
    return "New chat"
  }

  return trimmed.length > 48 ? `${trimmed.slice(0, 45)}...` : trimmed
}

function parseProviderOptions(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return {}
  }

  const parsed = JSON.parse(trimmed) as unknown

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Provider options must be a JSON object.")
  }

  return parsed as Record<string, unknown>
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "-9999px"
  document.body.append(textarea)
  textarea.select()

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command was rejected.")
    }
  } finally {
    textarea.remove()
  }
}

function normalizeStoredThread(thread: ChatThread): ChatThread {
  const storedSettings = (thread.settings ?? {}) as Partial<ChatSettings>
  const defaultSettings = createDefaultSettings()
  const settings = {
    provider: storedSettings.provider ?? defaultSettings.provider,
    model: storedSettings.model ?? defaultSettings.model,
    thinkingEffort:
      storedSettings.thinkingEffort ?? defaultSettings.thinkingEffort,
    providerOptions: {
      ...DEFAULT_PROVIDER_OPTIONS,
      ...storedSettings.providerOptions,
    },
  }

  return {
    ...thread,
    settings,
    messages: Array.isArray(thread.messages) ? thread.messages : [],
  }
}

function normalizeThreadsStore(store: ThreadsStore): ThreadsStore {
  const fallback = createDefaultStore()

  const threads = Array.isArray(store.threads)
    ? store.threads.map(normalizeStoredThread)
    : []

  if (!threads.length) {
    return fallback
  }

  const activeThreadId = threads.some(
    (thread) => thread.id === store.activeThreadId
  )
    ? store.activeThreadId
    : threads[0].id

  return {
    version: 1,
    activeThreadId,
    threads,
  }
}

function selectRequestedThread(store: ThreadsStore, threadId: string | null) {
  if (!threadId || !store.threads.some((thread) => thread.id === threadId)) {
    return store
  }

  return {
    ...store,
    activeThreadId: threadId,
  }
}

async function loadRemoteThreadsStore(): Promise<ThreadsStore> {
  const response = await fetch("/api/threads", { cache: "no-store" })

  if (!response.ok) {
    throw new Error("Unable to load chat history.")
  }

  return normalizeThreadsStore((await response.json()) as ThreadsStore)
}

function loadLocalThreadsStore(): ThreadsStore {
  const fallback = createDefaultStore()
  const raw = localStorage.getItem(THREADS_STORAGE_KEY)

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as ThreadsStore
    return normalizeThreadsStore(parsed)
  } catch {
    return fallback
  }
}

function loadAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? ""
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const initialStore = React.useMemo(() => createHydrationStore(), [])
  const [store, setStore] = React.useState<ThreadsStore>(initialStore)
  const [accessToken, setAccessToken] = React.useState("")
  const [input, setInput] = React.useState("")
  const composerTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [renameThreadId, setRenameThreadId] = React.useState<string | null>(
    null
  )
  const [renameValue, setRenameValue] = React.useState("")
  const [composerError, setComposerError] = React.useState<string | null>(null)
  const [providerOptionsError, setProviderOptionsError] = React.useState<
    string | null
  >(null)

  const activeThread = React.useMemo(
    () =>
      store.threads.find((thread) => thread.id === store.activeThreadId) ??
      store.threads[0],
    [store.activeThreadId, store.threads]
  )
  const activeThreadId = activeThread?.id

  const transport = React.useMemo(
    () => new DefaultChatTransport<ResearchAssistantMessage>({ api: "/api/chat" }),
    []
  )

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    addToolOutput,
    status,
    error,
    clearError,
  } = useChat<ResearchAssistantMessage>({
    id: activeThread?.id,
    messages: (activeThread?.messages ?? []) as ResearchAssistantMessage[],
    transport,
    sendAutomaticallyWhen: shouldSendAutomaticallyAfterToolCalls,
    onError: (err) => {
      setComposerError(err.message)
    },
    onFinish: ({ messages: finishedMessages }) => {
      if (!activeThreadId) {
        return
      }

      setStore((current) => ({
        ...current,
        threads: current.threads.map((thread) => {
          if (thread.id !== activeThreadId) {
            return thread
          }

          const firstUserMessage = finishedMessages.find(
            (message) => message.role === "user"
          )
          const shouldAutotitle =
            thread.title === "New chat" && firstUserMessage != null

          return {
            ...thread,
            title: shouldAutotitle
              ? titleFromText(getMessageText(firstUserMessage))
              : thread.title,
            updatedAt: new Date().toISOString(),
            messages: finishedMessages,
          }
        }),
      }))
    },
  })

  const isStreaming = status === "submitted" || status === "streaming"
  const pendingQuestionPart = React.useMemo(
    () => (isStreaming ? null : getPendingQuestionPart(messages)),
    [isStreaming, messages]
  )
  const hasPendingQuestion = pendingQuestionPart != null
  const selectedProvider = activeThread?.settings.provider ?? "openai"
  const selectedProviderMeta = PROVIDERS[selectedProvider]
  const hasAccessToken = Boolean(accessToken.trim())
  const selectedModelMeta = selectedProviderMeta.models.find(
    (model) => model.value === activeThread?.settings.model
  )
  const researchPlan = React.useMemo(
    () => getLatestResearchPlan(messages),
    [messages]
  )
  const researchStepProgress = React.useMemo(
    () => getResearchStepProgress(messages),
    [messages]
  )
  const researchPlanUpdating = React.useMemo(
    () => isResearchPlanUpdating(messages),
    [messages]
  )
  const threadUsage = React.useMemo(() => getThreadUsage(messages), [messages])

  React.useLayoutEffect(() => {
    const textarea = composerTextareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`
    textarea.style.overflowY = textarea.scrollHeight > 192 ? "auto" : "hidden"
  }, [input])

  React.useEffect(() => {
    let cancelled = false

    async function loadInitialState() {
      const requestedThreadId = new URLSearchParams(window.location.search).get(
        "thread"
      )
      setAccessToken(loadAccessToken())

      try {
        const nextStore = await loadRemoteThreadsStore()

        if (!cancelled) {
          setStore(selectRequestedThread(nextStore, requestedThreadId))
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setStore(
            selectRequestedThread(
              loadLocalThreadsStore(),
              requestedThreadId
            )
          )
          toast.error("Using browser chat history because the database is unavailable.")
        }
      } finally {
        if (!cancelled) {
          setLoaded(true)
        }
      }
    }

    void loadInitialState()

    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!loaded) {
      return
    }

    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
  }, [accessToken, loaded])

  React.useEffect(() => {
    if (!loaded) {
      return
    }

    // Keep the browser recovery snapshot as current as the remote copy.
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(store))

    const timeoutId = window.setTimeout(() => {
      void fetch("/api/threads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: accessToken.trim(), store }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Unable to save chat history to the database.")
          }
        })
        .catch((err) => {
          console.error(err)
          toast.error("Unable to save chat history to the database.")
        })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [accessToken, loaded, store])

  React.useEffect(() => {
    const thread = store.threads.find(
      (storedThread) => storedThread.id === activeThreadId
    )

    if (!thread) {
      return
    }

    clearError()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComposerError(null)
    setProviderOptionsError(null)
    setMessages(thread.messages as ResearchAssistantMessage[])
    // This effect intentionally keys off the id only. Store changes for settings
    // or persistence must not reset the live chat message state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, clearError, setMessages])

  const createChatRequest = React.useCallback(() => {
    const settings = activeThread.settings
    return {
      accessToken: accessToken.trim(),
      threadId: activeThread.id,
      agentConfig: {
        provider: settings.provider,
        model: settings.model,
        thinkingEffort: settings.thinkingEffort,
        providerOptions: parseProviderOptions(settings.providerOptions[settings.provider]),
      },
    }
  }, [accessToken, activeThread])

  const updateActiveThread = React.useCallback(
    (updater: (thread: ChatThread) => ChatThread) => {
      setStore((current) => ({
        ...current,
        threads: current.threads.map((thread) =>
          thread.id === current.activeThreadId ? updater(thread) : thread
        ),
      }))
    },
    []
  )

  const updateActiveSettings = React.useCallback(
    (patch: Partial<ChatSettings>) => {
      updateActiveThread((thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        settings: {
          ...thread.settings,
          ...patch,
        },
      }))
    },
    [updateActiveThread]
  )

  const updateProviderOptionText = React.useCallback(
    (provider: ProviderId, value: string) => {
      updateActiveThread((thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        settings: {
          ...thread.settings,
          providerOptions: {
            ...thread.settings.providerOptions,
            [provider]: value,
          },
        },
      }))
    },
    [updateActiveThread]
  )

  const updateActiveProvider = React.useCallback(
    (provider: ProviderId) => {
      updateActiveThread((thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        settings: {
          ...thread.settings,
          provider,
          model: PROVIDERS[provider].defaultModel,
          thinkingEffort: PROVIDERS[provider].defaultThinkingEffort,
        },
      }))
    },
    [updateActiveThread]
  )

  const createNewThread = React.useCallback(() => {
    const thread = createThread()

    setStore((current) => ({
      version: 1,
      activeThreadId: thread.id,
      threads: [thread, ...current.threads],
    }))
    setInput("")
  }, [])

  const switchThread = React.useCallback(
    (id: string) => {
      if (isStreaming) {
        stop()
      }

      setStore((current) => ({
        ...current,
        activeThreadId: id,
      }))
      setInput("")
    },
    [isStreaming, stop]
  )

  const deleteThread = React.useCallback(
    (id: string) => {
      if (!window.confirm("Delete this thread? Files in its sandbox workspace will be permanently deleted.")) return
      if (isStreaming && id === activeThread.id) {
        stop()
      }

      setStore((current) => {
        const remaining = current.threads.filter((thread) => thread.id !== id)

        if (!remaining.length) {
          return createDefaultStore()
        }

        return {
          version: 1,
          activeThreadId:
            current.activeThreadId === id ? remaining[0].id : current.activeThreadId,
          threads: remaining,
        }
      })
    },
    [activeThread.id, isStreaming, stop]
  )

  const openRename = React.useCallback((thread: ChatThread) => {
    setRenameThreadId(thread.id)
    setRenameValue(thread.title)
  }, [])

  const saveRename = React.useCallback(() => {
    const trimmed = renameValue.trim()

    if (!renameThreadId || !trimmed) {
      return
    }

    setStore((current) => ({
      ...current,
      threads: current.threads.map((thread) =>
        thread.id === renameThreadId
          ? { ...thread, title: trimmed, updatedAt: new Date().toISOString() }
          : thread
      ),
    }))
    setRenameThreadId(null)
    setRenameValue("")
  }, [renameThreadId, renameValue])

  const submit = React.useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault()
      clearError()
      setComposerError(null)

      const text = input.trim()

      if (!text || isStreaming || hasPendingQuestion) {
        return
      }

      if (!hasAccessToken) {
        setComposerError("Enter the workspace access token before sending.")
        setSettingsOpen(true)
        return
      }

      try {
        const requestBody = createChatRequest()
        setInput("")
        await sendMessage(
          { text },
          {
            body: requestBody,
          }
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to send the message."
        setComposerError(message)
        if (message.includes("Provider options")) {
          setProviderOptionsError(message)
          setSettingsOpen(true)
        }
        return
      }
    },
    [
      clearError,
      createChatRequest,
      hasAccessToken,
      input,
      isStreaming,
      hasPendingQuestion,
      sendMessage,
    ]
  )

  const regenerateLast = React.useCallback(async () => {
    clearError()
    setComposerError(null)

    if (!hasAccessToken) {
      setComposerError("Enter the workspace access token before regenerating.")
      setSettingsOpen(true)
      return
    }

    try {
      const requestBody = createChatRequest()
      await regenerate({
        body: requestBody,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to regenerate the response."
      setComposerError(message)
      if (message.includes("Provider options")) {
        setProviderOptionsError(message)
        setSettingsOpen(true)
      }
    }
  }, [
    clearError,
    createChatRequest,
    hasAccessToken,
    regenerate,
  ])

  const submitQuestionAnswers = React.useCallback(
    async (toolCallId: string, output: AskUserQuestionsOutput) => {
      clearError()
      setComposerError(null)

      if (!hasAccessToken) {
        setComposerError("Enter the workspace access token before continuing.")
        setSettingsOpen(true)
        return
      }

      try {
        const requestBody = createChatRequest()
        addToolOutput({
          tool: "ask_user_questions",
          toolCallId,
          output,
          options: {
            body: requestBody,
          },
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to submit the answers."
        setComposerError(message)
        if (message.includes("Provider options")) {
          setProviderOptionsError(message)
          setSettingsOpen(true)
        }
      }
    },
    [addToolOutput, clearError, createChatRequest, hasAccessToken]
  )

  const exploreResearchStep = React.useCallback(
    async (step: ResearchPlanStep) => {
      clearError()
      setComposerError(null)

      if (isStreaming || hasPendingQuestion) {
        return
      }

      if (!hasAccessToken) {
        setComposerError("Enter the workspace access token before continuing.")
        setSettingsOpen(true)
        return
      }

      try {
        const requestBody = createChatRequest()
        await sendMessage(
          {
            text: `Explore “${step.name}” next.`,
            metadata: {
              action: {
                type: "explore_research_step",
                stepName: step.name,
              },
            } satisfies ResearchMessageMetadata,
          },
          {
            body: requestBody,
          }
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to explore the step."
        setComposerError(message)
        if (message.includes("Provider options")) {
          setProviderOptionsError(message)
          setSettingsOpen(true)
        }
      }
    },
    [
      clearError,
      createChatRequest,
      hasAccessToken,
      hasPendingQuestion,
      isStreaming,
      sendMessage,
    ]
  )

  const copyMessage = React.useCallback(async (message: UIMessage) => {
    const text = getMessageText(message)

    if (!text) {
      return
    }

    try {
      await copyTextToClipboard(text)
      toast.success("Message copied")
    } catch (err) {
      console.error(err)
      toast.error("Unable to copy message")
    }
  }, [])

  if (!activeThread) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner />
      </main>
    )
  }

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar
        threads={store.threads}
        activeThreadId={activeThread.id}
        loaded={loaded}
        onCreateNewThread={createNewThread}
        onSwitchThread={switchThread}
        onOpenRename={openRename}
        onDeleteThread={deleteThread}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex min-w-0 items-center">
              <h1 className="truncate text-sm font-medium">{activeThread.title}</h1>
            </div>
          </div>
          <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
            <Select
              value={selectedProvider}
              onValueChange={(value) => updateActiveProvider(value as ProviderId)}
            >
              <SelectTrigger className="h-8 w-[128px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(PROVIDERS).map(([id, provider]) => (
                    <SelectItem key={id} value={id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={activeThread.settings.model}
              onValueChange={(model) => updateActiveSettings({ model })}
            >
              <SelectTrigger className="h-8 w-[188px] max-w-[42vw]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {!selectedModelMeta && (
                    <SelectItem value={activeThread.settings.model}>
                      {activeThread.settings.model}
                    </SelectItem>
                  )}
                  {selectedProviderMeta.models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={activeThread.settings.thinkingEffort}
              onValueChange={(thinkingEffort) => updateActiveSettings({ thinkingEffort })}
            >
              <SelectTrigger className="h-8 w-[112px] max-w-[28vw]" aria-label="Reasoning effort">
                <BrainIcon className="size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {selectedProviderMeta.thinkingEffortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Thread info">
                  <InfoIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-3">
                <DropdownMenuLabel className="px-0 pt-0 text-sm font-medium text-foreground">
                  Thread info
                </DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Context used</span>
                  <span className="text-right tabular-nums">{formatTokenCount(threadUsage.contextTokens)}</span>
                  <span className="text-muted-foreground">Input</span>
                  <span className="text-right tabular-nums">{formatTokenCount(threadUsage.inputTokens)}</span>
                  <span className="text-muted-foreground">Cache read</span>
                  <span className="text-right tabular-nums">{formatTokenCount(threadUsage.cacheReadTokens)}</span>
                  <span className="text-muted-foreground">Cache write</span>
                  <span className="text-right tabular-nums">{formatTokenCount(threadUsage.cacheWriteTokens)}</span>
                  <span className="text-muted-foreground">Output</span>
                  <span className="text-right tabular-nums">{formatTokenCount(threadUsage.outputTokens)}</span>
                </div>
                <DropdownMenuSeparator className="my-3" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total usage</span>
                  <span className="font-medium tabular-nums">{formatTokenCount(threadUsage.totalTokens)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Responses tracked</span>
                  <span className="tabular-nums">{threadUsage.responses}</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
                {!messages.length && (
                  <Empty className="min-h-[55svh] border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <BotIcon />
                      </EmptyMedia>
                      <EmptyTitle>Start a conversation</EmptyTitle>
                      <EmptyDescription>
                        Messages are saved to the shared workspace. Provider API
                        keys are configured on the backend.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                        <KeyRoundIcon data-icon="inline-start" />
                        Open settings
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}

                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={
                      isStreaming &&
                      message.role === "assistant" &&
                      message === messages.at(-1)
                    }
                    onSubmitQuestion={submitQuestionAnswers}
                    onCopy={() => copyMessage(message)}
                  />
                ))}

                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2Icon className="animate-spin" />
                    Waiting for the model
                  </div>
                )}
              </div>
            </ScrollArea>

            {!isStreaming && (
              <div className="border-t bg-background px-3 py-3">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                  {(composerError || error || !hasAccessToken) && (
                    <Alert variant={composerError || error ? "destructive" : "default"}>
                      <AlertCircleIcon />
                      <AlertTitle>
                        {composerError || error
                          ? "Chat request blocked"
                          : "Missing access token"}
                      </AlertTitle>
                      <AlertDescription>
                        {composerError ??
                          error?.message ??
                          "Enter the workspace access token in settings before sending."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!pendingQuestionPart && (
                    <form onSubmit={submit}>
                      <InputGroup className="h-auto min-h-11 items-end gap-1 bg-card px-2 py-1.5 shadow-sm">
                        <InputGroupTextarea
                          ref={composerTextareaRef}
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault()
                              event.currentTarget.form?.requestSubmit()
                            }
                          }}
                          placeholder={
                            hasPendingQuestion
                              ? "Answer the questions above..."
                              : "Message..."
                          }
                          rows={1}
                          disabled={isStreaming || hasPendingQuestion}
                          className="max-h-48 min-h-8 py-1.5"
                        />
                        <div className="flex shrink-0 items-center gap-1 pb-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InputGroupButton
                                size="icon-sm"
                                onClick={regenerateLast}
                                disabled={
                                  !messages.length ||
                                  isStreaming ||
                                  hasPendingQuestion
                                }
                              >
                                <RefreshCwIcon />
                                <span className="sr-only">Regenerate</span>
                              </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InputGroupButton
                                type="submit"
                                size="icon-sm"
                                variant="default"
                                disabled={!input.trim() || hasPendingQuestion}
                              >
                                <SendIcon />
                                <span className="sr-only">Send</span>
                              </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>Send</TooltipContent>
                          </Tooltip>
                        </div>
                      </InputGroup>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="order-first h-[min(34svh,300px)] shrink-0 overflow-hidden border-b lg:order-last lg:h-auto lg:w-[380px] lg:border-b-0 lg:border-l xl:w-[420px]">
            <ResearchMetroMap
              plan={researchPlan}
              currentStepName={researchStepProgress.currentStepName}
              visitedStepNames={researchStepProgress.visitedStepNames}
              disabled={isStreaming || hasPendingQuestion}
              isUpdating={researchPlanUpdating}
              onSelectStep={exploreResearchStep}
            />
          </aside>
        </div>
      </SidebarInset>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thread={activeThread}
        accessToken={accessToken}
        theme={theme}
        providerOptionsError={providerOptionsError}
        setProviderOptionsError={setProviderOptionsError}
        onAccessTokenChange={setAccessToken}
        onThemeChange={setTheme}
        onSettingsChange={updateActiveSettings}
        onProviderOptionsChange={updateProviderOptionText}
      />

      <Dialog
        open={renameThreadId != null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameThreadId(null)
            setRenameValue("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>Set a short local title for this chat.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rename-title">Title</FieldLabel>
              <Input
                id="rename-title"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    saveRename()
                  }
                }}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameThreadId(null)}>
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={!renameValue.trim()}>
              <CheckIcon data-icon="inline-start" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

function MessageBubble({
  message,
  isStreaming = false,
  onSubmitQuestion,
  onCopy,
}: {
  message: ResearchAssistantMessage
  isStreaming?: boolean
  onSubmitQuestion: (
    toolCallId: string,
    output: AskUserQuestionsOutput
  ) => void
  onCopy: () => void
}) {
  const isUser = message.role === "user"
  const text = getMessageText(message)
  const visibleAssistantParts = isUser
    ? []
    : message.parts.filter(isVisibleAssistantPart)
  const activityParts = isUser
    ? []
    : message.parts.filter(isAssistantActivityPart)

  return (
    <article
      className={cn(
        "group/message flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "max-w-[min(38rem,82%)] items-end" : "w-full max-w-full"
        )}
      >
        <div
          className={cn(
            "text-sm leading-6",
            isUser
              ? "border bg-primary px-2.5 py-1.5 text-primary-foreground"
              : "text-foreground"
          )}
        >
          {isUser && text ? (
            <MarkdownContent text={text} isUser={isUser} />
          ) : !isUser && visibleAssistantParts.length ? (
            <div className="flex flex-col gap-3">
              {activityParts.length > 0 && (
                <AssistantActivity
                  parts={activityParts}
                  streaming={isStreaming}
                />
              )}
              {visibleAssistantParts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <MarkdownContent
                      key={index}
                      text={part.text}
                      isUser={false}
                      isStreaming={isStreaming}
                    />
                  )
                }

                if (part.type === "tool-update_plan") {
                  return <PlanUpdateCard key={part.toolCallId} part={part} />
                }

                if (
                  part.type === "tool-ask_user_questions" &&
                  part.state === "input-available"
                ) {
                  return (
                    <AskUserQuestionsPanel
                      key={part.toolCallId}
                      part={part}
                      disabled={isStreaming}
                      onSubmit={onSubmitQuestion}
                    />
                  )
                }

                return (
                  <AnsweredQuestionsTranscript key={part.toolCallId} part={part} />
                )
              })}
            </div>
          ) : (
            <AssistantActivity parts={activityParts} streaming={isStreaming} />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-xs" variant="ghost" onClick={onCopy} disabled={!text}>
                <CopyIcon />
                <span className="sr-only">Copy message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </article>
  )
}

type AssistantActivityPart = ResearchAssistantMessage["parts"][number]

export function AssistantActivity({
  parts,
  streaming,
}: {
  parts: AssistantActivityPart[]
  streaming: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const activityParts = parts.filter(isAssistantActivityPart)
  const label = streaming ? "Thinking" : "Activity"

  return (
    <div className="min-w-0 text-xs text-muted-foreground">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="group/activity inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {streaming ? <Spinner /> : <BrainIcon className="size-3.5" />}
        <span className="font-medium">{label}</span>
        {activityParts.length > 0 && (
          <span className="tabular-nums text-muted-foreground/70">
            {activityParts.length}
          </span>
        )}
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-2 flex max-h-[32rem] flex-col gap-2 overflow-y-auto border-l pl-3">
          {activityParts.length > 0 ? (
            activityParts.map((part, index) => (
              <ActivityPart key={getActivityPartKey(part, index)} part={part} />
            ))
          ) : (
            <div className="py-2 italic">Waiting for model activity…</div>
          )}
        </div>
      )}
    </div>
  )
}

function getActivityPartKey(part: AssistantActivityPart, index: number) {
  return "toolCallId" in part ? part.toolCallId : `${part.type}-${index}`
}

function ActivityPart({ part }: { part: AssistantActivityPart }) {
  if (part.type === "reasoning") {
    return (
      <section className="rounded-md border bg-muted/20 px-3 py-2">
        <div className="mb-1.5 flex items-center gap-2 font-medium text-foreground">
          <BrainIcon className="size-3.5 text-primary" />
          Thinking
          {part.state === "streaming" && <Spinner />}
        </div>
        <div className="whitespace-pre-wrap break-words leading-5 text-muted-foreground">
          {part.text || "Thinking…"}
        </div>
      </section>
    )
  }

  if (!part.type.startsWith("tool-")) return null
  if (part.type === "tool-exec" || part.type === "tool-apply_patch") {
    return <SandboxToolCard part={part} />
  }

  const toolName = part.type.slice("tool-".length)
  const state = "state" in part ? part.state : undefined
  const input = "input" in part ? part.input : undefined
  const output = "output" in part ? part.output : undefined
  const errorText = "errorText" in part ? part.errorText : undefined
  const running = state === "input-streaming" || state === "input-available"

  return (
    <section className="rounded-md border bg-muted/20">
      <div className="flex items-center gap-2 px-3 py-2">
        {running ? <Spinner /> : <WrenchIcon className="size-3.5" />}
        <span className="font-medium text-foreground">{toolName}</span>
        {state && (
          <Badge
            variant={state === "output-error" ? "destructive" : "secondary"}
          >
            {formatToolState(state)}
          </Badge>
        )}
      </div>
      {input !== undefined && <ActivityData label="Input" value={input} />}
      {output !== undefined && <ActivityData label="Output" value={output} />}
      {typeof errorText === "string" && (
        <pre className="overflow-auto whitespace-pre-wrap border-t px-3 py-2 text-destructive">{errorText}</pre>
      )}
    </section>
  )
}

function ActivityData({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="border-t">
      <summary className="cursor-pointer px-3 py-2 font-medium">{label}</summary>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all px-3 pb-3 font-mono text-[11px] leading-4 text-foreground/80">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  )
}

function formatToolState(state: string) {
  return state.replace("input-", "").replace("output-", "")
}

function PlanUpdateCard({ part }: { part: UpdatePlanPart }) {
  if (part.state === "output-error") {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Research route failed to update</AlertTitle>
        <AlertDescription>{part.errorText}</AlertDescription>
      </Alert>
    )
  }

  if (part.state !== "output-available") return null

  const output = part.output as UpdateResearchPlanResult

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <RouteIcon className="size-3.5 text-primary" />
      <span className="font-medium text-foreground">Research route updated</span>
      <span>·</span>
      <span>{output.step_count} stops</span>
    </div>
  )
}

function SandboxToolCard({
  part,
}: {
  part: SandboxToolPart
}) {
  const running = part.state === "input-streaming" || part.state === "input-available"
  const failed = part.state === "output-error"
  const output = part.state === "output-available" ? part.output : undefined
  const input = "input" in part ? part.input : undefined
  const isExec = part.type === "tool-exec"
  const execInput = isExec ? input as { cmd?: string; workdir?: string; timeoutMs?: number } | undefined : undefined
  const patchInput = !isExec ? input as { patch?: string } | undefined : undefined
  const command = execInput?.cmd
  const patch = patchInput?.patch
  const files = patch ? [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)].map((match) => match[1] ?? match[2]) : []
  return (
    <div className="rounded-md border bg-muted/30 text-xs">
      <div className="flex items-center gap-2 px-3 py-2">
        {running ? <Spinner /> : isExec ? <TerminalIcon className="size-3.5" /> : <FilePenLineIcon className="size-3.5" />}
        <span className="font-medium">{isExec ? "exec" : "apply_patch"}</span>
        <Badge variant={failed || (output && output.exitCode !== 0) ? "destructive" : "secondary"}>
          {running ? "running" : failed ? "error" : output?.timedOut ? "timed out" : output?.exitCode === 0 ? "success" : "failed"}
        </Badge>
        {output && <span className="text-muted-foreground">exit {output.exitCode} · {(output.durationMs / 1000).toFixed(2)}s{output.truncated ? " · truncated" : ""}</span>}
      </div>
      <div className="truncate border-t px-3 py-2 font-mono text-muted-foreground">
        {isExec ? `${execInput?.workdir ?? "/workspace"} · ${execInput?.timeoutMs ?? 120000}ms · ${command ?? ""}` : files.join(", ") || "Patch"}
      </div>
      {failed && <pre className="overflow-auto whitespace-pre-wrap border-t px-3 py-2 text-destructive">{part.errorText}</pre>}
      {output?.stdout && <details className="border-t"><summary className="cursor-pointer px-3 py-2">stdout</summary><pre className="max-h-64 overflow-auto whitespace-pre-wrap px-3 pb-3">{output.stdout}</pre></details>}
      {output?.stderr && <details className="border-t"><summary className="cursor-pointer px-3 py-2">stderr</summary><pre className="max-h-64 overflow-auto whitespace-pre-wrap px-3 pb-3 text-destructive">{output.stderr}</pre></details>}
      {(command || patch) && <details className="border-t"><summary className="cursor-pointer px-3 py-2">Full input</summary><pre className="max-h-64 overflow-auto whitespace-pre-wrap px-3 pb-3">{command ?? patch}</pre></details>}
    </div>
  )
}

export function AskUserQuestionsPanel({
  part,
  disabled,
  onSubmit,
}: {
  part: AskUserQuestionsPart & { state: "input-available" }
  disabled: boolean
  onSubmit: (toolCallId: string, output: AskUserQuestionsOutput) => void
}) {
  const input = part.input as AskUserQuestionsInput
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<string, string>
  >({})
  const [customAnswers, setCustomAnswers] = React.useState<Record<string, string>>(
    {}
  )

  const allAnswered = input.questions.every((question) => {
    const selected = selectedAnswers[question.id]

    if (selected === OTHER_ANSWER_VALUE) {
      return Boolean(customAnswers[question.id]?.trim())
    }

    return Boolean(selected)
  })

  const submitAnswers = () => {
    if (!allAnswered || disabled) {
      return
    }

    onSubmit(part.toolCallId, {
      answers: input.questions.map((question) => {
        const selected = selectedAnswers[question.id]
        const customAnswer = customAnswers[question.id]?.trim()
        const answer =
          selected === OTHER_ANSWER_VALUE
            ? customAnswer ?? ""
            : question.options.find((option) => option.label === selected)?.label ??
              selected ??
              ""

        return {
          id: question.id,
          question: question.question,
          selectedOption:
            selected && selected !== OTHER_ANSWER_VALUE ? selected : undefined,
          customAnswer:
            selected === OTHER_ANSWER_VALUE ? customAnswer : undefined,
          answer,
        }
      }),
    })
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                {input.title ?? "Before I continue"}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {input.purpose}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">Question</Badge>
          </div>
        </div>

          <FieldGroup className="p-4">
            {input.questions.map((question, questionIndex) => {
              const selected = selectedAnswers[question.id]
              const isOther = selected === OTHER_ANSWER_VALUE

              return (
                <Field key={question.id}>
                  <FieldLabel>
                    <span className="text-xs text-muted-foreground">
                      {question.header || `Question ${questionIndex + 1}`}
                    </span>
                    <span>{question.question}</span>
                  </FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={selected}
                    onValueChange={(value) => {
                      if (!value) {
                        return
                      }

                      setSelectedAnswers((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }}
                    orientation="vertical"
                    className="w-full items-stretch"
                    disabled={disabled}
                  >
                    {question.options.map((option) => (
                      <ToggleGroupItem
                        key={option.label}
                        value={option.label}
                        variant="outline"
                        className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
                      >
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{option.label}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </ToggleGroupItem>
                    ))}
                    <ToggleGroupItem
                      value={OTHER_ANSWER_VALUE}
                      variant="outline"
                      className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
                    >
                      Other
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {isOther && (
                    <Textarea
                      value={customAnswers[question.id] ?? ""}
                      onChange={(event) =>
                        setCustomAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      placeholder="Type your answer..."
                      rows={2}
                      disabled={disabled}
                    />
                  )}
                </Field>
              )
            })}
          </FieldGroup>

        <div className="flex justify-end border-t px-4 py-3">
          <Button onClick={submitAnswers} disabled={!allAnswered || disabled}>
            <CheckIcon data-icon="inline-start" />
            Continue
          </Button>
        </div>
    </section>
  )
}

function AnsweredQuestionsTranscript({ part }: { part: AskUserQuestionsPart }) {
  if (part.state === "output-error") {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Question response failed</AlertTitle>
        <AlertDescription>{part.errorText}</AlertDescription>
      </Alert>
    )
  }

  if (part.state !== "output-available") {
    return null
  }

  const input = part.input as AskUserQuestionsInput
  const output = part.output as AskUserQuestionsOutput

  return (
    <div className="border bg-muted/30 px-3 py-2 text-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{input.title ?? "Your answers"}</div>
        <Badge variant="outline">Answered</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {output.answers.map((answer) => (
          <div key={answer.id} className="grid gap-1">
            <div className="text-xs text-muted-foreground">{answer.question}</div>
            <div>{answer.answer}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarkdownContent({
  text,
  isUser,
  isStreaming = false,
}: {
  text: string
  isUser: boolean
  isStreaming?: boolean
}) {
  const openHtmlFenceSource = React.useMemo(
    () => (isStreaming ? getOpenHtmlFenceSource(text) : null),
    [isStreaming, text]
  )
  const renderPre = React.useCallback(
    (props: React.ComponentProps<"pre"> & { node?: unknown }) => {
      const { node, children, ...preProps } = props
      void node

      const codeChild = React.Children.toArray(children)[0]

      if (!isUser && React.isValidElement(codeChild)) {
        const childProps = codeChild.props as {
          className?: string
          children?: React.ReactNode
        }
        const language = childProps.className?.match(/language-(\S+)/)?.[1]

        if (language === "html") {
          const source = React.Children.toArray(childProps.children).join("")

          if (
            openHtmlFenceSource !== null &&
            source.trimEnd() === openHtmlFenceSource.trimEnd()
          ) {
            return <HtmlOutputBlock source={source} deferRendering />
          }

          return <HtmlOutputBlock source={source} />
        }
      }

      return <pre {...preProps}>{children}</pre>
    },
    [isUser, openHtmlFenceSource]
  )

  return (
    <div className={cn("markdown-message", isUser && "markdown-message-user")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => {
            const { node, ...anchorProps } = props
            void node

            return <a {...anchorProps} target="_blank" rel="noreferrer" />
          },
          table: (props) => {
            const { node, ...tableProps } = props
            void node

            return (
              <div className="markdown-table-wrapper">
                <table {...tableProps} />
              </div>
            )
          },
          pre: renderPre,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

export function getOpenHtmlFenceSource(markdown: string): string | null {
  const lines = markdown.split("\n")
  let fence: { character: "`" | "~"; length: number; start: number } | null = null
  let offset = 0

  for (const line of lines) {
    if (fence === null) {
      const opening = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*html(?:[ \t].*)?$/i)

      if (opening) {
        const marker = opening[1]
        fence = {
          character: marker[0] as "`" | "~",
          length: marker.length,
          start: offset + line.length + 1,
        }
      }
    } else {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)

      if (
        closing &&
        closing[1][0] === fence.character &&
        closing[1].length >= fence.length
      ) {
        fence = null
      }
    }

    offset += line.length + 1
  }

  return fence === null ? null : markdown.slice(fence.start)
}

function SettingsDialog({
  open,
  onOpenChange,
  thread,
  accessToken,
  theme,
  providerOptionsError,
  setProviderOptionsError,
  onAccessTokenChange,
  onThemeChange,
  onSettingsChange,
  onProviderOptionsChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  thread: ChatThread
  accessToken: string
  theme: Theme
  providerOptionsError: string | null
  setProviderOptionsError: (error: string | null) => void
  onAccessTokenChange: (value: string) => void
  onThemeChange: (theme: Theme) => void
  onSettingsChange: (patch: Partial<ChatSettings>) => void
  onProviderOptionsChange: (provider: ProviderId, value: string) => void
}) {
  const settings = thread.settings
  const [activeTab, setActiveTab] = React.useState<"model" | "advanced">("model")
  const visibleTab = providerOptionsError ? "advanced" : activeTab

  const setProvider = (provider: ProviderId) => {
    onSettingsChange({
      provider,
      model: PROVIDERS[provider].defaultModel,
      thinkingEffort: PROVIDERS[provider].defaultThinkingEffort,
    })
  }

  const saveSettings = () => {
    try {
      parseProviderOptions(settings.providerOptions[settings.provider])
      setProviderOptionsError(null)
      onOpenChange(false)
      toast.success("Settings saved")
    } catch (err) {
      setProviderOptionsError(
        err instanceof Error ? err.message : "Provider options JSON is invalid."
      )
    }
  }

  const selectedModelMeta = PROVIDERS[settings.provider].models.find(
    (model) => model.value === settings.model
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure the selected provider, model, and workspace access.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={visibleTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <ScrollArea className="max-h-[60svh] pr-3">
            <TabsContent value="model">
              <FieldGroup>
                <Field>
                  <FieldLabel>Provider</FieldLabel>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => setProvider(value as ProviderId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(PROVIDERS).map(([id, provider]) => (
                          <SelectItem key={id} value={id}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Model</FieldLabel>
                  <Select
                    value={settings.model}
                    onValueChange={(model) => onSettingsChange({ model })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {!selectedModelMeta && (
                          <SelectItem value={settings.model}>
                            {settings.model}
                          </SelectItem>
                        )}
                        {PROVIDERS[settings.provider].models.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label} · {model.description}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Current model ID: {settings.model}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Thinking Effort</FieldLabel>
                  <Select
                    value={settings.thinkingEffort}
                    onValueChange={(thinkingEffort) =>
                      onSettingsChange({ thinkingEffort })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PROVIDERS[settings.provider].thinkingEffortOptions.map(
                          (option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} · {option.description}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Sent as the selected provider&apos;s thinking configuration.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="access-token">Access Token</FieldLabel>
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(event) => onAccessTokenChange(event.target.value)}
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Required for every streamed request.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Theme</FieldLabel>
                  <Select
                    value={theme}
                    onValueChange={(value) => onThemeChange(value as Theme)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {THEMES.map((themeOption) => (
                          <SelectItem
                            key={themeOption.value}
                            value={themeOption.value}
                          >
                            {themeOption.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    System follows the current OS color scheme.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </TabsContent>
            <TabsContent value="advanced">
              <FieldGroup>
                <Field data-invalid={Boolean(providerOptionsError)}>
                  <FieldLabel htmlFor="provider-options">
                    {PROVIDERS[settings.provider].label} Provider Options JSON
                  </FieldLabel>
                  <Textarea
                    id="provider-options"
                    value={settings.providerOptions[settings.provider]}
                    onChange={(event) =>
                      onProviderOptionsChange(settings.provider, event.target.value)
                    }
                    rows={10}
                    aria-invalid={Boolean(providerOptionsError)}
                    className="font-mono"
                  />
                  <FieldDescription>
                    Enter an object for the selected provider. It will be passed
                    as AI SDK provider options for this request.
                  </FieldDescription>
                  <FieldError>{providerOptionsError}</FieldError>
                </Field>
              </FieldGroup>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <XIcon data-icon="inline-start" />
            Close
          </Button>
          <Button onClick={saveSettings}>
            <CheckIcon data-icon="inline-start" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
