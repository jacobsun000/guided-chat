import "server-only"

import { ToolLoopAgent, createAgentUIStreamResponse, stepCountIs, type LanguageModel, type ToolSet } from "ai"

import type { AgentModelConfig } from "@/features/chat/schemas"
import { createModel, normalizeProviderOptions, type AgentEnvironment } from "./provider"
import { BASELINE_SYSTEM_PROMPT } from "./prompts"
import { createBaselineTools } from "./tools"
import type { NetworkDependencies } from "./tools/read-image"
import { prepareBaselineMessages } from "./prepare-messages"
import { getSandboxManager } from "./sandbox/docker"
import type { SandboxManager } from "./sandbox/types"

export type ResearchAgentRequest = {
  agentConfig: AgentModelConfig
  threadId: string
  messages: unknown[]
  abortSignal?: AbortSignal
}

export type ResearchAgentDependencies = {
  env?: AgentEnvironment
  network?: NetworkDependencies
  createModel?: (config: AgentModelConfig, env: AgentEnvironment) => LanguageModel
  createTools?: (env: AgentEnvironment, network?: NetworkDependencies, sandbox?: { manager: SandboxManager; threadId: string; abortSignal?: AbortSignal }) => ToolSet
  sandboxManager?: SandboxManager
}

export class ResearchAgentService {
  constructor(private readonly dependencies: ResearchAgentDependencies = {}) { }

  async stream(request: ResearchAgentRequest) {
    const requestId = crypto.randomUUID().slice(0, 8)
    const startedAt = Date.now()
    let completedSteps = 0
    let lastActivity = "initializing model"
    const log = (event: string, details: Record<string, unknown> = {}) => {
      console.info(
        "[research-agent]",
        JSON.stringify({
          event,
          requestId,
          threadId: request.threadId,
          elapsedMs: Date.now() - startedAt,
          ...details,
        })
      )
    }
    const heartbeat = setInterval(() => {
      log("still-running", { completedSteps, lastActivity })
    }, 30_000)
    heartbeat.unref()
    const finishLogging = () => clearInterval(heartbeat)
    request.abortSignal?.addEventListener(
      "abort",
      () => {
        finishLogging()
        log("aborted", { completedSteps, lastActivity })
      },
      { once: true }
    )

    log("started", {
      provider: request.agentConfig.provider,
      model: request.agentConfig.model,
      thinkingEffort: request.agentConfig.thinkingEffort,
      messageCount: request.messages.length,
    })

    try {
      const env = this.dependencies.env ?? process.env
      const manager = this.dependencies.sandboxManager ?? getSandboxManager()
      const tools = (this.dependencies.createTools ?? createBaselineTools)(
        env,
        this.dependencies.network,
        {
          manager,
          threadId: request.threadId,
          abortSignal: request.abortSignal,
        }
      )
      const model = (this.dependencies.createModel ?? createModel)(
        request.agentConfig,
        env
      )
      const agent = new ToolLoopAgent({
        id: "research-agent",
        model,
        instructions: BASELINE_SYSTEM_PROMPT,
        providerOptions: normalizeProviderOptions(request.agentConfig),
        tools,
        stopWhen: stepCountIs(40),
        onStepFinish: (step) => {
          completedSteps += 1
          const toolNames = step.toolCalls.map((call) => call.toolName)
          lastActivity =
            toolNames.length > 0
              ? `completed tools: ${toolNames.join(", ")}`
              : `completed model step ${completedSteps}`
          log("step-finished", {
            step: completedSteps,
            finishReason: step.finishReason,
            toolNames,
            toolResultCount: step.toolResults.length,
            reasoningCharacters: step.reasoningText?.length ?? 0,
            textCharacters: step.text.length,
            inputTokens: step.usage.inputTokens,
            outputTokens: step.usage.outputTokens,
          })
        },
        onFinish: (result) => {
          finishLogging()
          log("finished", {
            completedSteps: result.steps.length,
            finishReason: result.finishReason,
            inputTokens: result.totalUsage.inputTokens,
            outputTokens: result.totalUsage.outputTokens,
          })
        },
      })
      const response = await createAgentUIStreamResponse({
        agent,
        uiMessages: prepareBaselineMessages(request.messages),
        abortSignal: request.abortSignal,
        messageMetadata: ({ part }) => {
          if (part.type !== "finish") return undefined
          const usage = part.totalUsage
          return {
            usage: {
              inputTokens: usage.inputTokens ?? 0,
              cacheReadTokens: usage.inputTokenDetails.cacheReadTokens ?? 0,
              cacheWriteTokens: usage.inputTokenDetails.cacheWriteTokens ?? 0,
              outputTokens: usage.outputTokens ?? 0,
              totalTokens: usage.totalTokens ?? 0,
            },
          }
        },
      })
      log("stream-opened")
      return response
    } catch (error) {
      finishLogging()
      console.error(
        "[research-agent]",
        JSON.stringify({
          event: "failed",
          requestId,
          threadId: request.threadId,
          elapsedMs: Date.now() - startedAt,
          completedSteps,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      )
      throw error
    }
  }
}

export const researchAgentService = new ResearchAgentService()
