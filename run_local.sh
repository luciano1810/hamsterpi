#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

HOST="${HOST:-0.0.0.0}"
APP_PORT="${APP_PORT:-8000}"
LOG_PORT="${LOG_PORT:-8002}"
REQUIREMENTS_FILE="${REQUIREMENTS_FILE:-requirements.txt}"
UVICORN_BIN="${UVICORN_BIN:-uvicorn}"
VENV_DIR="${VENV_DIR:-$SCRIPT_DIR/.venv}"
VENV_PYTHON_BIN="${VENV_PYTHON_BIN:-python3}"

ensure_requirements_file() {
  if [[ ! -f "$REQUIREMENTS_FILE" ]]; then
    echo "Error: requirements file not found: $REQUIREMENTS_FILE"
    exit 1
  fi
}

activate_or_create_venv() {
  local activate_script="$VENV_DIR/bin/activate"

  ensure_requirements_file

  if [[ ! -f "$activate_script" ]]; then
    if ! command -v "$VENV_PYTHON_BIN" >/dev/null 2>&1; then
      echo "Error: '$VENV_PYTHON_BIN' not found, cannot create virtualenv."
      exit 1
    fi

    echo "[run_local] creating virtualenv at: $VENV_DIR"
    "$VENV_PYTHON_BIN" -m venv "$VENV_DIR"
    # shellcheck source=/dev/null
    source "$activate_script"
    python -m pip install --upgrade pip
    python -m pip install -r "$REQUIREMENTS_FILE"
    echo "[run_local] activated virtualenv: $VENV_DIR (new)"
    return
  fi

  # shellcheck source=/dev/null
  source "$activate_script"
  echo "[run_local] activated virtualenv: $VENV_DIR"
}

activate_python_env() {
  if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    echo "[run_local] using active virtualenv: ${VIRTUAL_ENV}"
    return
  fi

  if [[ -n "${CONDA_PREFIX:-}" ]]; then
    echo "[run_local] using active conda env: ${CONDA_PREFIX}"
    return
  fi

  activate_or_create_venv
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
