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
import { AlertTriangleIcon, ArrowLeftIcon, Loader2Icon, MapPinnedIcon, MessageSquareIcon, RefreshCwIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { nodeAttentionScore, parseStepIds, type ScaffoldNode, type ScaffoldRating, type ScaffoldReviewResult, type ScaffoldState, type ScaffoldSteering } from "@/lib/scaffolding"

type Props = {
  state?: ScaffoldState
  reviewingNode?: string | null
  onReviewNode: (node: ScaffoldNode) => void
  onRate: (nodeName: string, questionIndex: number, rating: ScaffoldRating) => void
  onSteer: (steering: ScaffoldSteering) => void
  onFollowup: (node: ScaffoldNode, quote: string, question: string) => void
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
        <button type="button" onClick={() => data.onOpen(node)} className={cn("w-[230px] border p-4 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl", tone.card)}>
          <Handle type="target" position={Position.Top} className="!size-2 !border-background !bg-muted-foreground" />
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-semibold leading-5">{node.name}</span>
            <Badge className={cn("px-2 py-0.5 text-xs font-bold tabular-nums", tone.badge)}>{score.toFixed(0)}</Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{node.description}</p>
          <Handle type="source" position={Position.Bottom} className="!size-2 !border-background !bg-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-72 p-3 shadow-xl">
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

export function ScaffoldingReview({ state, reviewingNode, onReviewNode, onRate, onSteer, onFollowup, onRegenerate }: Props) {
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

  if (selectedNode) {
    return <NodeReviewDetail
      key={selectedNode.name}
      node={selectedNode}
      review={review}
      steps={selectedSteps}
      loading={selectedNode.name === reviewingNode}
      ratings={state?.ratings?.[selectedNode.name]}
      followups={state?.followups?.[selectedNode.name] ?? []}
      onRate={(index, rating) => onRate(selectedNode.name, index, rating)}
      onSteer={onSteer}
      onFollowup={(quote, question) => onFollowup(selectedNode, quote, question)}
      onBack={() => setSelectedNode(null)}
    />
  }

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
      {state?.status === "error" && <div className="m-4 border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangleIcon className="mr-2 inline size-4" />{state.error}</div>}
      {state?.mapResult && state.status !== "generating" && <div className="flex min-h-0 flex-1 flex-col">
        <div className="m-3 mb-0 border bg-background/90 p-3 shadow-sm">
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
    </section>
  )
}

function NodeReviewDetail({ node, review, steps, loading, ratings, followups, onRate, onSteer, onFollowup, onBack }: { node: ScaffoldNode; review?: ScaffoldReviewResult; steps: ScaffoldState["trajectory"]; loading: boolean; ratings?: Record<number, ScaffoldRating>; followups: NonNullable<ScaffoldState["followups"]>[string]; onRate: (index: number, rating: ScaffoldRating) => void; onSteer: (steering: ScaffoldSteering) => void; onFollowup: (quote: string, question: string) => void; onBack: () => void }) {
  const [tab, setTab] = React.useState("review")
  const [answers, setAnswers] = React.useState<Record<number, number>>({})
  const [selection, setSelection] = React.useState("")
  const [question, setQuestion] = React.useState("Explain this")
  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() ?? ""
    if (text) { setSelection(text.slice(0, 2000)); setQuestion("Explain this") }
  }
  return <section className="relative flex h-full min-h-0 flex-col bg-card/70" onMouseUp={captureSelection}>
    <div className="flex shrink-0 items-start gap-3 border-b bg-background/90 px-4 py-3">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to completion map"><ArrowLeftIcon /></Button>
      <div><h2 className="text-sm font-semibold">{node.name}</h2><p className="mt-1 text-xs text-muted-foreground">{node.description}</p></div>
    </div>
    <div className="min-h-0 flex-1 px-3 pt-3">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full min-h-0 flex-col">
        <TabsList><TabsTrigger value="review">Task review</TabsTrigger><TabsTrigger value="steps">Detailed steps</TabsTrigger></TabsList>
        <TabsContent value="review" className="min-h-0 flex-1">
          {loading && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2Icon className="animate-spin" />Generating node review…</div>}
          {review && <ScrollArea className="h-full"><div className="space-y-5 pb-6 pr-3">
            <iframe
              title={`${node.name} review slide`}
              sandbox="allow-same-origin"
              srcDoc={review.html_slide}
              className="h-[520px] w-full overflow-hidden border bg-white shadow-sm"
              onLoad={(event) => {
                const frame = event.currentTarget
                frame.contentDocument?.addEventListener("mouseup", () => {
                  const text = frame.contentWindow?.getSelection()?.toString().trim() ?? ""
                  if (text) { setSelection(text.slice(0, 2000)); setQuestion("Explain this") }
                })
              }}
            />
            {review.questions.map((item, index) => {
              const selectedChoice = answers[index]
              const answered = selectedChoice !== undefined
              return <div key={index} className="border bg-background p-4 shadow-sm">
                <p className="text-sm font-medium">{item.question}</p>
                <div className="mt-3 grid gap-2">{item.choices.map((choice, choiceIndex) => <Button key={choiceIndex} type="button" variant={selectedChoice === choiceIndex ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))}>{choice}</Button>)}</div>
                {answered && <div className="mt-4 bg-muted p-3 text-sm leading-6"><span className="font-semibold">What the trajectory did: </span>{item.trajectory_answer}<div className="mt-3 flex flex-wrap gap-2">{(["agree", "disagree", "doubt"] as const).map((rating) => <Button key={rating} size="sm" variant={ratings?.[index] === rating ? "default" : "outline"} onClick={() => {
                  onRate(index, rating)
                  if (rating !== "agree") {
                    onSteer({ id: crypto.randomUUID(), node_name: node.name, question: item.question, user_choice: item.choices[selectedChoice], rating, trajectory_answer: item.trajectory_answer, step_ids: item.step_ids })
                  }
                }}>{rating[0].toUpperCase() + rating.slice(1)}</Button>)}</div></div>}
              </div>
            })}
            {followups.length > 0 && <div className="border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground"><MessageSquareIcon className="mr-2 inline size-3.5" />{followups.length} follow-up message{followups.length === 1 ? "" : "s"} shown in the left panel.</div>}
          </div></ScrollArea>}
        </TabsContent>
        <TabsContent value="steps" className="min-h-0 flex-1"><ScrollArea className="h-full"><div className="space-y-3 pb-6 pr-3">{steps?.map((step) => <div key={step.step_id} className="border bg-muted/20 p-3"><div className="mb-2 flex gap-2"><Badge variant="outline">Step {step.step_id}</Badge><Badge variant="secondary">{step.role} · {step.type}</Badge></div><pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5">{typeof step.content === "string" ? step.content : JSON.stringify(step.content, null, 2)}</pre></div>)}</div></ScrollArea></TabsContent>
      </Tabs>
    </div>
    {selection && <div className="absolute right-4 bottom-4 z-30 w-[min(380px,calc(100%-2rem))] border bg-popover p-3 shadow-2xl">
      <div className="mb-2 line-clamp-2 border-l-2 border-primary pl-2 text-xs text-muted-foreground">“{selection}”</div>
      <div className="flex gap-2"><Input autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && question.trim()) { onFollowup(selection, question.trim()); setSelection("") } }} className="min-w-0 flex-1" /><Button size="sm" onClick={() => { if (question.trim()) { onFollowup(selection, question.trim()); setSelection("") } }}>Ask</Button><Button size="sm" variant="ghost" onClick={() => setSelection("")}>Cancel</Button></div>
    </div>}
  </section>
}
