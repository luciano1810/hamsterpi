from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

Point = Tuple[int, int]
Polygon = List[Point]


class AppConfig(BaseModel):
    title: str
    timezone: str
    run_mode: str = "real"
    demo_source: str = "virtual"
    demo_upload_dir: str = "./uploads"
    demo_analysis_resolution: str = "1280x720"
    demo_analysis_fps: int = Field(default=15, ge=1, le=60)

    @field_validator("run_mode")
    @classmethod
    def validate_run_mode(cls, value: str) -> str:
        allowed = {"demo", "real"}
        if value not in allowed:
            raise ValueError(f"run_mode must be one of {sorted(allowed)}")
        return value

    @field_validator("demo_source")
    @classmethod
    def validate_demo_source(cls, value: str) -> str:
        allowed = {"virtual", "uploaded_video"}
        if value not in allowed:
            raise ValueError(f"demo_source must be one of {sorted(allowed)}")
        return value

    @field_validator("demo_analysis_resolution")
    @classmethod
    def validate_demo_analysis_resolution(cls, value: str) -> str:
        raw = str(value).strip().lower().replace(" ", "")
        parts = raw.split("x")
        if len(parts) != 2:
            raise ValueError("demo_analysis_resolution must be in WxH format, e.g. 1280x720")
        try:
            width = int(parts[0])
            height = int(parts[1])
        except ValueError as exc:  # noqa: B904
            raise ValueError("demo_analysis_resolution must contain integer width/height") from exc
        if width < 320 or height < 180:
            raise ValueError("demo_analysis_resolution is too small, min is 320x180")
        if width > 3840 or height > 2160:
            raise ValueError("demo_analysis_resolution is too large, max is 3840x2160")
        return f"{width}x{height}"


class HamsterProfileConfig(BaseModel):
    name: str = "Hammy"
    age_months: int = Field(default=6, ge=0, le=120)
    breed: str = "Dwarf"
    sex: str = "unknown"
    color: str = ""
    notes: str = ""

    @field_validator("name", "breed")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        text = str(value or "").strip()
        if not text:
            raise ValueError("value cannot be empty")
        return text

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, value: str) -> str:
        normalized = str(value or "").strip().lower()
        allowed = {"unknown", "male", "female"}
        if normalized not in allowed:
            raise ValueError(f"sex must be one of {sorted(allowed)}")
        return normalized

    @field_validator("color", "notes")
    @classmethod
    def normalize_optional_text(cls, value: str) -> str:
        return str(value or "").strip()


class VideoConfig(BaseModel):
    source_path: str
    fps: int = Field(default=30, ge=1)
    frame_width: int = Field(default=1280, ge=1)
    frame_height: int = Field(default=720, ge=1)
    simulate: bool = True
    snapshot_interval_seconds: int = Field(default=300, ge=1)
    real_camera_device: str = "rpicam"
    real_camera_rotation: int = Field(default=0)
    real_stream_fps: int = Field(default=10, ge=1, le=30)
    real_record_enabled: bool = True
    real_record_fps: int = Field(default=10, ge=1, le=30)
    real_record_segment_seconds: int = Field(default=300, ge=30, le=3600)
    real_record_output_dir: str = "./captures/real_loop"
    real_record_codec: str = "mp4v"
    real_record_max_storage_gb: float = Field(default=2.0, ge=0.1, le=256.0)

    @field_validator("real_camera_rotation")
    @classmethod
    def validate_real_camera_rotation(cls, value: int) -> int:
        angle = int(value) % 360
        if angle not in {0, 90, 180, 270}:
            raise ValueError("real_camera_rotation must be one of 0/90/180/270")
        return angle


