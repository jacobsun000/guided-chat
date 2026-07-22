import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "test/server-only.ts") } },
  test: { include: ["sandbox/**/*.docker.test.ts"], testTimeout: 1_800_000 },
})
