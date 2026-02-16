from __future__ import annotations

import base64
import time
from collections import defaultdict
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request
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
from hamsterpi.logging_system import configure_logging, get_logger, resolve_log_file
from hamsterpi.pipeline import HamsterVisionPipeline
from hamsterpi.simulator import VirtualDatasetGenerator

app = FastAPI(title="HamsterPi Monitoring Demo", version="0.3.0")

# Configure a safe default logger before config file is loaded.
configure_logging(LoggingConfig())
LOGGER = get_logger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".webm"}
PREVIEW_DIR_NAME = ".preview_frames"


@app.middleware("http")
async def http_request_logger(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        LOGGER.exception(
            "HTTP request failed",
            extra={
                "context": {
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.url.query),
                    "elapsed_ms": elapsed_ms,
                    "error": str(exc),
                }
            },
        )
        raise

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    context = {
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "elapsed_ms": elapsed_ms,
    }
    if response.status_code >= 500:
        LOGGER.error("HTTP request completed", extra={"context": context})
    elif response.status_code >= 400:
        LOGGER.warning("HTTP request completed", extra={"context": context})
    else:
        LOGGER.info("HTTP request completed", extra={"context": context})
    return response


class InitZonesPayload(BaseModel):
    fence_polygon: List[List[int]] = Field(min_length=3)
    wheel_mask_polygon: List[List[int]] = Field(min_length=3)
    zones: Dict[str, List[List[int]]]
    frame_width: Optional[int] = Field(default=None, ge=1)
    frame_height: Optional[int] = Field(default=None, ge=1)
    wheel_roi: Optional[List[int]] = None
    inventory_rois: Optional[Dict[str, List[int]]] = None
    bedding_roi: Optional[List[int]] = None


class RawConfigPayload(BaseModel):
    config: Dict[str, Any]


def _resolve_upload_dir(config: SystemConfig) -> Path:
    path = Path(config.app.demo_upload_dir)
    if path.is_absolute():
        return path
    return BASE_DIR / path


def _is_allowed_video_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in ALLOWED_VIDEO_EXTENSIONS


def _resolve_preview_dir(upload_dir: Path) -> Path:
    return upload_dir / PREVIEW_DIR_NAME


def _normalize_preview_token(token: str) -> str:
    raw = Path(token).name.strip()
    normalized = "".join(ch for ch in raw if ch.isalnum() or ch in {"-", "_"})
    return normalized[:80]


def _preview_temp_path(upload_dir: Path, token: str) -> Path:
    return _resolve_preview_dir(upload_dir) / f"temp_{token}.jpg"


def _preview_video_path(upload_dir: Path, video_key: str) -> Path:
    return _resolve_preview_dir(upload_dir) / f"{video_key}.jpg"


def _find_preview_for_video(config: SystemConfig, video_path: Optional[Path]) -> Optional[Path]:
    if video_path is None:
        return None
    upload_dir = _resolve_upload_dir(config)
    preview_path = _preview_video_path(upload_dir, video_path.name)
    if preview_path.exists():
        return preview_path
    return None


def _bind_preview_to_video(config: SystemConfig, video_path: Path, preview_token: str) -> Optional[Path]:
    upload_dir = _resolve_upload_dir(config)
    preview_dir = _resolve_preview_dir(upload_dir)
    preview_dir.mkdir(parents=True, exist_ok=True)

    final_path = _preview_video_path(upload_dir, video_path.name)
    token = _normalize_preview_token(preview_token)
    if token:
        temp_path = _preview_temp_path(upload_dir, token)
        if temp_path.exists():
            if final_path.exists():
                try:
                    final_path.unlink()
                except OSError:
                    pass
            try:
                temp_path.replace(final_path)
            except OSError:
                return None
            return final_path

    if final_path.exists():
        return final_path
    return None


def _list_uploaded_videos(config: SystemConfig, active_video_path: Optional[Path]) -> List[Dict[str, Any]]:
    upload_dir = _resolve_upload_dir(config)
    if not upload_dir.exists() or not upload_dir.is_dir():
        return []

    active_resolved: Optional[Path] = None
    if active_video_path is not None:
        try:
            active_resolved = active_video_path.resolve()
        except OSError:
            active_resolved = active_video_path

    entries: List[Dict[str, Any]] = []
    for path in upload_dir.iterdir():
        if not _is_allowed_video_file(path):
            continue
        try:
            stat = path.stat()
        except OSError:
            continue

        try:
            path_resolved = path.resolve()
        except OSError:
            path_resolved = path

        entries.append(
            {
                "video_key": path.name,
                "display_name": path.name,
                "path": str(path),
                "size_bytes": int(stat.st_size),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "is_active": bool(active_resolved is not None and path_resolved == active_resolved),
                "has_preview": _preview_video_path(upload_dir, path.name).exists(),
                "_mtime": float(stat.st_mtime),
            }
        )

    entries.sort(key=lambda item: (item.get("_mtime", 0.0), item.get("video_key", "")), reverse=True)
    for item in entries:
        item.pop("_mtime", None)
    return entries


