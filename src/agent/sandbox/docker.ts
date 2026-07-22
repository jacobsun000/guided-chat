import "server-only"

import crypto from "node:crypto"
import { PassThrough, Writable } from "node:stream"
import Docker from "dockerode"
import { loadSandboxConfig, normalizeSandboxWorkdir, type SandboxConfig } from "./config"
import { SandboxInfrastructureError, type SandboxExecRequest, type SandboxExecResult, type SandboxManager, type SandboxPatchResult } from "./types"

const MANAGED = "guided-chat.managed"
const HASH = "guided-chat.thread-hash"
const VERSION = "guided-chat.sandbox-version"
const SANDBOX_VERSION = "1"
const OUTPUT_LIMIT = 16 * 1024

export function sandboxIdentity(threadId: string) {
  const hash = crypto.createHash("sha256").update(threadId).digest("hex")
  const short = hash.slice(0, 24)
  return { hash, containerName: `guided-chat-sandbox-${short}`, volumeName: `guided-chat-workspace-${short}` }
}

class CappedSink extends Writable {
  private head = Buffer.alloc(0); private tail = Buffer.alloc(0); private size = 0
  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    const value = Buffer.from(chunk); this.size += value.length
    const side = Math.floor(OUTPUT_LIMIT / 2)
    if (this.head.length < side) this.head = Buffer.concat([this.head, value.subarray(0, side - this.head.length)])
    this.tail = Buffer.concat([this.tail, value]); if (this.tail.length > side) this.tail = this.tail.subarray(this.tail.length - side)
    callback()
  }
  result() {
    if (this.size <= OUTPUT_LIMIT) return { text: (this.size <= this.head.length ? this.head : Buffer.concat([this.head, this.tail.subarray(Math.max(0, this.head.length + this.tail.length - this.size))])).toString("utf8"), truncated: false }
    const marker = Buffer.from("\n... output truncated ...\n")
    return { text: Buffer.concat([this.head, marker, this.tail]).toString("utf8"), truncated: true }
  }
}

export class DockerSandboxManager implements SandboxManager {
  private readonly docker: Docker; private readonly config: SandboxConfig
  private readonly creations = new Map<string, Promise<Docker.Container>>()
  private readonly queues = new Map<string, Promise<unknown>>()
  constructor(options: { docker?: Docker; config?: SandboxConfig } = {}) {
    this.docker = options.docker ?? new Docker(); this.config = options.config ?? loadSandboxConfig()
  }

  private queued<T>(threadId: string, operation: () => Promise<T>): Promise<T> {
    const prior = this.queues.get(threadId) ?? Promise.resolve()
    const current = prior.catch(() => undefined).then(operation)
    this.queues.set(threadId, current)
    void current.finally(() => { if (this.queues.get(threadId) === current) this.queues.delete(threadId) }).catch(() => undefined)
    return current
  }

  private labels(hash: string) { return { [MANAGED]: "true", [HASH]: hash, [VERSION]: SANDBOX_VERSION } }

  private async ensure(threadId: string) {
    const identity = sandboxIdentity(threadId)
    const pending = this.creations.get(identity.hash)
    if (pending) return pending
    const creation = this.ensureInner(identity).finally(() => this.creations.delete(identity.hash))
    this.creations.set(identity.hash, creation); return creation
  }

  private async ensureInner(identity: ReturnType<typeof sandboxIdentity>) {
    let configuredImage: Docker.ImageInspectInfo
    try {
      configuredImage = await this.docker.getImage(this.config.image).inspect()
    } catch (cause) { throw new SandboxInfrastructureError(`Sandbox image '${this.config.image}' is missing. Run pnpm sandbox:build.`, { cause }) }
    let container = this.docker.getContainer(identity.containerName)
    try {
      const info = await container.inspect()
      if (info.Config.Labels?.[MANAGED] !== "true" || info.Config.Labels?.[HASH] !== identity.hash) {
        throw new SandboxInfrastructureError(`Docker resource name collision for ${identity.containerName}.`)
      }
      if (info.Image !== configuredImage.Id || info.Config.Labels?.[VERSION] !== SANDBOX_VERSION) {
        await container.remove({ force: true }); container = await this.createContainer(identity)
      } else if (!info.State.Running) await container.start()
      return container
    } catch (error) {
      if (error instanceof SandboxInfrastructureError) throw error
      if ((error as { statusCode?: number }).statusCode !== 404) throw new SandboxInfrastructureError("Unable to inspect or start the Docker sandbox.", { cause: error })
      return this.createContainer(identity)
    }
  }

