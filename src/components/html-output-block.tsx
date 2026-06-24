"use client"

import * as React from "react"

import { useTheme } from "@/components/theme-provider"

const FRAME_WIDTH = 960
const FRAME_HEIGHT = 540

type TailwindResponse = {
  css: string
  hash: string
}

type TailwindState = {
  source: string
  css: string | null
  error: string | null
}

function escapeStyleContent(value: string) {
  return value.replace(/<\/style/gi, "<\\/style")
}

function escapeScriptContent(value: string) {
  return value.replace(/<\/script/gi, "<\\/script")
}

function buildSrcDoc(source: string, css: string, isDark: boolean) {
  const frameCss = `
    html,
    body {
      width: ${FRAME_WIDTH}px;
      min-height: ${FRAME_HEIGHT}px;
      margin: 0;
      overflow: hidden;
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
  const [width, setWidth] = React.useState(FRAME_WIDTH)
  const [tailwindState, setTailwindState] = React.useState<TailwindState>({
    source: "",
    css: null,
    error: null,
  })
  const containerRef = React.useRef<HTMLDivElement | null>(null)

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

  const scale = width / FRAME_WIDTH
  const height = FRAME_HEIGHT * scale
  const css =
    tailwindState.source === source && tailwindState.error === null
      ? tailwindState.css
      : null
  const error =
    tailwindState.source === source ? tailwindState.error : null
  const srcDoc = React.useMemo(
    () =>
      css === null ? "" : buildSrcDoc(source, css, resolvedTheme === "dark"),
    [css, resolvedTheme, source]
  )

  return (
    <div className="html-output-block" ref={containerRef}>
      {error ? (
        <div className="html-output-error" role="alert">
          {error}
        </div>
      ) : css === null ? (
        <div className="html-output-loading">Rendering HTML preview</div>
      ) : (
        <div className="html-output-frame" style={{ height }}>
          <iframe
            title="HTML output preview"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      )}
    </div>
  )
}
