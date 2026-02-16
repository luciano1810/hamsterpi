#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

HOST="${HOST:-0.0.0.0}"
APP_PORT="${APP_PORT:-8000}"
LOG_PORT="${LOG_PORT:-8002}"
UVICORN_BIN="${UVICORN_BIN:-uvicorn}"

if ! command -v "$UVICORN_BIN" >/dev/null 2>&1; then
  echo "Error: cannot find uvicorn (${UVICORN_BIN}) in PATH"
  exit 1
fi

echo "[run_all] start main app: http://${HOST}:${APP_PORT}"
"$UVICORN_BIN" hamsterpi.main:app --host "$HOST" --port "$APP_PORT" &
PID_MAIN=$!

echo "[run_all] start log viewer: http://${HOST}:${LOG_PORT}"
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
    echo "[run_all] main app exited"
    exit 1
  fi
  if ! kill -0 "$PID_LOG" >/dev/null 2>&1; then
    echo "[run_all] log viewer exited"
    exit 1
  fi
  sleep 1
done
