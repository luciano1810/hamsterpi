#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Install HamsterPi as a systemd service (auto start on boot).

Usage:
  sudo ./scripts/install_systemd_service.sh [options]

Options:
  --project-dir <path>     Project root directory (default: repo root)
  --service-name <name>    systemd service name (default: hamsterpi)
  --user <name>            Service run user (default: sudo user or current user)
  --group <name>           Service run group (default: primary group of --user)
  --host <addr>            Bind host for uvicorn (default: 0.0.0.0)
  --app-port <port>        Main app port (default: 8000)
  --log-port <port>        Log viewer port (default: 8002)
  --python <bin>           Python executable for creating venv (default: python3)
  --skip-deps              Skip pip install/upgrade
  --no-start               Enable on boot but do not start immediately
  -h, --help               Show this help
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_NAME="hamsterpi"
SERVICE_USER="${SUDO_USER:-${USER}}"
SERVICE_GROUP=""
HOST="0.0.0.0"
APP_PORT="8000"
LOG_PORT="8002"
PYTHON_BIN="python3"
SKIP_DEPS="0"
NO_START="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --group)
      SERVICE_GROUP="$2"
      shift 2
      ;;
    --host)
      HOST="$2"
      shift 2
      ;;
    --app-port)
      APP_PORT="$2"
      shift 2
      ;;
    --log-port)
      LOG_PORT="$2"
      shift 2
      ;;
    --python)
      PYTHON_BIN="$2"
      shift 2
      ;;
    --skip-deps)
      SKIP_DEPS="1"
      shift
      ;;
    --no-start)
      NO_START="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$EUID" -ne 0 ]]; then
  echo "Please run as root (use sudo)." >&2
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemctl not found. This script only supports systemd-based Linux." >&2
  exit 1
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  echo "User not found: $SERVICE_USER" >&2
  exit 1
fi

if [[ -z "$SERVICE_GROUP" ]]; then
  SERVICE_GROUP="$(id -gn "$SERVICE_USER")"
fi
if ! getent group "$SERVICE_GROUP" >/dev/null 2>&1; then
  echo "Group not found: $SERVICE_GROUP" >&2
  exit 1
fi

PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
RUN_SCRIPT="$PROJECT_DIR/scripts/run_all.sh"
REQ_FILE="$PROJECT_DIR/requirements.txt"
VENV_DIR="$PROJECT_DIR/.venv"
UVICORN_BIN="$VENV_DIR/bin/uvicorn"
PIP_BIN="$VENV_DIR/bin/pip"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ ! -f "$RUN_SCRIPT" ]]; then
  echo "Cannot find run script: $RUN_SCRIPT" >&2
  exit 1
fi
if [[ ! -f "$REQ_FILE" ]]; then
  echo "Cannot find requirements file: $REQ_FILE" >&2
  exit 1
fi

run_as_user() {
  if [[ "$SERVICE_USER" == "root" ]]; then
    "$@"
    return
  fi
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$SERVICE_USER" -- "$@"
    return
  fi
  su -s /bin/bash - "$SERVICE_USER" -c "$(printf '%q ' "$@")"
}

echo "[install] project: $PROJECT_DIR"
echo "[install] service: $SERVICE_NAME"
echo "[install] user/group: $SERVICE_USER/$SERVICE_GROUP"

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "[install] creating venv: $VENV_DIR"
  run_as_user "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

if [[ "$SKIP_DEPS" != "1" ]]; then
  echo "[install] installing dependencies into venv"
  run_as_user "$PIP_BIN" install --upgrade pip
  run_as_user "$PIP_BIN" install -r "$REQ_FILE"
fi

if [[ ! -x "$UVICORN_BIN" ]]; then
  echo "uvicorn not found in venv: $UVICORN_BIN" >&2
  echo "Try removing --skip-deps and rerun this script." >&2
  exit 1
fi

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=HamsterPi Monitoring Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
Environment=PYTHONUNBUFFERED=1
Environment=HOST=$HOST
Environment=APP_PORT=$APP_PORT
Environment=LOG_PORT=$LOG_PORT
Environment=UVICORN_BIN=$UVICORN_BIN
ExecStart=$RUN_SCRIPT
Restart=always
RestartSec=3
KillSignal=SIGINT
TimeoutStopSec=20

[Install]
WantedBy=multi-user.target
EOF

chmod 0644 "$SERVICE_FILE"

echo "[install] reloading systemd"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

if [[ "$NO_START" == "1" ]]; then
  echo "[install] service enabled, not started (--no-start)"
else
  echo "[install] starting service"
  systemctl restart "$SERVICE_NAME"
  systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,30p'
fi

echo
echo "Done."
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo systemctl restart $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"
