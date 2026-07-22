import { describe, expect, it } from "vitest"
import { normalizeSandboxWorkdir } from "./config"
import { sandboxIdentity } from "./docker"

describe("sandbox identity", () => {
  it("uses deterministic, opaque Docker names", () => {
    const first = sandboxIdentity("thread/secret")
    expect(first).toEqual(sandboxIdentity("thread/secret"))
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(first.containerName).toMatch(/^guided-chat-sandbox-[a-f0-9]{24}$/)
    expect(first.volumeName).toMatch(/^guided-chat-workspace-[a-f0-9]{24}$/)
    expect(first.containerName).not.toContain("secret")
  })
})

describe("normalizeSandboxWorkdir", () => {
  it.each([
    [undefined, "/workspace"], [".", "/workspace"], ["results/../data", "/workspace/data"],
    ["/workspace/a/../b", "/workspace/b"], ["/datasets/catalog", "/datasets/catalog"],
  ])("normalizes %s", (input, expected) => expect(normalizeSandboxWorkdir(input)).toBe(expected))
  it.each(["..", "../etc", "/etc", "/workspace/../../etc", "/datasets/../etc"])("rejects %s", (input) => {
    expect(() => normalizeSandboxWorkdir(input)).toThrow(/beneath/)
  })
})
