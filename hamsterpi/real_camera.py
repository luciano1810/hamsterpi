from __future__ import annotations

import importlib
import json
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from threading import Condition, Event, Lock, Thread
from typing import Any, Optional, Protocol, TextIO, Tuple, Union

import cv2
import numpy as np

from hamsterpi.config import SystemConfig, project_root
from hamsterpi.logging_system import get_logger

LOGGER = get_logger(__name__)


def _safe_status_text(value: str) -> str:
    text = str(value or "").strip()
    return text or "idle"


def _normalize_rotation(value: int) -> int:
    angle = int(value) % 360
    if angle in {0, 90, 180, 270}:
        return angle
    return 0


def _resolve_output_dir(raw_path: str) -> Path:
    path = Path(raw_path).expanduser()
    if path.is_absolute():
        return path
    return project_root() / path


@dataclass(eq=True, frozen=True)
class RealCameraSettings:
    device: str
    rotation: int
    frame_width: int
    frame_height: int
    capture_fps: int
    stream_fps: int
    record_enabled: bool
    record_fps: int
    record_segment_seconds: int
    record_output_dir: Path
    record_codec: str
    record_max_storage_gb: float

    @property
    def record_max_storage_bytes(self) -> int:
        return int(max(self.record_max_storage_gb, 0.0) * 1024 * 1024 * 1024)

    @classmethod
    def from_config(cls, config: SystemConfig) -> "RealCameraSettings":
        video_cfg = config.video
        return cls(
            device=str(video_cfg.real_camera_device or "auto").strip() or "auto",
            rotation=_normalize_rotation(video_cfg.real_camera_rotation),
            frame_width=max(1, int(video_cfg.frame_width)),
            frame_height=max(1, int(video_cfg.frame_height)),
            capture_fps=max(1, int(video_cfg.fps)),
            stream_fps=max(1, int(video_cfg.real_stream_fps)),
            record_enabled=bool(video_cfg.real_record_enabled),
            record_fps=max(1, int(video_cfg.real_record_fps)),
            record_segment_seconds=max(30, int(video_cfg.real_record_segment_seconds)),
            record_output_dir=_resolve_output_dir(video_cfg.real_record_output_dir),
            record_codec=str(video_cfg.real_record_codec or "mp4v")[:4].ljust(4, "v"),
            record_max_storage_gb=float(video_cfg.real_record_max_storage_gb),
        )


class CameraBackend(Protocol):
    name: str

    def read(self) -> tuple[bool, Optional[np.ndarray]]:
        ...

    def close(self) -> None:
        ...


class OpenCVCameraBackend:
    def __init__(self, device: Union[int, str], settings: RealCameraSettings) -> None:
        self._device = device
        self._settings = settings
        self._capture: Optional[cv2.VideoCapture] = None
        self.name = f"opencv:{device}"

    def open(self) -> None:
        candidates: list[tuple[str, Optional[int]]] = []
        if hasattr(cv2, "CAP_V4L2"):
            candidates.append(("v4l2", int(getattr(cv2, "CAP_V4L2"))))
        candidates.append(("default", None))

        opened: Optional[cv2.VideoCapture] = None
        for _, backend in candidates:
            if backend is None:
                cap = cv2.VideoCapture(self._device)
            else:
                cap = cv2.VideoCapture(self._device, backend)
            if cap.isOpened():
                opened = cap
                break
            cap.release()

        if opened is None:
            raise RuntimeError(f"failed to open camera device: {self._device}")

        opened.set(cv2.CAP_PROP_FRAME_WIDTH, float(self._settings.frame_width))
        opened.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self._settings.frame_height))
        opened.set(cv2.CAP_PROP_FPS, float(self._settings.capture_fps))
        if hasattr(cv2, "CAP_PROP_BUFFERSIZE"):
            opened.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self._capture = opened

    def read(self) -> tuple[bool, Optional[np.ndarray]]:
        if self._capture is None:
            return False, None
        ok, frame = self._capture.read()
        if not ok or frame is None or frame.size == 0:
            return False, None
        return True, frame

    def close(self) -> None:
        if self._capture is not None:
            self._capture.release()
            self._capture = None


