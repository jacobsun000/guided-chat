"use client"

import * as React from "react"
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AlertTriangleIcon, Loader2Icon, MapPinnedIcon, RefreshCwIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { nodeAttentionScore, parseStepIds, type ScaffoldNode, type ScaffoldRating, type ScaffoldReviewResult, type ScaffoldState } from "@/lib/scaffolding"

type Props = {
  state?: ScaffoldState
  reviewingNode?: string | null
  onReviewNode: (node: ScaffoldNode) => void
  onRate: (nodeName: string, questionIndex: number, rating: ScaffoldRating) => void
  onRegenerate: () => void
}

type ReviewNodeData = { scaffoldNode: ScaffoldNode; onOpen: (node: ScaffoldNode) => void }
type ReviewFlowNode = Node<ReviewNodeData, "reviewNode">

function attentionTone(score: number) {
  if (score >= 75) return { card: "border-rose-500/70 bg-rose-50 shadow-rose-500/10 dark:bg-rose-950/40", badge: "bg-rose-600 text-white" }
  if (score >= 55) return { card: "border-amber-500/70 bg-amber-50 shadow-amber-500/10 dark:bg-amber-950/35", badge: "bg-amber-500 text-white" }
  return { card: "border-emerald-500/50 bg-emerald-50 shadow-emerald-500/10 dark:bg-emerald-950/30", badge: "bg-emerald-600 text-white" }
}

function ReviewNode({ data }: NodeProps<ReviewFlowNode>) {
  const node = data.scaffoldNode
  const score = nodeAttentionScore(node)
  const tone = attentionTone(score)
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <button type="button" onClick={() => data.onOpen(node)} className={cn("w-[230px] rounded-2xl border p-4 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl", tone.card)}>
          <Handle type="target" position={Position.Top} className="!size-2 !border-background !bg-muted-foreground" />
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-semibold leading-5">{node.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", tone.badge)}>{score.toFixed(0)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{node.description}</p>
          <Handle type="source" position={Position.Bottom} className="!size-2 !border-background !bg-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-72 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold">What to review</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{node.review_suggestion}</p>
      </TooltipContent>
    </Tooltip>
  )
}

const nodeTypes = { reviewNode: ReviewNode }

function buildFlowNodes(nodes: ScaffoldNode[], edges: { from_node: string; to_node: string }[], onOpen: (node: ScaffoldNode) => void) {
  const incoming = new Map(nodes.map((node) => [node.name, 0]))
  edges.forEach((edge) => incoming.set(edge.to_node, (incoming.get(edge.to_node) ?? 0) + 1))
  const depths = new Map<string, number>()
  const queue = nodes.filter((node) => (incoming.get(node.name) ?? 0) === 0).map((node) => ({ name: node.name, depth: 0 }))
  while (queue.length) {
    const current = queue.shift()!
    if ((depths.get(current.name) ?? -1) >= current.depth) continue
    depths.set(current.name, current.depth)
    edges.filter((edge) => edge.from_node === current.name).forEach((edge) => queue.push({ name: edge.to_node, depth: current.depth + 1 }))
  }
  nodes.forEach((node, index) => { if (!depths.has(node.name)) depths.set(node.name, index) })
  const levels = new Map<number, ScaffoldNode[]>()
  nodes.forEach((node) => levels.set(depths.get(node.name) ?? 0, [...(levels.get(depths.get(node.name) ?? 0) ?? []), node]))
  return nodes.map((node): ReviewFlowNode => {
    const depth = depths.get(node.name) ?? 0
    const level = levels.get(depth) ?? [node]
    const column = level.findIndex((candidate) => candidate.name === node.name)
    return { id: node.name, type: "reviewNode", position: { x: column * 290, y: depth * 175 }, data: { scaffoldNode: node, onOpen } }
  })
}

