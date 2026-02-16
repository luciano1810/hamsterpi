from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from hamsterpi.config import ConfigError, LoggingConfig, default_config_path, load_config
from hamsterpi.logging_system import configure_logging, get_logger, level_counts, read_log_records, resolve_log_file

app = FastAPI(title="HamsterPi Log Viewer", version="0.1.0")

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_LOG_DIR = BASE_DIR / "web" / "logs"

configure_logging(LoggingConfig())
LOGGER = get_logger(__name__)


def _active_logging_config() -> LoggingConfig:
    try:
        cfg = load_config(default_config_path())
        return cfg.logging
    except ConfigError:
        return LoggingConfig()


def _parse_levels(levels: str) -> Optional[List[str]]:
    if not levels.strip():
        return None
    allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
    selected = [item.strip().upper() for item in levels.split(",") if item.strip()]
    filtered = [item for item in selected if item in allowed]
    return filtered or None


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_LOG_DIR / "index.html")


@app.get("/health")
def health() -> Dict[str, str]:
    cfg = _active_logging_config()
    configure_logging(cfg)
    return {"status": "ok", "time": datetime.now().isoformat(), "log_file": str(resolve_log_file(cfg.file_path))}


@app.get("/api/logs")
def get_logs(
    levels: str = Query(default="", description="Comma-separated levels"),
    q: str = Query(default="", description="Keyword filter"),
    limit: int = Query(default=500, ge=1, le=5000),
) -> Dict[str, Any]:
    cfg = _active_logging_config()
    configure_logging(cfg)
    selected_levels = _parse_levels(levels)
    records = read_log_records(
        file_path=cfg.file_path,
        limit=limit,
        levels=selected_levels,
        keyword=q,
    )
    counts = level_counts(cfg.file_path)

    LOGGER.debug(
        "Log records queried",
        extra={
            "context": {
                "levels": selected_levels or [],
                "keyword": q,
                "limit": limit,
                "result_count": len(records),
            }
        },
    )

    return {
        "log_file": str(resolve_log_file(cfg.file_path)),
        "default_level": cfg.level,
        "items": records,
        "count": len(records),
        "counts": counts,
        "generated_at": datetime.now().isoformat(),
    }


app.mount("/web", StaticFiles(directory=str(WEB_LOG_DIR)), name="log-web")
