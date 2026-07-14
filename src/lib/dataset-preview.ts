import { getDatasetBySlug, type DatasetPreview } from "@/lib/datasets"

export const DATASET_PREVIEW_ROW_LIMIT = 50

export type CsvPreview = DatasetPreview

export function getCsvPreview(slug: string, filePath: string) {
  const dataset = getDatasetBySlug(slug)
  const file = dataset?.metadata.files.find((candidate) => {
    return candidate.path === filePath
  })

  if (!dataset || !file) {
    return null
  }

  return {
    dataset,
    filePath: file.path,
    fileDescription: file.description,
    preview: file.preview,
  }
}
