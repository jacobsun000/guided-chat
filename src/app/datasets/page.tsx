import Link from "next/link"
import { ArrowRightIcon, DatabaseIcon, FileTextIcon } from "lucide-react"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DATASETS, getDatasetHref } from "@/lib/datasets"

export default function DatasetsPage() {
  return (
    <DatasetPageShell title="Dataset library">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Data library
          </Badge>
          <h2 className="text-xl font-semibold tracking-tight">Datasets</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Browse the available datasets, their files, and a small preview of
            each CSV.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {DATASETS.map((dataset) => (
            <Link key={dataset.slug} href={getDatasetHref(dataset.slug)}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DatabaseIcon />
                    <span className="truncate">{dataset.metadata.name}</span>
                  </CardTitle>
                  <CardDescription>{dataset.metadata.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileTextIcon />
                    {dataset.metadata.files.length} files
                  </span>
                  <ArrowRightIcon />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </DatasetPageShell>
  )
}
