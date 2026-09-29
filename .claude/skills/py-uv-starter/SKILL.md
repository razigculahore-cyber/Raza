---
name: py-uv-starter
description: Scaffold a new Python backend project using uv (the fast Python package/project manager). Use this skill whenever the user asks to start a new Python project, backend, API, or service with uv, mentions "uv init", wants a Python project bootstrapped, or asks for a Python starter/template project. Make sure to use this skill even if the user just says something like "set up a new Python backend" or "create a uv project" without spelling out every step, since it encodes the exact init → sync → run workflow.
---

# py-uv-starter

Scaffold a new Python project/backend using [uv](https://docs.astral.sh/uv/), Astral's fast Python package and project manager.

## When to use this skill

Trigger this whenever the user wants to:
- Start a brand-new Python project or backend from scratch
- Use `uv` specifically to manage a Python project (vs pip/poetry/conda)
- Get a runnable "hello world" Python service/backend skeleton

## Core workflow

The canonical sequence for scaffolding a project named `backend` is:

```bash
uv init backend
cd backend
uv sync
uv run main.py
```

Steps explained:
1. `uv init backend` — creates a new directory `backend/` with a `pyproject.toml`, a `main.py` stub, a `.python-version` file, and a `README.md`.
2. `cd backend` — enter the new project directory.
3. `uv sync` — resolve and install dependencies into a local `.venv`, creating/updating `uv.lock`.
4. `uv run main.py` — run the entrypoint inside the project's managed virtual environment (uv will sync automatically if needed, but running `uv sync` explicitly first is good practice and surfaces lock/dependency issues early).

## How to run this for a user

1. Ask (or infer from context) the **project name** — default to `backend` if the user doesn't specify one.
2. Use `scripts/init_project.sh <project-name>` to run the full sequence in one shot, OR run the four commands above manually via bash_tool if you need finer control (e.g. adding dependencies before syncing).
3. If the user wants dependencies added (e.g. FastAPI, Flask), add them with `uv add <package>` *before* `uv run`, e.g.:
   ```bash
   cd backend
   uv add fastapi uvicorn
   ```
4. If the user wants a specific Python version, pass it at init time: `uv init backend --python 3.12`.
5. After scaffolding, show the user the resulting file tree (`view` the project directory) and confirm `main.py` ran successfully.

## Notes

- `uv` must be installed and network access must be available to fetch packages/interpreters (`uv init`/`uv sync` may need to download a Python interpreter or packages). If `uv` is missing, tell the user to install it (see https://docs.astral.sh/uv/getting-started/installation/) rather than trying to work around it.
- `uv init` fails if the target directory already exists and is non-empty — if scaffolding into an existing folder, use `uv init .` inside that folder instead of `uv init <name>`.
- For a library (not an app), use `uv init --lib <name>` instead; for a bare package layout use `uv init --package <name>`.
- Prefer `uv add <pkg>` over manually editing `pyproject.toml` to add dependencies — it updates both `pyproject.toml` and `uv.lock` correctly.
