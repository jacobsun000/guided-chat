import taskData from "../../tasks/dataset_tasks.json"

import { DATASETS, getDatasetHref, type Dataset } from "@/lib/datasets"

export type TaskDifficulty = "low" | "medium" | "high"

export type ResearchTask = {
  id: string
  metadata: {
    verifiable: boolean
    verificationMethod: string
    diffuculty: TaskDifficulty
  }
  dataset: string
  name: string
  content: string
}

export const TASKS = taskData.tasks as ResearchTask[]

export function getTaskById(id: string) {
  return TASKS.find((task) => task.id === id)
}

export function getTaskHref(id: string) {
  return `/tasks/${encodeURIComponent(id)}`
}

export function getTaskDataset(task: ResearchTask): Dataset | undefined {
  return DATASETS.find((dataset) => dataset.metadata.id === task.dataset)
}

export function getTaskDatasetHref(task: ResearchTask) {
  const dataset = getTaskDataset(task)
  return dataset ? getDatasetHref(dataset.slug) : undefined
}
