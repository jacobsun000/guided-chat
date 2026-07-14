"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BotIcon,
  DatabaseIcon,
  Edit3Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react"

import type { ChatThread } from "@/lib/chat-store"
import { DATASET_CATALOG, getDatasetHref } from "@/lib/dataset-catalog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AppSidebarProps = {
  threads: ChatThread[]
  activeThreadId?: string
  loaded: boolean
  onCreateNewThread?: () => void
  onSwitchThread?: (id: string) => void
  onOpenRename?: (thread: ChatThread) => void
  onDeleteThread?: (id: string) => void
  onOpenSettings?: () => void
}

export function AppSidebar({
  threads,
  activeThreadId,
  loaded,
  onCreateNewThread,
  onSwitchThread,
  onOpenRename,
  onDeleteThread,
  onOpenSettings,
}: AppSidebarProps) {
  const pathname = usePathname()
  const hasChatActions =
    onSwitchThread != null && onOpenRename != null && onDeleteThread != null

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2 px-2">
            <BotIcon />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">Guided Chat</span>
              <span className="block truncate text-xs text-muted-foreground">
                Shared workspace
              </span>
            </span>
          </Link>
          {onCreateNewThread ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-sm" variant="ghost" onClick={onCreateNewThread}>
                  <PlusIcon />
                  <span className="sr-only">New chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon-sm" variant="ghost">
                  <Link href="/">
                    <MessageSquareIcon />
                    <span className="sr-only">Open chat</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open chat</TooltipContent>
            </Tooltip>
          )}
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
              {loaded && !threads.length && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <MessageSquareIcon />
                      <span>Open chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {loaded &&
                threads.map((thread) => (
                  <SidebarMenuItem key={thread.id}>
                    {hasChatActions ? (
                      <SidebarMenuButton
                        isActive={thread.id === activeThreadId}
                        onClick={() => onSwitchThread(thread.id)}
                        tooltip={thread.title}
                      >
                        <MessageSquareIcon />
                        <span>{thread.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild tooltip={thread.title}>
                        <Link href={`/?thread=${encodeURIComponent(thread.id)}`}>
                          <MessageSquareIcon />
                          <span>{thread.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {hasChatActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontalIcon />
                            <span className="sr-only">Chat actions</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => onOpenRename(thread)}>
                              <Edit3Icon data-icon="inline-start" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteThread(thread.id)}>
                              <Trash2Icon data-icon="inline-start" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Datasets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DATASET_CATALOG.map((dataset) => {
                const href = getDatasetHref(dataset.slug)
                const isActive = pathname.startsWith(href)

                return (
                  <SidebarMenuItem key={dataset.slug}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={`${dataset.name}: ${dataset.description}`}
                      size="lg"
                      className="h-auto min-h-12 items-start py-2"
                    >
                      <Link href={href}>
                        <DatabaseIcon />
                        <span className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                          <span className="truncate font-medium">
                            {dataset.name}
                          </span>
                          <span className="line-clamp-2 text-[10px] leading-tight font-normal text-muted-foreground">
                            {dataset.description}
                          </span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {onOpenSettings ? (
          <Button variant="outline" onClick={onOpenSettings}>
            <SettingsIcon data-icon="inline-start" />
            Settings
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/">
              <MessageSquareIcon data-icon="inline-start" />
              Open chat
            </Link>
          </Button>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
