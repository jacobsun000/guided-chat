"use client"

import * as React from "react"
import { AlertTriangleIcon, Loader2Icon, MapPinnedIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { nodeAttentionScore, parseStepIds, type ScaffoldNode, type ScaffoldRating, type ScaffoldReviewResult, type ScaffoldState } from "@/lib/scaffolding"

type Props = {
  state?: ScaffoldState
  reviewingNode?: string | null
  onReviewNode: (node: ScaffoldNode) => void
  onRate: (nodeName: string, questionIndex: number, rating: ScaffoldRating) => void
}

function scoreStyle(score: number) {
  if (score >= 75) return "border-destructive/60 bg-destructive/10"
  if (score >= 55) return "border-amber-500/60 bg-amber-500/10"
  return "border-emerald-500/40 bg-emerald-500/5"
}

export function ScaffoldingReview({ state, reviewingNode, onReviewNode, onRate }: Props) {
  const [selectedNode, setSelectedNode] = React.useState<ScaffoldNode | null>(null)
  const review = selectedNode ? state?.reviews?.[selectedNode.name] : undefined
  const trajectory = state?.trajectory ?? []
  const selectedIds = React.useMemo(() => {
    if (!selectedNode) return new Set<number>()
    try { return new Set(parseStepIds(selectedNode.step_ids)) } catch { return new Set<number>() }
  }, [selectedNode])
  const selectedSteps = trajectory.filter((step) => selectedIds.has(step.step_id))

  const openNode = (node: ScaffoldNode) => {
    setSelectedNode(node)
    if (!state?.reviews?.[node.name]) onReviewNode(node)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-card/70">
      <div className="shrink-0 border-b bg-background/85 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPinnedIcon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Trajectory review</h2>
          {state?.mapResult && <Badge variant="outline">{state.mapResult.map.nodes.length} nodes</Badge>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Attention score combines importance and uncertainty.</p>
      </div>

      {(!state || state.status === "idle") && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Complete a chat response to generate its trajectory review.
        </div>
      )}
      {state?.status === "generating" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Reviewing the full baseline trajectory…
        </div>
      )}
      {state?.status === "error" && (
        <div className="m-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangleIcon className="mr-2 inline size-4" />{state.error}
        </div>
      )}
      {state?.mapResult && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-4">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result summary</p>
              <p className="mt-2 text-sm leading-6">{state.mapResult.result_summary}</p>
            </div>
            <div className="space-y-2">
              {state.mapResult.map.nodes.map((node, index) => {
                const score = nodeAttentionScore(node)
                return (
                  <React.Fragment key={node.name}>
                    {index > 0 && <div className="mx-auto h-4 w-px bg-border" />}
                    <button
                      type="button"
                      onClick={() => openNode(node)}
                      className={cn("group w-full rounded-lg border p-3 text-left transition hover:shadow-sm", scoreStyle(score))}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold">{node.name}</span>
                        <Badge variant={score >= 75 ? "destructive" : "secondary"}>{score.toFixed(0)}</Badge>
                      </div>
                      <p className={cn("mt-1 text-xs leading-5 text-muted-foreground", score >= 70 && "group-hover:hidden")}>{node.description}</p>
                      {score >= 70 && <p className="mt-1 hidden text-xs leading-5 text-foreground group-hover:block">Review: {node.review_suggestion}</p>}
                      <p className="mt-2 text-[11px] text-muted-foreground">Steps {node.step_ids}</p>
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
            {state.mapResult.map.edges.length > 0 && (
              <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Flow: </span>
                {state.mapResult.map.edges.map((edge) => `${edge.from_node} → ${edge.to_node}`).join(" · ")}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      <NodeReviewDialog
        key={selectedNode?.name ?? "closed"}
        node={selectedNode}
        review={review}
        steps={selectedSteps}
        loading={selectedNode?.name === reviewingNode}
        ratings={selectedNode ? state?.ratings?.[selectedNode.name] : undefined}
        onRate={(index, rating) => selectedNode && onRate(selectedNode.name, index, rating)}
        onClose={() => setSelectedNode(null)}
      />
    </section>
  )
}

function NodeReviewDialog({ node, review, steps, loading, ratings, onRate, onClose }: {
  node: ScaffoldNode | null
  review?: ScaffoldReviewResult
  steps: ScaffoldState["trajectory"]
  loading: boolean
  ratings?: Record<number, ScaffoldRating>
  onRate: (index: number, rating: ScaffoldRating) => void
  onClose: () => void
}) {
  const [tab, setTab] = React.useState("review")
  const [answers, setAnswers] = React.useState<Record<number, number>>({})
  return (
    <Dialog open={Boolean(node)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90svh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{node?.name}</DialogTitle>
          <DialogDescription>{node?.description}</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
          <TabsList><TabsTrigger value="review">Guided review</TabsTrigger><TabsTrigger value="steps">Detailed trajectory</TabsTrigger></TabsList>
          <TabsContent value="review" className="min-h-0">
            {loading && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2Icon className="animate-spin" />Generating node review…</div>}
            {review && <ScrollArea className="h-[68svh]"><div className="space-y-5 pr-3">
              <iframe title={`${node?.name} review slide`} sandbox="" srcDoc={review.html_slide} className="h-[430px] w-full rounded-lg border bg-white" />
              {review.questions.map((question, index) => {
                const answered = answers[index] !== undefined
                return <div key={index} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{question.question}</p>
                  <div className="mt-3 grid gap-2">{question.choices.map((choice, choiceIndex) => <Button key={choiceIndex} type="button" variant={answers[index] === choiceIndex ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))}>{choice}</Button>)}</div>
                  {answered && <div className="mt-4 rounded-md bg-muted p-3 text-sm leading-6"><span className="font-semibold">What the trajectory did: </span>{question.trajectory_answer}<div className="mt-3 flex flex-wrap gap-2">{(["agree", "disagree", "doubt"] as const).map((rating) => <Button key={rating} size="sm" variant={ratings?.[index] === rating ? "default" : "outline"} onClick={() => { onRate(index, rating); if (rating !== "agree") setTab("steps") }}>{rating[0].toUpperCase() + rating.slice(1)}</Button>)}</div></div>}
                </div>
              })}
            </div></ScrollArea>}
          </TabsContent>
          <TabsContent value="steps"><ScrollArea className="h-[68svh]"><div className="space-y-3 pr-3">{steps?.map((step) => <div key={step.step_id} className="rounded-lg border bg-muted/20 p-3"><div className="mb-2 flex gap-2"><Badge variant="outline">Step {step.step_id}</Badge><Badge variant="secondary">{step.role} · {step.type}</Badge></div><pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5">{typeof step.content === "string" ? step.content : JSON.stringify(step.content, null, 2)}</pre></div>)}</div></ScrollArea></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
