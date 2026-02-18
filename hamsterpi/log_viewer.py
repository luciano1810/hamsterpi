from __future__ import annotations

import math
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from hamsterpi.config import (
    ConfigError,
    LoggingConfig,
    SystemConfig,
    default_config_path,
    load_config,
    load_raw_config,
    save_raw_config,
)
from hamsterpi.logging_system import configure_logging, get_logger, level_counts, read_log_records, resolve_log_file

app = FastAPI(title="HamsterPi Log Viewer", version="0.1.0")

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_LOG_DIR = BASE_DIR / "web" / "logs"

configure_logging(LoggingConfig())
LOGGER = get_logger(__name__)


class LoggingConfigPayload(BaseModel):
    logging: Dict[str, Any] = Field(default_factory=dict)


def _active_logging_config() -> LoggingConfig:
    try:
        cfg = load_config(default_config_path())
        return cfg.logging
    except ConfigError:
        return LoggingConfig()


def _read_logging_config_from_raw() -> LoggingConfig:
    try:
        raw = load_raw_config(default_config_path())
    except ConfigError:
        return LoggingConfig()

    section = raw.get("logging")
    if isinstance(section, dict):
        try:
            return LoggingConfig.model_validate(section)
        except Exception:  # noqa: BLE001
            return LoggingConfig()
    return LoggingConfig()


def _parse_levels(levels: str) -> Optional[List[str]]:
    if not levels.strip():
        return None
    allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
    selected = [item.strip().upper() for item in levels.split(",") if item.strip()]
    filtered = [item for item in selected if item in allowed]
    return filtered or None


def _is_performance_record(record: Dict[str, Any]) -> bool:
    message = str(record.get("message", "")).lower()
    if "[perf]" in message:
        return True

    context = record.get("context")
    if not isinstance(context, dict):
        return False

    if bool(context.get("is_perf", False)):
        return True

    perf_keys = {
        "elapsed_ms",
        "total_elapsed_ms",
        "avg_frame_ms",
        "processed_fps",
        "analyzed_fps",
        "effective_fps",
    }
    return any(key in context for key in perf_keys)


def _record_level_counts(records: List[Dict[str, Any]]) -> Dict[str, int]:
    counts: Counter[str] = Counter()
    for record in records:
        counts[str(record.get("level", "INFO"))] += 1
    return {name: int(counts.get(name, 0)) for name in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]}


def _as_float(value: Any) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(numeric):
        return None
    return numeric


def _context_numeric(context: Dict[str, Any], key: str) -> Optional[float]:
    if key in context:
        return _as_float(context.get(key))

    nested_perf = context.get("perf")
    if isinstance(nested_perf, dict) and key in nested_perf:
        return _as_float(nested_perf.get(key))
    return None


