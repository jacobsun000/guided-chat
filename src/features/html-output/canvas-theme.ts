export const CANVAS_THEME_CSS = `
  :root {
    --canvas-bg: oklch(0.975 0.012 255);
    --canvas-fg: oklch(0.22 0.035 265);
    --canvas-card: oklch(1 0 0 / 92%);
    --canvas-card-fg: oklch(0.22 0.035 265);
    --canvas-muted: oklch(0.94 0.02 255);
    --canvas-muted-fg: oklch(0.49 0.035 260);
    --canvas-border: oklch(0.86 0.035 255);
    --canvas-primary: oklch(0.52 0.19 272);
    --canvas-primary-fg: oklch(0.985 0.005 255);
    --canvas-accent: oklch(0.7 0.14 185);
    --canvas-accent-soft: oklch(0.92 0.055 185);
    --canvas-danger: oklch(0.58 0.2 28);
    --canvas-warning: oklch(0.7 0.14 75);
    --canvas-success: oklch(0.58 0.13 158);
    --canvas-radius: 14px;
    --canvas-shadow: 0 16px 44px oklch(0.28 0.06 265 / 10%);
  }

  .dark {
    --canvas-bg: oklch(0.17 0.035 265);
    --canvas-fg: oklch(0.94 0.012 255);
    --canvas-card: oklch(0.225 0.038 265 / 94%);
    --canvas-card-fg: oklch(0.94 0.012 255);
    --canvas-muted: oklch(0.27 0.035 262);
    --canvas-muted-fg: oklch(0.72 0.025 255);
    --canvas-border: oklch(0.38 0.045 260);
    --canvas-primary: oklch(0.7 0.15 275);
    --canvas-primary-fg: oklch(0.16 0.035 265);
    --canvas-accent: oklch(0.73 0.13 185);
    --canvas-accent-soft: oklch(0.31 0.06 185);
    --canvas-danger: oklch(0.7 0.17 25);
    --canvas-warning: oklch(0.78 0.13 78);
    --canvas-success: oklch(0.7 0.12 158);
    --canvas-shadow: 0 20px 52px oklch(0.05 0.02 265 / 34%);
  }

  html, body {
    background: var(--canvas-bg);
    color: var(--canvas-fg);
  }

  .canvas-root {
    position: relative;
    isolation: isolate;
    width: 100%;
    min-height: 540px;
    overflow: hidden;
    padding: 52px 56px;
    background:
      radial-gradient(circle at 92% 2%, color-mix(in oklch, var(--canvas-primary), transparent 84%), transparent 34%),
      radial-gradient(circle at 4% 96%, color-mix(in oklch, var(--canvas-accent), transparent 86%), transparent 30%),
      var(--canvas-bg);
    color: var(--canvas-fg);
  }

  .canvas-root::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.36;
    background-image: linear-gradient(var(--canvas-border) 1px, transparent 1px), linear-gradient(90deg, var(--canvas-border) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom, black, transparent 65%);
  }

  .canvas-header { margin-bottom: 30px; max-width: 780px; }
  .canvas-eyebrow { margin-bottom: 10px; color: var(--canvas-primary); font-size: 12px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; }
  .canvas-title { max-width: 820px; font-size: 38px; font-weight: 720; letter-spacing: -.035em; line-height: 1.08; text-wrap: balance; }
  .canvas-description { margin-top: 13px; max-width: 720px; color: var(--canvas-muted-fg); font-size: 16px; line-height: 1.65; text-wrap: pretty; }

  .canvas-card { border: 1px solid var(--canvas-border); border-radius: var(--canvas-radius); background: var(--canvas-card); color: var(--canvas-card-fg); box-shadow: var(--canvas-shadow); }
  .canvas-card-header { display: flex; flex-direction: column; gap: 6px; padding: 22px 24px 0; }
  .canvas-card-title { font-size: 17px; font-weight: 680; letter-spacing: -.015em; line-height: 1.3; }
  .canvas-card-description { color: var(--canvas-muted-fg); font-size: 13px; line-height: 1.55; }
  .canvas-card-content { padding: 22px 24px; }
  .canvas-card-footer { display: flex; align-items: center; gap: 10px; padding: 0 24px 22px; }

  .canvas-badge { display: inline-flex; width: fit-content; align-items: center; gap: 6px; border: 1px solid transparent; border-radius: 999px; padding: 4px 9px; font-size: 11px; font-weight: 700; line-height: 1; letter-spacing: .025em; }
  .canvas-badge-default { background: var(--canvas-primary); color: var(--canvas-primary-fg); }
  .canvas-badge-secondary { border-color: var(--canvas-border); background: var(--canvas-muted); color: var(--canvas-fg); }
  .canvas-badge-accent { background: var(--canvas-accent-soft); color: color-mix(in oklch, var(--canvas-accent), var(--canvas-fg) 42%); }
  .canvas-badge-outline { border-color: var(--canvas-border); background: transparent; color: var(--canvas-muted-fg); }

  .canvas-alert { display: grid; grid-template-columns: auto 1fr; gap: 12px; border: 1px solid var(--canvas-border); border-radius: 12px; padding: 16px 18px; background: color-mix(in oklch, var(--canvas-card), transparent 8%); }
  .canvas-alert-marker { margin-top: 6px; width: 8px; height: 8px; border-radius: 999px; background: var(--canvas-primary); box-shadow: 0 0 0 5px color-mix(in oklch, var(--canvas-primary), transparent 84%); }
  .canvas-alert-warning .canvas-alert-marker { background: var(--canvas-warning); box-shadow: 0 0 0 5px color-mix(in oklch, var(--canvas-warning), transparent 84%); }
  .canvas-alert-danger .canvas-alert-marker { background: var(--canvas-danger); box-shadow: 0 0 0 5px color-mix(in oklch, var(--canvas-danger), transparent 84%); }
  .canvas-alert-success .canvas-alert-marker { background: var(--canvas-success); box-shadow: 0 0 0 5px color-mix(in oklch, var(--canvas-success), transparent 84%); }
  .canvas-alert-title { font-size: 14px; font-weight: 700; }
  .canvas-alert-description { margin-top: 3px; color: var(--canvas-muted-fg); font-size: 13px; line-height: 1.55; }

  .canvas-stat { display: flex; min-height: 112px; flex-direction: column; justify-content: space-between; border-left: 3px solid var(--canvas-primary); padding: 12px 0 12px 18px; }
  .canvas-stat-label { color: var(--canvas-muted-fg); font-size: 12px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
  .canvas-stat-value { margin-top: 5px; font-size: 34px; font-weight: 740; letter-spacing: -.04em; line-height: 1; }
  .canvas-stat-detail { margin-top: 9px; color: var(--canvas-muted-fg); font-size: 12px; line-height: 1.45; }

  .canvas-progress { overflow: hidden; width: 100%; height: 8px; border-radius: 999px; background: var(--canvas-muted); }
  .canvas-progress-bar { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--canvas-primary), var(--canvas-accent)); }
  .canvas-separator { width: 100%; height: 1px; background: var(--canvas-border); }
  .canvas-quote { border-left: 3px solid var(--canvas-accent); padding: 3px 0 3px 18px; color: var(--canvas-fg); font-size: 16px; font-weight: 540; line-height: 1.6; }
  .canvas-quote cite { display: block; margin-top: 8px; color: var(--canvas-muted-fg); font-size: 12px; font-style: normal; font-weight: 500; }

  .canvas-sources { display: flex; flex-direction: column; gap: 7px; }
  .canvas-source { display: grid; grid-template-columns: 20px 1fr; gap: 8px; color: var(--canvas-muted-fg); font-size: 11px; line-height: 1.45; }
  .canvas-source-index { color: var(--canvas-primary); font-weight: 750; }
  .canvas-source a { color: inherit; text-decoration: underline; text-decoration-color: color-mix(in oklch, currentColor, transparent 65%); text-underline-offset: 3px; }
`

