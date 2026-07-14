import Link from "next/link"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BadgeQuestionMarkIcon,
  NotebookTabsIcon,
} from "lucide-react"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TASKS, getTaskHref } from "@/lib/tasks"

export default function TasksPage() {
  return (
    <DatasetPageShell title="Task library" sectionLabel="Tasks">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Research prompts
          </Badge>
          <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Browse open-ended analysis tasks across the available datasets.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookTabsIcon />
              All tasks
            </CardTitle>
            <CardDescription>
              {TASKS.length} research tasks across the available datasets.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {TASKS.map((task) => (
                <Link
                  key={task.id}
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
                    </span>
                  </span>
                  <ArrowRightIcon className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </DatasetPageShell>
  )
}
