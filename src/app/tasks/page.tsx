import {
  NotebookTabsIcon,
} from "lucide-react"

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
import { getTaskEvaluationCount } from "@/lib/task-results"
import { TASKS } from "@/lib/tasks"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  const evaluationCounts = new Map(
    await Promise.all(
      TASKS.map(async (task) => [
        task.id,
        await getTaskEvaluationCount(task.id),
      ] as const)
    )
  )

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
                <TaskPreview
                  key={task.id}
                  task={task}
                  evaluationCount={evaluationCounts.get(task.id) ?? 0}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </DatasetPageShell>
  )
}
