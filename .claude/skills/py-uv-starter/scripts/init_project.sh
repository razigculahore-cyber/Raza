#!/usr/bin/env bash
# Scaffold a new Python project with uv.
#
# Usage:
#   ./init_project.sh [project-name] [-- extra 'uv init' args...]
#
# Example:
#   ./init_project.sh backend
#   ./init_project.sh backend -- --python 3.12
#
# Runs the canonical workflow:
#   uv init <name>
#   cd <name>
#   uv sync
#   uv run main.py

set -euo pipefail

PROJECT_NAME="${1:-backend}"
shift || true

if [[ "${1:-}" == "--" ]]; then
  shift
fi
EXTRA_ARGS=("$@")

if ! command -v uv >/dev/null 2>&1; then
  echo "Error: 'uv' is not installed. Install it first: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

echo "==> uv init ${PROJECT_NAME} ${EXTRA_ARGS[*]:-}"
uv init "${PROJECT_NAME}" "${EXTRA_ARGS[@]}"

cd "${PROJECT_NAME}"

echo "==> uv sync"
uv sync

echo "==> uv run main.py"
uv run main.py

echo "==> Done. Project scaffolded at: $(pwd)"
