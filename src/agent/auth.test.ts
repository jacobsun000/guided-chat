import { describe, expect, it } from "vitest"
import { verifyAccessToken } from "./auth"

describe("access token verification", () => {
  it("distinguishes missing configuration, invalid values, and valid values", () => {
    expect(verifyAccessToken("token", undefined)).toBe("not-configured")
    expect(verifyAccessToken("wrong", "token")).toBe("invalid")
    expect(verifyAccessToken(" token ", "token")).toBe("valid")
  })
})