export const CANVAS_UI_RUNTIME = `
    const canvasCx = (...values) => values.filter(Boolean).join(" ");
    const canvasComponent = (tag, baseClass) => React.forwardRef(
      ({ className, ...props }, ref) => React.createElement(tag, { ...props, ref, className: canvasCx(baseClass, className) })
    );

    const Canvas = canvasComponent("main", "canvas-root");
    const CanvasHeader = canvasComponent("header", "canvas-header");
    const CanvasEyebrow = canvasComponent("div", "canvas-eyebrow");
    const CanvasTitle = canvasComponent("h1", "canvas-title");
    const CanvasDescription = canvasComponent("p", "canvas-description");
    const Card = canvasComponent("section", "canvas-card");
    const CardHeader = canvasComponent("header", "canvas-card-header");
    const CardTitle = canvasComponent("h2", "canvas-card-title");
    const CardDescription = canvasComponent("p", "canvas-card-description");
    const CardContent = canvasComponent("div", "canvas-card-content");
    const CardFooter = canvasComponent("footer", "canvas-card-footer");
    const Separator = canvasComponent("div", "canvas-separator");
    const SourceList = canvasComponent("ol", "canvas-sources");

    const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) =>
      React.createElement("span", { ...props, ref, className: canvasCx("canvas-badge", "canvas-badge-" + variant, className) })
    );
    const Alert = React.forwardRef(({ className, variant = "default", title, children, ...props }, ref) =>
      React.createElement("section", { ...props, ref, className: canvasCx("canvas-alert", "canvas-alert-" + variant, className) },
        React.createElement("span", { className: "canvas-alert-marker", "aria-hidden": "true" }),
        React.createElement("div", null,
          title && React.createElement("div", { className: "canvas-alert-title" }, title),
          React.createElement("div", { className: "canvas-alert-description" }, children)
        )
      )
    );
    const Stat = React.forwardRef(({ className, label, value, detail, ...props }, ref) =>
      React.createElement("div", { ...props, ref, className: canvasCx("canvas-stat", className) },
        React.createElement("div", null,
          React.createElement("div", { className: "canvas-stat-label" }, label),
          React.createElement("div", { className: "canvas-stat-value" }, value)
        ),
        detail && React.createElement("div", { className: "canvas-stat-detail" }, detail)
      )
    );
    const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) =>
      React.createElement("div", { ...props, ref, role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": value, className: canvasCx("canvas-progress", className) },
        React.createElement("div", { className: "canvas-progress-bar", style: { width: Math.max(0, Math.min(100, value)) + "%" } })
      )
    );
    const Quote = React.forwardRef(({ className, cite, children, ...props }, ref) =>
      React.createElement("blockquote", { ...props, ref, className: canvasCx("canvas-quote", className) }, children, cite && React.createElement("cite", null, cite))
    );
    const SourceItem = React.forwardRef(({ className, index, children, ...props }, ref) =>
      React.createElement("li", { ...props, ref, className: canvasCx("canvas-source", className) },
        React.createElement("span", { className: "canvas-source-index" }, String(index).padStart(2, "0")),
        React.createElement("span", null, children)
      )
    );

    const CanvasUI = Object.freeze({
      Canvas, CanvasHeader, CanvasEyebrow, CanvasTitle, CanvasDescription,
      Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
      Badge, Alert, Stat, Progress, Separator, Quote, SourceList, SourceItem,
    });
    window.CanvasUI = CanvasUI;
`
