import "server-only"

import { tavilySearch } from "@tavily/ai-sdk"
import { tool, type ToolSet } from "ai"

import { askUserQuestionsInputSchema, askUserQuestionsOutputSchema } from "@/lib/question-tool"
import type { AgentEnvironment } from "../provider"
import { createUpdatePlanTool } from "./update-plan"
import { createReadImageTool, type NetworkDependencies } from "./read-image"
import type { SandboxManager } from "../sandbox/types"
import { createSandboxTools } from "./sandbox"

type SandboxContext = { manager: SandboxManager; threadId: string; abortSignal?: AbortSignal }

export function createBaselineTools(env: AgentEnvironment = process.env, network?: NetworkDependencies, sandbox?: SandboxContext) {
  const tools: ToolSet = {
    read_image: createReadImageTool(network),
  }
  if (sandbox) Object.assign(tools, createSandboxTools(sandbox.manager, sandbox.threadId, sandbox.abortSignal))
  const tavilyApiKey = env.TAVILY_API_KEY?.trim()
  if (tavilyApiKey) tools.web_search = tavilySearch({ apiKey: tavilyApiKey })
  return tools
}

export function createAgentTools(env: AgentEnvironment = process.env, network?: NetworkDependencies, sandbox?: SandboxContext) {
  const tools: ToolSet = {
    ask_user_questions: tool({
      description: "Ask targeted questions needed to continue productively.",
      inputSchema: askUserQuestionsInputSchema,
      outputSchema: askUserQuestionsOutputSchema,
    }),
    read_image: createReadImageTool(network),
    update_plan: createUpdatePlanTool(),
  }
  if (sandbox) Object.assign(tools, createSandboxTools(sandbox.manager, sandbox.threadId, sandbox.abortSignal))
  const tavilyApiKey = env.TAVILY_API_KEY?.trim()
  if (tavilyApiKey) tools.web_search = tavilySearch({ apiKey: tavilyApiKey })
  return tools
}
