import Link from "next/link"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
  NotebookTabsIcon,
} from "lucide-react"
import { notFound } from "next/navigation"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { TaskPreview } from "@/components/task-preview"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDatasetBySlug, getDatasetFileHref } from "@/lib/datasets"
import { getTaskEvaluationCount } from "@/lib/task-results"
import { getTasksByDatasetId } from "@/lib/tasks"

export const dynamic = "force-dynamic"

type DatasetPageProps = {
  params: Promise<{ datasetId: string }>
}

export default async function DatasetPage({ params }: DatasetPageProps) {
  const { datasetId } = await params
  const dataset = getDatasetBySlug(datasetId)

  if (!dataset) {
    notFound()
  }

  const relatedTasks = getTasksByDatasetId(dataset.metadata.id)
  const evaluationCounts = new Map(
    await Promise.all(
      relatedTasks.map(async (task) => [
        task.id,
        await getTaskEvaluationCount(task.id),
      ] as const)
    )
  )

  return (
    <DatasetPageShell title={dataset.metadata.name}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/datasets"
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon />
            All datasets
          </Link>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              Dataset
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight">
              {dataset.metadata.name}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {dataset.metadata.description}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              Select a file to view the first rows of its CSV data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {dataset.metadata.files.map((file) => (
                <Link
                  key={file.path}
                  href={getDatasetFileHref(dataset.slug, file.path)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <FileTextIcon className="shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{file.path}</span>
                    <span className="text-xs text-muted-foreground">
                      {file.description}
                    </span>
                  </span>
                  <ArrowRightIcon className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookTabsIcon />
              Related tasks
            </CardTitle>
            <CardDescription>
              {relatedTasks.length} research task
              {relatedTasks.length === 1 ? "" : "s"} using this dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {relatedTasks.length ? (
              <div className="divide-y">
                {relatedTasks.map((task) => (
                  <TaskPreview
                    key={task.id}
                    task={task}
                    evaluationCount={evaluationCounts.get(task.id) ?? 0}
                  />
                ))}
              </div>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                No research tasks are associated with this dataset yet.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </DatasetPageShell>
  )
}