def _empty_dashboard_payload(config: SystemConfig, source: str, status_message: str) -> Dict[str, Any]:
    return {
        "generated_at": datetime.now().isoformat(),
        "meta": {
            "history_minutes": config.frontend.history_minutes,
            "frame_width": config.video.frame_width,
            "frame_height": config.video.frame_height,
            "source": source,
            "runtime_profile": config.runtime.profile,
            "status_message": status_message,
        },
        "summary": {
            "distance_km_24h": 0.0,
            "patrol_length_m_24h": 0.0,
            "avg_speed_kmh": 0.0,
            "max_speed_kmh": 0.0,
            "running_ratio": 0.0,
            "reverse_ratio": 0.0,
            "max_running_streak_min": 0.0,
            "escape_count": 0,
            "water_level_ratio": 0.0,
            "food_coverage_ratio": 0.0,
            "gnaw_wear_index": 0.0,
            "anxiety_index": 0.0,
            "grooming_count_total": 0,
            "digging_minutes_total": 0.0,
            "health_risk_level": "unknown",
            "environment_comfort_index": 0.0,
            "environment_risk_level": "unknown",
            "capture_segments": 0,
        },
        "timeseries": [],
        "odometer": {
            "hourly": [{"hour": f"{h:02d}:00", "distance_km": 0.0, "stop_go_events": 0} for h in range(24)],
            "direction_distribution": {"forward": 0, "reverse": 0, "idle": 0},
            "stop_go_switches": [],
        },
        "spatial": {
            "heatmap": [[0.0] * 40 for _ in range(24)],
            "heatmap_rows": 24,
            "heatmap_cols": 40,
            "trajectory": [],
            "zone_dwell_seconds": {},
            "zone_dwell_ratio": {},
            "escape_events": [],
        },
        "health": {"latest": None, "scans": []},
        "inventory": {"water_series": [], "food_series": [], "gnaw_series": [], "hoard_hotspots": []},
        "behavior": {
            "schedule": {"day": datetime.now().date().isoformat(), "first_out": "", "last_in": ""},
            "hourly": [{"hour": f"{h:02d}:00", "grooming_count": 0, "digging_minutes": 0.0} for h in range(24)],
            "anxiety_series": [],
        },
        "environment": {
            "latest": None,
            "series": [],
            "hourly": [{"hour": f"{h:02d}:00", "comfort_index": 0.0} for h in range(24)],
        },
        "motion": {"series": [], "segments": []},
        "alerts": [],
    }


