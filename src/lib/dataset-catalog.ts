export type DatasetCatalogEntry = {
  slug: string
  name: string
  description: string
}

export const DATASET_CATALOG: DatasetCatalogEntry[] = [
  {
    slug: "olist_brazilian_ecommerce",
    name: "Olist Brazilian E-Commerce",
    description:
      "An anonymized relational Brazilian e-commerce dataset covering orders, customers, sellers, products, payments, reviews, and geolocation from 2016 to 2018.",
  },
  {
    slug: "imdb_non_commercial_datasets",
    name: "IMDb Non-Commercial Datasets",
    description:
      "Official IMDb personal and non-commercial title and name data converted from UTF-8 TSV releases to CSV.",
  },
  {
    slug: "nyc_tlc_trip_records",
    name: "NYC Taxi and Limousine Commission Trip Records",
    description:
      "April 2026 official monthly TLC trip records for yellow, green, FHV, and HVFHV services, with the taxi-zone lookup table; Parquet trip files were converted to CSV.",
  },
  {
    slug: "hmda_mortgage",
    name: "HMDA Mortgage Data",
    description:
      "The official 2024 one-year national HMDA release, frozen June 2, 2026, covering loan applications, institutions, and MSA or MD reference data.",
  },
  {
    slug: "sec_financial_statement_notes",
    name: "SEC Financial Statement and Notes Data Sets",
    description:
      "Latest downloaded SEC XBRL-derived financial statement and notes releases: the 2026 Q1 financial statement set and the 2026 June notes set, converted from tab-delimited files to CSV.",
  },
]

export function getDatasetHref(slug: string) {
  return `/datasets/${encodeURIComponent(slug)}`
}
