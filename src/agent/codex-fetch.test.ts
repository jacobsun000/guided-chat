import { afterEach, describe, expect, it, vi } from "vitest"
import { createCodexFetch } from "./codex-fetch"

function sse(events: unknown[]) {
  return new Response(
    events.map((event) => `event: ${(event as { type: string }).type}\ndata: ${JSON.stringify(event)}\n\n`).join(""),
    { headers: { "content-type": "text/event-stream" } }
  )
}

describe("Codex fetch", () => {
  afterEach(() => vi.restoreAllMocks())

  it("retries transient errors emitted before model output", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sse([
        { type: "response.created" },
        { type: "error", error: { type: "server_error", code: "server_error" } },
      ]))
      .mockResolvedValueOnce(sse([
        { type: "response.output_text.delta", delta: "OK" },
        { type: "response.completed" },
      ]))
    const codexFetch = createCodexFetch(
      async () => ({ authorization: "Bearer token", "chatgpt-account-id": "account" }),
      { retryDelay: async () => undefined }
    )

    const response = await codexFetch("https://example.test/responses", {
      method: "POST",
      body: JSON.stringify({ model: "gpt-test", store: true }),
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(await response.text()).toContain('"delta":"OK"')
    const request = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(request).toMatchObject({
      store: false,
      include: ["reasoning.encrypted_content"],
    })
  })

  it("does not retry after output has begun", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(sse([
      { type: "response.output_text.delta", delta: "partial" },
      { type: "error", error: { type: "server_error", code: "server_error" } },
    ]))
    const codexFetch = createCodexFetch(
      async () => ({}),
      { retryDelay: async () => undefined }
    )

    const response = await codexFetch("https://example.test/responses")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(await response.text()).toContain('"delta":"partial"')
  })

  it("stops at the configured retry budget", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => sse([
      { type: "error", error: { code: "server_is_overloaded" } },
    ]))
    const codexFetch = createCodexFetch(
      async () => ({}),
      { maxStreamRetries: 2, retryDelay: async () => undefined }
    )

    const response = await codexFetch("https://example.test/responses")

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(await response.text()).toContain("server_is_overloaded")
  })
})
