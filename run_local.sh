#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

HOST="${HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-8000}"
LOG_PORT="${LOG_PORT:-8002}"
CONDA_ENV_NAME="${CONDA_ENV_NAME:-hamsterpi-local}"
CONDA_PYTHON_VERSION="${CONDA_PYTHON_VERSION:-3.11}"
REQUIREMENTS_FILE="${REQUIREMENTS_FILE:-requirements.txt}"
UVICORN_BIN="${UVICORN_BIN:-uvicorn}"

activate_python_env() {
  if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    echo "[run_local] using active virtualenv: ${VIRTUAL_ENV}"
    return
  fi

  if [[ -f "$SCRIPT_DIR/.venv/bin/activate" ]]; then
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/.venv/bin/activate"
    echo "[run_local] activated virtualenv: .venv"
    return
  fi

  if ! command -v conda >/dev/null 2>&1; then
    echo "Error: no active virtualenv, .venv not found, and conda is unavailable."
    echo "Create .venv manually or install conda."
    exit 1
  fi

  local conda_base
  conda_base="$(conda info --base 2>/dev/null || true)"
  if [[ -z "$conda_base" || ! -f "$conda_base/etc/profile.d/conda.sh" ]]; then
    echo "Error: unable to locate conda activation script."
    exit 1
  fi

  if [[ ! -f "$REQUIREMENTS_FILE" ]]; then
    echo "Error: requirements file not found: $REQUIREMENTS_FILE"
    exit 1
  fi

  # shellcheck source=/dev/null
  source "$conda_base/etc/profile.d/conda.sh"

  if ! conda run -n "$CONDA_ENV_NAME" python -c "import sys" >/dev/null 2>&1; then
    echo "[run_local] conda env '$CONDA_ENV_NAME' not found, creating..."
    conda create -y -n "$CONDA_ENV_NAME" "python=${CONDA_PYTHON_VERSION}"
    conda run -n "$CONDA_ENV_NAME" python -m pip install --upgrade pip
    conda run -n "$CONDA_ENV_NAME" python -m pip install -r "$REQUIREMENTS_FILE"
  fi

  conda activate "$CONDA_ENV_NAME"
  echo "[run_local] activated conda env: $CONDA_ENV_NAME"
}

activate_python_env

if ! command -v "$UVICORN_BIN" >/dev/null 2>&1; then
  echo "Error: uvicorn not found in current environment."
  echo "Install dependencies with: pip install -r $REQUIREMENTS_FILE"
  exit 1
fi

echo "[run_local] main app: http://${HOST}:${APP_PORT}"
"$UVICORN_BIN" hamsterpi.main:app --host "$HOST" --port "$APP_PORT" &
PID_MAIN=$!

echo "[run_local] log viewer: http://${HOST}:${LOG_PORT}"
"$UVICORN_BIN" hamsterpi.log_viewer:app --host "$HOST" --port "$LOG_PORT" &
PID_LOG=$!

cleanup() {
  local code=$?
  trap - INT TERM EXIT

  if kill -0 "$PID_MAIN" >/dev/null 2>&1; then
    kill "$PID_MAIN" >/dev/null 2>&1 || true
  fi
  if kill -0 "$PID_LOG" >/dev/null 2>&1; then
    kill "$PID_LOG" >/dev/null 2>&1 || true
  fi

  wait "$PID_MAIN" >/dev/null 2>&1 || true
  wait "$PID_LOG" >/dev/null 2>&1 || true
  exit "$code"
}

trap cleanup INT TERM EXIT

while true; do
  if ! kill -0 "$PID_MAIN" >/dev/null 2>&1; then
    echo "[run_local] main app exited"
    exit 1
  fi
  if ! kill -0 "$PID_LOG" >/dev/null 2>&1; then
    echo "[run_local] log viewer exited"
    exit 1
  fi
  sleep 1
done