class Picamera2Backend:
    def __init__(self, settings: RealCameraSettings) -> None:
        self._settings = settings
        self._camera: Any = None
        self.name = "picamera2"

    def open(self) -> None:
        module = importlib.import_module("picamera2")
        picam2_cls = getattr(module, "Picamera2")
        camera = picam2_cls()
        config = camera.create_video_configuration(
            main={
                "size": (int(self._settings.frame_width), int(self._settings.frame_height)),
                "format": "RGB888",
            },
            controls={"FrameRate": float(self._settings.capture_fps)},
        )
        camera.configure(config)
        camera.start()
        time.sleep(0.15)
        self._camera = camera

    def read(self) -> tuple[bool, Optional[np.ndarray]]:
        if self._camera is None:
            return False, None
        try:
            frame_rgb = self._camera.capture_array("main")
        except Exception:  # noqa: BLE001
            return False, None
        if frame_rgb is None or frame_rgb.size == 0:
            return False, None
        if frame_rgb.ndim == 2:
            frame = cv2.cvtColor(frame_rgb, cv2.COLOR_GRAY2BGR)
        else:
            frame = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
        return True, frame

    def close(self) -> None:
        if self._camera is not None:
            try:
                self._camera.stop()
            except Exception:  # noqa: BLE001
                pass
            try:
                self._camera.close()
            except Exception:  # noqa: BLE001
                pass
            self._camera = None


