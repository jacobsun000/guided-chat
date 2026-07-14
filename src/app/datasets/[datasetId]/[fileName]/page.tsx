import Link from "next/link"
import { ArrowLeftIcon, FileTextIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { DatasetPageShell } from "@/components/dataset-page-shell"
import { Badge } from "@/components/ui/badge"
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
import {
  DATASET_PREVIEW_ROW_LIMIT,
  getCsvPreview,
} from "@/lib/dataset-preview"
import { getDatasetHref } from "@/lib/datasets"

export const dynamic = "force-dynamic"

type DatasetFilePageProps = {
  params: Promise<{ datasetId: string; fileName: string }>
}

export default async function DatasetFilePage({
  params,
}: DatasetFilePageProps) {
  const { datasetId, fileName } = await params
  const datasetFile = await getCsvPreview(datasetId, fileName)

  if (!datasetFile) {
    notFound()
  }

  const { dataset, filePath, fileDescription, preview } = datasetFile

  return (
    <DatasetPageShell title={filePath}>
      <main className="mx-auto flex w-full max-w-[min(100%-2rem,110rem)] flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href={getDatasetHref(dataset.slug)}
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon />
            Back to {dataset.metadata.name}
          </Link>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              CSV preview
            </Badge>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <FileTextIcon />
              <span className="break-all">{filePath}</span>
            </h2>
            <p className="text-sm text-muted-foreground">{fileDescription}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data preview</CardTitle>
            <CardDescription>
              Values are shown as strings from the converted CSV. Only the
              first {DATASET_PREVIEW_ROW_LIMIT} rows are stored in metadata and
              sent to the browser. Use the horizontal scrollbar to inspect all{" "}
              {preview.columns.length} columns.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {preview.columns.length ? (
              <Table
                className="min-w-max"
                containerClassName="max-h-[min(65svh,42rem)] overflow-auto"
              >
                <TableCaption>
                  Preview of {filePath} with {preview.columns.length} columns.
                </TableCaption>
                <TableHeader className="sticky top-0 z-10 bg-muted/40">
                  <TableRow>
                    {preview.columns.map((column, index) => (
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
                  {preview.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {preview.columns.map((column, columnIndex) => (
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
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                This CSV does not contain a header row.
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {preview.truncated
              ? `Showing the first ${preview.rowCount} rows.`
              : `Showing ${preview.rowCount} rows.`}
          </CardFooter>
        </Card>
      </main>
    </DatasetPageShell>
  )
}
