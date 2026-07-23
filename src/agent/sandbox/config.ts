import "server-only"

import fs from "node:fs"
import path from "node:path"

export type SandboxConfig = {
  image: string; datasetsPath: string; tasksPath: string; cpus: number; memoryMb: number
  swapMb: number; pids: number; defaultTimeoutMs: number; maxTimeoutMs: number
}

function positiveNumber(env: NodeJS.ProcessEnv, name: string, fallback: number, integer = true) {
  const raw = env[name]
  if (raw == null || raw.trim() === "") return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0 || (integer && !Number.isInteger(value))) {
    throw new Error(`${name} must be a positive ${integer ? "integer" : "number"}.`)
  }
  return value
}

export function loadSandboxConfig(env: NodeJS.ProcessEnv = process.env): SandboxConfig {
  const configured = env.GUIDED_CHAT_DATASETS_PATH?.trim() || path.join(process.cwd(), "datasets")
  const configuredTasks = env.GUIDED_CHAT_TASKS_PATH?.trim() || path.join(process.cwd(), "tasks")
  let datasetsPath: string
  let tasksPath: string
  try { datasetsPath = fs.realpathSync(configured) } catch {
    throw new Error(`Sandbox datasets directory does not exist: ${path.resolve(configured)}`)
  }
  if (!fs.statSync(datasetsPath).isDirectory()) throw new Error(`Sandbox datasets path is not a directory: ${datasetsPath}`)
  try { tasksPath = fs.realpathSync(configuredTasks) } catch {
    throw new Error(`Sandbox tasks directory does not exist: ${path.resolve(configuredTasks)}`)
  }
  if (!fs.statSync(tasksPath).isDirectory()) throw new Error(`Sandbox tasks path is not a directory: ${tasksPath}`)
  const defaultTimeoutMs = positiveNumber(env, "GUIDED_CHAT_SANDBOX_EXEC_TIMEOUT_MS", 120_000)
  const maxTimeoutMs = positiveNumber(env, "GUIDED_CHAT_SANDBOX_EXEC_MAX_TIMEOUT_MS", 1_800_000)
  if (defaultTimeoutMs > maxTimeoutMs) throw new Error("Sandbox default timeout cannot exceed its maximum timeout.")
  return {
    image: env.GUIDED_CHAT_SANDBOX_IMAGE?.trim() || "guided-chat-sandbox:local",
    datasetsPath,
    tasksPath,
    cpus: positiveNumber(env, "GUIDED_CHAT_SANDBOX_CPUS", 4, false),
    memoryMb: positiveNumber(env, "GUIDED_CHAT_SANDBOX_MEMORY_MB", 8192),
    swapMb: positiveNumber(env, "GUIDED_CHAT_SANDBOX_SWAP_MB", 8192),
    pids: positiveNumber(env, "GUIDED_CHAT_SANDBOX_PIDS", 512), defaultTimeoutMs, maxTimeoutMs,
  }
}

export function normalizeSandboxWorkdir(input?: string) {
  if (!input) return "/workspace"
  const absolute = input.startsWith("/") ? path.posix.normalize(input) : path.posix.resolve("/workspace", input)
  if (absolute !== "/workspace" && !absolute.startsWith("/workspace/") && absolute !== "/datasets" && !absolute.startsWith("/datasets/") && absolute !== "/tasks" && !absolute.startsWith("/tasks/")) {
    throw new Error("workdir must be beneath /workspace, /datasets, or /tasks.")
  }
  return absolute
}