class RuntimeConfig(BaseModel):
    profile: str = "rpi_zero2w"
    low_memory_mode: bool = True
    process_every_nth_frame: int = Field(default=3, ge=1, le=20)
    max_frame_results: int = Field(default=360, ge=30)
    analysis_scale: float = Field(default=0.5, gt=0.0, le=1.0)
    max_analysis_width: int = Field(default=640, ge=64)
    max_analysis_height: int = Field(default=480, ge=64)
    max_fps: int = Field(default=10, ge=1, le=60)
    store_debug_frames: bool = False


class MotionTriggerConfig(BaseModel):
    enabled: bool = True
    downscale_width: int = Field(default=320, ge=64)
    blur_kernel: int = Field(default=5, ge=3)
    diff_threshold: int = Field(default=24, ge=1, le=255)
    min_motion_ratio: float = Field(default=0.006, ge=0.0, le=1.0)

    @field_validator("blur_kernel")
    @classmethod
    def ensure_odd_kernel(cls, value: int) -> int:
        return value if value % 2 == 1 else value + 1


class EnvironmentConfig(BaseModel):
    enabled: bool = True
    sample_every_nth_frame: int = Field(default=5, ge=1)
    low_light_threshold: float = Field(default=0.22, ge=0.0, le=1.0)
    high_light_threshold: float = Field(default=0.9, ge=0.0, le=1.0)
    hygiene_dark_ratio_threshold: float = Field(default=0.24, ge=0.0, le=1.0)
    clutter_edge_threshold: float = Field(default=0.18, ge=0.0, le=1.0)
    bedding_roi: List[int] = Field(default_factory=lambda: [0, 360, 1280, 360])

    @field_validator("bedding_roi")
    @classmethod
    def validate_roi(cls, value: List[int]) -> List[int]:
        if len(value) != 4:
            raise ValueError("bedding_roi should be [x, y, w, h]")
        return value


class HSVRange(BaseModel):
    lower: List[int]
    upper: List[int]

    @field_validator("lower", "upper")
    @classmethod
    def validate_triplet(cls, value: List[int]) -> List[int]:
        if len(value) != 3:
            raise ValueError("HSV value must contain exactly 3 integers")
        return value


class WheelConfig(BaseModel):
    diameter_cm: float = Field(ge=1.0)
    roi: List[int]
    min_rpm_for_running: float = Field(default=8.0, ge=0.0)
    marker_hsv_ranges: List[HSVRange]

    @field_validator("roi")
    @classmethod
    def validate_roi(cls, value: List[int]) -> List[int]:
        if len(value) != 4:
            raise ValueError("ROI should be [x, y, w, h]")
        return value


class SpatialConfig(BaseModel):
    frame_width: int
    frame_height: int
    fence_polygon: Polygon
    wheel_mask_polygon: Polygon
    zones: Dict[str, Polygon]


class VLMConfig(BaseModel):
    enabled: bool = False
    provider: str = "openai"
    endpoint: str
    model: str
    api_key_env: str = "OPENAI_API_KEY"
    timeout_seconds: int = Field(default=20, ge=1)

    def resolve_api_key(self) -> str:
        return os.environ.get(self.api_key_env, "")


class HealthConfig(BaseModel):
    capture_interval_seconds: int = Field(default=900, ge=1)
    baseline_body_area_px: int = Field(default=32000, ge=1)
    vlm: VLMConfig


class InventoryConfig(BaseModel):
    water_roi: List[int]
    food_roi: List[int]
    gnaw_roi: List[int]
    low_water_threshold: float = Field(default=0.2, ge=0.0, le=1.0)
    low_food_threshold: float = Field(default=0.25, ge=0.0, le=1.0)


