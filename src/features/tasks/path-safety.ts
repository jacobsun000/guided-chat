import "server-only"

import { resolve, sep } from "node:path"

export function resolveWithin(root: string, ...segments: string[]) {
  const resolvedRoot = resolve(root)
  const candidate = resolve(resolvedRoot, ...segments)
  if (candidate !== resolvedRoot && !candidate.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error("Path escapes the configured task directory.")
  }
  return candidate
}

