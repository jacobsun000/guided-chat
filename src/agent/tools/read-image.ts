import "server-only"

import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

import { tool } from "ai"
import { z } from "zod"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 5

export type NetworkDependencies = {
  fetch: typeof fetch
  lookup: typeof lookup
}

const defaultNetwork: NetworkDependencies = { fetch, lookup }

function isBlockedIp(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "")
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  if (isIP(normalized) === 6) {
    return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") ||
      normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)
  }
  return true
}

async function assertPublicDestination(url: URL, network: NetworkDependencies) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("read_image only supports http and https URLs.")
  }
  if (url.username || url.password) throw new Error("Image URLs cannot include credentials.")
  const addresses = await network.lookup(url.hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new Error("Image URL resolves to a blocked network destination.")
  }
}

async function fetchImage(url: URL, signal: AbortSignal | undefined, network: NetworkDependencies) {
  let current = url
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicDestination(current, network)
    const response = await network.fetch(current, {
      headers: { Accept: "image/*" },
      redirect: "manual",
      signal,
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) throw new Error("Image redirect did not include a location.")
      if (redirects === MAX_REDIRECTS) throw new Error("Image URL redirected too many times.")
      current = new URL(location, current)
      continue
    }
    if (!response.ok) throw new Error(`Unable to fetch image: ${response.status}.`)
    const mediaType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    if (!mediaType?.startsWith("image/")) throw new Error("URL did not return an image MIME type.")
    const declared = Number(response.headers.get("content-length"))
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) throw new Error("Image is too large. Maximum size is 10 MB.")
    if (!response.body) throw new Error("Image response did not include a body.")
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new Error("Image is too large. Maximum size is 10 MB.")
      }
      chunks.push(value)
    }
    return { url: current.toString(), mediaType, base64: Buffer.concat(chunks).toString("base64") }
  }
  throw new Error("Image URL redirected too many times.")
}

export function createReadImageTool(network: NetworkDependencies = defaultNetwork) {
  return tool({
    description: "Securely fetch and inspect a public HTTP(S) image.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: ({ url }, { abortSignal }) => fetchImage(new URL(url), abortSignal, network),
    toModelOutput: ({ output }) => ({
      type: "content",
      value: [
        { type: "text", text: `Fetched image from ${output.url}.` },
        { type: "image-data", data: output.base64, mediaType: output.mediaType },
      ],
    }),
  })
}

