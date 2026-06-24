import { tavilySearch } from "@tavily/ai-sdk"
import { tool, type ToolSet } from "ai"
import { z } from "zod"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type ReadImageResult = {
  url: string
  mediaType: string
  base64: string
}

export function createAgentTools() {
  const tools: ToolSet = {
    read_image: createReadImageTool(),
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim()

  if (tavilyApiKey) {
    tools.web_search = tavilySearch({ apiKey: tavilyApiKey })
  }

  return tools
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
