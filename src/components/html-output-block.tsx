"use client"

import * as React from "react"

import { useTheme } from "@/components/theme-provider"

const FRAME_WIDTH = 960
const FRAME_HEIGHT = 540
const MIN_FRAME_HEIGHT = 1

type TailwindResponse = {
  css: string
  hash: string
}

type TailwindState = {
  source: string
  css: string | null
  error: string | null
}

type ContentHeightState = {
  source: string
  height: number
}

type HtmlBlockHeightMessage = {
  type: "html-output-height"
  blockId: string
  height: number
}

export function getScaledHtmlOutputHeight(
  contentHeight: number,
  renderedWidth: number
) {
  return Math.max(
    MIN_FRAME_HEIGHT,
    contentHeight * (renderedWidth / FRAME_WIDTH)
  )
}

function escapeStyleContent(value: string) {
  return value.replace(/<\/style/gi, "<\\/style")
}

function escapeScriptContent(value: string) {
  return value.replace(/<\/script/gi, "<\\/script")
}

function buildSrcDoc(
  source: string,
  css: string,
  isDark: boolean,
  blockId: string
) {
  const frameCss = `
    html,
    body {
      width: ${FRAME_WIDTH}px;
      margin: 0;
      background: transparent;
    }

    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--foreground, #171717);
    }

    #html-block-error {
      position: fixed;
      inset: 12px;
      z-index: 2147483647;
      display: none;
      overflow: auto;
      border: 1px solid rgba(220, 38, 38, 0.45);
      background: rgba(254, 242, 242, 0.98);
      color: #7f1d1d;
      padding: 12px;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre-wrap;
    }

    .dark #html-block-error {
      border-color: rgba(248, 113, 113, 0.45);
      background: rgba(69, 10, 10, 0.98);
      color: #fecaca;
    }
  `

  const runtime = `
    (() => {
      const showError = (error) => {
        const target = document.getElementById("html-block-error");
        if (!target) return;
        const message = error && error.stack ? error.stack : String(error);
        target.textContent = message;
        target.style.display = "block";
      };

      window.addEventListener("error", (event) => {
        showError(event.error || event.message);
      });

      window.addEventListener("unhandledrejection", (event) => {
        showError(event.reason || "Unhandled promise rejection");
      });

      window.onHtmlBlockReady = (callback) => {
        try {
          if (typeof callback === "function") {
            callback({
              React: window.React,
              ReactDOM: window.ReactDOM,
              Lucide: window.Lucide,
              Recharts: window.Recharts,
            });
          }
        } catch (error) {
          showError(error);
        }
      };

      window.__htmlBlockShowError = showError;

      const postHeight = () => {
        const bodyRect = document.body
          ? document.body.getBoundingClientRect()
          : { height: 0 };
        const height = Math.max(
          1,
          document.body ? document.body.scrollHeight : 0,
          document.body ? document.body.offsetHeight : 0,
          bodyRect.height
        );

        window.parent.postMessage(
          {
            type: "html-output-height",
            blockId: ${JSON.stringify(blockId)},
            height,
          },
          "*"
        );
      };

      const scheduleHeightPost = () => {
        requestAnimationFrame(() => {
          postHeight();
          requestAnimationFrame(postHeight);
        });
      };

      window.addEventListener("load", scheduleHeightPost);
      document.addEventListener("DOMContentLoaded", scheduleHeightPost);

      const observer = new ResizeObserver(scheduleHeightPost);
      observer.observe(document.documentElement);
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body) {
          observer.observe(document.body);
        }
      });

      scheduleHeightPost();
    })();
  `

  const jsxRuntime = `
    import * as React from "https://esm.sh/react@19.2.4";
    import { createRoot } from "https://esm.sh/react-dom@19.2.4/client";
    import * as Lucide from "https://esm.sh/lucide-react@1.21.0?deps=react@19.2.4";
    import * as Recharts from "https://esm.sh/recharts@3.9.0?deps=react@19.2.4,react-dom@19.2.4";

    window.React = React;
    window.ReactDOM = { createRoot };
    window.Lucide = Lucide;
    window.Recharts = Recharts;

    const showError = window.__htmlBlockShowError || console.error;
    const scripts = Array.from(document.querySelectorAll('script[type="text/html-block-jsx"]'));

    for (const script of scripts) {
      try {
        if (!window.Babel) {
          throw new Error("Babel runtime did not load.");
        }

        const transformed = window.Babel.transform(script.textContent || "", {
          presets: [["react", { runtime: "classic" }]],
          filename: "html-block.jsx",
        }).code;

        Function(
          "React",
          "ReactDOM",
          "Lucide",
          "Recharts",
          "onHtmlBlockReady",
          transformed
        )(React, window.ReactDOM, Lucide, Recharts, window.onHtmlBlockReady);
      } catch (error) {
        showError(error);
      }
    }
  `

  return `<!doctype html>
<html class="${isDark ? "dark" : ""}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${FRAME_WIDTH}, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://esm.sh https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'" />
    <style>${escapeStyleContent(frameCss)}</style>
    <style>${escapeStyleContent(css)}</style>
    <script>${escapeScriptContent(runtime)}</script>
    <script src="https://unpkg.com/@babel/standalone@8.0.2/babel.min.js" crossorigin="anonymous"></script>
  </head>
  <body>
    <div id="html-block-error" role="alert"></div>
    ${source}
    <script type="module">${escapeScriptContent(jsxRuntime)}</script>
  </body>
</html>`
}

