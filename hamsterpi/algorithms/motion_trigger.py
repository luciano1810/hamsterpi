from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np


@dataclass
class MotionTriggerState:
    timestamp: str
    motion_ratio: float
    motion_pixels: int
    is_motion: bool
    capture_active: bool
    start_capture: bool
    stop_capture: bool
    current_clip_path: str

    def to_dict(self) -> dict:
        return asdict(self)


class MotionTriggeredRecorder:
    """Start recording only when image changes beyond threshold."""

    def __init__(
        self,
        downscale_width: int,
        blur_kernel: int,
        diff_threshold: int,
        min_motion_ratio: float,
        start_trigger_frames: int,
        stop_trigger_frames: int,
        min_capture_seconds: float,
        cool_down_seconds: float,
        output_dir: str,
        record_video: bool,
        output_fps: int,
        codec: str,
    ) -> None:
        self.downscale_width = downscale_width
        self.blur_kernel = blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1
        self.diff_threshold = diff_threshold
        self.min_motion_ratio = min_motion_ratio
        self.start_trigger_frames = start_trigger_frames
        self.stop_trigger_frames = stop_trigger_frames
        self.min_capture_seconds = min_capture_seconds
        self.cool_down_seconds = cool_down_seconds
        self.output_dir = Path(output_dir)
        self.record_video = record_video
        self.output_fps = output_fps
        self.codec = codec

        self._prev_gray: Optional[np.ndarray] = None
        self._motion_streak = 0
        self._idle_streak = 0
        self._capture_active = False
        self._capture_started_at: Optional[datetime] = None
        self._cooldown_until: Optional[datetime] = None

        self._writer: Optional[cv2.VideoWriter] = None
        self._current_clip_path = ""
        self._segments: List[dict] = []
        self._open_kernel_3 = np.ones((3, 3), np.uint8)
        self._cached_input_size: Optional[tuple[int, int]] = None
        self._cached_target_size: Optional[tuple[int, int]] = None

    def _preprocess(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        input_size = (w, h)
        if input_size != self._cached_input_size:
            target_w = min(self.downscale_width, w)
            target_h = max(1, int(h * target_w / max(w, 1)))
            self._cached_input_size = input_size
            self._cached_target_size = (target_w, target_h)
        target_size = self._cached_target_size
        if target_size is None:
            target_w = min(self.downscale_width, w)
            target_h = max(1, int(h * target_w / max(w, 1)))
            target_size = (target_w, target_h)
        resized = cv2.resize(frame, target_size, interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        cv2.GaussianBlur(gray, (self.blur_kernel, self.blur_kernel), 0, dst=gray)
        return gray

    def _start_capture(self, frame: np.ndarray, timestamp: datetime) -> None:
        self._capture_active = True
        self._capture_started_at = timestamp
        self._current_clip_path = str(self.output_dir / f"motion_{timestamp.strftime('%Y%m%d_%H%M%S')}.mp4")

        if not self.record_video:
            return

        self.output_dir.mkdir(parents=True, exist_ok=True)
        h, w = frame.shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*self.codec)
        self._writer = cv2.VideoWriter(self._current_clip_path, fourcc, float(self.output_fps), (w, h))

    def _stop_capture(self, timestamp: datetime) -> None:
        self._capture_active = False
        started_at = self._capture_started_at
        self._capture_started_at = None
        self._cooldown_until = timestamp + timedelta(seconds=self.cool_down_seconds)

        if self._writer is not None:
            self._writer.release()
            self._writer = None

        if started_at is not None:
            self._segments.append(
                {
                    "start": started_at.isoformat(),
                    "end": timestamp.isoformat(),
                    "path": self._current_clip_path,
                    "duration_s": round((timestamp - started_at).total_seconds(), 3),
                }
            )
        self._current_clip_path = ""

    def update(self, frame: np.ndarray, timestamp: datetime) -> MotionTriggerState:
        processed = self._preprocess(frame)

        if self._prev_gray is None:
            self._prev_gray = processed
            return MotionTriggerState(
                timestamp=timestamp.isoformat(),
                motion_ratio=0.0,
                motion_pixels=0,
                is_motion=False,
                capture_active=self._capture_active,
                start_capture=False,
                stop_capture=False,
                current_clip_path=self._current_clip_path,
            )

        diff = cv2.absdiff(self._prev_gray, processed)
        _, mask = cv2.threshold(diff, self.diff_threshold, 255, cv2.THRESH_BINARY)
        cv2.morphologyEx(mask, cv2.MORPH_OPEN, self._open_kernel_3, dst=mask, iterations=1)
        motion_pixels = int(np.count_nonzero(mask))
        motion_ratio = float(motion_pixels) / float(mask.size)
        is_motion = motion_ratio >= self.min_motion_ratio

        self._prev_gray = processed

        if is_motion:
            self._motion_streak += 1
            self._idle_streak = 0
        else:
            self._idle_streak += 1
            self._motion_streak = 0

        start_capture = False
        stop_capture = False

        cooling = self._cooldown_until is not None and timestamp < self._cooldown_until
        if not self._capture_active and not cooling and self._motion_streak >= self.start_trigger_frames:
            self._start_capture(frame, timestamp)
            start_capture = True

        if self._capture_active and self._writer is not None:
            self._writer.write(frame)

        if self._capture_active and self._idle_streak >= self.stop_trigger_frames:
            elapsed = (timestamp - (self._capture_started_at or timestamp)).total_seconds()
            if elapsed >= self.min_capture_seconds:
                self._stop_capture(timestamp)
                stop_capture = True

        return MotionTriggerState(
            timestamp=timestamp.isoformat(),
            motion_ratio=round(motion_ratio, 6),
            motion_pixels=motion_pixels,
            is_motion=is_motion,
            capture_active=self._capture_active,
            start_capture=start_capture,
            stop_capture=stop_capture,
            current_clip_path=self._current_clip_path,
        )

    def close(self) -> None:
        if self._writer is not None:
            self._writer.release()
            self._writer = None

    def segments(self) -> List[dict]:
        return list(self._segments)
