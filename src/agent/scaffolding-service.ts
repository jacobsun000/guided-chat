import "server-only"

import { Output, stepCountIs, streamText, type ToolSet } from "ai"
import type { z } from "zod"
import type { AgentModelConfig } from "@/features/chat/schemas"
import {
  parseStepIds,
  scaffoldMapResultSchema,
  scaffoldReviewResultSchema,
  validateScaffoldMap,
  type ScaffoldMapResult,
  type ScaffoldReviewResult,
  type TrajectoryStep,
} from "@/lib/scaffolding"
import { BASELINE_SYSTEM_PROMPT } from "./prompts"
import { prepareBaselineMessages } from "./prepare-messages"
import { createModel, normalizeProviderOptions, type AgentEnvironment } from "./provider"
import { getSandboxManager } from "./sandbox/docker"
import type { SandboxManager } from "./sandbox/types"
import { createBaselineTools } from "./tools"
import type { NetworkDependencies } from "./tools/read-image"
import { buildBaselineTrajectory, selectTrajectorySteps } from "./trajectory"

const MAP_SYSTEM_PROMPT = `You review how a data-analysis agent completed a task. Produce a compact completion map with 4-8 major nodes. Model the meaningful path from the user's goal through key decisions and evidence to the final result. Focus on consequential task steps, not implementation mechanics. Do not create nodes for shell commands, tool selection, file listing, package installation, formatting, or other low-level technical details; fold those primitive events into the higher-level purpose they served.

Each node must have a unique short name of 2-5 words. Its description must be one very short sentence of at most 12 words, written for a non-technical reviewer. Include importance and uncertainty integer scores from 1 to 100, a review suggestion, and step_ids. Importance measures how critical the node is to the final task: 100 means failure here will definitely make the entire task fail; 50 means it materially affects quality; 1 means it is incidental. Uncertainty measures likelihood that the reasoning or execution could be wrong: 100 means failure is extremely likely or unsupported; 50 means meaningful doubt remains; 1 means it is directly verified and highly reliable. review_suggestion must say what a human should inspect and why.

step_ids use compact forms such as "5-16" or "5,6,7,11". Every provided trajectory step must belong to exactly one node. Edges use exact node names and represent workflow direction. trajectory_summary is concise context for another review agent: goal, key steps, and outcomes. result_summary is a concise, plain-language human summary emphasizing key outcomes.

You may use the available analysis tools when useful. Return only the requested structured output.`

const REVIEW_SYSTEM_PROMPT = `You are a review assistant explaining one major stage in how a data-analysis task was completed. Use the global trajectory summary and exact selected steps. Focus on the stage's goal, consequential choices, evidence, assumptions, and effect on the result—not low-level tool mechanics such as which shell command or utility was used. Produce one self-contained HTML slide and at most three multiple-choice review questions about consequential decisions in these steps.

The HTML must be a complete, readable document with inline CSS, no scripts, no external assets, and no network dependencies. Explain what happened, evidence used, assumptions, risks, and what deserves verification. Do not invent missing work.

Each question asks what the user would do or conclude at a key step. choices contains plausible options. trajectory_answer explains what the trajectory actually did and its limitations; it is not presented as ground truth. step_ids must refer only to supplied selected steps. You may use the available analysis tools when useful. Return only the requested structured output.`

type Dependencies = {
  env?: AgentEnvironment
  network?: NetworkDependencies
  sandboxManager?: SandboxManager
  createTools?: typeof createBaselineTools
}

type BaseRequest = {
  threadId: string
  agentConfig: AgentModelConfig
  abortSignal?: AbortSignal
}

export class ScaffoldingService {
  constructor(private readonly dependencies: Dependencies = {}) {}

  async createMap(request: BaseRequest & { messages: unknown[] }) {
    const trajectory = buildBaselineTrajectory(
      BASELINE_SYSTEM_PROMPT,
      prepareBaselineMessages(request.messages)
    )
    const prompt = `Review this baseline trajectory. The JSON is complete and each primitive item has a step_id.\n\n${JSON.stringify(trajectory)}`
    let correction: string | undefined
    let prior: ScaffoldMapResult | undefined

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await this.generate(
        request,
        MAP_SYSTEM_PROMPT,
        correction
          ? `${prompt}\n\nYour previous output was:\n${JSON.stringify(prior)}\n\nValidation failed. Correct all of these issues:\n${correction}`
          : prompt,
        scaffoldMapResultSchema,
        "completion_review_map"
      )
      prior = result.output
      const errors = validateScaffoldMap(prior, trajectory)
      if (!errors.length) return { ...prior, trajectory }
      correction = errors.map((error) => `- ${error}`).join("\n")
    }
    throw new Error(`Unable to produce a valid review map: ${correction}`)
  }

  async createReview(request: BaseRequest & {
    trajectory: TrajectoryStep[]
    trajectorySummary: string
    nodeName: string
    stepIds: string
  }): Promise<ScaffoldReviewResult> {
    const ids = parseStepIds(request.stepIds)
    const selectedSteps = selectTrajectorySteps(request.trajectory, ids)
    if (selectedSteps.length !== ids.length) throw new Error("The node references unavailable trajectory steps.")
    const allowed = new Set(ids)
    let correction: string | undefined
    let prior: ScaffoldReviewResult | undefined

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const prompt = `Global trajectory summary:\n${request.trajectorySummary}\n\nNode: ${request.nodeName}\nAllowed step IDs: ${ids.join(", ")}\nSelected trajectory steps:\n${JSON.stringify(selectedSteps)}${correction ? `\n\nYour previous output was:\n${JSON.stringify(prior)}\n\nValidation failed. Correct these issues:\n${correction}` : ""}`
      const result = await this.generate(
        request,
        REVIEW_SYSTEM_PROMPT,
        prompt,
        scaffoldReviewResultSchema,
        "node_review"
      )
      prior = result.output
      const errors: string[] = []
      prior.questions.forEach((question, index) => {
        try {
          const questionIds = parseStepIds(question.step_ids)
          if (!questionIds.length || questionIds.some((id) => !allowed.has(id))) {
            errors.push(`Question ${index + 1} step_ids must be a non-empty subset of the node steps.`)
          }
        } catch (error) {
          errors.push(`Question ${index + 1}: ${error instanceof Error ? error.message : "invalid step_ids"}`)
        }
      })
      if (!errors.length) return prior
      correction = errors.map((error) => `- ${error}`).join("\n")
    }
    throw new Error(`Unable to produce a valid node review: ${correction}`)
  }

  private async generate<OUTPUT>(
    request: BaseRequest,
    system: string,
    prompt: string,
    schema: z.ZodType<OUTPUT>,
    outputName: string
  ) {
    const env = this.dependencies.env ?? process.env
    const manager = this.dependencies.sandboxManager ?? getSandboxManager()
    const tools: ToolSet = (this.dependencies.createTools ?? createBaselineTools)(
      env,
      this.dependencies.network,
      { manager, threadId: request.threadId, abortSignal: request.abortSignal }
    )
    const result = streamText({
      model: createModel(request.agentConfig, env),
      system,
      prompt,
      tools,
      output: Output.object({ schema, name: outputName }),
      stopWhen: stepCountIs(40),
      providerOptions: normalizeProviderOptions(request.agentConfig),
      abortSignal: request.abortSignal,
    })
    await result.consumeStream()
    return { output: await result.output }
  }
}

export const scaffoldingService = new ScaffoldingService()
