"use client"

import * as React from "react"
import {
  CheckIcon,
  CircleIcon,
  Loader2Icon,
  MapPinnedIcon,
  MoveIcon,
  RouteIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ResearchPlan, ResearchPlanStep } from "@/lib/research-plan"
import { cn } from "@/lib/utils"

const CANVAS_WIDTH = 410
const CENTER_X = CANVAS_WIDTH / 2
const STATION_GAP = 132
const MAP_PADDING_TOP = 72
const MAP_PADDING_BOTTOM = 76
const STATION_CARD_WIDTH = 158
const CONNECTOR_WIDTH = 24
const MARKER_SIZE = 22
const STATION_BUTTON_WIDTH =
  STATION_CARD_WIDTH + CONNECTOR_WIDTH + MARKER_SIZE
const ROUTE_COLORS = [
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-1)",
]

type MetroStation = {
  step: ResearchPlanStep
  x: number
  y: number
  depth: number
  order: number
  side: "left" | "right"
  color: string
}

type MetroLine = {
  from: MetroStation
  to: MetroStation
}

export type MetroLayout = {
  stations: MetroStation[]
  lines: MetroLine[]
  centerX: number
  spineStartY: number
  spineEndY: number
  width: number
  height: number
}

type ResearchMetroMapProps = {
  plan: ResearchPlan | null
  currentStepName?: string
  visitedStepNames: Set<string>
  disabled: boolean
  isUpdating: boolean
  onSelectStep: (step: ResearchPlanStep) => void
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
}