  private async createContainer(identity: ReturnType<typeof sandboxIdentity>) {
    let volumeExists = true
    try {
      const volume = await this.docker.getVolume(identity.volumeName).inspect()
      if (volume.Labels?.[MANAGED] !== "true" || volume.Labels?.[HASH] !== identity.hash) throw new SandboxInfrastructureError(`Docker resource name collision for ${identity.volumeName}.`)
    } catch (error) {
      if (error instanceof SandboxInfrastructureError) throw error
      if ((error as { statusCode?: number }).statusCode !== 404) throw error
      volumeExists = false
      await this.docker.createVolume({ Name: identity.volumeName, Labels: this.labels(identity.hash) })
    }
    if (!volumeExists) await this.initializeVolume(identity)
    const memory = this.config.memoryMb * 1024 * 1024
    const container = await this.docker.createContainer({
      name: identity.containerName, Image: this.config.image, Cmd: ["sleep", "infinity"], User: "10001:10001",
      Labels: this.labels(identity.hash), Env: ["HOME=/workspace/.home"], WorkingDir: "/workspace",
      HostConfig: { ReadonlyRootfs: true, CapDrop: ["ALL"], SecurityOpt: ["no-new-privileges:true"], Init: true,
        NetworkMode: "bridge", RestartPolicy: { Name: "no" }, NanoCpus: Math.round(this.config.cpus * 1e9), Memory: memory,
        MemorySwap: memory + this.config.swapMb * 1024 * 1024, PidsLimit: this.config.pids,
        Binds: [`${identity.volumeName}:/workspace`, `${this.config.datasetsPath}:/datasets:ro`], Tmpfs: { "/tmp": "rw,nosuid,nodev,size=2147483648" } },
    })
    await container.start(); return container
  }

  private async initializeVolume(identity: ReturnType<typeof sandboxIdentity>) {
    const helper = await this.docker.createContainer({ Image: this.config.image, Cmd: ["chown", "10001:10001", "/workspace"], User: "0:0",
      HostConfig: { AutoRemove: false, NetworkMode: "none", CapDrop: ["ALL"], CapAdd: ["CHOWN"], SecurityOpt: ["no-new-privileges:true"], Binds: [`${identity.volumeName}:/workspace`] } })
    try { await helper.start(); const status = await helper.wait(); if (status.StatusCode !== 0) throw new Error("workspace initialization failed") }
    finally { try { await helper.remove({ force: true }) } catch {} }
  }

  exec(threadId: string, request: SandboxExecRequest, abortSignal?: AbortSignal) {
    return this.queued(threadId, () => this.run(threadId, request, abortSignal))
  }

  private async run(threadId: string, request: SandboxExecRequest, abortSignal?: AbortSignal): Promise<SandboxExecResult> {
    const workdir = normalizeSandboxWorkdir(request.workdir)
    const timeout = request.timeoutMs ?? this.config.defaultTimeoutMs
    if (timeout < 1000 || timeout > this.config.maxTimeoutMs) throw new Error(`timeoutMs must be between 1000 and ${this.config.maxTimeoutMs}.`)
    const container = await this.ensure(threadId); const executionId = crypto.randomUUID(); const pidFile = `/tmp/guided-chat-${executionId}.pgid`
    const started = Date.now(); let timedOut = false
    const execution = await container.exec({ Cmd: ["setsid", "/bin/bash", "-c", `echo $$ > "$1"; exec /bin/bash -lc "$2"`, "guided-chat", pidFile, request.cmd], WorkingDir: workdir, AttachStdout: true, AttachStderr: true, Tty: false })
    const stream = await execution.start({ hijack: true, stdin: false }); const stdout = new CappedSink(); const stderr = new CappedSink()
    this.docker.modem.demuxStream(stream as unknown as NodeJS.ReadableStream, stdout, stderr)
    let killStarted = false
    const signalGroup = async (signal: "TERM" | "KILL") => {
      try { const stop = await container.exec({ Cmd: ["/bin/bash", "-lc", `test -f '${pidFile}' && kill -${signal} -- -$(cat '${pidFile}') || true`], AttachStdout: false, AttachStderr: false }); await stop.start({}) } catch {}
    }
    const kill = async () => {
      if (killStarted) return; killStarted = true
      await signalGroup("TERM")
      setTimeout(() => { void signalGroup("KILL") }, 2_000)
    }
    const onAbort = () => { void kill() }; abortSignal?.addEventListener("abort", onAbort, { once: true })
    const timer = setTimeout(() => { timedOut = true; void kill() }, timeout)
    try { await new Promise<void>((resolve, reject) => { stream.once("end", resolve); stream.once("error", reject) }) }
    finally { clearTimeout(timer); abortSignal?.removeEventListener("abort", onAbort) }
    const inspect = await execution.inspect(); const out = stdout.result(); const err = stderr.result()
    return { exitCode: inspect.ExitCode ?? (timedOut ? 124 : 1), stdout: out.text, stderr: err.text, truncated: out.truncated || err.truncated, timedOut, durationMs: Date.now() - started }
  }

