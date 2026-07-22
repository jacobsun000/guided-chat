import { researchAgentService } from "@/agent/service"
import { createChatPost } from "@/features/chat/server/chat-handler"

export const maxDuration = 1800
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const POST = createChatPost(researchAgentService)
