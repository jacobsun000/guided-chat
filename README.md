# Guided Chat

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
