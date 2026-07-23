import "server-only"

import { getDatasetBySlug } from "@/lib/datasets"
import {
  getSourceReferenceText,
  type SourceReferenceMention,
} from "@/lib/source-references"
import { getTaskById, getTaskDataset } from "@/lib/tasks"

type ResolvedReference = {
  type: "task" | "dataset"
  id: string
  name: string
  path: string
  relatedDatasetPath?: string
}

function resolveReference(
  mention: SourceReferenceMention
): ResolvedReference | undefined {
  if (mention.type === "task") {
    const task = getTaskById(mention.id)
    if (!task) return undefined
    const dataset = getTaskDataset(task)
    return {
      type: "task",
      id: task.id,
      name: task.name,
      path: `/tasks/${task.id}/task.md`,
      relatedDatasetPath: dataset
        ? `/datasets/${dataset.slug}`
        : undefined,
    }
  }

  const dataset = getDatasetBySlug(mention.id)
  if (!dataset) return undefined
  return {
    type: "dataset",
    id: dataset.slug,
    name: dataset.metadata.name,
    path: `/datasets/${dataset.slug}`,
  }
}

export function buildSourceReferencesContext(
  text: string,
  mentions: SourceReferenceMention[]
) {
  const resolved = new Map<string, ResolvedReference>()

  for (const mention of mentions) {
    if (
      mention.start < 0 ||
      mention.end <= mention.start ||
      mention.end > text.length
    ) {
      continue
    }
    const reference = resolveReference(mention)
    if (!reference) continue
    const expected = getSourceReferenceText(reference)
    if (text.slice(mention.start, mention.end) !== expected) continue
    resolved.set(`${reference.type}:${reference.id}`, reference)
  }

  if (!resolved.size) return undefined

  const lines = [
    "<references>",
    "These sources were explicitly selected with @ references. Inspect the exact read-only container paths as needed.",
  ]

  for (const reference of resolved.values()) {
    lines.push(`- type: ${reference.type}`)
    lines.push(`  name: ${reference.name}`)
    lines.push(`  path: ${reference.path}`)
    if (reference.relatedDatasetPath) {
      lines.push(`  related_dataset_path: ${reference.relatedDatasetPath}`)
    }
  }

  lines.push("</references>")
  return lines.join("\n")
}