export function ResearchMetroMap({
  plan,
  currentStepName,
  visitedStepNames,
  disabled,
  isUpdating,
  onSelectStep,
}: ResearchMetroMapProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<DragState | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const layout = React.useMemo(
    () => (plan ? buildMetroLayout(plan) : null),
    [plan]
  )

  React.useEffect(() => {
    if (!layout || !currentStepName || !scrollRef.current) return

    const station = layout.stations.find(
      (candidate) => candidate.step.name === currentStepName
    )
    if (!station) return

    const viewport = scrollRef.current
    viewport.scrollTo({
      left: Math.max(0, station.x - viewport.clientWidth / 2),
      top: Math.max(0, station.y - viewport.clientHeight / 2),
      behavior: "smooth",
    })
  }, [currentStepName, layout])

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("[data-metro-station]")
    ) {
      return
    }

    const viewport = event.currentTarget
    viewport.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    }
    setIsDragging(true)
  }

  const dragMap = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    event.preventDefault()
    event.currentTarget.scrollLeft =
      drag.scrollLeft - (event.clientX - drag.startX)
    event.currentTarget.scrollTop =
      drag.scrollTop - (event.clientY - drag.startY)
  }

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-card/70 text-card-foreground">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RouteIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Research route</h2>
            {plan && (
              <Badge variant="outline" className="tabular-nums">
                {plan.steps.length} stops
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a station for its slide. Drag the map to move.
          </p>
        </div>
        {isUpdating ? (
          <Badge variant="secondary" className="shrink-0">
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
            Updating
          </Badge>
        ) : plan ? (
          <Badge variant="secondary" className="shrink-0">
            <MoveIcon data-icon="inline-start" />
            Drag
          </Badge>
        ) : null}
      </div>

      {!layout ? (
        <div className="flex min-h-44 flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 grid size-11 place-items-center rounded-full border bg-muted/50 text-muted-foreground">
            <MapPinnedIcon className="size-5" />
          </div>
          <p className="text-sm font-medium">Your route will appear here</p>
          <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">
            The agent will research the topic before designing your learning
            route.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          aria-label="Draggable research route map"
          onPointerDown={startDragging}
          onPointerMove={dragMap}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className={cn(
            "metro-map-scroll relative min-h-0 flex-1 touch-pan-x touch-pan-y select-none overflow-auto bg-[radial-gradient(circle_at_center,var(--border)_1px,transparent_1px)] [background-size:22px_22px]",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          <div
            className="relative transition-[width,height] duration-700 ease-out"
            style={{ width: layout.width, height: layout.height }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              <line
                x1={layout.centerX}
                x2={layout.centerX}
                y1={layout.spineStartY}
                y2={layout.spineEndY}
                stroke="var(--background)"
                strokeLinecap="round"
                strokeWidth="13"
              />
              <line
                data-testid="metro-spine"
                pathLength={1}
                x1={layout.centerX}
                x2={layout.centerX}
                y1={layout.spineStartY}
                y2={layout.spineEndY}
                stroke="color-mix(in oklch, var(--primary), var(--foreground) 8%)"
                strokeLinecap="round"
                strokeWidth="6"
                className="metro-map-track"
              />

              {layout.lines.map((line) => {
                const explored =
                  visitedStepNames.has(line.from.step.name) &&
                  (visitedStepNames.has(line.to.step.name) ||
                    currentStepName === line.to.step.name)

                if (!explored) return null

                return (
                  <line
                    key={`${line.from.step.name}->${line.to.step.name}`}
                    x1={layout.centerX}
                    x2={layout.centerX}
                    y1={line.from.y}
                    y2={line.to.y}
                    stroke="var(--chart-2)"
                    strokeLinecap="round"
                    strokeWidth="7"
                    className="transition-[stroke-width,opacity] duration-500"
                  />
                )
              })}
            </svg>

            {layout.stations.map((station) => {
              const isCurrent = station.step.name === currentStepName
              const isVisited = visitedStepNames.has(station.step.name)
              const marker = (
                <span
                  className={cn(
                    "relative z-20 grid shrink-0 place-items-center rounded-full border-[4px] border-background bg-background shadow-sm transition-[transform,background-color,box-shadow] duration-500",
                    isCurrent &&
                      "scale-125 bg-primary text-primary-foreground shadow-[0_0_0_7px_color-mix(in_oklch,var(--primary),transparent_78%)]",
                    isVisited && !isCurrent && "bg-card"
                  )}
                  style={{
                    width: MARKER_SIZE,
                    height: MARKER_SIZE,
                    borderColor: station.color,
                  }}
                >
                  {isCurrent ? (
                    <CircleIcon className="size-2 fill-current" />
                  ) : isVisited ? (
                    <CheckIcon className="size-2.5" />
                  ) : null}
                </span>
              )
              const connector = (
                <span
                  className="h-1 shrink-0 rounded-full shadow-[0_0_0_3px_var(--background)]"
                  style={{
                    width: CONNECTOR_WIDTH,
                    backgroundColor: station.color,
                  }}
                />
              )
              const card = (
                <span
                  className={cn(
                    "block shrink-0 rounded-lg border bg-background px-3 py-2.5 shadow-sm transition-[border-color,box-shadow,transform,background-color] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring/50",
                    station.side === "left" ? "text-right" : "text-left",
                    isCurrent &&
                      "border-primary shadow-md ring-1 ring-primary/25",
                    isVisited && !isCurrent && "bg-muted"
                  )}
                  style={{
                    width: STATION_CARD_WIDTH,
                    ...(station.side === "left"
                      ? {
                          borderRightColor: station.color,
                          borderRightWidth: 4,
                        }
                      : {
                          borderLeftColor: station.color,
                          borderLeftWidth: 4,
                        }),
                  }}
                >
                  <span
                    className={cn(
                      "flex items-start justify-between gap-2",
                      station.side === "left" && "flex-row-reverse"
                    )}
                  >
                    <span className="line-clamp-2 text-xs font-semibold leading-4">
                      {station.step.name}
                    </span>
                    <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      {String(station.order + 1).padStart(2, "0")} ·{" "}
                      {isCurrent ? "Now" : isVisited ? "Seen" : "Go"}
                    </span>
                  </span>
                  <span className="mt-1.5 line-clamp-3 text-[11px] leading-4 text-muted-foreground">
                    {station.step.description}
                  </span>
                </span>
              )

              return (
                <button
                  key={station.step.name}
                  data-metro-station
                  type="button"
                  disabled={disabled}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Explore ${station.step.name}`}
                  onClick={() => onSelectStep(station.step)}
                  className={cn(
                    "metro-map-station group absolute z-10 flex -translate-y-1/2 items-center text-left transition-[left,top,opacity] duration-700 ease-out focus-visible:outline-none disabled:cursor-wait disabled:opacity-60",
                    isCurrent && "z-20"
                  )}
                  style={{
                    left:
                      station.side === "left"
                        ? station.x - STATION_BUTTON_WIDTH + MARKER_SIZE / 2
                        : station.x - MARKER_SIZE / 2,
                    top: station.y,
                    width: STATION_BUTTON_WIDTH,
                  }}
                >
                  {station.side === "left" ? (
                    <>
                      {card}
                      {connector}
                      {marker}
                    </>
                  ) : (
                    <>
                      {marker}
                      {connector}
                      {card}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export function buildMetroLayout(plan: ResearchPlan): MetroLayout {
  const orderedSteps = stableTopologicalOrder(plan)
  const depths = getStepDepths(plan)
  const incoming = new Map(plan.steps.map((step) => [step.name, [] as string[]]))

  for (const step of plan.steps) {
    for (const nextStep of step.next_steps) {
      if (incoming.has(nextStep)) {
        incoming.set(nextStep, [...(incoming.get(nextStep) ?? []), step.name])
      }
    }
  }

  const colorByName = assignRouteColors(plan, incoming, depths)
  const stations = orderedSteps.map((step, order): MetroStation => ({
    step,
    order,
    depth: depths.get(step.name) ?? 0,
    side: order % 2 === 0 ? "left" : "right",
    x: CENTER_X,
    y: MAP_PADDING_TOP + order * STATION_GAP,
    color: colorByName.get(step.name) ?? ROUTE_COLORS[0],
  }))
  const stationByName = new Map(
    stations.map((station) => [station.step.name, station])
  )
  const lines = plan.steps.flatMap((step) =>
    step.next_steps.flatMap((nextStep) => {
      const from = stationByName.get(step.name)
      const to = stationByName.get(nextStep)
      return from && to ? [{ from, to }] : []
    })
  )
  const spineStartY = stations[0]?.y ?? MAP_PADDING_TOP
  const spineEndY = stations.at(-1)?.y ?? MAP_PADDING_TOP

  return {
    stations,
    lines,
    centerX: CENTER_X,
    spineStartY,
    spineEndY,
    width: CANVAS_WIDTH,
    height: spineEndY + MAP_PADDING_BOTTOM,
  }
}

function stableTopologicalOrder(plan: ResearchPlan) {
  const indexByName = new Map(
    plan.steps.map((step, index) => [step.name, index])
  )
  const byName = new Map(plan.steps.map((step) => [step.name, step]))
  const indegree = new Map(plan.steps.map((step) => [step.name, 0]))

  for (const step of plan.steps) {
    for (const nextStep of step.next_steps) {
      if (indegree.has(nextStep)) {
        indegree.set(nextStep, (indegree.get(nextStep) ?? 0) + 1)
      }
    }
  }

  const ready = plan.steps
    .filter((step) => indegree.get(step.name) === 0)
    .toSorted(
      (left, right) =>
        (indexByName.get(left.name) ?? 0) -
        (indexByName.get(right.name) ?? 0)
    )
  const ordered: ResearchPlanStep[] = []

  while (ready.length) {
    const step = ready.shift()
    if (!step) break
    ordered.push(step)

    for (const nextStepName of step.next_steps) {
      if (!indegree.has(nextStepName)) continue
      const nextIndegree = (indegree.get(nextStepName) ?? 0) - 1
      indegree.set(nextStepName, nextIndegree)

      if (nextIndegree === 0) {
        const nextStep = byName.get(nextStepName)
        if (nextStep) {
          ready.push(nextStep)
          ready.sort(
            (left, right) =>
              (indexByName.get(left.name) ?? 0) -
              (indexByName.get(right.name) ?? 0)
          )
        }
      }
    }
  }

  return ordered.length === plan.steps.length ? ordered : plan.steps
}

function getStepDepths(plan: ResearchPlan) {
  const incoming = new Map(plan.steps.map((step) => [step.name, [] as string[]]))
  const depths = new Map<string, number>()

  for (const step of plan.steps) {
    for (const nextStep of step.next_steps) {
      if (incoming.has(nextStep)) {
        incoming.set(nextStep, [...(incoming.get(nextStep) ?? []), step.name])
      }
    }
  }

  function depthFor(name: string, stack = new Set<string>()): number {
    const existing = depths.get(name)
    if (existing != null) return existing
    if (stack.has(name)) return 0

    const parents = incoming.get(name) ?? []
    const nextStack = new Set(stack).add(name)
    const depth = parents.length
      ? 1 + Math.max(...parents.map((parent) => depthFor(parent, nextStack)))
      : 0
    depths.set(name, depth)
    return depth
  }

  for (const step of plan.steps) depthFor(step.name)
  return depths
}

function assignRouteColors(
  plan: ResearchPlan,
  incoming: Map<string, string[]>,
  depthByName: Map<string, number>
) {
  const colors = new Map<string, string>()
  const ordered = plan.steps.toSorted(
    (left, right) =>
      (depthByName.get(left.name) ?? 0) -
      (depthByName.get(right.name) ?? 0)
  )
  let nextColor = 0

  for (const step of ordered) {
    const assigned = colors.get(step.name)
    const inherited = (incoming.get(step.name) ?? [])
      .map((parent) => colors.get(parent))
      .find((color): color is string => Boolean(color))

    colors.set(
      step.name,
      assigned ?? inherited ?? ROUTE_COLORS[nextColor++ % ROUTE_COLORS.length]
    )

    step.next_steps.slice(1).forEach((nextStep) => {
      if (!colors.has(nextStep)) {
        colors.set(
          nextStep,
          ROUTE_COLORS[nextColor++ % ROUTE_COLORS.length]
        )
      }
    })
  }

  return colors
}
