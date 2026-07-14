"use client"

import * as React from "react"
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import {
  CheckCircle2Icon,
  FlagIcon,
  LockIcon,
  MapIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getHardPrerequisiteIds,
  type DependencyEdge,
  type DependencyMap,
  type DependencyNode,
  type EdgeKind,
  type UserMapState,
  type UserNodeState,
} from "@/lib/dependency-map"
import { cn } from "@/lib/utils"

const NODE_WIDTH = 250
const COLUMN_GAP = 330
const ROW_GAP = 165

const LOCKING_EDGE_KINDS = new Set<EdgeKind>([
  "prerequisite",
  "supports",
  "evidence_for",
  "method_for",
  "part_of",
  "leads_to_final",
])

const NODE_KIND_ORDER: Record<string, number> = {
  term: 0,
  topic: 1,
  subquestion: 2,
  atomic_fact: 3,
  method: 4,
  evidence: 5,
  assumption: 6,
  claim: 7,
  inference: 8,
  uncertainty: 9,
  counterpoint: 10,
  decision_point: 11,
  final_synthesis: 12,
}

export type DependencyMapGraphNodeRequest = {
  map: DependencyMap
  node: DependencyNode
  overrideLocked?: boolean
}

type DependencyMapGraphProps = {
  map: DependencyMap
  nodeStates: Record<string, UserNodeState>
  userState: UserMapState
  disabled: boolean
  onInspectNode: (request: DependencyMapGraphNodeRequest) => void
  onMarkUnderstood: (map: DependencyMap, node: DependencyNode) => void
  onFlagNode: (map: DependencyMap, node: DependencyNode) => void
}

type DependencyDisplayEdge = DependencyEdge & {
  synthetic?: boolean
}

type DependencyFlowNodeData = {
  map: DependencyMap
  node: DependencyNode
  nodeState: UserNodeState
  userState: UserMapState
  disabled: boolean
  isFinal: boolean
  onInspectNode: (request: DependencyMapGraphNodeRequest) => void
  onMarkUnderstood: (map: DependencyMap, node: DependencyNode) => void
  onFlagNode: (map: DependencyMap, node: DependencyNode) => void
}

type DependencyFlowEdgeData = {
  kind: EdgeKind
  strength: DependencyEdge["strength"]
  rationale: string
}

type DependencyFlowNode = Node<DependencyFlowNodeData, "dependencyNode">
type DependencyFlowEdge = Edge<DependencyFlowEdgeData, "smoothstep">

const dependencyNodeTypes = {
  dependencyNode: DependencyFlowNodeCard,
} satisfies NodeTypes

export function DependencyMapGraph({
  map,
  nodeStates,
  userState,
  disabled,
  onInspectNode,
  onMarkUnderstood,
  onFlagNode,
}: DependencyMapGraphProps) {
  const { nodes, edges } = React.useMemo(
    () =>
      buildFlowGraph({
        map,
        nodeStates,
        userState,
        disabled,
        onInspectNode,
        onMarkUnderstood,
        onFlagNode,
      }),
    [
      disabled,
      map,
      nodeStates,
      onFlagNode,
      onInspectNode,
      onMarkUnderstood,
      userState,
    ]
  )
  const fitWholeMap = nodes.length <= 8

  return (
    <div className="grid gap-2">
      <div className="h-[min(70vh,720px)] min-h-[520px] overflow-hidden border bg-background">
        <ReactFlow<DependencyFlowNode, DependencyFlowEdge>
          key={map.map_id}
          nodes={nodes}
          edges={edges}
          nodeTypes={dependencyNodeTypes}
          fitView={fitWholeMap}
          fitViewOptions={{ padding: 0.18 }}
          defaultViewport={
            fitWholeMap ? undefined : { x: 36, y: 32, zoom: 0.78 }
          }
          minZoom={0.42}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          onlyRenderVisibleElements
          panOnScroll
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          onNodeDoubleClick={(_, flowNode) => {
            onInspectNode({
              map,
              node: flowNode.data.node,
              overrideLocked: flowNode.data.nodeState === "locked",
            })
          }}
          aria-label="Dependency map graph"
        >
          <Background color="var(--border)" gap={26} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) =>
              minimapColorForState(
                (node as DependencyFlowNode).data.nodeState,
                (node as DependencyFlowNode).data.isFinal
              )
            }
            nodeStrokeColor="var(--border)"
            maskColor="color-mix(in oklch, var(--background), transparent 35%)"
            bgColor="var(--background)"
          />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline">Solid: hard dependency</Badge>
        <Badge variant="outline">Dashed: soft dependency</Badge>
        <Badge variant="destructive">Red: contradiction</Badge>
        <Badge variant="secondary">Double-click a room to inspect</Badge>
      </div>
    </div>
  )
}

