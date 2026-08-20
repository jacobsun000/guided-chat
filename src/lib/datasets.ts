// Keep runtime metadata outside the raw-dataset tree so the dev bundler never
// needs to traverse or watch the CSV directories.
import olistMetadata from "@/data/datasets/olist_brazilian_ecommerce.json"
import imdbMetadata from "@/data/datasets/imdb_non_commercial_datasets.json"
import nycTlcMetadata from "@/data/datasets/nyc_tlc_trip_records.json"
import hmdaMetadata from "@/data/datasets/hmda_mortgage.json"
import secMetadata from "@/data/datasets/sec_financial_statement_notes.json"
import tcgaMetadata from "@/data/datasets/tcga_pancancer_gene_expression.json"

export type DatasetFile = {
  path: string
  description: string
  preview: DatasetPreview
}

export type DatasetPreview = {
  columns: string[]
  rows: string[][]
  rowCount: number
  truncated: boolean
}

export type DatasetMetadata = {
  id: string
  name: string
  description: string
  files: DatasetFile[]
}

export type Dataset = {
  slug: string
  metadata: DatasetMetadata
}

export const DATASETS: Dataset[] = [
  {
    slug: "olist_brazilian_ecommerce",
    metadata: olistMetadata.dataset,
  },
  {
    slug: "imdb_non_commercial_datasets",
    metadata: imdbMetadata.dataset,
  },
  {
    slug: "nyc_tlc_trip_records",
    metadata: nycTlcMetadata.dataset,
  },
  {
    slug: "hmda_mortgage",
    metadata: hmdaMetadata.dataset,
  },
  {
    slug: "sec_financial_statement_notes",
    metadata: secMetadata.dataset,
  },
  {
    slug: "tcga_pancancer_gene_expression",
    metadata: tcgaMetadata.dataset,
  },
]

export function getDatasetBySlug(slug: string) {
  return DATASETS.find((dataset) => dataset.slug === slug)
}

export function getDatasetHref(slug: string) {
  return `/datasets/${encodeURIComponent(slug)}`
}

export function getDatasetFileHref(slug: string, filePath: string) {
  return `${getDatasetHref(slug)}/${encodeURIComponent(filePath)}`
}
