import { createHash } from "node:crypto"

import { compile } from "tailwindcss"
import { TAILWIND_STYLESHEETS } from "@/features/html-output/server/tailwind-stylesheets"

type TailwindRequestBody = {
  source?: unknown
}

const MAX_SOURCE_LENGTH = 120_000
const cssCache = new Map<string, string>()
const MAX_CACHE_ENTRIES = 100
const tailwindCssBase = "/tailwindcss"

const APP_THEME_CSS = `
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.553 0.195 38.402);
  --primary-foreground: oklch(0.98 0.016 73.684);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.837 0.128 66.29);
  --chart-2: oklch(0.705 0.213 47.604);
  --chart-3: oklch(0.646 0.222 41.116);
  --chart-4: oklch(0.553 0.195 38.402);
  --chart-5: oklch(0.47 0.157 37.304);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.646 0.222 41.116);
  --sidebar-primary-foreground: oklch(0.98 0.016 73.684);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.47 0.157 37.304);
  --primary-foreground: oklch(0.98 0.016 73.684);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.837 0.128 66.29);
  --chart-2: oklch(0.705 0.213 47.604);
  --chart-3: oklch(0.646 0.222 41.116);
  --chart-4: oklch(0.553 0.195 38.402);
  --chart-5: oklch(0.47 0.157 37.304);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.705 0.213 47.604);
  --sidebar-primary-foreground: oklch(0.98 0.016 73.684);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
`

const TAILWIND_SEED_CSS = `
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);
@custom-variant dark (&:is(.dark *));
${APP_THEME_CSS}
`

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

function extractCandidates(source: string) {
  const candidates = new Set<string>()
  const classAttributePattern =
    /\bclass(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{(?:"([^"]*)"|'([^']*)'|`([^`]*)`)\})/g

  for (const match of source.matchAll(classAttributePattern)) {
    const classValue =
      match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? ""

    for (const candidate of classValue.split(/\s+/)) {
      if (candidate) {
        candidates.add(candidate)
      }
    }
  }

  return [...candidates]
}

async function loadTailwindStylesheet(id: string) {
  const content = TAILWIND_STYLESHEETS[id]
  if (!content) throw new Error(`Unsupported Tailwind stylesheet: ${id}`)

  return {
    path: `${tailwindCssBase}/${id.split("/").at(-1)}`,
    base: tailwindCssBase,
    content,
  }
}

export async function POST(request: Request) {
  let body: TailwindRequestBody

  try {
    body = (await request.json()) as TailwindRequestBody
  } catch {
    return jsonError("Request body must be valid JSON.")
  }

  if (typeof body.source !== "string") {
    return jsonError("Request body must include a source string.")
  }

  if (body.source.length > MAX_SOURCE_LENGTH) {
    return jsonError("HTML source is too large.", 413)
  }

  const hash = createHash("sha256").update(body.source).digest("hex")
  const cachedCss = cssCache.get(hash)

  if (cachedCss) {
    return Response.json({ css: cachedCss, hash })
  }

  try {
    const compiler = await compile(TAILWIND_SEED_CSS, {
      base: tailwindCssBase,
      loadStylesheet: loadTailwindStylesheet,
    })
    const css = compiler.build(extractCandidates(body.source))

    cssCache.set(hash, css)
    if (cssCache.size > MAX_CACHE_ENTRIES) {
      const oldest = cssCache.keys().next().value
      if (oldest) cssCache.delete(oldest)
    }

    return Response.json({ css, hash })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to compile Tailwind CSS."

    return jsonError(message, 500)
  }
}