def _percentile(values: List[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int(round((len(ordered) - 1) * ratio))
    idx = max(0, min(idx, len(ordered) - 1))
    return float(ordered[idx])


def _performance_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    perf_records = [item for item in records if _is_performance_record(item)]
    elapsed_values: List[float] = []
    processed_fps_values: List[float] = []
    analyzed_fps_values: List[float] = []
    avg_frame_ms_values: List[float] = []
    category_counts: Counter[str] = Counter()

    latest_elapsed_ms = 0.0
    latest_processed_fps = 0.0
    latest_analyzed_fps = 0.0

    for item in perf_records:
        context = item.get("context")
        if not isinstance(context, dict):
            continue

        category = str(context.get("perf_category", "")).strip()
        if category:
            category_counts[category] += 1

        elapsed_ms = _context_numeric(context, "elapsed_ms") or _context_numeric(context, "total_elapsed_ms")
        if elapsed_ms is not None:
            elapsed_values.append(elapsed_ms)
            latest_elapsed_ms = elapsed_ms

        processed_fps = _context_numeric(context, "processed_fps") or _context_numeric(context, "effective_fps")
        if processed_fps is not None:
            processed_fps_values.append(processed_fps)
            latest_processed_fps = processed_fps

        analyzed_fps = _context_numeric(context, "analyzed_fps")
        if analyzed_fps is not None:
            analyzed_fps_values.append(analyzed_fps)
            latest_analyzed_fps = analyzed_fps

        avg_frame_ms = _context_numeric(context, "avg_frame_ms")
        if avg_frame_ms is not None:
            avg_frame_ms_values.append(avg_frame_ms)

    elapsed_avg = (sum(elapsed_values) / len(elapsed_values)) if elapsed_values else 0.0
    processed_fps_avg = (sum(processed_fps_values) / len(processed_fps_values)) if processed_fps_values else 0.0
    analyzed_fps_avg = (sum(analyzed_fps_values) / len(analyzed_fps_values)) if analyzed_fps_values else 0.0
    avg_frame_ms_avg = (sum(avg_frame_ms_values) / len(avg_frame_ms_values)) if avg_frame_ms_values else 0.0

    return {
        "perf_records": len(perf_records),
        "elapsed_samples": len(elapsed_values),
        "elapsed_ms_avg": round(float(elapsed_avg), 3),
        "elapsed_ms_p95": round(float(_percentile(elapsed_values, 0.95)), 3),
        "elapsed_ms_max": round(float(max(elapsed_values) if elapsed_values else 0.0), 3),
        "avg_frame_ms_avg": round(float(avg_frame_ms_avg), 3),
        "processed_fps_avg": round(float(processed_fps_avg), 3),
        "analyzed_fps_avg": round(float(analyzed_fps_avg), 3),
        "latest_elapsed_ms": round(float(latest_elapsed_ms), 3),
        "latest_processed_fps": round(float(latest_processed_fps), 3),
        "latest_analyzed_fps": round(float(latest_analyzed_fps), 3),
        "category_counts": dict(category_counts),
    }


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_LOG_DIR / "index.html")


@app.get("/health")
def health() -> Dict[str, str]:
    cfg = _active_logging_config()
    configure_logging(cfg)
    return {"status": "ok", "time": datetime.now().isoformat(), "log_file": str(resolve_log_file(cfg.file_path))}


@app.get("/api/config/logging")
def get_logging_config() -> Dict[str, Any]:
    cfg = _read_logging_config_from_raw()
    configure_logging(cfg)
    return {
        "config_path": str(default_config_path()),
        "logging": cfg.model_dump(),
        "saved_at": datetime.now().isoformat(),
    }


@app.post("/api/config/logging")
def save_logging_config(payload: LoggingConfigPayload) -> Dict[str, Any]:
    try:
        logging_cfg = LoggingConfig.model_validate(payload.logging or {})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid logging config: {exc}") from exc

    try:
        raw = load_raw_config(default_config_path())
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=f"Config load failed: {exc}") from exc

    raw["logging"] = logging_cfg.model_dump()
    try:
        SystemConfig.model_validate(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid config after update: {exc}") from exc

    save_raw_config(raw, default_config_path())
    configure_logging(logging_cfg)
    LOGGER.info(
        "Log viewer updated logging config",
        extra={"context": {"config_path": str(default_config_path()), "level": logging_cfg.level}},
    )
    return {
        "status": "ok",
        "saved_at": datetime.now().isoformat(),
        "config_path": str(default_config_path()),
        "logging": logging_cfg.model_dump(),
    }


@app.get("/api/logs")
def get_logs(
    levels: str = Query(default="", description="Comma-separated levels"),
    q: str = Query(default="", description="Keyword filter"),
    limit: int = Query(default=500, ge=1, le=5000),
    perf_only: bool = Query(default=False, description="Only performance-related logs"),
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
    if perf_only:
        records = [item for item in records if _is_performance_record(item)]

    counts = _record_level_counts(records) if perf_only else level_counts(cfg.file_path)
    perf_summary = _performance_summary(records)
    perf_summary["filter_enabled"] = bool(perf_only)

    LOGGER.debug(
        "Log records queried",
        extra={
            "context": {
                "levels": selected_levels or [],
                "keyword": q,
                "limit": limit,
                "perf_only": perf_only,
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
        "performance": perf_summary,
        "generated_at": datetime.now().isoformat(),
    }


app.mount("/web", StaticFiles(directory=str(WEB_LOG_DIR)), name="log-web")