def _dashboard_from_pipeline_result(result: Dict[str, Any], config: SystemConfig, source_name: str) -> Dict[str, Any]:
    frames = result.get("frames", [])
    summary = result.get("summary", {})

    analyzed = [item for item in frames if not item.get("skipped") and item.get("odometer")]
    if not analyzed:
        return _empty_dashboard_payload(config, source=f"uploaded-video:{source_name}", status_message="no analyzable frames")

    timeseries: List[Dict[str, Any]] = []
    alerts: List[Dict[str, str]] = []
    health_scans: List[Dict[str, Any]] = []

    water_series: List[Dict[str, Any]] = []
    food_series: List[Dict[str, Any]] = []
    gnaw_series: List[Dict[str, Any]] = []
    anxiety_series: List[Dict[str, Any]] = []
    environment_series: List[Dict[str, Any]] = []
    motion_series: List[Dict[str, Any]] = []

    direction_counts = {"forward": 0, "reverse": 0, "idle": 0}
    hourly_distance_km = defaultdict(float)
    hourly_stop_go = defaultdict(int)

    hourly_grooming = defaultdict(int)
    hourly_digging_minutes = defaultdict(float)
    environment_hourly = defaultdict(list)

    stop_go_switches: List[str] = []
    escape_events: List[Dict[str, Any]] = []

    prev_distance_m: Optional[float] = None
    prev_running: Optional[bool] = None
    prev_grooming: Optional[int] = None
    prev_digging_seconds: Optional[int] = None

    latest_environment: Optional[Dict[str, Any]] = None

    for frame in frames:
        ts = frame.get("timestamp")
        if ts is None:
            continue

        motion = frame.get("motion")
        if motion:
            motion_series.append(
                {
                    "timestamp": ts,
                    "motion_ratio": float(motion.get("motion_ratio", 0.0)),
                    "is_motion": bool(motion.get("is_motion", False)),
                    "capture_active": bool(motion.get("capture_active", False)),
                    "start_capture": bool(motion.get("start_capture", False)),
                    "stop_capture": bool(motion.get("stop_capture", False)),
                }
            )

        if frame.get("skipped"):
            continue

        dt = datetime.fromisoformat(ts)
        hour = dt.hour

        odometer = frame.get("odometer", {})
        spatial = frame.get("spatial", {})
        behavior = frame.get("behavior", {})
        inventory = frame.get("inventory", {})
        environment = frame.get("environment")
        health = frame.get("health")

        speed_kmh = float(odometer.get("speed_kmh", 0.0))
        rpm = float(odometer.get("rpm", 0.0))
        distance_m_total = float(odometer.get("total_distance_m", 0.0))
        running = bool(odometer.get("running", False))
        direction = str(odometer.get("direction", "idle"))
        running_streak_min = float(odometer.get("running_streak_s", 0.0)) / 60.0

        if direction not in direction_counts:
            direction = "idle"
        direction_counts[direction] += 1

        if prev_distance_m is not None:
            hourly_distance_km[hour] += max(0.0, distance_m_total - prev_distance_m) / 1000.0
        prev_distance_m = distance_m_total

        if prev_running is not None and running != prev_running:
            hourly_stop_go[hour] += 1
            stop_go_switches.append(ts)
        prev_running = running

        x, y = None, None
        centroid = spatial.get("centroid")
        if isinstance(centroid, list) and len(centroid) == 2:
            x, y = float(centroid[0]), float(centroid[1])

        zone = spatial.get("in_zone")

        grooming_total = int(behavior.get("grooming_count", 0))
        digging_seconds_total = int(behavior.get("digging_seconds", 0.0))

        if prev_grooming is None:
            prev_grooming = grooming_total
        else:
            hourly_grooming[hour] += max(0, grooming_total - prev_grooming)
            prev_grooming = grooming_total

        if prev_digging_seconds is None:
            prev_digging_seconds = digging_seconds_total
        else:
            hourly_digging_minutes[hour] += max(0, digging_seconds_total - prev_digging_seconds) / 60.0
            prev_digging_seconds = digging_seconds_total

        anxiety = float(behavior.get("anxiety_index", 0.0))

        water_level = float(inventory.get("water_level_ratio", 0.0))
        food_coverage = float(inventory.get("food_coverage_ratio", 0.0))
        gnaw_wear = float(inventory.get("gnaw_wear_index", 0.0))

        if inventory.get("alerts"):
            for alert_type in inventory.get("alerts", []):
                severity = "high" if alert_type == "low_water" else "medium"
                alerts.append(
                    {
                        "timestamp": ts,
                        "type": str(alert_type),
                        "severity": severity,
                        "message": str(alert_type),
                    }
                )

        if bool(spatial.get("escape_detected", False)):
            alerts.append(
                {
                    "timestamp": ts,
                    "type": "escape",
                    "severity": "high",
                    "message": "Virtual fence crossed",
                }
            )
            if x is not None and y is not None:
                escape_events.append({"timestamp": ts, "x": int(x), "y": int(y)})

        if environment:
            env_entry = {
                "timestamp": ts,
                "brightness": float(environment.get("brightness", 0.0)),
                "dark_ratio": float(environment.get("dark_ratio", 0.0)),
                "edge_density": float(environment.get("edge_density", 0.0)),
                "cleanliness_score": float(environment.get("cleanliness_score", 0.0)),
                "bedding_evenness": float(environment.get("bedding_evenness", 0.0)),
                "lighting_score": float(environment.get("lighting_score", 0.0)),
                "comfort_index": float(environment.get("comfort_index", 0.0)),
                "risk_level": str(environment.get("risk_level", "low")),
            }
            environment_series.append(env_entry)
            environment_hourly[hour].append(env_entry["comfort_index"])
            latest_environment = env_entry

            if env_entry["risk_level"] == "high":
                alerts.append(
                    {
                        "timestamp": ts,
                        "type": "environment_risk",
                        "severity": "medium",
                        "message": "Living environment comfort index is low",
                    }
                )

        if health:
            scan = {
                "timestamp": ts,
                "fur_score": float(health.get("fur_score", 0.0)),
                "expression_score": float(health.get("expression_score", 0.0)),
                "volume_change_ratio": float(health.get("volume_change_ratio", 0.0)),
                "gait_symmetry_score": float(health.get("gait_symmetry_score", 0.0)),
                "risk_level": str(health.get("risk_level", "low")),
                "risk_numeric": 0.0,
                "notes": str(health.get("notes", "")),
            }
            health_scans.append(scan)
            if scan["risk_level"] == "high":
                alerts.append(
                    {
                        "timestamp": ts,
                        "type": "health_risk",
                        "severity": "high",
                        "message": "Visual health score indicates potential issue",
                    }
                )

        timeseries.append(
            {
                "timestamp": ts,
                "rpm": round(rpm, 3),
                "speed_kmh": round(speed_kmh, 3),
                "distance_m_total": round(distance_m_total, 3),
                "running": running,
                "direction": direction,
                "running_streak_min": round(running_streak_min, 2),
                "x": round(x, 2) if x is not None else None,
                "y": round(y, 2) if y is not None else None,
                "zone": zone,
                "water_level_ratio": round(water_level, 4),
                "food_coverage_ratio": round(food_coverage, 4),
                "gnaw_wear_index": round(gnaw_wear, 4),
                "grooming_count_total": grooming_total,
                "digging_seconds_total": digging_seconds_total,
                "anxiety_index": round(anxiety, 4),
                "comfort_index": round((latest_environment or {}).get("comfort_index", 0.0), 4),
                "motion_ratio": round(float((motion or {}).get("motion_ratio", 0.0)), 5),
                "capture_active": bool((motion or {}).get("capture_active", False)),
            }
        )

        water_series.append({"timestamp": ts, "value": round(water_level, 4)})
        food_series.append({"timestamp": ts, "value": round(food_coverage, 4)})
        gnaw_series.append({"timestamp": ts, "value": round(gnaw_wear, 4)})
        anxiety_series.append({"timestamp": ts, "anxiety_index": round(anxiety, 4)})

    if not environment_series:
        env_hist = summary.get("environment_history", [])
        for item in env_hist:
            if "timestamp" not in item:
                continue
            environment_series.append(item)
            h = datetime.fromisoformat(item["timestamp"]).hour
            environment_hourly[h].append(float(item.get("comfort_index", 0.0)))
        latest_environment = environment_series[-1] if environment_series else None

    latest = timeseries[-1]
    latest_health = health_scans[-1] if health_scans else None

    running_ratio = sum(1 for item in timeseries if item["running"]) / max(len(timeseries), 1)
    reverse_ratio = direction_counts["reverse"] / max(direction_counts["reverse"] + direction_counts["forward"], 1)
    max_running_streak = max((item["running_streak_min"] for item in timeseries), default=0.0)

    spatial_summary = summary.get("spatial", {})
    zone_dwell_seconds = summary.get("zone_dwell", spatial_summary.get("zone_dwell_seconds", {}))
    zone_ratio = spatial_summary.get("zone_ratio", {})

    heatmap = summary.get("heatmap")
    if not heatmap:
        heatmap = [[0.0] * 40 for _ in range(24)]

    trajectory = summary.get("trajectory", [])
    if not trajectory:
        trajectory = [
            {
                "timestamp": item["timestamp"],
                "x": item["x"],
                "y": item["y"],
                "zone": item["zone"],
            }
            for item in timeseries
            if item["x"] is not None and item["y"] is not None
        ]

    odometer_hourly = [
        {
            "hour": f"{h:02d}:00",
            "distance_km": round(float(hourly_distance_km.get(h, 0.0)), 4),
            "stop_go_events": int(hourly_stop_go.get(h, 0)),
        }
        for h in range(24)
    ]

    behavior_hourly = [
        {
            "hour": f"{h:02d}:00",
            "grooming_count": int(hourly_grooming.get(h, 0)),
            "digging_minutes": round(float(hourly_digging_minutes.get(h, 0.0)), 2),
        }
        for h in range(24)
    ]

    environment_hourly = [
        {
            "hour": f"{h:02d}:00",
            "comfort_index": round(float(np.mean(environment_hourly[h])) if environment_hourly[h] else 0.0, 4),
        }
        for h in range(24)
    ]

    alerts = sorted(alerts, key=lambda x: x["timestamp"])

    return {
        "generated_at": datetime.now().isoformat(),
        "meta": {
            "history_minutes": config.frontend.history_minutes,
            "frame_width": config.spatial.frame_width,
            "frame_height": config.spatial.frame_height,
            "source": f"uploaded-video:{source_name}",
            "runtime_profile": config.runtime.profile,
            "status_message": "video analyzed",
            "analysis_processed_count": int(summary.get("processed_count", 0)),
            "analysis_analyzed_count": int(summary.get("analyzed_count", 0)),
            "analysis_skipped_count": int(summary.get("skipped_count", 0)),
            "analysis_source_fps": float(summary.get("source_fps", 0.0)),
            "analysis_frame_step": int(summary.get("frame_step", 0)),
            "analysis_width": int(summary.get("analysis_width", 0)),
            "analysis_height": int(summary.get("analysis_height", 0)),
            "spatial_bev_enabled": bool(summary.get("spatial_bev_enabled", False)),
        },
        "summary": {
            "distance_km_24h": round(latest["distance_m_total"] / 1000.0, 3),
            "patrol_length_m_24h": round(float(spatial_summary.get("path_length_m", 0.0)), 3),
            "avg_speed_kmh": round(float(np.mean([item["speed_kmh"] for item in timeseries])), 3),
            "max_speed_kmh": round(float(np.max([item["speed_kmh"] for item in timeseries])), 3),
            "running_ratio": round(running_ratio, 4),
            "reverse_ratio": round(reverse_ratio, 4),
            "max_running_streak_min": round(max_running_streak, 2),
            "escape_count": int(spatial_summary.get("escape_count", len(escape_events))),
            "water_level_ratio": latest["water_level_ratio"],
            "food_coverage_ratio": latest["food_coverage_ratio"],
            "gnaw_wear_index": latest["gnaw_wear_index"],
            "anxiety_index": latest["anxiety_index"],
            "grooming_count_total": latest["grooming_count_total"],
            "digging_minutes_total": round(latest["digging_seconds_total"] / 60.0, 2),
            "health_risk_level": (latest_health or {}).get("risk_level", "unknown"),
            "environment_comfort_index": float((latest_environment or {}).get("comfort_index", 0.0)),
            "environment_risk_level": str((latest_environment or {}).get("risk_level", "unknown")),
            "capture_segments": len(summary.get("motion_segments", [])),
        },
        "timeseries": timeseries,
        "odometer": {
            "hourly": odometer_hourly,
            "direction_distribution": direction_counts,
            "stop_go_switches": stop_go_switches[-120:],
        },
        "spatial": {
            "heatmap": heatmap,
            "heatmap_rows": len(heatmap),
            "heatmap_cols": len(heatmap[0]) if heatmap else 0,
            "trajectory": trajectory,
            "zone_dwell_seconds": zone_dwell_seconds,
            "zone_dwell_ratio": zone_ratio,
            "escape_events": escape_events,
        },
        "health": {
            "latest": latest_health,
            "scans": health_scans,
        },
        "inventory": {
            "water_series": water_series,
            "food_series": food_series,
            "gnaw_series": gnaw_series,
            "hoard_hotspots": [],
        },
        "behavior": {
            "schedule": summary.get("schedule", {"day": datetime.now().date().isoformat(), "first_out": "", "last_in": ""}),
            "hourly": behavior_hourly,
            "anxiety_series": anxiety_series,
        },
        "environment": {
            "latest": latest_environment,
            "series": environment_series,
            "hourly": environment_hourly,
        },
        "motion": {
            "series": motion_series,
            "segments": summary.get("motion_segments", []),
        },
        "alerts": alerts[-300:],
    }