export function ScaffoldingReview({ state, reviewingNode, onReviewNode, onRate, onRegenerate }: Props) {
  const [selectedNode, setSelectedNode] = React.useState<ScaffoldNode | null>(null)
  const review = selectedNode ? state?.reviews?.[selectedNode.name] : undefined
  const trajectory = state?.trajectory ?? []
  const selectedIds = React.useMemo(() => {
    if (!selectedNode) return new Set<number>()
    try { return new Set(parseStepIds(selectedNode.step_ids)) } catch { return new Set<number>() }
  }, [selectedNode])
  const selectedSteps = trajectory.filter((step) => selectedIds.has(step.step_id))
  const openNode = React.useCallback((node: ScaffoldNode) => {
    setSelectedNode(node)
    if (!state?.reviews?.[node.name]) onReviewNode(node)
  }, [onReviewNode, state?.reviews])
  const mapResult = state?.mapResult
  const flowNodes = React.useMemo(() => mapResult ? buildFlowNodes(mapResult.map.nodes, mapResult.map.edges, openNode) : [], [mapResult, openNode])
  const flowEdges = React.useMemo(() => (mapResult?.map.edges ?? []).map((edge, index): Edge => ({
    id: `${edge.from_node}-${edge.to_node}-${index}`,
    source: edge.from_node,
    target: edge.to_node,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
    style: { strokeWidth: 2 },
  })), [mapResult])

  return (
    <section className="flex h-full min-h-0 flex-col bg-card/70">
      <div className="shrink-0 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapPinnedIcon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Completion Review</h2>
          {state?.mapResult && <Badge variant="outline">{state.mapResult.map.nodes.length} stages</Badge>}
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onRegenerate} disabled={state?.status === "generating"} aria-label="Regenerate completion review"><RefreshCwIcon className={cn(state?.status === "generating" && "animate-spin")} /></Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Follow the completion path and inspect stages that need attention.</p>
      </div>

      {(!state || state.status === "idle") && <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">Complete a chat response to generate its review.</div>}
      {state?.status === "generating" && <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground"><Loader2Icon className="size-5 animate-spin" />Building the completion map…</div>}
      {state?.status === "error" && <div className="m-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangleIcon className="mr-2 inline size-4" />{state.error}</div>}
      {state?.mapResult && state.status !== "generating" && <div className="flex min-h-0 flex-1 flex-col">
        <div className="m-3 mb-0 rounded-xl border bg-background/90 p-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outcome</p>
          <p className="mt-1 text-sm leading-6">{state.mapResult.result_summary}</p>
        </div>
        <div className="min-h-[320px] flex-1 p-2">
          <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.25 }} minZoom={0.35} maxZoom={1.5} proOptions={{ hideAttribution: true }}>
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>}

      <NodeReviewDialog key={selectedNode?.name ?? "closed"} node={selectedNode} review={review} steps={selectedSteps} loading={selectedNode?.name === reviewingNode} ratings={selectedNode ? state?.ratings?.[selectedNode.name] : undefined} onRate={(index, rating) => selectedNode && onRate(selectedNode.name, index, rating)} onClose={() => setSelectedNode(null)} />
    </section>
  )
}

function NodeReviewDialog({ node, review, steps, loading, ratings, onRate, onClose }: { node: ScaffoldNode | null; review?: ScaffoldReviewResult; steps: ScaffoldState["trajectory"]; loading: boolean; ratings?: Record<number, ScaffoldRating>; onRate: (index: number, rating: ScaffoldRating) => void; onClose: () => void }) {
  const [tab, setTab] = React.useState("review")
  const [answers, setAnswers] = React.useState<Record<number, number>>({})
  return <Dialog open={Boolean(node)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="flex max-h-[94svh] w-[96vw] max-w-none flex-col overflow-hidden sm:max-w-[min(96vw,1500px)]">
      <DialogHeader><DialogTitle>{node?.name}</DialogTitle><DialogDescription>{node?.description}</DialogDescription></DialogHeader>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
        <TabsList><TabsTrigger value="review">Guided review</TabsTrigger><TabsTrigger value="steps">Detailed trajectory</TabsTrigger></TabsList>
        <TabsContent value="review" className="min-h-0">
          {loading && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2Icon className="animate-spin" />Generating node review…</div>}
          {review && <ScrollArea className="h-[76svh]"><div className="space-y-5 pr-3">
            <iframe title={`${node?.name} review slide`} sandbox="" srcDoc={review.html_slide} className="h-[520px] w-full rounded-xl border bg-white shadow-sm" />
            {review.questions.map((question, index) => { const answered = answers[index] !== undefined; return <div key={index} className="rounded-xl border p-4"><p className="text-sm font-medium">{question.question}</p><div className="mt-3 grid gap-2">{question.choices.map((choice, choiceIndex) => <Button key={choiceIndex} type="button" variant={answers[index] === choiceIndex ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))}>{choice}</Button>)}</div>{answered && <div className="mt-4 rounded-lg bg-muted p-3 text-sm leading-6"><span className="font-semibold">What the trajectory did: </span>{question.trajectory_answer}<div className="mt-3 flex flex-wrap gap-2">{(["agree", "disagree", "doubt"] as const).map((rating) => <Button key={rating} size="sm" variant={ratings?.[index] === rating ? "default" : "outline"} onClick={() => { onRate(index, rating); if (rating !== "agree") setTab("steps") }}>{rating[0].toUpperCase() + rating.slice(1)}</Button>)}</div></div>}</div> })}
          </div></ScrollArea>}
        </TabsContent>
        <TabsContent value="steps"><ScrollArea className="h-[76svh]"><div className="space-y-3 pr-3">{steps?.map((step) => <div key={step.step_id} className="rounded-xl border bg-muted/20 p-3"><div className="mb-2 flex gap-2"><Badge variant="outline">Step {step.step_id}</Badge><Badge variant="secondary">{step.role} · {step.type}</Badge></div><pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5">{typeof step.content === "string" ? step.content : JSON.stringify(step.content, null, 2)}</pre></div>)}</div></ScrollArea></TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
}
