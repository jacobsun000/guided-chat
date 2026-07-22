import { describe, expect, it } from "vitest"

import { CANVAS_THEME_CSS, CANVAS_UI_RUNTIME } from "./canvas-theme"

describe("canvas theme", () => {
  it("defines a distinct light and dark canvas design system", () => {
    expect(CANVAS_THEME_CSS).toContain("--canvas-primary")
    expect(CANVAS_THEME_CSS).toContain(".dark")
    expect(CANVAS_THEME_CSS).toContain(".canvas-root")
    expect(CANVAS_THEME_CSS).toContain(".canvas-card")
  })

  it("exposes the stable shadcn-inspired component primitives", () => {
    expect(() => new Function(CANVAS_UI_RUNTIME)).not.toThrow()
    for (const component of [
      "CanvasHeader",
      "CardContent",
      "Badge",
      "Alert",
      "Stat",
      "Progress",
      "SourceItem",
    ]) {
      expect(CANVAS_UI_RUNTIME).toContain(component)
    }
    expect(CANVAS_UI_RUNTIME).toContain("Object.freeze")
    expect(CANVAS_UI_RUNTIME).toContain("window.CanvasUI")
  })
})
