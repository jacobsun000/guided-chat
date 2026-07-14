"use client"

import * as React from "react"
import type { ThreadsStore } from "@/lib/chat-store"

import { AppSidebar } from "@/components/app-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

type DatasetPageShellProps = {
  title: string
  children: React.ReactNode
}

export function DatasetPageShell({
  title,
  children,
}: DatasetPageShellProps) {
  const [threads, setThreads] = React.useState<ThreadsStore["threads"]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadThreads() {
      try {
        const response = await fetch("/api/threads", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Unable to load chat history.")
        }

        const store = (await response.json()) as ThreadsStore

        if (!cancelled) {
          setThreads(Array.isArray(store.threads) ? store.threads : [])
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) {
          setLoaded(true)
        }
      }
    }

    void loadThreads()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar threads={threads} loaded={loaded} />
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex min-w-0 flex-col justify-center">
            <span className="text-[10px] text-muted-foreground">Datasets</span>
            <h1 className="truncate text-sm font-medium">{title}</h1>
          </div>
        </header>
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          {children}
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}
