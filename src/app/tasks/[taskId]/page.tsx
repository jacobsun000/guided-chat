import Link from "next/link"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AtSignIcon,
  BadgeCheckIcon,
  BadgeQuestionMarkIcon,
  DatabaseIcon,
  GaugeIcon,
} from "lucide-react"
import { notFound } from "next/navigation"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getTaskById,
  getTaskDataset,
  getTaskDatasetHref,
} from "@/lib/tasks"
import {
  getTaskEvaluationHref,
  getTaskEvaluations,
} from "@/lib/task-results"
import { getChatReferenceHref } from "@/lib/source-references"

export const dynamic = "force-dynamic"

type TaskPageProps = {
  params: Promise<{ taskId: string }>
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { taskId } = await params
  const task = getTaskById(taskId)

  if (!task) {
    notFound()
  }

  const dataset = getTaskDataset(task)
  const datasetHref = getTaskDatasetHref(task)
  const evaluations = await getTaskEvaluations(task.id)

  return (
    <DatasetPageShell title={task.name} sectionLabel="Tasks">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/tasks"
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon />
            All tasks
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit">
                Research task
              </Badge>
              <h2 className="text-xl font-semibold tracking-tight">{task.name}</h2>
              <p className="max-w-3xl text-base leading-relaxed">{task.content}</p>
            </div>
            <Button asChild className="w-fit">
              <Link
                href={getChatReferenceHref({ type: "task", id: task.id })}
              >
                <AtSignIcon data-icon="inline-start" />
                Reference in chat
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
            <CardDescription>
              Files and supporting information to submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {task.deliverables}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon />
                Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="capitalize">
                {task.metadata.difficulty}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {task.metadata.verifiable ? (
                  <BadgeCheckIcon />
                ) : (
                  <BadgeQuestionMarkIcon />
                )}
                Verifiability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={task.metadata.verifiable ? "secondary" : "outline"}>
                {task.metadata.verifiable ? "Verifiable" : "Interpretive"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification method</CardTitle>
            <CardDescription>
              How the research output can be evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {task.metadata.verificationMethod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon />
              Dataset
            </CardTitle>
            <CardDescription>
              The source data associated with this task.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataset && datasetHref ? (
              <Link
                href={datasetHref}
                className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">{dataset.metadata.name}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {dataset.metadata.description}
                  </span>
                </span>
                <ArrowRightIcon className="shrink-0 text-muted-foreground" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">{task.dataset}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>
              Submitted analysis results and the files included with each one.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {evaluations.length ? (
              <div className="divide-y">
                {evaluations.map((evaluation) => (
                  <Link
                    key={evaluation.id}
                    href={getTaskEvaluationHref(task.id, evaluation.id)}
                    className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium">{evaluation.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {evaluation.files.length} supported file
                        {evaluation.files.length === 1 ? "" : "s"} · Markdown,
                        text, and CSV previews available
                      </span>
                    </span>
                    <ArrowRightIcon className="shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                No evaluation results have been submitted for this task yet.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </DatasetPageShell>
  )
}
