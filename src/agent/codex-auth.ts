import "server-only"

import { chmod, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const CODEX_TOKEN_URL = "https://auth.openai.com/oauth/token"
const REFRESH_LEEWAY_MS = 30_000

type CodexAuthFile = {
  tokens?: {
    access_token?: string
    refresh_token?: string
    account_id?: string | null
    id_token?: unknown
  }
  last_refresh?: string
  [key: string]: unknown
}

export type CodexAuthSession = {
  accessToken: string
  accountId: string
}

function authFilePath(env: Readonly<Record<string, string | undefined>>) {
  const codexHome = env.CODEX_HOME?.trim() || path.join(homedir(), ".codex")
  return path.join(codexHome, "auth.json")
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const payload = token.split(".")[1]
  if (!payload) return undefined
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function accountIdFromToken(token: string) {
  const claims = decodeJwtPayload(token)?.["https://api.openai.com/auth"]
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) return undefined
  const accountId = (claims as Record<string, unknown>).chatgpt_account_id
  return typeof accountId === "string" && accountId.trim() ? accountId : undefined
}

function tokenExpiresSoon(token: string) {
  const expiresAt = decodeJwtPayload(token)?.exp
  return typeof expiresAt === "number"
    ? expiresAt * 1000 <= Date.now() + REFRESH_LEEWAY_MS
    : false
}

async function readAuthFile(env: Readonly<Record<string, string | undefined>>) {
  const file = authFilePath(env)
  let raw: string
  try {
    raw = await readFile(file, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Missing Codex OAuth credentials at ${file}. Run 'codex login' first.`)
    }
    throw error
  }
  const auth = JSON.parse(raw) as CodexAuthFile
  return { auth, file }
}

async function refreshTokens(auth: CodexAuthFile, file: string) {
  const refreshToken = auth.tokens?.refresh_token
  if (!refreshToken) throw new Error("Codex OAuth credential is expired and has no refresh token. Run 'codex login' again.")

  const response = await fetch(CODEX_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CODEX_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).trim()
    throw new Error(`Codex OAuth token refresh failed (${response.status})${detail ? `: ${detail}` : ""}`)
  }

  const payload = await response.json() as {
    access_token?: string
    refresh_token?: string
    id_token?: string
  }
  if (!payload.access_token) throw new Error("Codex OAuth token refresh returned no access token.")

  auth.tokens = {
    ...auth.tokens,
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? refreshToken,
    id_token: payload.id_token ?? auth.tokens?.id_token,
    account_id: accountIdFromToken(payload.access_token) ?? auth.tokens?.account_id,
  }
  auth.last_refresh = new Date().toISOString()
  await writeFile(file, `${JSON.stringify(auth, null, 2)}\n`, { mode: 0o600 })
  await chmod(file, 0o600)
  return payload.access_token
}

export async function getCodexAuthSession(
  env: Readonly<Record<string, string | undefined>> = process.env
): Promise<CodexAuthSession> {
  const { auth, file } = await readAuthFile(env)
  let accessToken = auth.tokens?.access_token
  if (!accessToken) throw new Error(`Codex OAuth credentials at ${file} contain no access token. Run 'codex login' again.`)
  if (tokenExpiresSoon(accessToken)) accessToken = await refreshTokens(auth, file)

  const accountId = auth.tokens?.account_id || accountIdFromToken(accessToken)
  if (!accountId) throw new Error(`Codex OAuth credentials at ${file} contain no ChatGPT account id.`)
  return { accessToken, accountId }
}
