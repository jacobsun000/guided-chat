import "server-only"

import { ToolLoopAgent, createAgentUIStreamResponse, hasToolCall, stepCountIs, type LanguageModel, type ToolSet } from "ai"

import type { AgentModelConfig } from "@/features/chat/schemas"
import { createModel, normalizeProviderOptions, type AgentEnvironment } from "./provider"
import { RESEARCH_SYSTEM_PROMPT } from "./prompts"
import { createAgentTools } from "./tools"
import type { NetworkDependencies } from "./tools/read-image"
import { prepareActionMessages } from "./messages"

export type ResearchAgentRequest = {
  agentConfig: AgentModelConfig
  messages: unknown[]
  abortSignal?: AbortSignal
}

export type ResearchAgentDependencies = {
  env?: AgentEnvironment
  network?: NetworkDependencies
  createModel?: (config: AgentModelConfig, env: AgentEnvironment) => LanguageModel
  createTools?: (env: AgentEnvironment, network?: NetworkDependencies) => ToolSet
}

export class ResearchAgentService {
  constructor(private readonly dependencies: ResearchAgentDependencies = {}) {}

  async stream(request: ResearchAgentRequest) {
    const env = this.dependencies.env ?? process.env
    const tools = (this.dependencies.createTools ?? createAgentTools)(env, this.dependencies.network)
    const model = (this.dependencies.createModel ?? createModel)(request.agentConfig, env)
    const agent = new ToolLoopAgent({
      id: "research-agent",
      model,
      instructions: RESEARCH_SYSTEM_PROMPT,
      providerOptions: normalizeProviderOptions(request.agentConfig),
      tools,
      stopWhen: [hasToolCall("output_dependency_map"), stepCountIs(5)],
    })
    return createAgentUIStreamResponse({
      agent,
      uiMessages: prepareActionMessages(request.messages),
      abortSignal: request.abortSignal,
    })
  }
}

export const researchAgentService = new ResearchAgentService()
