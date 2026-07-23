"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  SOURCE_REFERENCE_OPTIONS,
  getSourceReferenceText,
  type SourceReferenceMention,
  type SourceReferenceOption,
} from "@/lib/source-references"

type ActiveQuery = {
  start: number
  end: number
  query: string
}

export function reconcileReferenceMentions(
  previous: string,
  next: string,
  mentions: SourceReferenceMention[]
) {
  let prefix = 0
  while (
    prefix < previous.length &&
    prefix < next.length &&
    previous[prefix] === next[prefix]
  ) {
    prefix += 1
  }

  let suffix = 0
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] ===
      next[next.length - 1 - suffix]
  ) {
    suffix += 1
  }

  const previousChangeEnd = previous.length - suffix
  const delta = next.length - previous.length

  return mentions.flatMap((mention) => {
    if (mention.end <= prefix) return [mention]
    if (mention.start >= previousChangeEnd) {
      return [
        {
          ...mention,
          start: mention.start + delta,
          end: mention.end + delta,
        },
      ]
    }
    return []
  })
}

export function findActiveReferenceQuery(
  text: string,
  caret: number,
  mentions: SourceReferenceMention[]
): ActiveQuery | undefined {
  if (caret < 1) return undefined
  const start = text.lastIndexOf("@", caret - 1)
  if (start < 0) return undefined
  if (start > 0 && !/\s/.test(text[start - 1])) return undefined
  const query = text.slice(start + 1, caret)
  if (query.includes("\n") || query.includes("@")) return undefined
  if (
    mentions.some(
      (mention) => mention.start === start
    )
  ) {
    return undefined
  }
  return { start, end: caret, query }
}

export function filterSourceReferenceOptions(query: string) {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return SOURCE_REFERENCE_OPTIONS
  return SOURCE_REFERENCE_OPTIONS.filter((option) =>
    `${option.type}/${option.name} ${option.id}`
      .toLocaleLowerCase()
      .includes(normalized)
  )
}

function HighlightedText({
  text,
  mentions,
}: {
  text: string
  mentions: SourceReferenceMention[]
}) {
  const parts: React.ReactNode[] = []
  let offset = 0

  for (const mention of mentions.toSorted((left, right) => left.start - right.start)) {
    if (
      mention.start < offset ||
      mention.end <= mention.start ||
      mention.end > text.length
    ) {
      continue
    }
    parts.push(text.slice(offset, mention.start))
    parts.push(
      <span
        key={`${mention.type}:${mention.id}:${mention.start}`}
        className="bg-accent text-accent-foreground"
      >
        {text.slice(mention.start, mention.end)}
      </span>
    )
    offset = mention.end
  }
  parts.push(text.slice(offset))
  if (text.endsWith("\n")) parts.push("\n")

  return <>{parts}</>
}

type SourceReferenceComposerProps = Omit<
  React.ComponentProps<"textarea">,
  "value" | "onChange"
> & {
  value: string
  mentions: SourceReferenceMention[]
  onValueChange: (value: string, mentions: SourceReferenceMention[]) => void
}

export const SourceReferenceComposer = React.forwardRef<
  HTMLTextAreaElement,
  SourceReferenceComposerProps