export function HtmlOutputBlock({ source }: { source: string }) {
  const { resolvedTheme } = useTheme()
  const blockId = React.useId()
  const [width, setWidth] = React.useState(FRAME_WIDTH)
  const [contentHeightState, setContentHeightState] =
    React.useState<ContentHeightState>({
      source: "",
      height: FRAME_HEIGHT,
    })
  const [tailwindState, setTailwindState] = React.useState<TailwindState>({
    source: "",
    css: null,
    error: null,
  })
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)

  React.useEffect(() => {
    const target = containerRef.current

    if (!target) {
      return
    }

    const updateWidth = () => {
      setWidth(Math.max(280, Math.min(FRAME_WIDTH, target.clientWidth)))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(target)

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()

    fetch("/api/html-output/tailwind", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as Partial<TailwindResponse> & {
          error?: string
        }

        if (!response.ok || typeof payload.css !== "string") {
          throw new Error(payload.error || "Unable to compile Tailwind CSS.")
        }

        setTailwindState({ source, css: payload.css, error: null })
      })
      .catch((fetchError: unknown) => {
        if (!controller.signal.aborted) {
          setTailwindState({
            source,
            css: null,
            error:
              fetchError instanceof Error
                ? fetchError.message
                : "Unable to compile Tailwind CSS.",
          })
        }
      })

    return () => controller.abort()
  }, [source])

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent<HtmlBlockHeightMessage>) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }

      if (
        event.data?.type !== "html-output-height" ||
        event.data.blockId !== blockId ||
        typeof event.data.height !== "number"
      ) {
        return
      }

      setContentHeightState({
        source,
        height: Math.max(1, Math.ceil(event.data.height)),
      })
    }

    window.addEventListener("message", handleMessage)

    return () => window.removeEventListener("message", handleMessage)
  }, [blockId, source])

  const scale = width / FRAME_WIDTH
  const contentHeight =
    contentHeightState.source === source
      ? contentHeightState.height
      : FRAME_HEIGHT
  const scaledContentHeight = getScaledHtmlOutputHeight(contentHeight, width)
  const height = scaledContentHeight
  const css =
    tailwindState.source === source && tailwindState.error === null
      ? tailwindState.css
      : null
  const error =
    tailwindState.source === source ? tailwindState.error : null
  const srcDoc = React.useMemo(
    () =>
      css === null
        ? ""
        : buildSrcDoc(source, css, resolvedTheme === "dark", blockId),
    [blockId, css, resolvedTheme, source]
  )

  return (
    <div className="html-output-block" ref={containerRef}>
      {error ? (
        <div className="html-output-error" role="alert">
          {error}
        </div>
      ) : css === null ? (
        <div className="html-output-loading" role="status" aria-live="polite">
          <div className="html-output-loading-preview" aria-hidden="true">
            <div className="html-output-loading-toolbar">
              <span />
              <span />
              <span />
            </div>
            <div className="html-output-loading-grid">
              <div className="html-output-loading-panel html-output-loading-panel-lg" />
              <div className="html-output-loading-panel" />
              <div className="html-output-loading-panel" />
            </div>
            <div className="html-output-loading-progress" />
          </div>
          <span>Rendering HTML preview</span>
        </div>
      ) : (
        <div className="html-output-frame" style={{ height }}>
          <div
            className="html-output-frame-scaler"
            style={{ width, height: scaledContentHeight }}
          >
            <iframe
              ref={iframeRef}
              title="HTML output preview"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              srcDoc={srcDoc}
              style={{
                width: FRAME_WIDTH,
                height: contentHeight,
                transform: `scale(${scale})`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
