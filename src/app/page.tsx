"use client"

import * as React from "react"
import type { UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react"
import {
  AlertCircleIcon,
  BotIcon,
  CheckIcon,
  CopyIcon,
  Edit3Icon,
  KeyRoundIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { useTheme, type Theme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

type ProviderId = "openai" | "anthropic" | "google"

type StoredKeys = Partial<Record<ProviderId, string>>

type ProviderOptionsJson = Record<ProviderId, string>

type ChatSettings = {
  provider: ProviderId
  model: string
  system: string
  temperature: number
  maxOutputTokens: number
  providerOptions: ProviderOptionsJson
}

type ChatThread = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: UIMessage[]
  settings: ChatSettings
}

type ThreadsStore = {
  version: 1
  activeThreadId: string
  threads: ChatThread[]
}

const KEYS_STORAGE_KEY = "guided-chat.keys.v1"
const THREADS_STORAGE_KEY = "guided-chat.threads.v1"

const PROVIDERS: Record<
  ProviderId,
  {
    label: string
    defaultModel: string
    keyLabel: string
    models: { label: string; value: string; description: string }[]
  }
> = {
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5.5",
    keyLabel: "OpenAI API key",
    models: [
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
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-6",
    keyLabel: "Anthropic API key",
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
  },
  google: {
    label: "Google",
    defaultModel: "gemini-3.5-flash",
    keyLabel: "Google API key",
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
  },
}

const THEMES: { label: string; value: Theme }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
]

const DEFAULT_PROVIDER_OPTIONS: ProviderOptionsJson = {
  openai: "{}",
  anthropic: "{}",
  google: "{}",
}

const HYDRATION_THREAD_TIMESTAMP = "1970-01-01T00:00:00.000Z"
const HYDRATION_THREAD_ID = "hydration-thread"

function createDefaultSettings(): ChatSettings {
  return {
    provider: "openai",
    model: PROVIDERS.openai.defaultModel,
    system: "",
    temperature: 0.7,
    maxOutputTokens: 1024,
    providerOptions: { ...DEFAULT_PROVIDER_OPTIONS },
  }
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function createThread({
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

function createDefaultStore(): ThreadsStore {
  const thread = createThread()

  return {
    version: 1,
    activeThreadId: thread.id,
    threads: [thread],
  }
}

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

function normalizeStoredThread(thread: ChatThread): ChatThread {
  const settings = {
    ...createDefaultSettings(),
    ...thread.settings,
    providerOptions: {
      ...DEFAULT_PROVIDER_OPTIONS,
      ...thread.settings?.providerOptions,
    },
  }

  return {
    ...thread,
    settings,
    messages: Array.isArray(thread.messages) ? thread.messages : [],
  }
}

function loadThreadsStore(): ThreadsStore {
  const fallback = createDefaultStore()
  const raw = localStorage.getItem(THREADS_STORAGE_KEY)

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as ThreadsStore
    const threads = Array.isArray(parsed.threads)
      ? parsed.threads.map(normalizeStoredThread)
      : []

    if (!threads.length) {
      return fallback
    }

    const activeThreadId = threads.some(
      (thread) => thread.id === parsed.activeThreadId
    )
      ? parsed.activeThreadId
      : threads[0].id

    return {
      version: 1,
      activeThreadId,
      threads,
    }
  } catch {
    return fallback
  }
}

function loadKeys(): StoredKeys {
  const raw = localStorage.getItem(KEYS_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as StoredKeys

    return {
      openai: parsed.openai ?? "",
      anthropic: parsed.anthropic ?? "",
      google: parsed.google ?? "",
    }
  } catch {
    return {}
  }
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const initialStore = React.useMemo(() => createHydrationStore(), [])
  const [store, setStore] = React.useState<ThreadsStore>(initialStore)
  const [keys, setKeys] = React.useState<StoredKeys>({})
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
    () => new DefaultChatTransport<UIMessage>({ api: "/api/chat" }),
    []
  )

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
    clearError,
  } = useChat({
    id: activeThread?.id,
    messages: activeThread?.messages ?? [],
    transport,
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
  const selectedProvider = activeThread?.settings.provider ?? "openai"
  const selectedProviderMeta = PROVIDERS[selectedProvider]
  const hasSelectedKey = Boolean(keys[selectedProvider]?.trim())
  const selectedModelMeta = selectedProviderMeta.models.find(
    (model) => model.value === activeThread?.settings.model
  )

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
    const nextStore = loadThreadsStore()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(nextStore)
    setKeys(loadKeys())
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    if (!loaded) {
      return
    }

    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys))
  }, [keys, loaded])

  React.useEffect(() => {
    if (!loaded) {
      return
    }

    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(store))
  }, [loaded, store])

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
    setMessages(thread.messages)
    // This effect intentionally keys off the id only. Store changes for settings
    // or persistence must not reset the live chat message state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, clearError, setMessages])

  const createRequestBody = React.useCallback(() => {
    const settings = activeThread.settings

    return {
      provider: settings.provider,
      model: settings.model,
      apiKey: keys[settings.provider]?.trim(),
      system: settings.system,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      providerOptions: parseProviderOptions(
        settings.providerOptions[settings.provider]
      ),
    }
  }, [activeThread, keys])

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

      if (!text || isStreaming) {
        return
      }

      if (!hasSelectedKey) {
        setComposerError(`Add a ${selectedProviderMeta.keyLabel} before sending.`)
        setSettingsOpen(true)
        return
      }

      try {
        parseProviderOptions(
          activeThread.settings.providerOptions[activeThread.settings.provider]
        )
      } catch (err) {
        setProviderOptionsError(
          err instanceof Error ? err.message : "Provider options JSON is invalid."
        )
        setSettingsOpen(true)
        return
      }

      setInput("")
      await sendMessage(
        { text },
        {
          body: createRequestBody(),
        }
      )
    },
    [
      activeThread,
      clearError,
      createRequestBody,
      hasSelectedKey,
      input,
      isStreaming,
      selectedProviderMeta.keyLabel,
      sendMessage,
    ]
  )

  const regenerateLast = React.useCallback(async () => {
    clearError()
    setComposerError(null)

    if (!hasSelectedKey) {
      setComposerError(`Add a ${selectedProviderMeta.keyLabel} before regenerating.`)
      setSettingsOpen(true)
      return
    }

    try {
      parseProviderOptions(
        activeThread.settings.providerOptions[activeThread.settings.provider]
      )
      await regenerate({
        body: createRequestBody(),
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to regenerate the response."
      setComposerError(message)
    }
  }, [
    activeThread,
    clearError,
    createRequestBody,
    hasSelectedKey,
    regenerate,
    selectedProviderMeta.keyLabel,
  ])

  const copyMessage = React.useCallback(async (message: UIMessage) => {
    const text = getMessageText(message)

    if (!text) {
      return
    }

    await navigator.clipboard.writeText(text)
    toast.success("Message copied")
  }, [])

  if (!activeThread) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 px-2">
              <BotIcon />
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">Guided Chat</div>
                <div className="truncate text-xs text-muted-foreground">
                  Local conversations
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-sm" variant="ghost" onClick={createNewThread}>
                  <PlusIcon />
                  <span className="sr-only">New chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {!loaded &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <Skeleton className="h-8 w-full" />
                    </SidebarMenuItem>
                  ))}
                {loaded &&
                  store.threads.map((thread) => (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton
                        isActive={thread.id === activeThread.id}
                        onClick={() => switchThread(thread.id)}
                        tooltip={thread.title}
                      >
                        <span>{thread.title}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontalIcon />
                            <span className="sr-only">Chat actions</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => openRename(thread)}>
                              <Edit3Icon data-icon="inline-start" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteThread(thread.id)}>
                              <Trash2Icon data-icon="inline-start" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon data-icon="inline-start" />
            Settings
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-svh">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger>
              <PanelLeftIcon />
            </SidebarTrigger>
            <Separator orientation="vertical" className="h-5" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium">{activeThread.title}</h1>
              <div className="truncate text-xs text-muted-foreground">
                {messages.length} messages
              </div>
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
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
              {!messages.length && (
                <Empty className="min-h-[55svh] border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BotIcon />
                    </EmptyMedia>
                    <EmptyTitle>Start a conversation</EmptyTitle>
                    <EmptyDescription>
                      Messages stay in this browser. Provider keys are sent only
                      with the selected request.
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

          <div className="border-t bg-background px-3 py-3">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              {(composerError || error || !hasSelectedKey) && (
                <Alert variant={composerError || error ? "destructive" : "default"}>
                  <AlertCircleIcon />
                  <AlertTitle>
                    {composerError || error ? "Chat request blocked" : "Missing API key"}
                  </AlertTitle>
                  <AlertDescription>
                    {composerError ??
                      error?.message ??
                      `Add a ${selectedProviderMeta.keyLabel} in settings before sending.`}
                  </AlertDescription>
                </Alert>
              )}

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
                    placeholder="Message..."
                    rows={1}
                    disabled={isStreaming}
                    className="max-h-48 min-h-8 py-1.5"
                  />
                  <div className="flex shrink-0 items-center gap-1 pb-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          size="icon-sm"
                          onClick={regenerateLast}
                          disabled={!messages.length || isStreaming}
                        >
                          <RefreshCwIcon />
                          <span className="sr-only">Regenerate</span>
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>Regenerate</TooltipContent>
                    </Tooltip>
                    {isStreaming ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            size="icon-sm"
                            variant="outline"
                            onClick={stop}
                          >
                            <SquareIcon />
                            <span className="sr-only">Stop</span>
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>Stop</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            type="submit"
                            size="icon-sm"
                            variant="default"
                            disabled={!input.trim()}
                          >
                            <SendIcon />
                            <span className="sr-only">Send</span>
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>Send</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </InputGroup>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thread={activeThread}
        keys={keys}
        theme={theme}
        providerOptionsError={providerOptionsError}
        setProviderOptionsError={setProviderOptionsError}
        onKeysChange={setKeys}
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
  onCopy,
}: {
  message: UIMessage
  onCopy: () => void
}) {
  const isUser = message.role === "user"
  const text = getMessageText(message)

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
            "whitespace-pre-wrap text-sm leading-6",
            isUser
              ? "border bg-primary px-2.5 py-1.5 text-primary-foreground"
              : "text-foreground"
          )}
        >
          {text || (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Streaming
            </span>
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

function SettingsDialog({
  open,
  onOpenChange,
  thread,
  keys,
  theme,
  providerOptionsError,
  setProviderOptionsError,
  onKeysChange,
  onThemeChange,
  onSettingsChange,
  onProviderOptionsChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  thread: ChatThread
  keys: StoredKeys
  theme: Theme
  providerOptionsError: string | null
  setProviderOptionsError: (error: string | null) => void
  onKeysChange: React.Dispatch<React.SetStateAction<StoredKeys>>
  onThemeChange: (theme: Theme) => void
  onSettingsChange: (patch: Partial<ChatSettings>) => void
  onProviderOptionsChange: (provider: ProviderId, value: string) => void
}) {
  const settings = thread.settings
  const [activeTab, setActiveTab] = React.useState<"model" | "keys" | "advanced">(
    "model"
  )
  const visibleTab = providerOptionsError ? "advanced" : activeTab

  const setProvider = (provider: ProviderId) => {
    onSettingsChange({
      provider,
      model: PROVIDERS[provider].defaultModel,
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
            Configure the selected provider, model, and local API keys.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={visibleTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
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
                <Field>
                  <FieldLabel htmlFor="system-prompt">System Prompt</FieldLabel>
                  <Textarea
                    id="system-prompt"
                    value={settings.system}
                    onChange={(event) =>
                      onSettingsChange({ system: event.target.value })
                    }
                    rows={5}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={settings.temperature}
                      onChange={(event) =>
                        onSettingsChange({
                          temperature: Number(event.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="max-output">Max Output Tokens</FieldLabel>
                    <Input
                      id="max-output"
                      type="number"
                      step="1"
                      min="1"
                      value={settings.maxOutputTokens}
                      onChange={(event) =>
                        onSettingsChange({
                          maxOutputTokens: Number(event.target.value),
                        })
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>
            </TabsContent>
            <TabsContent value="keys">
              <FieldGroup>
                {(Object.keys(PROVIDERS) as ProviderId[]).map((provider) => (
                  <Field key={provider}>
                    <FieldLabel htmlFor={`${provider}-key`}>
                      {PROVIDERS[provider].keyLabel}
                    </FieldLabel>
                    <Input
                      id={`${provider}-key`}
                      type="password"
                      value={keys[provider] ?? ""}
                      onChange={(event) =>
                        onKeysChange((current) => ({
                          ...current,
                          [provider]: event.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Stored in this browser localStorage.
                    </FieldDescription>
                  </Field>
                ))}
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
