import { describe, expect, it } from "vitest"
import taskData from "../../../tasks/tasks.json"
import { researchTaskSchema } from "./schemas"

describe("task catalog", () => {
  it("uses valid difficulty metadata", () => {
    expect(() => researchTaskSchema.array().parse(taskData.tasks)).not.toThrow()
  })
})