  applyPatch(threadId: string, patch: string, abortSignal?: AbortSignal): Promise<SandboxPatchResult> {
    return this.queued(threadId, async () => {
      const result = await this.runPatch(threadId, patch, abortSignal)
      const changedFiles = [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)].map((match) => match[1] ?? match[2])
      return { ...result, changedFiles: [...new Set(changedFiles)] }
    })
  }

  private async runPatch(threadId: string, patch: string, abortSignal?: AbortSignal) {
    const container = await this.ensure(threadId); const started = Date.now()
    const execution = await container.exec({ Cmd: ["/opt/guided-chat/apply_patch"], WorkingDir: "/workspace", AttachStdin: true, AttachStdout: true, AttachStderr: true, Tty: false })
    const stream = await execution.start({ hijack: true, stdin: true }); const stdout = new CappedSink(); const stderr = new CappedSink()
    this.docker.modem.demuxStream(stream as unknown as NodeJS.ReadableStream, stdout, stderr)
    const duplex = stream as unknown as PassThrough; duplex.write(patch); duplex.end()
    const timeout = this.config.defaultTimeoutMs; let timedOut = false
    const timer = setTimeout(() => { timedOut = true; duplex.destroy() }, timeout)
    const onAbort = () => duplex.destroy(); abortSignal?.addEventListener("abort", onAbort, { once: true })
    try { await new Promise<void>((resolve, reject) => { stream.once("end", resolve); stream.once("error", reject) }) } finally { clearTimeout(timer); abortSignal?.removeEventListener("abort", onAbort) }
    const inspect = await execution.inspect(); const out = stdout.result(); const err = stderr.result()
    return { exitCode: inspect.ExitCode ?? 1, stdout: out.text, stderr: err.text, truncated: out.truncated || err.truncated, timedOut, durationMs: Date.now() - started }
  }

  async reconcile(validThreadIds: string[]) {
    const valid = new Set(validThreadIds.map((id) => sandboxIdentity(id).hash))
    const containers = await this.docker.listContainers({ all: true, filters: { label: [`${MANAGED}=true`] } })
    for (const info of containers) {
      const hash = info.Labels[HASH]; const expectedName = hash ? `/guided-chat-sandbox-${hash.slice(0, 24)}` : ""
      if (!hash || info.Names?.[0] !== expectedName || valid.has(hash)) continue
      await this.docker.getContainer(info.Id).remove({ force: true })
    }
    const volumes = await this.docker.listVolumes({ filters: { label: [`${MANAGED}=true`] } })
    for (const volume of volumes.Volumes ?? []) {
      const hash = volume.Labels?.[HASH]; const expectedName = hash ? `guided-chat-workspace-${hash.slice(0, 24)}` : ""
      if (!hash || volume.Name !== expectedName || valid.has(hash)) continue
      await this.docker.getVolume(volume.Name).remove()
    }
  }
}

let singleton: DockerSandboxManager | undefined
export function getSandboxManager() { return singleton ??= new DockerSandboxManager() }