class DashboardState:
    def __init__(self) -> None:
        self.lock = Lock()
        self.config = load_config(default_config_path())
        log_path = configure_logging(self.config.logging)
        LOGGER.info(
            "Logger configured",
            extra={
                "context": {
                    "log_file": str(log_path),
                    "level": self.config.logging.level,
                    "run_mode": self.config.app.run_mode,
                    "demo_source": self.config.app.demo_source,
                }
            },
        )
        self.generator = VirtualDatasetGenerator(self.config)
        self.payload = self.generator.generate(self.config.frontend.history_minutes)
        self.last_update = datetime.now()

        self.uploaded_video_path: Optional[Path] = None
        self.uploaded_video_name: str = ""
        self.uploaded_preview_path: Optional[Path] = None
        self.uploaded_payload: Optional[Dict[str, Any]] = None
        self.uploaded_analyzed_at: Optional[datetime] = None
        self.uploaded_zone_required: bool = False
        self.uploaded_zone_token: str = ""

    def activate_uploaded_demo_source(self) -> None:
        self.config.app.run_mode = "demo"
        self.config.app.demo_source = "uploaded_video"

    def should_refresh_virtual(self) -> bool:
        max_age = timedelta(seconds=self.config.frontend.refresh_interval_seconds)
        return datetime.now() - self.last_update >= max_age

    def refresh_virtual(self) -> Dict[str, Any]:
        self.payload = self.generator.generate(self.config.frontend.history_minutes)
        self.last_update = datetime.now()
        return self.payload

    def set_uploaded_video(self, path: Path, display_name: str, preview_path: Optional[Path] = None) -> None:
        self.activate_uploaded_demo_source()
        self.uploaded_video_path = path
        self.uploaded_video_name = display_name
        self.uploaded_preview_path = preview_path if preview_path is not None and preview_path.exists() else None
        self.uploaded_payload = None
        self.uploaded_analyzed_at = None
        self.uploaded_zone_required = True
        self.uploaded_zone_token = str(path.resolve())
        LOGGER.info(
            "Uploaded video registered",
            extra={
                "context": {
                    "path": str(path),
                    "display_name": display_name,
                    "preview_path": str(self.uploaded_preview_path) if self.uploaded_preview_path else "",
                    "zone_required": True,
                }
            },
        )

    def mark_uploaded_video_zones_initialized(self) -> None:
        if self.uploaded_video_path is None:
            return
        self.activate_uploaded_demo_source()
        self.uploaded_zone_required = False
        self.uploaded_zone_token = str(self.uploaded_video_path.resolve())
        LOGGER.info(
            "Uploaded video zones initialized",
            extra={"context": {"path": str(self.uploaded_video_path)}},
        )

    def analyze_uploaded_video(self, max_frames: Optional[int] = None) -> Dict[str, Any]:
        self.activate_uploaded_demo_source()
        if self.uploaded_video_path is None or not self.uploaded_video_path.exists():
            payload = _empty_dashboard_payload(
                self.config,
                source="uploaded-video",
                status_message="no uploaded video",
            )
            self.payload = payload
            return payload

        if self.uploaded_zone_required:
            raise RuntimeError("zone initialization required for uploaded video")

        limit = max_frames
        if limit is None:
            limit = max(300, self.config.runtime.max_frame_results * self.config.runtime.process_every_nth_frame)

        pipeline = HamsterVisionPipeline(self.config, always_analyze=True)
        result = pipeline.process_video(self.uploaded_video_path, max_frames=limit)
        payload = _dashboard_from_pipeline_result(result, self.config, self.uploaded_video_name or self.uploaded_video_path.name)

        self.uploaded_payload = payload
        self.uploaded_analyzed_at = datetime.now()
        self.payload = payload
        self.last_update = datetime.now()
        LOGGER.info(
            "Uploaded video analyzed",
            extra={
                "context": {
                    "path": str(self.uploaded_video_path),
                    "display_name": self.uploaded_video_name,
                    "max_frames": limit,
                    "summary": payload.get("summary", {}),
                }
            },
        )
        return payload

    def reload_from_disk(self) -> None:
        self.config = load_config(default_config_path())
        configure_logging(self.config.logging)
        self.generator = VirtualDatasetGenerator(self.config)
        self.payload = self.generator.generate(self.config.frontend.history_minutes)
        self.last_update = datetime.now()
        LOGGER.info(
            "Config reloaded from disk",
            extra={
                "context": {
                    "run_mode": self.config.app.run_mode,
                    "demo_source": self.config.app.demo_source,
                    "log_file": str(resolve_log_file(self.config.logging.file_path)),
                }
            },
        )

    def dashboard_for_mode(self, refresh: bool = False) -> Dict[str, Any]:
        run_mode = self.config.app.run_mode
        demo_source = self.config.app.demo_source

        if run_mode == "real":
            payload = _empty_dashboard_payload(
                self.config,
                source="real-camera",
                status_message="real mode reserved",
            )
            payload["meta"]["run_mode"] = "real"
            payload["meta"]["demo_source"] = demo_source
            payload["meta"]["uploaded_video_name"] = self.uploaded_video_name
            payload["meta"]["uploaded_video_key"] = self.uploaded_video_path.name if self.uploaded_video_path else ""
            payload["meta"]["uploaded_preview_available"] = bool(self.uploaded_preview_path and self.uploaded_preview_path.exists())
            payload["meta"]["uploaded_analyzed_at"] = self.uploaded_analyzed_at.isoformat() if self.uploaded_analyzed_at else ""
            payload["meta"]["uploaded_zone_required"] = self.uploaded_zone_required
            self.payload = payload
            return payload

        if demo_source == "uploaded_video":
            if refresh:
                payload = self.analyze_uploaded_video()
            elif self.uploaded_payload is not None:
                payload = self.uploaded_payload
            else:
                payload = _empty_dashboard_payload(
                    self.config,
                    source="uploaded-video",
                    status_message="upload a video then analyze",
                )
            payload["meta"]["run_mode"] = run_mode
            payload["meta"]["demo_source"] = demo_source
            payload["meta"]["uploaded_video_name"] = self.uploaded_video_name
            payload["meta"]["uploaded_video_key"] = self.uploaded_video_path.name if self.uploaded_video_path else ""
            payload["meta"]["uploaded_preview_available"] = bool(self.uploaded_preview_path and self.uploaded_preview_path.exists())
            payload["meta"]["uploaded_analyzed_at"] = self.uploaded_analyzed_at.isoformat() if self.uploaded_analyzed_at else ""
            payload["meta"]["uploaded_zone_required"] = self.uploaded_zone_required
            return payload

        if refresh or self.should_refresh_virtual():
            payload = self.refresh_virtual()
        else:
            payload = self.payload

        payload["meta"]["run_mode"] = run_mode
        payload["meta"]["demo_source"] = demo_source
        payload["meta"]["uploaded_video_name"] = self.uploaded_video_name
        payload["meta"]["uploaded_video_key"] = self.uploaded_video_path.name if self.uploaded_video_path else ""
        payload["meta"]["uploaded_preview_available"] = bool(self.uploaded_preview_path and self.uploaded_preview_path.exists())
        payload["meta"]["uploaded_analyzed_at"] = self.uploaded_analyzed_at.isoformat() if self.uploaded_analyzed_at else ""
        payload["meta"]["uploaded_zone_required"] = self.uploaded_zone_required
        return payload


