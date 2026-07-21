import Link from "next/link"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BadgeQuestionMarkIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getTaskHref, type ResearchTask } from "@/lib/tasks"

type TaskPreviewProps = {
  task: ResearchTask
  evaluationCount: number
}

export function TaskPreview({ task, evaluationCount }: TaskPreviewProps) {
  return (
    <Link
      href={getTaskHref(task.id)}
      className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium">{task.name}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {task.content}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {task.metadata.diffuculty}
          </Badge>
          <Badge variant="outline">
            {task.metadata.verifiable ? (
              <BadgeCheckIcon data-icon="inline-start" />
            ) : (
              <BadgeQuestionMarkIcon data-icon="inline-start" />
            )}
            {task.metadata.verifiable ? "Verifiable" : "Interpretive"}
          </Badge>
          <Badge variant="outline">
            {evaluationCount} evaluation result
            {evaluationCount === 1 ? "" : "s"}
          </Badge>
        </span>
      </span>
      <ArrowRightIcon className="shrink-0 text-muted-foreground" />
    </Link>
  )
}
