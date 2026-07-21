import "server-only"

import { timingSafeEqual } from "node:crypto"

export type TokenVerification = "valid" | "invalid" | "not-configured"

export function verifyAccessToken(value: unknown, expected = process.env.GUIDED_CHAT_ACCESS_TOKEN): TokenVerification {
  if (!expected) return "not-configured"
  const supplied = typeof value === "string" ? value.trim() : ""
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  const comparable = suppliedBuffer.length === expectedBuffer.length
    ? suppliedBuffer
    : Buffer.alloc(expectedBuffer.length)
  return timingSafeEqual(expectedBuffer, comparable) && comparable === suppliedBuffer
    ? "valid"
    : "invalid"
}