function DependencyFlowNodeCard({
  data,
}: NodeProps<DependencyFlowNode>) {
  const {
    map,
    node,
    nodeState,
    userState,
    disabled,
    isFinal,
    onInspectNode,
    onMarkUnderstood,
    onFlagNode,
  } = data
  const hardPrerequisites = getHardPrerequisiteIds(map, node.id)
  const reviewedIds = new Set([
    ...userState.visited_node_ids,
    ...userState.understood_node_ids,
  ])
  const missingPrerequisites = hardPrerequisites
    .filter((nodeId) => !reviewedIds.has(nodeId))
    .map((nodeId) => map.nodes.find((candidate) => candidate.id === nodeId))
    .filter((candidate): candidate is DependencyNode => Boolean(candidate))

  return (
    <div
      className={cn(
        "relative grid gap-2 border bg-background p-2 text-xs shadow-sm",
        nodeState === "locked" &&
          "border-dashed bg-muted/35 text-muted-foreground opacity-85",
        nodeState === "available" && "border-primary/50 bg-primary/5",
        nodeState === "visited" && "border-ring bg-muted/35",
        nodeState === "understood" && "border-primary bg-primary/10",
        nodeState === "flagged" &&
          "border-destructive/80 bg-destructive/10",
        isFinal && "ring-2 ring-primary/35"
      )}
      style={{ width: NODE_WIDTH }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-background !bg-muted-foreground"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-background !bg-primary"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-foreground">{node.label}</span>
            <Badge variant="outline">{node.kind.replaceAll("_", " ")}</Badge>
            {isFinal && <Badge variant="secondary">Final</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-muted-foreground">
            {node.summary}
          </p>
        </div>
        <NodeStateBadge state={nodeState} />
      </div>

      <div className="grid gap-1 text-muted-foreground">
        {missingPrerequisites.length > 0 && (
          <div className="line-clamp-1 text-destructive">
            <span className="font-medium">Needs: </span>
            {missingPrerequisites
              .map((prerequisite) => prerequisite.label)
              .join(", ")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="nodrag nopan"
              size="xs"
              variant={nodeState === "locked" ? "outline" : "default"}
              disabled={disabled}
              onClick={() =>
                onInspectNode({
                  map,
                  node,
                  overrideLocked: nodeState === "locked",
                })
              }
            >
              {nodeState === "locked" ? (
                <LockIcon data-icon="inline-start" />
              ) : (
                <MapIcon data-icon="inline-start" />
              )}
              {nodeState === "locked" ? "Open anyway" : "Inspect"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {nodeState === "locked"
              ? "Open with a prerequisite warning"
              : "Inspect this node"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="nodrag nopan"
              size="icon-xs"
              variant="outline"
              disabled={disabled || nodeState === "locked"}
              onClick={() => onMarkUnderstood(map, node)}
            >
              <CheckCircle2Icon />
              <span className="sr-only">Mark understood</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark understood</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="nodrag nopan"
              size="icon-xs"
              variant={nodeState === "flagged" ? "destructive" : "outline"}
              disabled={disabled}
              onClick={() => onFlagNode(map, node)}
            >
              <FlagIcon />
              <span className="sr-only">Flag node</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Flag node</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function buildFlowGraph({
  map,
  nodeStates,
  userState,
  disabled,
  onInspectNode,
  onMarkUnderstood,
  onFlagNode,
}: DependencyMapGraphProps): {
  nodes: DependencyFlowNode[]
  edges: DependencyFlowEdge[]
} {
  const displayEdges = buildDisplayEdges(map)
  const depths = getNodeDepths(map, displayEdges)
  const groups = groupNodesByDepth(map, depths)
  const maxRows = Math.max(...groups.map((group) => group.nodes.length), 1)
  const graphHeight = Math.max(0, (maxRows - 1) * ROW_GAP)

  const nodes = groups.flatMap((group) => {
    const groupOffset = (graphHeight - Math.max(0, (group.nodes.length - 1) * ROW_GAP)) / 2

    return group.nodes.map((node, rowIndex) => ({
      id: node.id,
      type: "dependencyNode" as const,
      position: {
        x: group.depth * COLUMN_GAP,
        y: groupOffset + rowIndex * ROW_GAP,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        map,
        node,
        nodeState: nodeStates[node.id] ?? "locked",
        userState,
        disabled,
        isFinal: node.id === map.final_node_id,
        onInspectNode,
        onMarkUnderstood,
        onFlagNode,
      },
    }))
  })

  const edges = displayEdges.map((edge, index) => {
    const color = edgeColor(edge)

    return {
      id: `${edge.synthetic ? "synthetic" : "edge"}-${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      type: "smoothstep" as const,
      animated: false,
      data: {
        kind: edge.kind,
        strength: edge.strength,
        rationale: edge.rationale,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      style: {
        stroke: color,
        strokeWidth: edge.strength === "hard" ? 1.8 : 1.35,
        strokeDasharray:
          edge.kind === "contradicts" || edge.strength === "soft"
            ? "6 5"
            : undefined,
      },
    }
  })

  return { nodes, edges }
}

function buildDisplayEdges(map: DependencyMap): DependencyDisplayEdge[] {
  const displayEdges: DependencyDisplayEdge[] = map.edges.map((edge) => ({
    ...edge,
    synthetic: false,
  }))

  for (const node of map.nodes) {
    for (const prerequisiteId of node.prerequisites) {
      const hasDisplayedEdge = displayEdges.some(
        (edge) => edge.from === prerequisiteId && edge.to === node.id
      )

      if (hasDisplayedEdge) {
        continue
      }

      displayEdges.push({
        from: prerequisiteId,
        to: node.id,
        kind: "prerequisite",
        strength: "hard",
        rationale: "Listed as a prerequisite on the target node.",
        synthetic: true,
      })
    }
  }

  return displayEdges
}

function groupNodesByDepth(
  map: DependencyMap,
  depths: Map<string, number>
) {
  const groups = new Map<number, DependencyNode[]>()

  for (const node of map.nodes) {
    const depth = depths.get(node.id) ?? 0
    groups.set(depth, [...(groups.get(depth) ?? []), node])
  }

  return Array.from(groups.entries())
    .sort(([leftDepth], [rightDepth]) => leftDepth - rightDepth)
    .map(([depth, nodes]) => ({
      depth,
      nodes: nodes.toSorted((left, right) => compareNodes(map, left, right)),
    }))
}

function getNodeDepths(
  map: DependencyMap,
  displayEdges: DependencyDisplayEdge[]
) {
  const depths = new Map<string, number>()

  function depthFor(nodeId: string, stack: Set<string>): number {
    const existing = depths.get(nodeId)

    if (existing != null) {
      return existing
    }

    if (stack.has(nodeId)) {
      return 0
    }

    const nextStack = new Set(stack).add(nodeId)
    const prerequisites = displayEdges
      .filter(
        (edge) =>
          edge.to === nodeId &&
          edge.strength === "hard" &&
          LOCKING_EDGE_KINDS.has(edge.kind)
      )
      .map((edge) => edge.from)
    const depth = prerequisites.length
      ? 1 +
        Math.max(
          ...prerequisites.map((prerequisiteId) =>
            depthFor(prerequisiteId, nextStack)
          )
        )
      : 0

    depths.set(nodeId, depth)
    return depth
  }

  for (const node of map.nodes) {
    depthFor(node.id, new Set())
  }

  return depths
}

function compareNodes(
  map: DependencyMap,
  left: DependencyNode,
  right: DependencyNode
) {
  if (left.id === map.final_node_id) {
    return 1
  }
  if (right.id === map.final_node_id) {
    return -1
  }

  const leftRecommendedIndex = map.recommended_first_node_ids.indexOf(left.id)
  const rightRecommendedIndex = map.recommended_first_node_ids.indexOf(right.id)

  if (leftRecommendedIndex !== -1 || rightRecommendedIndex !== -1) {
    return (
      (leftRecommendedIndex === -1 ? Number.MAX_SAFE_INTEGER : leftRecommendedIndex) -
      (rightRecommendedIndex === -1
        ? Number.MAX_SAFE_INTEGER
        : rightRecommendedIndex)
    )
  }

  const leftKind = NODE_KIND_ORDER[left.kind] ?? 100
  const rightKind = NODE_KIND_ORDER[right.kind] ?? 100

  if (leftKind !== rightKind) {
    return leftKind - rightKind
  }

  return left.label.localeCompare(right.label)
}

function NodeStateBadge({ state }: { state: UserNodeState }) {
  const config: Record<
    UserNodeState,
    {
      label: string
      variant: React.ComponentProps<typeof Badge>["variant"]
      icon: React.ReactNode
    }
  > = {
    locked: {
      label: "Locked",
      variant: "outline",
      icon: <LockIcon data-icon="inline-start" />,
    },
    available: {
      label: "Available",
      variant: "default",
      icon: <MapIcon data-icon="inline-start" />,
    },
    visited: {
      label: "Visited",
      variant: "secondary",
      icon: <MapIcon data-icon="inline-start" />,
    },
    understood: {
      label: "Understood",
      variant: "secondary",
      icon: <CheckCircle2Icon data-icon="inline-start" />,
    },
    flagged: {
      label: "Flagged",
      variant: "destructive",
      icon: <FlagIcon data-icon="inline-start" />,
    },
  }
  const selected = config[state]

  return (
    <Badge variant={selected.variant}>
      {selected.icon}
      {selected.label}
    </Badge>
  )
}

function edgeColor(edge: DependencyDisplayEdge) {
  if (edge.kind === "contradicts") {
    return "var(--destructive)"
  }

  if (edge.strength === "hard") {
    return "color-mix(in oklch, var(--primary), transparent 22%)"
  }

  return "color-mix(in oklch, var(--muted-foreground), transparent 20%)"
}

function minimapColorForState(state: UserNodeState, isFinal: boolean) {
  if (isFinal) {
    return "var(--primary)"
  }

  if (state === "flagged") {
    return "var(--destructive)"
  }

  if (state === "understood") {
    return "var(--primary)"
  }

  if (state === "locked") {
    return "var(--muted)"
  }

  return "var(--secondary)"
}