try:
    dashboard_state = DashboardState()
except ConfigError as exc:
    raise RuntimeError(f"Failed to start app because config is invalid: {exc}") from exc


def _to_int_polygon(points: List[List[int]], label: str) -> List[List[int]]:
    if len(points) < 3:
        raise HTTPException(status_code=400, detail=f"{label} requires at least 3 points")

    out: List[List[int]] = []
    for i, point in enumerate(points):
        if len(point) != 2:
            raise HTTPException(status_code=400, detail=f"{label}[{i}] must be [x, y]")
        out.append([int(point[0]), int(point[1])])
    return out


def _to_int_roi(roi: List[int], label: str) -> List[int]:
    if len(roi) != 4:
        raise HTTPException(status_code=400, detail=f"{label} must be [x, y, w, h]")
    return [int(v) for v in roi]


def _preview_placeholder(width: int, height: int) -> np.ndarray:
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[:, :] = (20, 34, 47)

    for x in range(0, width, 40):
        cv2.line(image, (x, 0), (x, height - 1), (30, 48, 62), 1)
    for y in range(0, height, 40):
        cv2.line(image, (0, y), (width - 1, y), (30, 48, 62), 1)

    cv2.putText(image, "No video preview found", (28, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (190, 220, 220), 2)
    cv2.putText(image, "Use this canvas to initialize zones", (28, 98), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (140, 200, 188), 2)
    return image


def _frame_visual_score(frame: np.ndarray) -> float:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean, std = cv2.meanStdDev(gray)
    max_v = float(gray.max())
    return float(mean[0][0]) + float(std[0][0]) * 2.0 + max_v * 0.5


def _looks_like_black_frame(frame: np.ndarray) -> bool:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean, std = cv2.meanStdDev(gray)
    max_v = float(gray.max())
    return float(mean[0][0]) < 10.0 and float(std[0][0]) < 6.0 and max_v < 40.0


def _read_preview_frame(video_path: Path, max_probe_frames: int = 90) -> Optional[np.ndarray]:
    cap = cv2.VideoCapture(str(video_path))
    best_frame: Optional[np.ndarray] = None
    best_score = -1.0
    probed = 0

    while probed < max_probe_frames:
        ok, raw = cap.read()
        if not ok or raw is None or raw.size == 0:
            break
        probed += 1

        score = _frame_visual_score(raw)
        if score > best_score:
            best_score = score
            best_frame = raw.copy()

        if not _looks_like_black_frame(raw):
            cap.release()
            return raw

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if frame_count > 0:
        for ratio in (0.15, 0.3, 0.5, 0.7):
            frame_idx = min(frame_count - 1, int(frame_count * ratio))
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ok, raw = cap.read()
            if not ok or raw is None or raw.size == 0:
                continue
            score = _frame_visual_score(raw)
            if score > best_score:
                best_score = score
                best_frame = raw.copy()
            if not _looks_like_black_frame(raw):
                cap.release()
                return raw

    cap.release()
    return best_frame


def _read_preview_image(image_path: Path) -> Optional[np.ndarray]:
    frame = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if frame is None or frame.size == 0:
        return None
    return frame


def _load_preview_frame(
    config: SystemConfig,
    max_width: int,
    preferred_video_path: Optional[Path] = None,
    preferred_preview_path: Optional[Path] = None,
) -> tuple[np.ndarray, str]:
    source = config.video.source_path
    frame: Optional[np.ndarray] = None
    source_type = "placeholder"

    if preferred_preview_path and preferred_preview_path.exists():
        frame = _read_preview_image(preferred_preview_path)
        if frame is not None:
            source_type = "uploaded_preview"

    if frame is None and preferred_video_path and preferred_video_path.exists():
        frame = _read_preview_frame(preferred_video_path)
        if frame is not None:
            source_type = "uploaded_video"

    if frame is None and source and Path(source).exists():
        frame = _read_preview_frame(Path(source))
        if frame is not None:
            source_type = "video"

    if frame is None:
        frame = _preview_placeholder(config.video.frame_width, config.video.frame_height)

    if max_width > 0 and frame.shape[1] > max_width:
        target_h = int(frame.shape[0] * max_width / max(frame.shape[1], 1))
        frame = cv2.resize(frame, (max_width, target_h), interpolation=cv2.INTER_AREA)

    return frame, source_type


def _image_to_base64_jpeg(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to encode preview frame")
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def _public_config(cfg: SystemConfig) -> Dict[str, Any]:
    return {
        "app": cfg.app.model_dump(),
        "video": cfg.video.model_dump(),
        "runtime": cfg.runtime.model_dump(),
        "motion_trigger": cfg.motion_trigger.model_dump(),
        "environment": cfg.environment.model_dump(),
        "wheel": cfg.wheel.model_dump(exclude={"marker_hsv_ranges"}),
        "spatial": {
            "zones": cfg.spatial.zones,
            "fence_polygon": cfg.spatial.fence_polygon,
            "wheel_mask_polygon": cfg.spatial.wheel_mask_polygon,
            "frame_width": cfg.spatial.frame_width,
            "frame_height": cfg.spatial.frame_height,
        },
        "health": {
            "capture_interval_seconds": cfg.health.capture_interval_seconds,
            "vlm_enabled": cfg.health.vlm.enabled,
            "vlm_provider": cfg.health.vlm.provider,
            "vlm_model": cfg.health.vlm.model,
            "vlm_endpoint": cfg.health.vlm.endpoint,
            "api_key_env": cfg.health.vlm.api_key_env,
        },
        "inventory": cfg.inventory.model_dump(),
        "alerts": cfg.alerts.model_dump(),
        "frontend": cfg.frontend.model_dump(),
        "logging": cfg.logging.model_dump(),
    }


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "time": datetime.now().isoformat()}


@app.get("/api/config")
def get_config() -> Dict[str, Any]:
    with dashboard_state.lock:
        return _public_config(dashboard_state.config)


@app.get("/api/config/raw")
def get_raw_config() -> Dict[str, Any]:
    with dashboard_state.lock:
        return {
            "config_path": str(default_config_path()),
            "config": load_raw_config(default_config_path()),
        }


@app.post("/api/config/raw")
def save_raw_config_api(payload: RawConfigPayload) -> Dict[str, Any]:
    with dashboard_state.lock:
        try:
            SystemConfig.model_validate(payload.config)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Invalid config: {exc}") from exc

        save_raw_config(payload.config, default_config_path())
        dashboard_state.reload_from_disk()
        LOGGER.info(
            "Raw config saved",
            extra={"context": {"config_path": str(default_config_path())}},
        )
        return {
            "status": "ok",
            "saved_at": datetime.now().isoformat(),
            "config": _public_config(dashboard_state.config),
        }


@app.get("/api/demo/status")
def demo_status() -> Dict[str, Any]:
    with dashboard_state.lock:
        uploaded_videos = _list_uploaded_videos(dashboard_state.config, dashboard_state.uploaded_video_path)
        return {
            "run_mode": dashboard_state.config.app.run_mode,
            "demo_source": dashboard_state.config.app.demo_source,
            "uploaded_video_name": dashboard_state.uploaded_video_name,
            "uploaded_video_key": dashboard_state.uploaded_video_path.name if dashboard_state.uploaded_video_path else "",
            "uploaded_video_path": str(dashboard_state.uploaded_video_path) if dashboard_state.uploaded_video_path else "",
            "uploaded_preview_available": bool(dashboard_state.uploaded_preview_path and dashboard_state.uploaded_preview_path.exists()),
            "uploaded_analyzed_at": dashboard_state.uploaded_analyzed_at.isoformat() if dashboard_state.uploaded_analyzed_at else "",
            "zone_required": dashboard_state.uploaded_zone_required,
            "uploaded_videos": uploaded_videos,
        }


@app.post("/api/demo/upload-preview")
async def upload_demo_preview(
    request: Request,
    token: str = Query(..., min_length=1, max_length=120),
) -> Dict[str, Any]:
    with dashboard_state.lock:
        cfg = dashboard_state.config
        if cfg.app.run_mode != "demo":
            raise HTTPException(status_code=400, detail="Preview upload is only available in demo mode")

        safe_token = _normalize_preview_token(token)
        if not safe_token:
            raise HTTPException(status_code=400, detail="Invalid preview token")

        upload_dir = _resolve_upload_dir(cfg)
        upload_dir.mkdir(parents=True, exist_ok=True)
        preview_dir = _resolve_preview_dir(upload_dir)
        preview_dir.mkdir(parents=True, exist_ok=True)
        target = _preview_temp_path(upload_dir, safe_token)

        max_bytes = 25 * 1024 * 1024
        total = 0
        chunks: List[bytes] = []
        async for chunk in request.stream():
            if not chunk:
                continue
            total += len(chunk)
            if total > max_bytes:
                raise HTTPException(status_code=400, detail="Preview image too large, max 25MB")
            chunks.append(chunk)

        payload = b"".join(chunks)
        if not payload:
            raise HTTPException(status_code=400, detail="Empty preview upload body")

        image_np = np.frombuffer(payload, dtype=np.uint8)
        frame = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        if frame is None or frame.size == 0:
            raise HTTPException(status_code=400, detail="Invalid preview image")

        ok = cv2.imwrite(str(target), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to save preview image")

        LOGGER.info(
            "Demo preview uploaded",
            extra={
                "context": {
                    "token": safe_token,
                    "path": str(target),
                    "width": int(frame.shape[1]),
                    "height": int(frame.shape[0]),
                    "size_bytes": total,
                }
            },
        )

        return {
            "status": "ok",
            "preview_token": safe_token,
            "width": int(frame.shape[1]),
            "height": int(frame.shape[0]),
            "size_bytes": total,
            "uploaded_at": datetime.now().isoformat(),
        }


@app.post("/api/demo/upload")
async def upload_demo_video(
    request: Request,
    filename: str = Query(default="upload.mp4"),
    preview_token: str = Query(default="", max_length=120),
) -> Dict[str, Any]:
    with dashboard_state.lock:
        cfg = dashboard_state.config
        if cfg.app.run_mode != "demo":
            raise HTTPException(status_code=400, detail="Video upload is only available in demo mode")

        safe_name = Path(filename).name
        suffix = Path(safe_name).suffix.lower() if safe_name else ".mp4"
        if suffix not in ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {suffix}")

        upload_dir = _resolve_upload_dir(cfg)
        upload_dir.mkdir(parents=True, exist_ok=True)

        raw_stem = Path(safe_name).stem if safe_name else "upload"
        normalized_stem = "".join(ch if (ch.isalnum() or ch in {"-", "_"}) else "_" for ch in raw_stem).strip("_")
        if not normalized_stem:
            normalized_stem = "upload"
        target = upload_dir / f"demo_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}_{normalized_stem[:40]}{suffix}"

        max_bytes = 350 * 1024 * 1024
        total = 0
        try:
            with target.open("wb") as f:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    total += len(chunk)
                    if total > max_bytes:
                        raise HTTPException(status_code=400, detail="File too large, max 350MB")
                    f.write(chunk)

            if total <= 0:
                raise HTTPException(status_code=400, detail="Empty upload body")
        except Exception:
            try:
                target.unlink()
            except OSError:
                pass
            raise

        preview_path = _bind_preview_to_video(cfg, target, preview_token)
        dashboard_state.set_uploaded_video(target, safe_name or target.name, preview_path=preview_path)
        LOGGER.info(
            "Demo video uploaded",
            extra={
                "context": {
                    "path": str(target),
                    "filename": safe_name or target.name,
                    "size_bytes": total,
                    "preview_path": str(preview_path) if preview_path else "",
                }
            },
        )

        return {
            "status": "ok",
            "uploaded_video_name": dashboard_state.uploaded_video_name,
            "uploaded_video_key": target.name,
            "uploaded_video_path": str(target),
            "uploaded_preview_available": bool(preview_path and preview_path.exists()),
            "size_bytes": total,
            "uploaded_at": datetime.now().isoformat(),
            "zone_required": dashboard_state.uploaded_zone_required,
            "uploaded_videos": _list_uploaded_videos(cfg, dashboard_state.uploaded_video_path),
        }


@app.post("/api/demo/select-uploaded")
def select_uploaded_video(video_key: str = Query(..., min_length=1, max_length=255)) -> Dict[str, Any]:
    with dashboard_state.lock:
        cfg = dashboard_state.config
        if cfg.app.run_mode != "demo":
            raise HTTPException(status_code=400, detail="Video selection is only available in demo mode")

        safe_key = Path(video_key).name
        if safe_key != video_key:
            raise HTTPException(status_code=400, detail="Invalid video key")

        upload_dir = _resolve_upload_dir(cfg)
        target = upload_dir / safe_key
        if not target.exists() or not target.is_file():
            raise HTTPException(status_code=404, detail="Uploaded video not found")
        suffix = target.suffix.lower()
        if suffix not in ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {suffix}")

        preview_path = _find_preview_for_video(cfg, target)
        dashboard_state.set_uploaded_video(target, target.name, preview_path=preview_path)
        LOGGER.info(
            "Uploaded demo video selected",
            extra={
                "context": {
                    "path": str(target),
                    "filename": target.name,
                    "preview_path": str(preview_path) if preview_path else "",
                }
            },
        )

        return {
            "status": "ok",
            "uploaded_video_name": dashboard_state.uploaded_video_name,
            "uploaded_video_key": target.name,
            "uploaded_video_path": str(target),
            "uploaded_preview_available": bool(preview_path and preview_path.exists()),
            "selected_at": datetime.now().isoformat(),
            "zone_required": dashboard_state.uploaded_zone_required,
            "uploaded_videos": _list_uploaded_videos(cfg, dashboard_state.uploaded_video_path),
        }


@app.post("/api/demo/analyze-upload")
def analyze_uploaded_video(max_frames: int = Query(default=0, ge=0, le=30000)) -> Dict[str, Any]:
    with dashboard_state.lock:
        cfg = dashboard_state.config
        if cfg.app.run_mode != "demo":
            raise HTTPException(status_code=400, detail="Analysis is only available in demo mode")
        if cfg.app.demo_source != "uploaded_video":
            raise HTTPException(status_code=400, detail="Set demo_source to uploaded_video first")

        frame_limit = max_frames if max_frames > 0 else None
        try:
            payload = dashboard_state.analyze_uploaded_video(max_frames=frame_limit)
        except RuntimeError as exc:
            LOGGER.warning(
                "Analyze uploaded video rejected",
                extra={"context": {"error": str(exc)}},
            )
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        return {
            "status": "ok",
            "analyzed_at": datetime.now().isoformat(),
            "meta": payload.get("meta", {}),
            "summary": payload.get("summary", {}),
        }


@app.get("/api/init/frame")
def get_init_frame(
    max_width: int = Query(default=0, ge=0, le=3840),
    source: str = Query(default="auto", pattern="^(auto|uploaded|config)$"),
) -> Dict[str, Any]:
    with dashboard_state.lock:
        cfg = dashboard_state.config
        preferred_video_path: Optional[Path] = None
        preferred_preview_path: Optional[Path] = None
        if source == "uploaded":
            preferred_video_path = dashboard_state.uploaded_video_path
            preferred_preview_path = dashboard_state.uploaded_preview_path
        elif source == "auto" and cfg.app.run_mode == "demo" and cfg.app.demo_source == "uploaded_video":
            preferred_video_path = dashboard_state.uploaded_video_path
            preferred_preview_path = dashboard_state.uploaded_preview_path

        frame, source_type = _load_preview_frame(
            cfg,
            max_width=max_width,
            preferred_video_path=preferred_video_path,
            preferred_preview_path=preferred_preview_path,
        )
        return {
            "source": source_type,
            "requested_source": source,
            "zone_required": dashboard_state.uploaded_zone_required,
            "width": int(frame.shape[1]),
            "height": int(frame.shape[0]),
            "image_b64": _image_to_base64_jpeg(frame),
            "spatial": {
                "fence_polygon": cfg.spatial.fence_polygon,
                "wheel_mask_polygon": cfg.spatial.wheel_mask_polygon,
                "zones": cfg.spatial.zones,
            },
            "wheel_roi": cfg.wheel.roi,
            "inventory_rois": {
                "water_roi": cfg.inventory.water_roi,
                "food_roi": cfg.inventory.food_roi,
                "gnaw_roi": cfg.inventory.gnaw_roi,
            },
            "bedding_roi": cfg.environment.bedding_roi,
        }


@app.post("/api/init/zones")
def save_init_zones(payload: InitZonesPayload) -> Dict[str, Any]:
    with dashboard_state.lock:
        raw = load_raw_config(default_config_path())
        updated = deepcopy(raw)

        spatial = dict(updated.get("spatial", {}))
        spatial["fence_polygon"] = _to_int_polygon(payload.fence_polygon, "fence_polygon")
        spatial["wheel_mask_polygon"] = _to_int_polygon(payload.wheel_mask_polygon, "wheel_mask_polygon")
        if payload.frame_width is not None and payload.frame_height is not None:
            spatial["frame_width"] = int(payload.frame_width)
            spatial["frame_height"] = int(payload.frame_height)

        zones: Dict[str, List[List[int]]] = {}
        for name, points in payload.zones.items():
            zones[name] = _to_int_polygon(points, f"zones.{name}")
        spatial["zones"] = zones

        updated["spatial"] = spatial

        if payload.wheel_roi is not None:
            wheel = dict(updated.get("wheel", {}))
            wheel["roi"] = _to_int_roi(payload.wheel_roi, "wheel_roi")
            updated["wheel"] = wheel

        if payload.inventory_rois is not None:
            inventory = dict(updated.get("inventory", {}))
            for key, value in payload.inventory_rois.items():
                if key in {"water_roi", "food_roi", "gnaw_roi"}:
                    inventory[key] = _to_int_roi(value, f"inventory_rois.{key}")
            updated["inventory"] = inventory

        if payload.bedding_roi is not None:
            env = dict(updated.get("environment", {}))
            env["bedding_roi"] = _to_int_roi(payload.bedding_roi, "bedding_roi")
            updated["environment"] = env

        try:
            SystemConfig.model_validate(updated)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Invalid zone config: {exc}") from exc

        save_raw_config(updated, default_config_path())
        dashboard_state.reload_from_disk()
        dashboard_state.mark_uploaded_video_zones_initialized()
        LOGGER.info("Zones saved", extra={"context": {"config_path": str(default_config_path())}})

        return {
            "status": "ok",
            "saved_at": datetime.now().isoformat(),
            "config": _public_config(dashboard_state.config),
            "uploaded_zone_required": dashboard_state.uploaded_zone_required,
        }


@app.get("/api/dashboard")
def get_dashboard(refresh: bool = Query(default=False)) -> Dict[str, Any]:
    with dashboard_state.lock:
        return dashboard_state.dashboard_for_mode(refresh=refresh)


@app.post("/api/dashboard/refresh")
def force_refresh() -> Dict[str, Any]:
    with dashboard_state.lock:
        return dashboard_state.dashboard_for_mode(refresh=True)


app.mount("/web", StaticFiles(directory=str(WEB_DIR)), name="web")
