# OpenChat — AGENTS.md

## Stack

* *web:* Next.js 16, React 19, TypeScript 7, Tailwind CSS 4, shadcn/ui — web/ — *port 3000*
* *api:* FastAPI, Python 3.13+, uv, Ruff, Pytest — api/ — *port 8000*
* *Local AI:* Ollama — localhost:11434 — model gemma4:31b-cloud
* *Cloud AI:* OpenAI, Anthropic, Gemini APIs

## Structure

* Keep web, api, and AI logic modular and separated.
* Follow existing project patterns before creating or changing code.
* Reuse existing components, utilities, and services.
* Avoid unnecessary dependencies or unrelated changes.
* Use current, non-deprecated APIs.

## web

bash
cd web
npm install
npm run dev


Add dependencies:

bash
npm install <package_name>


## api

bash
cd api
uv sync
uv run fastapi dev


Add dependencies:

bash
uv add <package_name>


Run tests:

bash
cd api
uv run pytest


## AI

* Keep AI provider/model configuration in environment variables.
* Never hard-code API keys or secrets.
* Support Ollama and cloud AI providers cleanly.
* Handle AI errors, timeouts, rate limits, and invalid responses.
* Do not expose server-side API keys to the web.

## Rules

* *Never commit .env or API keys.*
* Never expose secrets through NEXT_PUBLIC_*.
* Run tests/build checks after every change.
* Fix all relevant errors before finishing.
* Review changes for security, regressions, debug code, and unrelated modifications.
* Keep code clean, typed, reusable, secure, and production-ready.