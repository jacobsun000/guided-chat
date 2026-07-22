import { tool } from "ai"
import { z } from "zod"
import type { SandboxManager } from "../sandbox/types"

export const sandboxExecInputSchema = z.object({
  cmd: z.string().min(1).max(32 * 1024),
  workdir: z.string().max(512).optional(),
  timeoutMs: z.number().int().min(1_000).max(1_800_000).optional(),
})
export const sandboxPatchInputSchema = z.object({ patch: z.string().min(1).max(256 * 1024) })

function actionableError(error: unknown) {
  return error instanceof Error ? error.message : "The sandbox operation failed."
}

export function createSandboxTools(manager: SandboxManager, threadId: string, abortSignal?: AbortSignal) {
  return {
    exec: tool({
      description: "Run a non-interactive Bash command in this thread's persistent Docker sandbox.",
      inputSchema: sandboxExecInputSchema,
      execute: async (input) => {
        try { return await manager.exec(threadId, input, abortSignal) }
        catch (error) { throw new Error(actionableError(error), { cause: error }) }
      },
    }),
    apply_patch: tool({
      description: "Apply a Codex-format patch to files in this thread's persistent /workspace.",
      inputSchema: sandboxPatchInputSchema,
      execute: async ({ patch }) => {
        try { return await manager.applyPatch(threadId, patch, abortSignal) }
        catch (error) { throw new Error(actionableError(error), { cause: error }) }
      },
    }),
  }
}
