import { describe, expect, it } from "vitest"
import { DATASET_CATALOG } from "@/lib/dataset-catalog"
import { DATASETS } from "@/lib/datasets"

describe("client dataset catalog", () => {
  it("matches server metadata", () => {
    expect(DATASET_CATALOG).toEqual(DATASETS.map(({ slug, metadata }) => ({ slug, name: metadata.name, description: metadata.description })))
  })
})
