import "server-only"

import { tavilySearch } from "@tavily/ai-sdk"
import { tool, type ToolSet } from "ai"

import { askUserQuestionsInputSchema, askUserQuestionsOutputSchema } from "@/lib/question-tool"
import type { AgentEnvironment } from "../provider"
import { createOutputDependencyMapTool } from "./dependency-map"
import { createReadImageTool, type NetworkDependencies } from "./read-image"

export function createAgentTools(env: AgentEnvironment = process.env, network?: NetworkDependencies) {
  const tools: ToolSet = {
    ask_user_questions: tool({
      description: "Ask targeted questions needed to continue productively.",
      inputSchema: askUserQuestionsInputSchema,
      outputSchema: askUserQuestionsOutputSchema,
    }),
    read_image: createReadImageTool(network),
    output_dependency_map: createOutputDependencyMapTool(),
  }
  const tavilyApiKey = env.TAVILY_API_KEY?.trim()
  if (tavilyApiKey) tools.web_search = tavilySearch({ apiKey: tavilyApiKey })
  return tools
}

