import taskData from "../../tasks/tasks.json"

import { DATASET_CATALOG } from "@/lib/dataset-catalog"

export type SourceReferenceType = "task" | "dataset"

export type SourceReferenceOption = {
  type: SourceReferenceType
  id: string
  name: string
  description: string
}

export type SourceReferenceMention = {
  type: SourceReferenceType
  id: string
  start: number
  end: number
}

export const SOURCE_REFERENCE_OPTIONS: SourceReferenceOption[] = [
  ...taskData.tasks.map((task) => ({
    type: "task" as const,
    id: task.id,
    name: task.name,
    description: task.content,
  })),
  ...DATASET_CATALOG.map((dataset) => ({
    type: "dataset" as const,
    id: dataset.slug,
    name: dataset.name,
    description: dataset.description,
  })),
]

export function getSourceReferenceOption(
  type: SourceReferenceType,
  id: string
) {
  return SOURCE_REFERENCE_OPTIONS.find(
    (option) => option.type === type && option.id === id
  )
}

export function getSourceReferenceText(
  reference: Pick<SourceReferenceOption, "type" | "name">
) {
  return `@${reference.type}/${reference.name}`
}

export function getChatReferenceHref(
  reference: Pick<SourceReferenceOption, "type" | "id">
) {
  return `/?reference=${encodeURIComponent(`${reference.type}:${reference.id}`)}`
}

export function parseChatReference(value: string | null) {
  if (!value) return undefined
  const separator = value.indexOf(":")
  if (separator < 1) return undefined
  const type = value.slice(0, separator)
  const id = value.slice(separator + 1)
  if (type !== "task" && type !== "dataset") return undefined
  return getSourceReferenceOption(type, id)
}
