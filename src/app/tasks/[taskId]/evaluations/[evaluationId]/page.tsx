import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
} from "lucide-react"
import { notFound } from "next/navigation"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { Badge } from "@/components/ui/badge"
import { EvaluationReviewEditor } from "@/features/tasks/evaluation-review-editor"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  createEmptyEvaluationReview,
  EVALUATION_METRICS,
  getEvaluationReview,
} from "@/lib/evaluation-reviews"
import { getTaskById, getTaskHref } from "@/lib/tasks"
import {
  getTaskEvaluation,
  getTaskEvaluationHref,
  TASK_RESULT_PREVIEW_ROW_LIMIT,
} from "@/lib/task-results"

export const dynamic = "force-dynamic"

type TaskEvaluationPageProps = {
  params: Promise<{ taskId: string; evaluationId: string }>
  searchParams: Promise<{ file?: string | string[] }>
}

function FilePreview({
  kind,
  content,
  csvPreview,
}: {
  kind: "markdown" | "csv" | "text"
  content: string
  csvPreview?: {
    columns: string[]
    rows: string[][]
    rowCount: number
    truncated: boolean
  }
}) {
  if (kind === "markdown") {
    return (
      <div className="markdown-message max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: (props) => {
              const { node, ...anchorProps } = props
              void node

              return <a {...anchorProps} target="_blank" rel="noreferrer" />
            },
            table: (props) => {
              const { node, ...tableProps } = props
              void node

              return (
                <div className="markdown-table-wrapper">
                  <table {...tableProps} />
                </div>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  if (kind === "text") {
    return (
      <pre className="max-h-[min(65svh,42rem)] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
        {content}
      </pre>
    )
  }

  if (!csvPreview || !csvPreview.columns.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This CSV does not contain a header row to preview.
      </p>
    )
  }

  return (
    <Table
      className="min-w-max"
      containerClassName="max-h-[min(65svh,42rem)] overflow-auto"
    >
      <TableCaption>
        Preview of the first {Math.min(csvPreview.rowCount, TASK_RESULT_PREVIEW_ROW_LIMIT)} data rows.
      </TableCaption>
      <TableHeader className="sticky top-0 z-10 bg-muted/40">
        <TableRow>
          {csvPreview.columns.map((column, index) => (
            <TableHead
              key={`${column}-${index}`}
              className="bg-muted/40"
              scope="col"
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {csvPreview.rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {csvPreview.columns.map((column, columnIndex) => (
              <TableCell key={`${column}-${columnIndex}`} className="align-top">
                <div
                  className="max-h-24 max-w-72 overflow-auto whitespace-normal break-words"
                  title={row[columnIndex]}
                >
                  {row[columnIndex] || "—"}
                </div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function TaskEvaluationPage({
  params,
  searchParams,
}: TaskEvaluationPageProps) {
  const { taskId, evaluationId } = await params
  const { file } = await searchParams
  const task = getTaskById(taskId)

  if (!task) {
    notFound()
  }

  const evaluation = await getTaskEvaluation(
    task.id,
    evaluationId,
    typeof file === "string" ? file : undefined
  )

  if (!evaluation) {
    notFound()
  }

  const review =
    (await getEvaluationReview(task.id, evaluation.id)) ??
    createEmptyEvaluationReview()
  const currentFileIndex = evaluation.files.findIndex(
    (candidate) => candidate.name === evaluation.file.name
  )

  return (
    <DatasetPageShell title={evaluation.name} sectionLabel="Task evaluations">
      <main className="mx-auto flex w-full max-w-[min(100%-2rem,110rem)] flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href={getTaskHref(task.id)}
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon />
            Back to {task.name}
          </Link>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              Task evaluation
            </Badge>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <FileTextIcon />
              <span>{evaluation.name}</span>
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Result files submitted for <span className="font-medium text-foreground">{task.name}</span>.
            </p>
          </div>
        </div>

        <EvaluationReviewEditor
          taskId={task.id}
          evaluationId={evaluation.id}
          initialReview={review}
          artifactMetrics={EVALUATION_METRICS.artifactQuality}
          subjectiveMetrics={EVALUATION_METRICS.subjectiveStudyMeasures}
          scaleAnchors={EVALUATION_METRICS.scoring.artifactScale.anchors}
        />

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              Select a result file to preview. A readable report is selected by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <nav
              aria-label="Evaluation files"
              className="flex max-w-full gap-2 overflow-x-auto pb-1"
            >
              {evaluation.files.map((candidate, index) => {
                const isActive = index === currentFileIndex

                return (
                  <Link
                    key={candidate.name}
                    href={getTaskEvaluationHref(
                      task.id,
                      evaluation.id,
                      candidate.name
                    )}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/50",
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <FileTextIcon />
                    <span className="max-w-64 truncate">{candidate.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {candidate.kind}
                    </Badge>
                  </Link>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {evaluation.file.name}
              <Badge variant="secondary" className="capitalize">
                {evaluation.file.kind} preview
              </Badge>
            </CardTitle>
            <CardDescription>
              {evaluation.file.kind === "csv"
                ? "Values are shown as strings from the submitted CSV."
                : evaluation.file.kind === "markdown"
                  ? "The submitted Markdown is rendered for reading."
                  : "The submitted plain-text file is shown with its original line breaks."}
            </CardDescription>
          </CardHeader>
          <CardContent className={evaluation.file.kind === "csv" ? "p-0" : undefined}>
            <FilePreview
              kind={evaluation.file.kind}
              content={evaluation.file.content}
              csvPreview={evaluation.file.csvPreview}
            />
          </CardContent>
          {evaluation.file.kind === "csv" && evaluation.file.csvPreview ? (
            <CardFooter className="text-xs text-muted-foreground">
              {evaluation.file.csvPreview.truncated
                ? `Showing the first ${TASK_RESULT_PREVIEW_ROW_LIMIT} of ${evaluation.file.csvPreview.rowCount} data rows.`
                : `Showing ${evaluation.file.csvPreview.rowCount} data rows.`}
            </CardFooter>
          ) : null}
        </Card>

        <Link
          href={getTaskHref(task.id)}
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to task details
          <ArrowRightIcon />
        </Link>
      </main>
    </DatasetPageShell>
  )
}
