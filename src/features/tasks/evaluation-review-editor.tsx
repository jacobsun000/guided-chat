"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  ClipboardCheckIcon,
  InfoIcon,
  SaveIcon,
  TimerIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { EvaluationReview } from "@/features/tasks/evaluation-schemas"

type ArtifactMetric = {
  id: string
  label: string
  weight: number
  definition: string
  evidence: string
}

type SubjectiveMetric = {
  id: string
  label: string
  scale: string
  prompt: string
}

type EvaluationReviewEditorProps = {
  taskId: string
  evaluationId: string
  initialReview: EvaluationReview
  artifactMetrics: ArtifactMetric[]
  subjectiveMetrics: SubjectiveMetric[]
  scaleAnchors: Record<string, string>
}

type NumericOperationalKey = Exclude<
  keyof EvaluationReview["operationalMetrics"],
  "taskSuccess" | "notes"
>

const ACCESS_TOKEN_STORAGE_KEY = "guided-chat.access-token.v1"

const operationalFields: Array<{
  key: NumericOperationalKey
  label: string
  unit: string
  step?: string
  max?: string
}> = [
  { key: "totalTimeSeconds", label: "Total completion time", unit: "seconds" },
  { key: "humanActiveTimeSeconds", label: "Human active time", unit: "seconds" },
  { key: "inputTokens", label: "Input tokens", unit: "tokens" },
  { key: "outputTokens", label: "Output tokens", unit: "tokens" },
  { key: "toolCalls", label: "Tool calls", unit: "count" },
  { key: "estimatedCostUsd", label: "Estimated cost", unit: "USD", step: "0.001" },
  {
    key: "predictedSuccessProbability",
    label: "Predicted task success",
    unit: "percent",
    step: "0.1",
    max: "100",
  },
  { key: "interventions", label: "Human interventions", unit: "count" },
  { key: "verificationActions", label: "Verification actions", unit: "count" },
  {
    key: "verificationCoverage",
    label: "Verification coverage",
    unit: "proportion (0–1)",
    step: "0.01",
    max: "1",
  },
  {
    key: "meaningfulSteeringRate",
    label: "Meaningful steering rate",
    unit: "proportion (0–1)",
    step: "0.01",
    max: "1",
  },
  { key: "errorsCaughtByHuman", label: "Errors caught by human", unit: "count" },
]

function parseNullableNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean)
}

function scoreTone(score: number | null | undefined) {
  if (score === null || score === undefined) return "bg-muted"
  if (score >= 3.5) return "bg-emerald-500"
  if (score >= 2.5) return "bg-amber-500"
  return "bg-destructive"
}

