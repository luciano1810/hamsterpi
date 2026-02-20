from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Optional

import cv2
import numpy as np


@dataclass
class MotionAnalysisState:
    timestamp: str
    motion_ratio: float
    motion_pixels: int
    is_motion: bool

    def to_dict(self) -> dict:
        return asdict(self)


class MotionChangeAnalyzer:
    """Compute frame-difference motion signal for analysis gating."""

    def __init__(
        self,
        downscale_width: int,
        blur_kernel: int,
        diff_threshold: int,
        min_motion_ratio: float,
    ) -> None:
        self.downscale_width = downscale_width
        self.blur_kernel = blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1
        self.diff_threshold = diff_threshold
        self.min_motion_ratio = min_motion_ratio

        self._prev_gray: Optional[np.ndarray] = None
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

    def update(self, frame: np.ndarray, timestamp: datetime) -> MotionAnalysisState:
        processed = self._preprocess(frame)

        if self._prev_gray is None:
            self._prev_gray = processed
            return MotionAnalysisState(
                timestamp=timestamp.isoformat(),
                motion_ratio=0.0,
                motion_pixels=0,
                is_motion=False,
            )

        diff = cv2.absdiff(self._prev_gray, processed)
        _, mask = cv2.threshold(diff, self.diff_threshold, 255, cv2.THRESH_BINARY)
        cv2.morphologyEx(mask, cv2.MORPH_OPEN, self._open_kernel_3, dst=mask, iterations=1)
        motion_pixels = int(np.count_nonzero(mask))
        motion_ratio = float(motion_pixels) / float(mask.size)
        is_motion = motion_ratio >= self.min_motion_ratio

        self._prev_gray = processed

        return MotionAnalysisState(
            timestamp=timestamp.isoformat(),
            motion_ratio=round(motion_ratio, 6),
            motion_pixels=motion_pixels,
            is_motion=is_motion,
        )

    def close(self) -> None:
        return
