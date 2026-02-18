from __future__ import annotations

import math
from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Deque, List, Optional, Sequence, Tuple

import cv2
import numpy as np


@dataclass
class OdometerMetrics:
    timestamp: str
    angle_deg: float
    delta_angle_deg: float
    rpm: float
    speed_kmh: float
    total_revolutions: float
    total_distance_m: float
    direction: str
    running: bool
    running_streak_s: float
    stop_go_frequency_per_min: float

    def to_dict(self) -> dict:
        return asdict(self)


class VirtualOdometer:
    """Track wheel rotation using a colored marker or wheel texture."""

    def __init__(
        self,
        wheel_diameter_cm: float,
        marker_hsv_ranges: Sequence[Tuple[Sequence[int], Sequence[int]]],
        min_rpm_for_running: float = 8.0,
    ) -> None:
        self.wheel_diameter_cm = wheel_diameter_cm
        self.min_rpm_for_running = min_rpm_for_running
        self.marker_hsv_ranges = [
            (np.array(lower, dtype=np.uint8), np.array(upper, dtype=np.uint8))
            for lower, upper in marker_hsv_ranges
        ]
        self._wheel_circumference_m = math.pi * (self.wheel_diameter_cm / 100.0)
        self._previous_timestamp: Optional[datetime] = None
        self._previous_angle: Optional[float] = None
        self._previous_running = False
        self._running_streak_s = 0.0
        self._total_revolutions = 0.0
        self._state_switches: Deque[float] = deque(maxlen=180)
        self._texture_prev_gray: Optional[np.ndarray] = None

    @staticmethod
    def _unwrap_delta(delta_deg: float) -> float:
        if delta_deg > 180:
            delta_deg -= 360
        elif delta_deg < -180:
            delta_deg += 360
        return delta_deg

    @staticmethod
    def _crop(frame: np.ndarray, roi: Sequence[int]) -> np.ndarray:
        x, y, w, h = roi
        return frame[y : y + h, x : x + w]

    def _detect_marker_angle(self, frame: np.ndarray, roi: Sequence[int]) -> Optional[float]:
        patch = self._crop(frame, roi)
        if patch.size == 0:
            return None

        hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)

        for lower, upper in self.marker_hsv_ranges:
            cv2.bitwise_or(mask, cv2.inRange(hsv, lower, upper), dst=mask)

        mask = cv2.medianBlur(mask, 5)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < 12:
            return None

        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            return None

        cx = moments["m10"] / moments["m00"]
        cy = moments["m01"] / moments["m00"]
        center_x = patch.shape[1] / 2.0
        center_y = patch.shape[0] / 2.0

        # Clockwise positive by negating Y axis.
        angle = math.degrees(math.atan2(-(cy - center_y), cx - center_x))
        return (angle + 360.0) % 360.0

    def _estimate_angle_from_texture(self, frame: np.ndarray, roi: Sequence[int]) -> Optional[float]:
        patch = self._crop(frame, roi)
        if patch.size == 0:
            return None

        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        if self._texture_prev_gray is None:
            self._texture_prev_gray = gray
            return None

        shift, _ = cv2.phaseCorrelate(np.float32(self._texture_prev_gray), np.float32(gray))
        self._texture_prev_gray = gray

        shift_x, shift_y = shift
        if abs(shift_x) + abs(shift_y) < 0.01:
            return None

        pseudo_angle = (math.degrees(math.atan2(-shift_y, shift_x)) + 360.0) % 360.0
        return pseudo_angle

    def update(
        self,
        frame: np.ndarray,
        timestamp: datetime,
        wheel_roi: Sequence[int],
    ) -> OdometerMetrics:
        angle = self._detect_marker_angle(frame, wheel_roi)
        if angle is None:
            angle = self._estimate_angle_from_texture(frame, wheel_roi)

        if angle is None or self._previous_timestamp is None or self._previous_angle is None:
            self._previous_timestamp = timestamp
            self._previous_angle = angle
            return OdometerMetrics(
                timestamp=timestamp.isoformat(),
                angle_deg=float(angle or 0.0),
                delta_angle_deg=0.0,
                rpm=0.0,
                speed_kmh=0.0,
                total_revolutions=self._total_revolutions,
                total_distance_m=self._distance_from_revolutions(self._total_revolutions),
                direction="idle",
                running=False,
                running_streak_s=0.0,
                stop_go_frequency_per_min=0.0,
            )

        dt = max((timestamp - self._previous_timestamp).total_seconds(), 1e-6)
        raw_delta = angle - self._previous_angle
        delta = self._unwrap_delta(raw_delta)

        revolutions_delta = delta / 360.0
        self._total_revolutions += revolutions_delta
        rpm = abs(revolutions_delta) * (60.0 / dt)
        speed_kmh = self._speed_from_delta(revolutions_delta, dt)

        if abs(delta) < 0.8:
            direction = "idle"
        else:
            direction = "forward" if delta > 0 else "reverse"

        running = rpm >= self.min_rpm_for_running
        if running:
            self._running_streak_s += dt
        else:
            self._running_streak_s = 0.0

        if running != self._previous_running:
            self._state_switches.append(timestamp.timestamp())

        cutoff = timestamp.timestamp() - 60.0
        while self._state_switches and self._state_switches[0] < cutoff:
            self._state_switches.popleft()

        self._previous_running = running
        self._previous_timestamp = timestamp
        self._previous_angle = angle

        return OdometerMetrics(
            timestamp=timestamp.isoformat(),
            angle_deg=float(angle),
            delta_angle_deg=float(delta),
            rpm=float(rpm),
            speed_kmh=float(speed_kmh),
            total_revolutions=float(self._total_revolutions),
            total_distance_m=float(self._distance_from_revolutions(self._total_revolutions)),
            direction=direction,
            running=running,
            running_streak_s=float(self._running_streak_s),
            stop_go_frequency_per_min=float(len(self._state_switches)),
        )

    def _distance_from_revolutions(self, revolutions: float) -> float:
        return abs(revolutions) * self._wheel_circumference_m

    def _speed_from_delta(self, revolutions_delta: float, dt_seconds: float) -> float:
        meters_per_second = abs(revolutions_delta) * self._wheel_circumference_m / dt_seconds
        return meters_per_second * 3.6
