import { tavilySearch } from "@tavily/ai-sdk"
import { tool, type ToolSet } from "ai"
import { z } from "zod"

import {
  askUserQuestionsInputSchema,
  askUserQuestionsOutputSchema,
} from "@/lib/question-tool"
import {
  createInitialUserMapState,
  getAvailableNodeIds,
  outputDependencyMapInputSchema,
  outputDependencyMapResultSchema,
  validateDependencyMap,
  type DependencyMap,
} from "@/lib/dependency-map"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type ReadImageResult = {
  url: string
  mediaType: string
  base64: string
}

const globalForDependencyMaps = globalThis as typeof globalThis & {
  __guidedChatDependencyMaps?: Map<string, DependencyMap>
}

const dependencyMaps =
  globalForDependencyMaps.__guidedChatDependencyMaps ??
  (globalForDependencyMaps.__guidedChatDependencyMaps = new Map())

export function createAgentTools() {
  const tools: ToolSet = {
    ask_user_questions: createAskUserQuestionsTool(),
    read_image: createReadImageTool(),
    output_dependency_map: createOutputDependencyMapTool(),
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim()

  if (tavilyApiKey) {
    tools.web_search = tavilySearch({ apiKey: tavilyApiKey })
  }

  return tools
}

function createAskUserQuestionsTool() {
  return tool({
    description:
      "Ask the user targeted questions when their input is needed to continue productively. Use this for clarifying research uncertainty, guiding progressive exploration, or checking understanding.",
    inputSchema: askUserQuestionsInputSchema,
    outputSchema: askUserQuestionsOutputSchema,
  })
}

function createOutputDependencyMapTool() {
  return tool({
    description:
      "Render the structured dependency map after research and before any slide, answer, or node-specific teaching content. The input must be a DAG of inspectable artifacts, not hidden chain-of-thought.",
    inputSchema: outputDependencyMapInputSchema,
    outputSchema: outputDependencyMapResultSchema,
    execute: async ({ dependency_map }) => {
      const validation = validateDependencyMap(dependency_map)

      if (!validation.valid) {
        throw new Error(
          `Dependency map validation failed: ${validation.errors.join("; ")}`
        )
      }

      dependencyMaps.set(dependency_map.map_id, dependency_map)

      const initialState = createInitialUserMapState(dependency_map.map_id)
      const availableNodeIds = getAvailableNodeIds(dependency_map, initialState)

      return {
        map_id: dependency_map.map_id,
        rendered: true,
        available_node_ids: availableNodeIds,
        recommended_first_node_ids:
          dependency_map.recommended_first_node_ids.filter((nodeId) =>
            availableNodeIds.includes(nodeId)
          ),
        validation_warnings: validation.warnings.length
          ? validation.warnings
          : undefined,
      }
    },
  })
}

function createReadImageTool() {
  return tool({
    description:
      "Fetch an image from a URL and return it as native multimodal image content so you can inspect visual details. Use this whenever the user asks about an image URL or when seeing an image would improve the answer.",
    inputSchema: z.object({
      url: z
        .string()
        .url()
        .describe("The http(s) URL of the image to inspect."),
    }),
    execute: async ({ url }, { abortSignal }) => {
      const parsedUrl = new URL(url)

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("read_image only supports http and https URLs.")
      }

      const response = await fetch(parsedUrl, {
        headers: {
          Accept: "image/*",
        },
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(
          `Unable to fetch image: ${response.status} ${response.statusText}.`
        )
      }

      const mediaType = response.headers.get("content-type")?.split(";")[0]

      if (!mediaType?.startsWith("image/")) {
        throw new Error(
          `URL did not return an image. Received content type: ${mediaType ?? "unknown"}.`
        )
      }

      const contentLength = response.headers.get("content-length")
      const expectedBytes = contentLength ? Number(contentLength) : null

      if (expectedBytes != null && expectedBytes > MAX_IMAGE_BYTES) {
        throw new Error("Image is too large. Maximum size is 10 MB.")
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new Error("Image is too large. Maximum size is 10 MB.")
      }

      return {
        url: parsedUrl.toString(),
        mediaType,
        base64: buffer.toString("base64"),
      } satisfies ReadImageResult
    },
    toModelOutput: ({ output }) => ({
      type: "content",
      value: [
        {
          type: "text",
          text: `Fetched image from ${output.url}. Inspect the image content directly before answering.`,
        },
        {
          type: "image-data",
          data: output.base64,
          mediaType: output.mediaType,
        },
      ],
    }),
  })
}
