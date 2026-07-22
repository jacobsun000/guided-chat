import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { getCodexAuthSession } from "./codex-auth"

const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true })))
})

function jwt(payload: Record<string, unknown>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`
}

describe("Codex OAuth credentials", () => {
  it("reads the Codex auth file from CODEX_HOME", async () => {
    const codexHome = await mkdtemp(path.join(tmpdir(), "guided-chat-codex-"))
    tempDirectories.push(codexHome)
    const accessToken = jwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      "https://api.openai.com/auth": { chatgpt_account_id: "account-from-jwt" },
    })
    await writeFile(path.join(codexHome, "auth.json"), JSON.stringify({
      tokens: { access_token: accessToken, refresh_token: "refresh-token" },
    }))

    await expect(getCodexAuthSession({ CODEX_HOME: codexHome })).resolves.toEqual({
      accessToken,
      accountId: "account-from-jwt",
    })
  })

  it("explains how to create missing local credentials", async () => {
    const codexHome = await mkdtemp(path.join(tmpdir(), "guided-chat-codex-"))
    tempDirectories.push(codexHome)

    await expect(getCodexAuthSession({ CODEX_HOME: codexHome })).rejects.toThrow("codex login")
  })
})
