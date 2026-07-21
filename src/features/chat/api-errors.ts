import type { ApiErrorCode } from "./schemas"

export function jsonError(code: ApiErrorCode, message: string, status = 400) {
  return Response.json({ error: { code, message } }, { status })
}