>(function SourceReferenceComposer(
  {
    value,
    mentions,
    onValueChange,
    className,
    onKeyDown,
    onSelect,
    onScroll,
    ...props
  },
  forwardedRef
) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = React.useState(0)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [dismissedTrigger, setDismissedTrigger] = React.useState<number>()
  const [scrollTop, setScrollTop] = React.useState(0)

  React.useImperativeHandle(forwardedRef, () => textareaRef.current!)

  const activeQuery = React.useMemo(
    () => findActiveReferenceQuery(value, caret, mentions),
    [caret, mentions, value]
  )
  const options = React.useMemo(
    () =>
      activeQuery
        ? filterSourceReferenceOptions(activeQuery.query)
        : [],
    [activeQuery]
  )
  const open =
    activeQuery != null &&
    activeQuery.start !== dismissedTrigger &&
    options.length > 0

  const syncCaret = React.useCallback(
    (element: HTMLTextAreaElement) => {
      if (element.selectionStart !== element.selectionEnd) {
        setCaret(element.selectionEnd)
        return
      }
      setCaret(element.selectionStart)
      setActiveIndex(0)
      if (
        dismissedTrigger != null &&
        (element.selectionStart <= dismissedTrigger ||
          value[dismissedTrigger] !== "@")
      ) {
        setDismissedTrigger(undefined)
      }
    },
    [dismissedTrigger, value]
  )

  const selectOption = React.useCallback(
    (option: SourceReferenceOption) => {
      if (!activeQuery) return
      const display = getSourceReferenceText(option)
      const replacement = `${display} `
      const next =
        value.slice(0, activeQuery.start) +
        replacement +
        value.slice(activeQuery.end)
      const reconciled = reconcileReferenceMentions(value, next, mentions)
      const nextMentions = [
        ...reconciled,
        {
          type: option.type,
          id: option.id,
          start: activeQuery.start,
          end: activeQuery.start + display.length,
        },
      ].toSorted((left, right) => left.start - right.start)
      const nextCaret = activeQuery.start + replacement.length

      onValueChange(next, nextMentions)
      setDismissedTrigger(undefined)
      setCaret(nextCaret)
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
        textareaRef.current?.setSelectionRange(nextCaret, nextCaret)
      })
    },
    [activeQuery, mentions, onValueChange, value]
  )

  return (
    <div className="relative min-w-0 flex-1">
      {open && (
        <div
          id="source-reference-options"
          role="listbox"
          className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.map((option, index) => (
            <button
              key={`${option.type}:${option.id}`}
              id={`source-reference-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 px-2 py-1.5 text-left outline-none",
                index === activeIndex && "bg-accent text-accent-foreground"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                selectOption(option)
              }}
            >
              <span className="text-xs font-medium">
                {option.type}/{option.name}
              </span>
              <span className="line-clamp-1 text-[11px] text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 text-sm",
          className
        )}
      >
        <div style={{ transform: `translateY(-${scrollTop}px)` }}>
          <HighlightedText text={value} mentions={mentions} />
        </div>
      </div>

      <textarea
        ref={textareaRef}
        data-slot="input-group-control"
        value={value}
        aria-autocomplete="list"
        aria-controls={open ? "source-reference-options" : undefined}
        aria-activedescendant={
          open ? `source-reference-option-${activeIndex}` : undefined
        }
        className={cn(
          "relative z-10 w-full flex-1 resize-none rounded-none border-0 bg-transparent px-3 text-sm text-transparent shadow-none outline-none [caret-color:var(--foreground)] placeholder:text-muted-foreground focus-visible:ring-0 disabled:bg-transparent disabled:opacity-50",
          className
        )}
        onChange={(event) => {
          const next = event.target.value
          const nextMentions = reconcileReferenceMentions(value, next, mentions)
          onValueChange(next, nextMentions)
          setCaret(event.target.selectionStart)
          setActiveIndex(0)
          if (
            dismissedTrigger != null &&
            next[dismissedTrigger] !== "@"
          ) {
            setDismissedTrigger(undefined)
          }
        }}
        onSelect={(event) => {
          syncCaret(event.currentTarget)
          onSelect?.(event)
        }}
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop)
          onScroll?.(event)
        }}
        onKeyDown={(event) => {
          if (open) {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setActiveIndex((current) => (current + 1) % options.length)
              return
            }
            if (event.key === "ArrowUp") {
              event.preventDefault()
              setActiveIndex(
                (current) => (current - 1 + options.length) % options.length
              )
              return
            }
            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault()
              selectOption(options[activeIndex])
              return
            }
            if (event.key === "Escape") {
              event.preventDefault()
              setDismissedTrigger(activeQuery?.start)
              return
            }
          }
          onKeyDown?.(event)
        }}
        {...props}
      />
    </div>
  )
})