export function EvaluationReviewEditor({
  taskId,
  evaluationId,
  initialReview,
  artifactMetrics,
  subjectiveMetrics,
  scaleAnchors,
}: EvaluationReviewEditorProps) {
  const [review, setReview] = useState(initialReview)
  const [strengthsText, setStrengthsText] = useState(
    initialReview.strengths.join("\n")
  )
  const [concernsText, setConcernsText] = useState(
    initialReview.concerns.join("\n")
  )
  const [saving, setSaving] = useState(false)

  const liveOverallScore = useMemo(() => {
    const scores = new Map(
      review.artifactRatings.map((rating) => [rating.metricId, rating.score])
    )
    let total = 0
    let weight = 0

    for (const metric of artifactMetrics) {
      const score = scores.get(metric.id)
      if (score === null || score === undefined) continue
      total += (score / 4) * metric.weight
      weight += metric.weight
    }

    return weight ? Math.round((total / weight) * 1000) / 10 : null
  }, [artifactMetrics, review.artifactRatings])

  const updateArtifactRating = (
    metricId: string,
    patch: { score?: number | null; rationale?: string }
  ) => {
    setReview((current) => ({
      ...current,
      artifactRatings: current.artifactRatings.map((rating) =>
        rating.metricId === metricId ? { ...rating, ...patch } : rating
      ),
    }))
  }

  const updateSubjectiveRating = (
    metricId: string,
    patch: { score?: number | null; rationale?: string }
  ) => {
    setReview((current) => {
      const existing = current.subjectiveRatings.find(
        (rating) => rating.metricId === metricId
      )

      return {
        ...current,
        subjectiveRatings: existing
          ? current.subjectiveRatings.map((rating) =>
              rating.metricId === metricId ? { ...rating, ...patch } : rating
            )
          : [
              ...current.subjectiveRatings,
              { metricId, score: null, rationale: "", ...patch },
            ],
      }
    })
  }

  const save = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? ""
    if (!accessToken.trim()) {
      toast.error("Add the access token in Settings before saving.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(taskId)}/evaluations/${encodeURIComponent(evaluationId)}/review`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accessToken: accessToken.trim(),
            review: {
              ...review,
              evaluatedAt: new Date().toISOString(),
              overallScore: liveOverallScore,
            },
          }),
        }
      )
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to save evaluation")
      }

      setReview(body)
      toast.success("Evaluation saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save evaluation")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-6xl gap-0 py-0">
      <CardHeader className="border-b bg-gradient-to-r from-primary/8 via-primary/3 to-transparent py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-20 shrink-0 flex-col items-center justify-center border bg-background/80 shadow-sm">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                {liveOverallScore ?? "—"}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                out of 100
              </span>
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Evaluation review</CardTitle>
                <Badge variant="outline">baseline-v1</Badge>
                <Badge variant="secondary" className="capitalize">
                  {review.condition.replaceAll("-", " ")}
                </Badge>
              </div>
              <CardDescription className="max-w-2xl text-sm">
                Quality is scored independently from time, cost, and human experience.
                Blank study fields mean “not collected,” never zero.
              </CardDescription>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1.5 lg:items-end">
            <Button onClick={save} disabled={saving} size="lg">
              <SaveIcon data-icon="inline-start" />
              {saving ? "Saving…" : "Save evaluation"}
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Uses the access token stored in Settings
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 border-b bg-muted/10 py-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="evaluation-condition">Experimental condition</Label>
          <select
            id="evaluation-condition"
            className="h-9 w-full border border-input bg-background px-3 text-xs outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring/50"
            value={review.condition}
            onChange={(event) =>
              setReview((current) => ({
                ...current,
                condition: event.target.value as EvaluationReview["condition"],
              }))
            }
          >
            <option value="reference">Reference / ground truth</option>
            <option value="agent-alone">Agent alone</option>
            <option value="human-chat">Human + regular chat</option>
            <option value="human-scaffold">Human + scaffolding</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="evaluation-evaluator">Evaluator</Label>
          <Input
            id="evaluation-evaluator"
            className="h-9"
            value={review.evaluator}
            onChange={(event) =>
              setReview((current) => ({ ...current, evaluator: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="evaluation-summary">Overall assessment</Label>
          <Textarea
            id="evaluation-summary"
            className="min-h-20 bg-background text-sm leading-relaxed"
            value={review.summary}
            onChange={(event) =>
              setReview((current) => ({ ...current, summary: event.target.value }))
            }
          />
        </div>
      </CardContent>

      <Tabs defaultValue="quality" className="gap-0">
        <div className="overflow-x-auto border-b px-4 md:px-6">
          <TabsList variant="line" className="h-12 min-w-max">
            <TabsTrigger value="quality" className="px-3">
              <ClipboardCheckIcon />
              Artifact quality
            </TabsTrigger>
            <TabsTrigger value="study" className="px-3">
              <TimerIcon />
              Study measures
            </TabsTrigger>
            <TabsTrigger value="human" className="px-3">
              <UserRoundIcon />
              Human-reported
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="quality" className="m-0 p-4 md:p-6">
          <section aria-labelledby="artifact-quality-heading" className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-1">
                <h3 id="artifact-quality-heading" className="text-sm font-semibold">
                  Objective artifact quality
                </h3>
                <p className="max-w-2xl text-xs text-muted-foreground">
                  Rate the submitted work on a 0–4 scale. The displayed weight is
                  how much that dimension contributes to the 100-point overall score.
                </p>
              </div>
              <div className="grid overflow-hidden border sm:grid-cols-5">
                {Object.entries(scaleAnchors).map(([score, anchor]) => (
                  <div
                    key={score}
                    className="min-w-28 border-b p-2 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
                  >
                    <span className="mr-1.5 font-semibold tabular-nums">{score}</span>
                    <span className="text-[10px] text-muted-foreground">{anchor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {artifactMetrics.map((metric) => {
                const rating = review.artifactRatings.find(
                  (candidate) => candidate.metricId === metric.id
                )
                const score = rating?.score
                const scorePercent = score === null || score === undefined
                  ? 0
                  : Math.max(0, Math.min(100, (score / 4) * 100))

                return (
                  <article key={metric.id} className="border bg-card shadow-sm">
                    <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_8rem] lg:p-5">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold">{metric.label}</h4>
                          <Badge variant="outline">
                            Weight {Math.round(metric.weight * 100)}%
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            up to {Math.round(metric.weight * 100)} overall points
                          </span>
                        </div>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                          {metric.definition}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <Label htmlFor={`score-${metric.id}`}>Score</Label>
                          <span className="text-xs text-muted-foreground">/ 4</span>
                        </div>
                        <Input
                          id={`score-${metric.id}`}
                          className="h-10 text-center text-base font-semibold tabular-nums"
                          type="number"
                          min="0"
                          max="4"
                          step="0.5"
                          value={score ?? ""}
                          onChange={(event) =>
                            updateArtifactRating(metric.id, {
                              score: parseNullableNumber(event.target.value),
                            })
                          }
                        />
                        <div className="h-1.5 overflow-hidden bg-muted" aria-hidden="true">
                          <div
                            className={`h-full transition-[width] ${scoreTone(score)}`}
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid border-t lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)]">
                      <div className="space-y-2 p-4 lg:p-5">
                        <Label htmlFor={`rationale-${metric.id}`}>
                          Evaluator rationale
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Explain why this artifact earned the selected score.
                        </p>
                        <Textarea
                          id={`rationale-${metric.id}`}
                          className="min-h-24 text-sm leading-relaxed"
                          value={rating?.rationale ?? ""}
                          onChange={(event) =>
                            updateArtifactRating(metric.id, {
                              rationale: event.target.value,
                            })
                          }
                        />
                      </div>
                      <aside className="border-t bg-muted/25 p-4 lg:border-t-0 lg:border-l lg:p-5">
                        <div className="flex gap-2.5">
                          <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                          <div className="space-y-1">
                            <p className="text-xs font-medium">How to assess</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {metric.evidence}
                            </p>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="grid gap-4 border-t pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 text-emerald-600" />
                  <Label htmlFor="evaluation-strengths">Key strengths</Label>
                </div>
                <Textarea
                  id="evaluation-strengths"
                  className="min-h-28 text-sm leading-relaxed"
                  placeholder="One strength per line"
                  value={strengthsText}
                  onChange={(event) => {
                    setStrengthsText(event.target.value)
                    setReview((current) => ({
                      ...current,
                      strengths: lines(event.target.value),
                    }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <InfoIcon className="size-4 text-amber-600" />
                  <Label htmlFor="evaluation-concerns">Concerns and caveats</Label>
                </div>
                <Textarea
                  id="evaluation-concerns"
                  className="min-h-28 text-sm leading-relaxed"
                  placeholder="One concern per line"
                  value={concernsText}
                  onChange={(event) => {
                    setConcernsText(event.target.value)
                    setReview((current) => ({
                      ...current,
                      concerns: lines(event.target.value),
                    }))
                  }}
                />
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="study" className="m-0 p-4 md:p-6">
          <section aria-labelledby="study-measures-heading" className="space-y-6">
            <div className="space-y-1">
              <h3 id="study-measures-heading" className="text-sm font-semibold">
                Objective study measures
              </h3>
              <p className="max-w-3xl text-xs text-muted-foreground">
                Capture telemetry separately from quality so the study can compare
                outcome, time, verification effort, steering, and cost without hiding trade-offs.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 border bg-muted/10 p-4">
                <Label htmlFor="task-success">Task success</Label>
                <select
                  id="task-success"
                  className="h-9 w-full border border-input bg-background px-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  value={
                    review.operationalMetrics.taskSuccess === null
                      ? ""
                      : String(review.operationalMetrics.taskSuccess)
                  }
                  onChange={(event) =>
                    setReview((current) => ({
                      ...current,
                      operationalMetrics: {
                        ...current.operationalMetrics,
                        taskSuccess: event.target.value === ""
                          ? null
                          : event.target.value === "true",
                      },
                    }))
                  }
                >
                  <option value="">Not collected</option>
                  <option value="true">Pass</option>
                  <option value="false">Fail</option>
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Mandatory deliverables present and quality ≥ 60
                </p>
              </div>

              {operationalFields.map((field) => (
                <div key={field.key} className="space-y-2 border bg-muted/10 p-4">
                  <Label htmlFor={`operational-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`operational-${field.key}`}
                    className="h-9 bg-background"
                    type="number"
                    min="0"
                    max={field.max}
                    step={field.step ?? "1"}
                    placeholder="Not collected"
                    value={review.operationalMetrics[field.key] ?? ""}
                    onChange={(event) =>
                      setReview((current) => ({
                        ...current,
                        operationalMetrics: {
                          ...current.operationalMetrics,
                          [field.key]: parseNullableNumber(event.target.value),
                        },
                      }))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">Unit: {field.unit}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-5">
              <Label htmlFor="operational-notes">Telemetry notes</Label>
              <Textarea
                id="operational-notes"
                className="min-h-24 text-sm leading-relaxed"
                value={review.operationalMetrics.notes}
                onChange={(event) =>
                  setReview((current) => ({
                    ...current,
                    operationalMetrics: {
                      ...current.operationalMetrics,
                      notes: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="human" className="m-0 p-4 md:p-6">
          <section aria-labelledby="human-measures-heading" className="space-y-6">
            <div className="space-y-1">
              <h3 id="human-measures-heading" className="text-sm font-semibold">
                Human-reported measures
              </h3>
              <p className="max-w-3xl text-xs text-muted-foreground">
                Use identical instruments for human + regular chat and human + scaffolding.
                These measures are not applicable to the agent-only condition.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {subjectiveMetrics.map((metric) => {
                const rating = review.subjectiveRatings.find(
                  (candidate) => candidate.metricId === metric.id
                )
                const isHundredPoint =
                  metric.id === "cognitive_load" || metric.id === "usability"

                return (
                  <article key={metric.id} className="border bg-muted/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{metric.label}</h4>
                        <Badge variant="outline">{metric.scale}</Badge>
                      </div>
                      <div className="w-24 shrink-0 space-y-1">
                        <Label htmlFor={`subjective-${metric.id}`}>Score</Label>
                        <Input
                          id={`subjective-${metric.id}`}
                          className="h-9 bg-background text-center tabular-nums"
                          type="number"
                          min={isHundredPoint ? "0" : "1"}
                          max={isHundredPoint ? "100" : "7"}
                          step="0.1"
                          placeholder="—"
                          value={rating?.score ?? ""}
                          onChange={(event) =>
                            updateSubjectiveRating(metric.id, {
                              score: parseNullableNumber(event.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm leading-relaxed">
                      {metric.prompt}
                    </p>
                    <Textarea
                      className="mt-4 min-h-20 bg-background text-sm"
                      aria-label={`${metric.label} notes`}
                      placeholder="Collection or interpretation notes"
                      value={rating?.rationale ?? ""}
                      onChange={(event) =>
                        updateSubjectiveRating(metric.id, {
                          rationale: event.target.value,
                        })
                      }
                    />
                  </article>
                )
              })}
            </div>

            <div className="border-t pt-6">
              <div className="mb-4 space-y-1">
                <h4 className="text-sm font-semibold">Domain learning</h4>
                <p className="text-xs text-muted-foreground">
                  Use parallel pre- and post-task quizzes. Learning gain is post minus pre.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 border bg-muted/10 p-4">
                  <Label htmlFor="pre-task-score">Pre-task quiz</Label>
                  <Input
                    id="pre-task-score"
                    className="h-9 bg-background"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Not collected"
                    value={review.learning.preTaskScore ?? ""}
                    onChange={(event) =>
                      setReview((current) => ({
                        ...current,
                        learning: {
                          ...current.learning,
                          preTaskScore: parseNullableNumber(event.target.value),
                        },
                      }))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">Unit: percent</p>
                </div>
                <div className="space-y-2 border bg-muted/10 p-4">
                  <Label htmlFor="post-task-score">Post-task quiz</Label>
                  <Input
                    id="post-task-score"
                    className="h-9 bg-background"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Not collected"
                    value={review.learning.postTaskScore ?? ""}
                    onChange={(event) =>
                      setReview((current) => ({
                        ...current,
                        learning: {
                          ...current.learning,
                          postTaskScore: parseNullableNumber(event.target.value),
                        },
                      }))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">Unit: percent</p>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