class RealCameraLoopService:
    def __init__(self, config: SystemConfig) -> None:
        self._settings = RealCameraSettings.from_config(config)
        self._thread: Optional[Thread] = None
        self._stop_event = Event()
        self._state_lock = Lock()
        self._frame_cv = Condition(self._state_lock)

        self._latest_frame_jpeg: Optional[bytes] = None
        self._latest_frame_at: Optional[datetime] = None
        self._latest_frame_size: Tuple[int, int] = (0, 0)
        self._latest_frame_seq = 0

        self._status_text = "stopped"
        self._backend_name = ""
        self._camera_opened = False
        self._last_error = ""
        self._error_count = 0

        self._writer: Optional[cv2.VideoWriter] = None
        self._writer_path: Optional[Path] = None
        self._writer_frame_log_path: Optional[Path] = None
        self._writer_meta_path: Optional[Path] = None
        self._writer_frame_log_file: Optional[TextIO] = None
        self._record_started_monotonic = 0.0
        self._last_record_written_monotonic = 0.0
        self._next_stream_encode_monotonic = 0.0
        self._segment_opened_at: Optional[datetime] = None
        self._segment_first_frame_at: Optional[datetime] = None
        self._segment_last_frame_at: Optional[datetime] = None
        self._segment_written_frames = 0
        self._segment_error_abs_sum_ms = 0.0
        self._segment_error_abs_max_ms = 0.0

    def apply_config(self, config: SystemConfig) -> None:
        next_settings = RealCameraSettings.from_config(config)
        should_restart = False
        with self._state_lock:
            if next_settings != self._settings:
                self._settings = next_settings
                should_restart = self._thread is not None and self._thread.is_alive()
        if should_restart:
            self.stop()
            self.start()

    def start(self) -> None:
        with self._state_lock:
            if self._thread is not None and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._status_text = "starting"
            thread = Thread(target=self._run, name="real-camera-loop", daemon=True)
            self._thread = thread
            thread.start()

    def stop(self) -> None:
        with self._state_lock:
            thread = self._thread
            self._thread = None
            self._stop_event.set()
            self._frame_cv.notify_all()
        if thread is not None:
            thread.join(timeout=4.0)
        with self._state_lock:
            self._close_writer_locked()
            self._camera_opened = False
            self._backend_name = ""
            self._status_text = "stopped"

    def wait_latest_frame_jpeg(self, timeout_seconds: float = 1.0) -> Optional[bytes]:
        with self._frame_cv:
            if self._latest_frame_jpeg is not None:
                return self._latest_frame_jpeg
            self._frame_cv.wait(timeout=max(0.0, float(timeout_seconds)))
            return self._latest_frame_jpeg

    def wait_next_frame_jpeg(self, last_seq: int, timeout_seconds: float = 1.0) -> tuple[int, Optional[bytes]]:
        timeout = max(0.0, float(timeout_seconds))
        deadline = time.monotonic() + timeout
        with self._frame_cv:
            while self._latest_frame_seq <= int(last_seq):
                remaining = deadline - time.monotonic()
                if remaining <= 0.0:
                    break
                self._frame_cv.wait(timeout=remaining)
            return int(self._latest_frame_seq), self._latest_frame_jpeg

    def snapshot(self) -> dict[str, Any]:
        with self._state_lock:
            settings = self._settings
            latest_at = self._latest_frame_at.isoformat() if self._latest_frame_at else ""
            frame_width, frame_height = self._latest_frame_size
            status = {
                "running": bool(self._thread is not None and self._thread.is_alive()),
                "camera_opened": bool(self._camera_opened),
                "backend": self._backend_name,
                "status": _safe_status_text(self._status_text),
                "last_error": self._last_error,
                "error_count": int(self._error_count),
                "latest_frame_at": latest_at,
                "frame_width": int(frame_width),
                "frame_height": int(frame_height),
                "recording_enabled": bool(settings.record_enabled),
                "recording_active": bool(self._writer is not None),
                "current_record_path": str(self._writer_path) if self._writer_path else "",
                "current_frame_log_path": str(self._writer_frame_log_path) if self._writer_frame_log_path else "",
                "current_written_frames": int(self._segment_written_frames),
                "stream_fps": int(settings.stream_fps),
                "record_max_storage_gb": float(settings.record_max_storage_gb),
                "record_output_dir": str(settings.record_output_dir),
                "record_segment_seconds": int(settings.record_segment_seconds),
                "record_fps": int(settings.record_fps),
            }

        file_count, total_bytes = self._scan_record_storage(settings.record_output_dir)
        status["stored_files"] = int(file_count)
        status["stored_bytes"] = int(total_bytes)
        status["stored_gb"] = round(float(total_bytes / (1024 * 1024 * 1024)), 4)
        return status

    def _set_status(self, text: str, *, opened: Optional[bool] = None, backend: Optional[str] = None, error: str = "") -> None:
        with self._state_lock:
            self._status_text = _safe_status_text(text)
            if opened is not None:
                self._camera_opened = bool(opened)
            if backend is not None:
                self._backend_name = backend
            if error:
                self._last_error = str(error)
                self._error_count += 1
            elif opened:
                self._last_error = ""

    def _run(self) -> None:
        backend: Optional[CameraBackend] = None
        while not self._stop_event.is_set():
            if backend is None:
                try:
                    backend = self._open_backend()
                    self._set_status("camera opened", opened=True, backend=backend.name, error="")
                    self._next_stream_encode_monotonic = 0.0
                    LOGGER.info(
                        "Real camera opened",
                        extra={
                            "context": {
                                "backend": backend.name,
                                "device": self._settings.device,
                                "width": self._settings.frame_width,
                                "height": self._settings.frame_height,
                                "capture_fps": self._settings.capture_fps,
                            }
                        },
                    )
                except Exception as exc:  # noqa: BLE001
                    self._set_status("camera open failed", opened=False, backend="", error=str(exc))
                    LOGGER.warning(
                        "Real camera open failed",
                        extra={
                            "context": {
                                "device": self._settings.device,
                                "error": str(exc),
                            }
                        },
                    )
                    self._close_writer()
                    time.sleep(1.0)
                    continue

            ok, frame = backend.read()
            if not ok or frame is None or frame.size == 0:
                self._set_status("camera read failed", opened=False, backend=backend.name, error="read frame failed")
                LOGGER.warning(
                    "Real camera read failed",
                    extra={"context": {"backend": backend.name}},
                )
                try:
                    backend.close()
                finally:
                    backend = None
                self._close_writer()
                time.sleep(0.4)
                continue

            frame = self._normalize_frame(frame)
            frame = self._rotate_frame(frame)
            now = datetime.now()
            now_mono = time.monotonic()
            self._publish_frame(frame, now, now_mono)
            self._record_frame(frame, now, now_mono)

        if backend is not None:
            try:
                backend.close()
            except Exception:  # noqa: BLE001
                pass
        self._close_writer()

    def _normalize_frame(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        settings = self._settings
        target_w = int(settings.frame_width)
        target_h = int(settings.frame_height)
        if w == target_w and h == target_h:
            return frame
        return cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)

    def _rotate_frame(self, frame: np.ndarray) -> np.ndarray:
        angle = self._settings.rotation
        if angle == 90:
            return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        if angle == 180:
            return cv2.rotate(frame, cv2.ROTATE_180)
        if angle == 270:
            return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        return frame

    def _publish_frame(self, frame: np.ndarray, now: datetime, now_mono: float) -> None:
        settings = self._settings
        interval = 1.0 / float(max(settings.stream_fps, 1))
        if now_mono < self._next_stream_encode_monotonic and self._latest_frame_jpeg is not None:
            with self._state_lock:
                self._latest_frame_at = now
                self._latest_frame_size = (int(frame.shape[1]), int(frame.shape[0]))
            return

        ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
        if not ok:
            return
        payload = encoded.tobytes()
        with self._frame_cv:
            self._latest_frame_jpeg = payload
            self._latest_frame_at = now
            self._latest_frame_size = (int(frame.shape[1]), int(frame.shape[0]))
            self._latest_frame_seq += 1
            self._frame_cv.notify_all()
        self._next_stream_encode_monotonic = now_mono + interval

    def _record_frame(self, frame: np.ndarray, now: datetime, now_mono: float) -> None:
        settings = self._settings
        if not settings.record_enabled:
            self._close_writer()
            return

        if self._writer is None:
            try:
                self._open_writer(frame.shape[1], frame.shape[0], now, now_mono)
            except Exception as exc:  # noqa: BLE001
                self._set_status("recording open failed", opened=True, backend=self._backend_name, error=str(exc))
                LOGGER.warning(
                    "Real loop recording open failed",
                    extra={"context": {"error": str(exc), "output_dir": str(settings.record_output_dir)}},
                )
                return

        min_interval = 1.0 / float(max(settings.record_fps, 1))
        if self._last_record_written_monotonic <= 0.0 or now_mono - self._last_record_written_monotonic >= min_interval:
            writer = self._writer
            if writer is not None:
                writer.write(frame)
                self._record_frame_timestamp(now)
                self._last_record_written_monotonic = now_mono

        if now_mono - self._record_started_monotonic >= float(settings.record_segment_seconds):
            self._rotate_writer(frame.shape[1], frame.shape[0], now, now_mono)

    def _open_writer(self, width: int, height: int, now: datetime, now_mono: float) -> None:
        settings = self._settings
        settings.record_output_dir.mkdir(parents=True, exist_ok=True)
        target_path = settings.record_output_dir / f"loop_{now.strftime('%Y%m%d_%H%M%S')}.mp4"
        frame_log_path = Path(f"{target_path.as_posix()}.frames.jsonl")
        meta_path = Path(f"{target_path.as_posix()}.meta.json")

        codec = str(settings.record_codec or "mp4v")[:4].ljust(4, "v")
        fourcc = cv2.VideoWriter_fourcc(*codec)
        writer = cv2.VideoWriter(target_path.as_posix(), fourcc, float(settings.record_fps), (int(width), int(height)))
        if not writer.isOpened() and codec.lower() != "mp4v":
            writer.release()
            codec = "mp4v"
            fourcc = cv2.VideoWriter_fourcc(*codec)
            writer = cv2.VideoWriter(target_path.as_posix(), fourcc, float(settings.record_fps), (int(width), int(height)))
        if not writer.isOpened():
            writer.release()
            raise RuntimeError("failed to open loop recorder")

        try:
            frame_log_file = frame_log_path.open("w", encoding="utf-8")
        except Exception:
            writer.release()
            raise

        self._writer = writer
        self._writer_path = target_path
        self._writer_frame_log_path = frame_log_path
        self._writer_meta_path = meta_path
        self._writer_frame_log_file = frame_log_file
        self._record_started_monotonic = now_mono
        self._last_record_written_monotonic = 0.0
        self._segment_opened_at = now
        self._segment_first_frame_at = None
        self._segment_last_frame_at = None
        self._segment_written_frames = 0
        self._segment_error_abs_sum_ms = 0.0
        self._segment_error_abs_max_ms = 0.0
        self._set_status("recording", opened=True, backend=self._backend_name, error="")

    def _rotate_writer(self, width: int, height: int, now: datetime, now_mono: float) -> None:
        self._close_writer(now)
        self._prune_record_storage()
        self._open_writer(width, height, now, now_mono)

    def _close_writer(self, closed_at: Optional[datetime] = None) -> None:
        with self._state_lock:
            self._close_writer_locked(closed_at=closed_at)

    def _close_writer_locked(self, closed_at: Optional[datetime] = None) -> None:
        closed_at = closed_at or datetime.now()
        video_path = self._writer_path
        if self._writer is not None:
            self._writer.release()
            self._writer = None
        if self._writer_frame_log_file is not None:
            try:
                self._writer_frame_log_file.flush()
                self._writer_frame_log_file.close()
            except Exception:  # noqa: BLE001
                pass
            self._writer_frame_log_file = None

        self._finalize_segment_metadata(video_path=video_path, closed_at=closed_at)

        self._writer_path = None
        self._writer_frame_log_path = None
        self._writer_meta_path = None
        self._record_started_monotonic = 0.0
        self._last_record_written_monotonic = 0.0
        self._segment_opened_at = None
        self._segment_first_frame_at = None
        self._segment_last_frame_at = None
        self._segment_written_frames = 0
        self._segment_error_abs_sum_ms = 0.0
        self._segment_error_abs_max_ms = 0.0

    def _record_frame_timestamp(self, now: datetime) -> None:
        frame_log_file = self._writer_frame_log_file
        first_at = self._segment_first_frame_at
        settings = self._settings
        if frame_log_file is None:
            return

        frame_index = int(self._segment_written_frames)
        if first_at is None:
            first_at = now
            self._segment_first_frame_at = now
        self._segment_last_frame_at = now

        nominal_video_time_s = frame_index / float(max(settings.record_fps, 1))
        elapsed_s = max(0.0, (now - first_at).total_seconds())
        error_ms = (elapsed_s - nominal_video_time_s) * 1000.0
        abs_error_ms = abs(error_ms)
        self._segment_error_abs_sum_ms += abs_error_ms
        self._segment_error_abs_max_ms = max(self._segment_error_abs_max_ms, abs_error_ms)

        payload = {
            "frame_index": frame_index,
            "captured_at": now.isoformat(timespec="milliseconds"),
            "video_time_s": round(nominal_video_time_s, 6),
            "elapsed_s": round(elapsed_s, 6),
            "sync_error_ms": round(error_ms, 3),
        }
        frame_log_file.write(json.dumps(payload, ensure_ascii=True, separators=(",", ":")))
        frame_log_file.write("\n")
        if frame_index % 25 == 0:
            frame_log_file.flush()
        self._segment_written_frames += 1

    def _finalize_segment_metadata(self, video_path: Optional[Path], closed_at: datetime) -> None:
        if video_path is None:
            return

        frame_log_path = self._writer_frame_log_path
        meta_path = self._writer_meta_path
        start_at = self._segment_opened_at
        first_at = self._segment_first_frame_at
        last_at = self._segment_last_frame_at
        written_frames = int(self._segment_written_frames)
        settings = self._settings

        elapsed_s = max(0.0, (last_at - first_at).total_seconds()) if first_at and last_at else 0.0
        expected_elapsed_s = (max(0, written_frames - 1) / float(max(settings.record_fps, 1))) if written_frames > 0 else 0.0
        drift_ms = (elapsed_s - expected_elapsed_s) * 1000.0
        avg_abs_error_ms = self._segment_error_abs_sum_ms / max(written_frames, 1) if written_frames > 0 else 0.0

        payload = {
            "video_path": str(video_path),
            "frame_log_path": str(frame_log_path) if frame_log_path else "",
            "record_fps": int(settings.record_fps),
            "opened_at": start_at.isoformat(timespec="milliseconds") if start_at else "",
            "first_frame_at": first_at.isoformat(timespec="milliseconds") if first_at else "",
            "last_frame_at": last_at.isoformat(timespec="milliseconds") if last_at else "",
            "closed_at": closed_at.isoformat(timespec="milliseconds"),
            "written_frames": written_frames,
            "timeline_elapsed_s": round(elapsed_s, 6),
            "expected_elapsed_s": round(expected_elapsed_s, 6),
            "timeline_drift_ms": round(drift_ms, 3),
            "avg_abs_sync_error_ms": round(avg_abs_error_ms, 3),
            "max_abs_sync_error_ms": round(float(self._segment_error_abs_max_ms), 3),
            "frame_time_matched": bool(abs(drift_ms) <= 300.0 and self._segment_error_abs_max_ms <= 350.0),
        }

        if meta_path is not None:
            try:
                with meta_path.open("w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=True, indent=2, sort_keys=True)
            except Exception:  # noqa: BLE001
                pass

        manifest_path = settings.record_output_dir / "segments_manifest.jsonl"
        try:
            with manifest_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(payload, ensure_ascii=True, separators=(",", ":")))
                f.write("\n")
        except Exception:  # noqa: BLE001
            pass

    @staticmethod
    def _scan_record_storage(directory: Path) -> tuple[int, int]:
        if not directory.exists() or not directory.is_dir():
            return 0, 0
        total_bytes = 0
        file_count = 0
        for path in directory.glob("loop_*.mp4"):
            if not path.is_file():
                continue
            try:
                size = int(path.stat().st_size)
            except OSError:
                continue
            total_bytes += max(0, size)
            file_count += 1
        return file_count, total_bytes

    def _prune_record_storage(self) -> None:
        settings = self._settings
        max_bytes = settings.record_max_storage_bytes
        if max_bytes <= 0:
            return
        out_dir = settings.record_output_dir
        if not out_dir.exists() or not out_dir.is_dir():
            return

        entries: list[tuple[Path, int, float]] = []
        for path in out_dir.glob("loop_*.mp4"):
            if not path.is_file():
                continue
            try:
                stat = path.stat()
            except OSError:
                continue
            entries.append((path, int(stat.st_size), float(stat.st_mtime)))

        if not entries:
            return

        current_path: Optional[Path] = None
        with self._state_lock:
            if self._writer_path is not None:
                current_path = self._writer_path.resolve()

        entries.sort(key=lambda item: item[2])
        total_size = int(sum(size for _, size, _ in entries))
        deleted_files = 0
        deleted_bytes = 0

        for path, size, _ in entries:
            if total_size <= max_bytes:
                break
            try:
                resolved = path.resolve()
            except OSError:
                resolved = path
            if current_path is not None and resolved == current_path:
                continue
            try:
                path.unlink()
                total_size -= size
                deleted_files += 1
                deleted_bytes += max(0, size)
                for sidecar in (Path(f"{path.as_posix()}.frames.jsonl"), Path(f"{path.as_posix()}.meta.json")):
                    try:
                        if sidecar.exists():
                            sidecar.unlink()
                    except OSError:
                        continue
            except OSError:
                continue

        if deleted_files > 0:
            LOGGER.info(
                "Pruned old loop recordings by storage limit",
                extra={
                    "context": {
                        "output_dir": str(out_dir),
                        "deleted_files": deleted_files,
                        "deleted_bytes": deleted_bytes,
                        "max_bytes": max_bytes,
                        "remaining_bytes": total_size,
                    }
                },
            )

    def _open_backend(self) -> CameraBackend:
        settings = self._settings
        device_raw = str(settings.device or "auto").strip()
        device_lc = device_raw.lower()

        open_errors: list[str] = []

        def try_picamera2() -> Optional[CameraBackend]:
            backend = Picamera2Backend(settings)
            try:
                backend.open()
                return backend
            except Exception as exc:  # noqa: BLE001
                open_errors.append(f"picamera2: {exc}")
                return None

        def try_opencv_devices(devices: list[Union[int, str]]) -> Optional[CameraBackend]:
            for candidate in devices:
                backend = OpenCVCameraBackend(candidate, settings)
                try:
                    backend.open()
                    return backend
                except Exception as exc:  # noqa: BLE001
                    open_errors.append(f"opencv({candidate}): {exc}")
                    continue
            return None

        if device_lc in {"auto", "picamera2", "csi", "ov5647"}:
            camera = try_picamera2()
            if camera is not None:
                return camera

        opencv_candidates: list[Union[int, str]] = []
        if device_lc == "auto":
            opencv_candidates = [0, "/dev/video0", "/dev/video1"]
        elif device_lc in {"picamera2", "csi", "ov5647"}:
            opencv_candidates = [0, "/dev/video0", "/dev/video1"]
        elif device_raw.isdigit():
            opencv_candidates = [int(device_raw)]
        else:
            opencv_candidates = [device_raw]

        camera = try_opencv_devices(opencv_candidates)
        if camera is not None:
            return camera

        detail = "; ".join(open_errors) if open_errors else f"device={device_raw}"
        raise RuntimeError(f"no available camera backend ({detail})")
