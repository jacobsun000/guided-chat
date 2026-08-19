import { describe, expect, it } from "vitest"

import { BASELINE_SYSTEM_PROMPT, SCAFFOLDING_SYSTEM_PROMPT } from "./prompts"

describe("agent mode prompts", () => {
  it("keeps the baseline prompt short and focused on data analysis tools", () => {
    expect(BASELINE_SYSTEM_PROMPT).toContain("data analysis agent")
    for (const tool of ["web_search", "read_image", "exec", "apply_patch"]) {
      expect(BASELINE_SYSTEM_PROMPT).toContain(tool)
    }
    expect(BASELINE_SYSTEM_PROMPT).toContain("@task and @dataset")
    expect(BASELINE_SYSTEM_PROMPT.length).toBeLessThan(1_000)
  })

  it("leaves scaffolding as an explicit placeholder", () => {
    expect(SCAFFOLDING_SYSTEM_PROMPT).toContain("not implemented")
  })
})
