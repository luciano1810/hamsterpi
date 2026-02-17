from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

import cv2
import numpy as np

VideoPath = Union[str, Path]


def _normalize_right_angle(value: Optional[float]) -> int:
    if value is None or not np.isfinite(value):
        return 0
    angle = int(round(float(value))) % 360
    if angle in {0, 90, 180, 270}:
        return angle
    return 0


@dataclass(frozen=True)
class VideoOrientation:
    metadata_angle: int
    auto_enabled: bool

    @property
    def manual_angle(self) -> int:
        if self.auto_enabled:
            return 0
        return self.metadata_angle


def configure_video_orientation(cap: cv2.VideoCapture) -> VideoOrientation:
    meta_prop = getattr(cv2, "CAP_PROP_ORIENTATION_META", None)
    auto_prop = getattr(cv2, "CAP_PROP_ORIENTATION_AUTO", None)

    metadata_angle = 0
    if meta_prop is not None:
        try:
            metadata_angle = _normalize_right_angle(cap.get(meta_prop))
        except Exception:  # noqa: BLE001
            metadata_angle = 0

    auto_enabled = False
    if auto_prop is not None:
        try:
            cap.set(auto_prop, 1)
        except Exception:  # noqa: BLE001
            pass
        try:
            auto_value = cap.get(auto_prop)
            auto_enabled = bool(np.isfinite(auto_value) and auto_value >= 0.5)
        except Exception:  # noqa: BLE001
            auto_enabled = False

    return VideoOrientation(metadata_angle=metadata_angle, auto_enabled=auto_enabled)


def open_video_capture(video_path: VideoPath) -> tuple[cv2.VideoCapture, VideoOrientation]:
    cap = cv2.VideoCapture(str(video_path))
    orientation = configure_video_orientation(cap)
    return cap, orientation


def apply_video_orientation(frame: np.ndarray, orientation: VideoOrientation) -> np.ndarray:
    angle = orientation.manual_angle
    if angle == 90:
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    if angle == 180:
        return cv2.rotate(frame, cv2.ROTATE_180)
    if angle == 270:
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return frame