class AlertsConfig(BaseModel):
    escape_enabled: bool = True
    notifier_provider: str = "mac"
    notifier_cooldown_seconds: int = Field(default=45, ge=1, le=3600)
    mac_notifier_command: str = "terminal-notifier"
    bark_server: str = "https://api.day.app"
    bark_device_key: str = ""
    bark_group: str = "HamsterPi"
    bark_sound: str = ""
    max_stereotypy_index: float = Field(default=0.7, ge=0.0, le=1.0)
    max_weight_change_ratio: float = Field(default=0.12, ge=0.0, le=1.0)

    @field_validator("notifier_provider")
    @classmethod
    def validate_notifier_provider(cls, value: str) -> str:
        normalized = str(value or "").strip().lower()
        if normalized in {"macos", "mac_notifier"}:
            normalized = "mac"
        allowed = {"none", "mac", "bark"}
        if normalized not in allowed:
            raise ValueError(f"notifier_provider must be one of {sorted(allowed)}")
        return normalized

    @field_validator("bark_server")
    @classmethod
    def normalize_bark_server(cls, value: str) -> str:
        raw = str(value or "").strip()
        if not raw:
            return "https://api.day.app"
        if raw.endswith("/"):
            raw = raw[:-1]
        return raw


class FrontendConfig(BaseModel):
    refresh_interval_seconds: int = Field(default=20, ge=1)
    history_minutes: int = Field(default=1440, ge=60)
    default_language: str = "zh-CN"
    available_languages: List[str] = Field(default_factory=lambda: ["zh-CN", "en-US"])

    @field_validator("available_languages")
    @classmethod
    def ensure_available_languages(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("available_languages cannot be empty")
        return value

    @field_validator("default_language")
    @classmethod
    def ensure_default_language(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("default_language cannot be empty")
        return value

    @model_validator(mode="after")
    def ensure_default_in_available(self) -> "FrontendConfig":
        if self.default_language not in self.available_languages:
            raise ValueError("default_language must be included in available_languages")
        return self


class LoggingConfig(BaseModel):
    level: str = "INFO"
    file_path: str = "./logs/hamsterpi.log"
    max_bytes: int = Field(default=5 * 1024 * 1024, ge=1024)
    backup_count: int = Field(default=5, ge=1, le=20)
    console_enabled: bool = True

    @field_validator("level")
    @classmethod
    def validate_level(cls, value: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        level = value.strip().upper()
        if level not in allowed:
            raise ValueError(f"level must be one of {sorted(allowed)}")
        return level


class SystemConfig(BaseModel):
    app: AppConfig
    hamster: HamsterProfileConfig = Field(default_factory=HamsterProfileConfig)
    video: VideoConfig
    runtime: RuntimeConfig = Field(default_factory=RuntimeConfig)
    motion_trigger: MotionTriggerConfig = Field(default_factory=MotionTriggerConfig)
    environment: EnvironmentConfig = Field(default_factory=EnvironmentConfig)
    wheel: WheelConfig
    spatial: SpatialConfig
    health: HealthConfig
    inventory: InventoryConfig
    alerts: AlertsConfig
    frontend: FrontendConfig
    logging: LoggingConfig = Field(default_factory=LoggingConfig)


class ConfigError(RuntimeError):
    """Configuration cannot be loaded or validated."""


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def default_config_path() -> Path:
    return project_root() / "config" / "config.yaml"


def load_raw_config(path: str | Path | None = None) -> Dict[str, Any]:
    config_path = Path(path) if path else default_config_path()
    if not config_path.exists():
        raise ConfigError(f"Config file not found: {config_path}")

    with config_path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    if not isinstance(raw, dict):
        raise ConfigError(f"Config root must be a mapping: {config_path}")
    return raw


def save_raw_config(raw: Dict[str, Any], path: str | Path | None = None) -> None:
    config_path = Path(path) if path else default_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with config_path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(raw, f, allow_unicode=False, sort_keys=False)


def load_config(path: str | Path | None = None) -> SystemConfig:
    config_path = Path(path) if path else default_config_path()
    raw = load_raw_config(config_path)

    try:
        return SystemConfig.model_validate(raw)
    except ValidationError as exc:
        raise ConfigError(f"Invalid config at {config_path}: {exc}") from exc
