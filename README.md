# Guided Chat

## Docker analysis sandboxes

Agent command and file tools run in one persistent Docker sandbox per chat thread. A local Linux Docker Engine and access to its socket are required; rootless Docker is preferred. Build the pinned analysis image before using chat tools:

```bash
pnpm sandbox:build
```

The sandbox uses `/workspace` for persistent writable files and mounts this repository's `datasets` and `tasks` directories read-only at `/datasets` and `/tasks`. Deleting a thread permanently removes its sandbox container and workspace volume. Containers use Docker bridge networking with unrestricted outbound access, which can also expose reachable local-network services.

Configuration variables and defaults are:

- `GUIDED_CHAT_SANDBOX_IMAGE=guided-chat-sandbox:local`
- `GUIDED_CHAT_DATASETS_PATH=<project>/datasets`
- `GUIDED_CHAT_TASKS_PATH=<project>/tasks`
- `GUIDED_CHAT_SANDBOX_CPUS=4`
- `GUIDED_CHAT_SANDBOX_MEMORY_MB=8192`
- `GUIDED_CHAT_SANDBOX_SWAP_MB=8192`
- `GUIDED_CHAT_SANDBOX_PIDS=512`
- `GUIDED_CHAT_SANDBOX_EXEC_TIMEOUT_MS=120000`
- `GUIDED_CHAT_SANDBOX_EXEC_MAX_TIMEOUT_MS=1800000`

Re-run `pnpm sandbox:build` after changing `sandbox/Dockerfile`, its requirements, or the patch helper. Use `GUIDED_CHAT_RUN_SANDBOX_TESTS=1 pnpm test:sandbox` for Docker integration checks. A missing-image error means the build has not run; Docker socket errors mean the daemon or permissions need attention; a missing-datasets error means the configured directory is invalid. Stale resources can be inspected using the `guided-chat.managed=true` Docker label and are reconciled on the next authenticated thread save.

Local Next.js app for a shared guided chat workspace.

## Development

```bash
pnpm install
pnpm db:push
pnpm dev
```

The local dev server runs at [http://localhost:8010](http://localhost:8010).

## Environment

Create a `.env` file with the backend access token and whichever provider keys you want to use:

```bash
GUIDED_CHAT_ACCESS_TOKEN=guided-chat-access-token
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
TAVILY_API_KEY=
```

`TAVILY_API_KEY` enables the `web_search` agent tool. The `read_image` tool does not require an API key.
