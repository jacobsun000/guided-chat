const DEFAULT_MAX_STREAM_RETRIES = 5
const MAX_PROBE_BYTES = 1024 * 1024

const RETRYABLE_ERROR_CODES = new Set([
  "server_error",
  "server_is_overloaded",
  "service_unavailable",
  "slow_down",
])

type CodexFetchOptions = {
  maxStreamRetries?: number
  retryDelay?: (attempt: number) => Promise<void>
}

function defaultRetryDelay(attempt: number) {
  const delayMs = Math.min(250 * 2 ** (attempt - 1), 4_000)
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs))
}

function retryableErrorCode(text: string) {
  for (const match of text.matchAll(/^data:\s*(\{.*\})\s*$/gm)) {
    try {
      const event = JSON.parse(match[1]) as {
        type?: string
        error?: { code?: string | null; type?: string | null }
        response?: { error?: { code?: string | null } | null }
      }
      if (event.type !== "error" && event.type !== "response.failed") continue
      const code = event.error?.code ?? event.error?.type ?? event.response?.error?.code
      if (code && RETRYABLE_ERROR_CODES.has(code)) return code
    } catch {
      // The chunk may end in the middle of an SSE event. Keep probing.
    }
  }
  return undefined
}

function outputHasStarted(text: string) {
  return /^event:\s*response\.(?:output_item|content_part|output_text|reasoning_summary_text)\./m.test(text)
    || /^event:\s*response\.(?:completed|incomplete)\s*$/m.test(text)
}

function replayResponse(
  response: Response,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  prefix: Uint8Array[]
) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of prefix) controller.enqueue(chunk)
    },
    async pull(controller) {
      try {
        const next = await reader.read()
        if (next.done) controller.close()
        else controller.enqueue(next.value)
      } catch (error) {
        controller.error(error)
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

async function probeCodexStream(response: Response) {
  if (!response.ok || !response.body) {
    return { response, retryableCode: undefined }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const chunks: Uint8Array[] = []
  let text = ""
  let byteLength = 0

  while (byteLength < MAX_PROBE_BYTES) {
    const next = await reader.read()
    if (next.done) {
      text += decoder.decode()
      const retryableCode = retryableErrorCode(text)
      if (retryableCode) {
        return {
          response: replayResponse(response, reader, chunks),
          retryableCode,
        }
      }
      return { response: replayResponse(response, reader, chunks), retryableCode: undefined }
    }

    chunks.push(next.value)
    byteLength += next.value.byteLength
    text += decoder.decode(next.value, { stream: true })

    const retryableCode = retryableErrorCode(text)
    if (retryableCode && !outputHasStarted(text)) {
      return {
        response: replayResponse(response, reader, chunks),
        retryableCode,
      }
    }
    if (outputHasStarted(text)) {
      return { response: replayResponse(response, reader, chunks), retryableCode: undefined }
    }
  }

  return { response: replayResponse(response, reader, chunks), retryableCode: undefined }
}

export function createCodexFetch(
  getHeaders: () => Promise<HeadersInit>,
  options: CodexFetchOptions = {}
): typeof fetch {
  const maxStreamRetries = options.maxStreamRetries ?? DEFAULT_MAX_STREAM_RETRIES
  const retryDelay = options.retryDelay ?? defaultRetryDelay

  return async (input, init) => {
    let body = init?.body
    if (typeof body === "string") {
      const json = JSON.parse(body) as Record<string, unknown>
      json.store = false
      const include = Array.isArray(json.include) ? json.include : []
      if (!include.includes("reasoning.encrypted_content")) {
        json.include = [...include, "reasoning.encrypted_content"]
      }
      body = JSON.stringify(json)
    }

    for (let attempt = 0; ; attempt += 1) {
      const headers = new Headers(init?.headers)
      const authHeaders = new Headers(await getHeaders())
      authHeaders.forEach((value, key) => headers.set(key, value))

      const response = await fetch(input, { ...init, headers, body })
      const probed = await probeCodexStream(response)
      if (!probed.retryableCode || attempt >= maxStreamRetries) return probed.response

      await probed.response.body?.cancel()
      console.warn(
        "[codex-provider]",
        JSON.stringify({
          event: "stream-retry",
          attempt: attempt + 1,
          maxRetries: maxStreamRetries,
          code: probed.retryableCode,
        })
      )
      await retryDelay(attempt + 1)
    }
  }
}
