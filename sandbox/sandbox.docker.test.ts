import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { DockerSandboxManager, sandboxIdentity } from "../src/agent/sandbox/docker"
import { loadSandboxConfig } from "../src/agent/sandbox/config"
import Docker from "dockerode"

const enabled = process.env.GUIDED_CHAT_RUN_SANDBOX_TESTS === "1"
describe.skipIf(!enabled)("sandbox image", () => {
  it("contains the analysis stack and patch helper", () => {
    const output = execFileSync("docker", ["run", "--rm", "--read-only", "--tmpfs", "/tmp", "guided-chat-sandbox:local", "python", "-c", "import duckdb,pandas,polars,pyarrow,numpy,scipy,sklearn,matplotlib,seaborn; print('ok')"], { encoding: "utf8" })
    expect(output.trim()).toBe("ok")
  })

  it("persists a thread workspace, mounts datasets read-only, and reconciles it", async () => {
    const docker = new Docker()
    const manager = new DockerSandboxManager({ docker, config: loadSandboxConfig() })
    const threadId = `integration-${Date.now()}`
    const identity = sandboxIdentity(threadId)
    try {
      const patch = "*** Begin Patch\n*** Add File: result.txt\n+persisted\n*** End Patch\n"
      expect((await manager.applyPatch(threadId, patch)).exitCode).toBe(0)
      const first = await manager.exec(threadId, { cmd: "cat result.txt; test -r /datasets/olist_brazilian_ecommerce/metadata.json; test ! -w /datasets" })
      expect(first).toMatchObject({ exitCode: 0, stdout: "persisted\n" })
      await docker.getContainer(identity.containerName).remove({ force: true })
      expect((await manager.exec(threadId, { cmd: "cat result.txt" })).stdout).toBe("persisted\n")
      const inspection = await docker.getContainer(identity.containerName).inspect()
      expect(inspection.Config.User).toBe("10001:10001")
      expect(inspection.HostConfig.ReadonlyRootfs).toBe(true)
      expect(inspection.HostConfig.CapDrop).toContain("ALL")
      await manager.reconcile([])
      await expect(docker.getContainer(identity.containerName).inspect()).rejects.toMatchObject({ statusCode: 404 })
      await expect(docker.getVolume(identity.volumeName).inspect()).rejects.toMatchObject({ statusCode: 404 })
    } finally {
      await manager.reconcile([])
    }
  })
})
