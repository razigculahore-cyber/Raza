# Meet — AGENTS.md

Full-stack AI app. Read this before coding.

## Stack

* web: Next.js 16, React 19, TypeScript 7, Tailwind 4, shadcn/ui
* api: FastAPI, Python 3.13, uv, Ruff, pytest
* Local AI: Ollama (`localhost:11434`) — `gemma3:1b`
* Cloud fallback: OpenAI, Anthropic, Grok, Gemini

## Commands

```bash
# web
cd web && npm install && npm run dev   # :3000

# api
cd api && uv sync && uv run fastapi dev # :8000

# Test
cd api && pytest
```

## Rules

* Follow existing patterns; keep changes small.
* TypeScript web; typed Python api.
* Run tests after every change.
* Add/update tests for changed behavior.
* Run Ruff on api changes.
* Never commit `.env`, API keys, or secrets.
* Never expose AI/API keys to web.
* Local AI first; cloud AI only as fallback.
* Keep AI providers behind a common interface.
* Don't add dependencies without need.
* Don't modify unrelated files.