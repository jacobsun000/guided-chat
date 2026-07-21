import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

export const TASK_RESULT_PREVIEW_ROW_LIMIT = 50

export type TaskResultFileKind = "markdown" | "csv"

export type TaskResultFile = {
  name: string
  kind: TaskResultFileKind
  size: number
}

export type TaskEvaluation = {
  id: string
  name: string
  files: TaskResultFile[]
}

export type TaskResultCsvPreview = {
  columns: string[]
  rows: string[][]
  rowCount: number
  truncated: boolean
}

export type TaskResultFileDetails = TaskResultFile & {
  content: string
  csvPreview?: TaskResultCsvPreview
}

export type TaskEvaluationDetails = TaskEvaluation & {
  file: TaskResultFileDetails
}

const TASKS_DIRECTORY = path.join(process.cwd(), "tasks")

function isSafePathSegment(value: string) {
  return Boolean(value) && value !== "." && value !== ".." &&
    !value.includes("/") && !value.includes("\\")
}

function getTaskDirectory(taskId: string) {
  return isSafePathSegment(taskId)
    ? path.join(TASKS_DIRECTORY, taskId)
    : null
}

function getEvaluationDirectory(taskId: string, evaluationId: string) {
  const taskDirectory = getTaskDirectory(taskId)

  return taskDirectory && isSafePathSegment(evaluationId)
    ? path.join(taskDirectory, evaluationId)
    : null
}

function getFileKind(fileName: string): TaskResultFileKind | null {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === ".md" || extension === ".markdown") {
    return "markdown"
  }

  if (extension === ".csv") {
    return "csv"
  }

  return null
}

function humanize(value: string) {
  return value
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3) {
        return word.toUpperCase()
      }

      return `${word[0].toUpperCase()}${word.slice(1)}`
    })
    .join(" ")
}

async function collectFiles(
  directory: string,
  relativeDirectory = ""
): Promise<TaskResultFile[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: TaskResultFile[] = []

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    const relativeName = relativeDirectory
      ? path.posix.join(relativeDirectory, entry.name)
      : entry.name
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath, relativeName)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const kind = getFileKind(entry.name)
    if (!kind) {
      continue
    }

    const fileStats = await stat(entryPath)
    files.push({ name: relativeName, kind, size: fileStats.size })
  }

  return files.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "markdown" ? -1 : 1
    }

    return left.name.localeCompare(right.name)
  })
}

async function getEvaluationFiles(taskId: string, evaluationId: string) {
  const evaluationDirectory = getEvaluationDirectory(taskId, evaluationId)

  if (!evaluationDirectory) {
    return null
  }

  try {
    const directoryStats = await stat(evaluationDirectory)
    if (!directoryStats.isDirectory()) {
      return null
    }

    return {
      directory: evaluationDirectory,
      files: await collectFiles(evaluationDirectory),
    }
  } catch {
    return null
  }
}

export async function getTaskEvaluations(taskId: string): Promise<TaskEvaluation[]> {
  const taskDirectory = getTaskDirectory(taskId)

  if (!taskDirectory) {
    return []
  }

  let entries
  try {
    entries = await readdir(taskDirectory, { withFileTypes: true })
  } catch {
    return []
  }

  const evaluations = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const result = await getEvaluationFiles(taskId, entry.name)

        if (!result || !result.files.length) {
          return null
        }

        return {
          id: entry.name,
          name: humanize(entry.name),
          files: result.files,
        }
      })
  )

  return evaluations.filter((evaluation): evaluation is TaskEvaluation => evaluation !== null)
}

export async function getTaskEvaluationCount(taskId: string) {
  return (await getTaskEvaluations(taskId)).length
}

export function getTaskEvaluationHref(
  taskId: string,
  evaluationId: string,
  fileName?: string
) {
  const href = `/tasks/${encodeURIComponent(taskId)}/evaluations/${encodeURIComponent(evaluationId)}`

  return fileName ? `${href}?file=${encodeURIComponent(fileName)}` : href
}

function parseCsvRecords(content: string) {
  const records: string[][] = []
  let record: string[] = []
  let field = ""
  let inQuotes = false

  const pushRecord = () => {
    if (record.length || field !== "") {
      record.push(field)
      records.push(record)
    }

    record = []
    field = ""
  }

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]

    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += character
      }
      continue
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true
    } else if (character === ",") {
      record.push(field)
      field = ""
    } else if (character === "\n") {
      pushRecord()
    } else if (character !== "\r") {
      field += character
    }
  }

  if (record.length || field) {
    pushRecord()
  }

  return records
}

export function getCsvPreview(
  content: string,
  rowLimit = TASK_RESULT_PREVIEW_ROW_LIMIT
): TaskResultCsvPreview {
  const records = parseCsvRecords(content)

  if (!records.length) {
    return { columns: [], rows: [], rowCount: 0, truncated: false }
  }

  const [columns, ...dataRows] = records
  const normalizedColumns = columns.map((column, index) =>
    index === 0 ? column.replace(/^\uFEFF/u, "") : column
  )

  return {
    columns: normalizedColumns,
    rows: dataRows.slice(0, rowLimit),
    rowCount: dataRows.length,
    truncated: dataRows.length > rowLimit,
  }
}

export async function getTaskEvaluation(
  taskId: string,
  evaluationId: string,
  requestedFileName?: string
): Promise<TaskEvaluationDetails | null> {
  const result = await getEvaluationFiles(taskId, evaluationId)

  if (!result || !result.files.length) {
    return null
  }

  const selectedFile =
    result.files.find((file) => file.name === requestedFileName) ??
    result.files.find((file) => file.kind === "markdown") ??
    result.files[0]
  const filePath = path.join(
    result.directory,
    ...selectedFile.name.split("/")
  )
  const content = await readFile(filePath, "utf-8")

  return {
    id: evaluationId,
    name: humanize(evaluationId),
    files: result.files,
    file: {
      ...selectedFile,
      content,
      ...(selectedFile.kind === "csv"
        ? { csvPreview: getCsvPreview(content) }
        : {}),
    },
  }
}
