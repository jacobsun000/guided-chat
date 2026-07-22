export type SandboxExecRequest = { cmd: string; workdir?: string; timeoutMs?: number }

export type SandboxExecResult = {
  exitCode: number
  stdout: string
  stderr: string
  truncated: boolean
  timedOut: boolean
  durationMs: number
}

export type SandboxPatchResult = SandboxExecResult & { changedFiles: string[] }

export interface SandboxManager {
  exec(threadId: string, request: SandboxExecRequest, abortSignal?: AbortSignal): Promise<SandboxExecResult>
  applyPatch(threadId: string, patch: string, abortSignal?: AbortSignal): Promise<SandboxPatchResult>
  reconcile(validThreadIds: string[]): Promise<void>
}

export class SandboxInfrastructureError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "SandboxInfrastructureError"
  }
}
