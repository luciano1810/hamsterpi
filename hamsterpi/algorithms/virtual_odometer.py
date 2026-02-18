from __future__ import annotations

import math
from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Deque, List, Optional, Sequence, Tuple

import cv2
import numpy as np

Point = Tuple[int, int]


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
    """Track wheel rotation from marker motion, using wheel polygon to normalize into a circle."""

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
        self._total_revolutions_net = 0.0
        self._total_revolutions_abs = 0.0
        self._previous_timestamp: Optional[datetime] = None
        self._previous_angle: Optional[float] = None
        self._previous_delta_deg = 0.0
        self._previous_running = False
        self._running_streak_s = 0.0
        self._state_switches: Deque[float] = deque(maxlen=180)
        self._marker_missing_streak = 0

        self._wheel_geometry_key: Optional[Tuple[int, ...]] = None
        self._wheel_polygon = np.zeros((0, 2), dtype=np.int32)
        self._wheel_bbox = (0, 0, 0, 0)
        self._wheel_mask_local: Optional[np.ndarray] = None
        self._ellipse_center = (0.0, 0.0)
        self._ellipse_axes = (1.0, 1.0)
        self._ellipse_angle_rad = 0.0
        self._texture_prev_ring: Optional[np.ndarray] = None
        self._texture_virtual_angle: Optional[float] = None

        self._marker_kernel_3 = np.ones((3, 3), np.uint8)
        self._min_marker_area_ratio = 0.00012
        self._max_marker_area_ratio = 0.20
        self._max_reliable_rpm = 260.0
        self._direction_state = "idle"
        self._direction_flip_candidate: Optional[str] = None
        self._direction_flip_evidence_deg = 0.0
        self._direction_flip_min_deg_marker = 10.0
        self._direction_flip_min_deg_other = 16.0

    @staticmethod
    def _unwrap_delta(delta_deg: float) -> float:
        if delta_deg > 180:
            delta_deg -= 360
        elif delta_deg < -180:
            delta_deg += 360
        return delta_deg

    def _unwrap_delta_with_history(self, delta_deg: float) -> float:
        base = self._unwrap_delta(delta_deg)
        prev = float(self._previous_delta_deg)
        if abs(prev) < 0.8:
            return base

        alt = base + 360.0 if base < 0 else base - 360.0
        if abs(alt - prev) + 12.0 < abs(base - prev):
            return alt
        return base

    def _resolve_direction(self, delta: float, rpm: float, source: str) -> str:
        low_delta = abs(delta) < 0.8
        low_rpm_hold = max(1.6, self.min_rpm_for_running * 0.28)
        low_rpm_idle = max(1.2, self.min_rpm_for_running * 0.2)
        if low_delta or rpm < low_rpm_hold:
            if self._direction_state != "idle" and rpm >= low_rpm_idle:
                return self._direction_state
            self._direction_state = "idle"
            self._direction_flip_candidate = None
            self._direction_flip_evidence_deg = 0.0
            return "idle"

        instant = "forward" if delta > 0 else "reverse"
        if self._direction_state in {"idle", instant}:
            self._direction_state = instant
            self._direction_flip_candidate = None
            self._direction_flip_evidence_deg = 0.0
            return instant

        if self._direction_flip_candidate != instant:
            self._direction_flip_candidate = instant
            self._direction_flip_evidence_deg = abs(delta)
        else:
            self._direction_flip_evidence_deg += abs(delta)

        flip_threshold = (
            self._direction_flip_min_deg_marker
            if source == "marker"
            else self._direction_flip_min_deg_other
        )
        if self._direction_flip_evidence_deg >= flip_threshold:
            self._direction_state = instant
            self._direction_flip_candidate = None
            self._direction_flip_evidence_deg = 0.0
            return instant

        return self._direction_state

    @staticmethod
    def _sanitize_roi(frame_shape: Tuple[int, ...], roi: Sequence[int]) -> Tuple[int, int, int, int]:
        frame_h, frame_w = frame_shape[:2]
        if len(roi) != 4:
            return 0, 0, frame_w, frame_h
        x, y, w, h = [int(round(float(v))) for v in roi]
        x = max(0, min(x, frame_w - 1))
        y = max(0, min(y, frame_h - 1))
        w = max(2, min(w, frame_w - x))
        h = max(2, min(h, frame_h - y))
        return x, y, w, h

    @staticmethod
    def _roi_polygon(roi: Sequence[int]) -> np.ndarray:
        x, y, w, h = [int(v) for v in roi]
        return np.array(
            [
                [x, y],
                [x + w - 1, y],
                [x + w - 1, y + h - 1],
                [x, y + h - 1],
            ],
            dtype=np.int32,
        )

    @staticmethod
    def _dedupe_points(points: Sequence[Tuple[int, int]]) -> List[Tuple[int, int]]:
        seen = set()
        out: List[Tuple[int, int]] = []
        for x, y in points:
            key = (int(x), int(y))
            if key in seen:
                continue
            seen.add(key)
            out.append(key)
        return out

    def _normalize_wheel_polygon(
        self,
        frame_shape: Tuple[int, ...],
        wheel_roi: Sequence[int],
        wheel_polygon: Optional[Sequence[Sequence[int]]],
    ) -> np.ndarray:
        frame_h, frame_w = frame_shape[:2]
        points: List[Tuple[int, int]] = []
        if wheel_polygon is not None:
            for point in wheel_polygon:
                if len(point) != 2:
                    continue
                try:
                    x = int(round(float(point[0])))
                    y = int(round(float(point[1])))
                except (TypeError, ValueError):
                    continue
                x = max(0, min(x, frame_w - 1))
                y = max(0, min(y, frame_h - 1))
                points.append((x, y))
        points = self._dedupe_points(points)
        if len(points) >= 3:
            return np.array(points, dtype=np.int32)

        x, y, w, h = self._sanitize_roi(frame_shape, wheel_roi)
        return self._roi_polygon((x, y, w, h))

    def _refresh_wheel_geometry(
        self,
        frame_shape: Tuple[int, ...],
        wheel_roi: Sequence[int],
        wheel_polygon: Optional[Sequence[Sequence[int]]],
    ) -> None:
        polygon = self._normalize_wheel_polygon(frame_shape, wheel_roi, wheel_polygon)
        flat_key = tuple(int(v) for v in polygon.reshape(-1).tolist())
        geometry_key = (frame_shape[0], frame_shape[1], *flat_key)
        if geometry_key == self._wheel_geometry_key:
            return

        self._wheel_geometry_key = geometry_key
        self._wheel_polygon = polygon
        self._texture_prev_ring = None
        self._texture_virtual_angle = None

        x, y, w, h = cv2.boundingRect(polygon)
        frame_h, frame_w = frame_shape[:2]
        x = max(0, min(int(x), frame_w - 1))
        y = max(0, min(int(y), frame_h - 1))
        w = max(2, min(int(w), frame_w - x))
        h = max(2, min(int(h), frame_h - y))
        self._wheel_bbox = (x, y, w, h)

        local_poly = polygon.copy()
        local_poly[:, 0] -= x
        local_poly[:, 1] -= y
        self._wheel_mask_local = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(self._wheel_mask_local, [local_poly], 255)

        center_x = x + w / 2.0
        center_y = y + h / 2.0
        axis_x = max(2.0, w / 2.0)
        axis_y = max(2.0, h / 2.0)
        angle_deg = 0.0

        poly_f = polygon.astype(np.float32)
        if poly_f.shape[0] >= 5:
            try:
                (center_x, center_y), (major, minor), angle_deg = cv2.fitEllipse(poly_f)
                axis_x = max(2.0, float(major) / 2.0)
                axis_y = max(2.0, float(minor) / 2.0)
            except cv2.error:
                pass
        else:
            try:
                (center_x, center_y), (major, minor), angle_deg = cv2.minAreaRect(poly_f)
                axis_x = max(2.0, float(major) / 2.0)
                axis_y = max(2.0, float(minor) / 2.0)
            except cv2.error:
                pass

        self._ellipse_center = (float(center_x), float(center_y))
        self._ellipse_axes = (float(axis_x), float(axis_y))
        self._ellipse_angle_rad = math.radians(float(angle_deg))

    def _wheel_patch(self, frame: np.ndarray) -> Optional[Tuple[np.ndarray, int, int]]:
        x, y, w, h = self._wheel_bbox
        if w <= 1 or h <= 1:
            return None
        patch = frame[y : y + h, x : x + w]
        if patch.size == 0:
            return None
        return patch, x, y

    def _point_to_unit_circle(self, x: float, y: float) -> Tuple[float, float]:
        dx = x - self._ellipse_center[0]
        dy = y - self._ellipse_center[1]
        cos_a = math.cos(self._ellipse_angle_rad)
        sin_a = math.sin(self._ellipse_angle_rad)
        xr = cos_a * dx + sin_a * dy
        yr = -sin_a * dx + cos_a * dy
        nx = xr / max(self._ellipse_axes[0], 1e-6)
        ny = yr / max(self._ellipse_axes[1], 1e-6)
        return nx, ny

    def _angle_from_global_point(self, x: float, y: float) -> Optional[Tuple[float, float]]:
        nx, ny = self._point_to_unit_circle(x, y)
        radius = float(math.hypot(nx, ny))
        if radius <= 1e-6:
            return None
        angle = (math.degrees(math.atan2(-ny, nx)) + 360.0) % 360.0
        return float(angle), radius

    def _adaptive_marker_mask(self, hsv: np.ndarray) -> np.ndarray:
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        if self._wheel_mask_local is None:
            return mask

        wheel_pixels = self._wheel_mask_local > 0
        if int(np.count_nonzero(wheel_pixels)) < 20:
            return mask

        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        sat_values = sat[wheel_pixels]
        val_values = val[wheel_pixels]
        sat_threshold = int(np.clip(np.percentile(sat_values, 82), 34, 220))
        val_threshold = int(np.clip(np.percentile(val_values, 32), 20, 225))

        sat_mask = cv2.inRange(sat, sat_threshold, 255)
        val_mask = cv2.inRange(val, val_threshold, 255)
        cv2.bitwise_and(sat_mask, val_mask, dst=mask)
        cv2.bitwise_and(mask, self._wheel_mask_local, dst=mask)
        cv2.morphologyEx(mask, cv2.MORPH_CLOSE, self._marker_kernel_3, dst=mask, iterations=1)
        cv2.morphologyEx(mask, cv2.MORPH_OPEN, self._marker_kernel_3, dst=mask, iterations=1)
        return mask

    def _best_marker_angle_from_mask(
        self,
        marker_mask: np.ndarray,
        patch: np.ndarray,
        hsv: np.ndarray,
        x0: int,
        y0: int,
        *,
        from_adaptive: bool,
    ) -> Optional[float]:
        contours, _ = cv2.findContours(marker_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        patch_area = float(patch.shape[0] * patch.shape[1])
        min_area = max(4.0, patch_area * self._min_marker_area_ratio)
        max_area = max(min_area * 2.0, patch_area * self._max_marker_area_ratio)
        sat_channel = hsv[:, :, 1]
        contour_mask = np.zeros(marker_mask.shape, dtype=np.uint8)

        best_angle: Optional[float] = None
        best_score = -1.0

        for contour in contours:
            area = float(cv2.contourArea(contour))
            if area < min_area or area > max_area:
                continue

            moments = cv2.moments(contour)
            if moments["m00"] == 0:
                continue

            cx = (moments["m10"] / moments["m00"]) + x0
            cy = (moments["m01"] / moments["m00"]) + y0
            angle_info = self._angle_from_global_point(cx, cy)
            if angle_info is None:
                continue
            angle, radius = angle_info
            if radius < 0.38 or radius > 1.58:
                continue

            contour_mask.fill(0)
            cv2.drawContours(contour_mask, [contour], -1, 255, thickness=-1)
            sat_mean = float(cv2.mean(sat_channel, mask=contour_mask)[0])

            rim_score = max(0.0, 1.6 - abs(radius - 0.95) * 2.2)
            continuity_score = 0.0
            predicted_score = 0.0
            if self._previous_angle is not None:
                continuity_err = abs(self._unwrap_delta(angle - self._previous_angle))
                continuity_score = max(0.0, 1.0 - continuity_err / 150.0)
                if abs(self._previous_delta_deg) > 0.1:
                    predicted = (self._previous_angle + self._previous_delta_deg + 360.0) % 360.0
                    predicted_err = abs(self._unwrap_delta(angle - predicted))
                    predicted_score = max(0.0, 1.0 - predicted_err / 80.0)

            chroma_base = 36.0 if from_adaptive else 24.0
            chroma_scale = 52.0 if from_adaptive else 96.0
            chroma_score = max(0.0, (sat_mean - chroma_base) / chroma_scale)
            area_score = min(10.0, math.sqrt(area))
            score = area_score + rim_score * 2.0 + continuity_score + predicted_score + chroma_score
            if score > best_score:
                best_score = score
                best_angle = float(angle)

        min_score = 2.4 if from_adaptive else 1.6
        if best_score < min_score:
            return None
        return best_angle

    def _detect_marker_angle(self, frame: np.ndarray) -> Optional[float]:
        patch_info = self._wheel_patch(frame)
        if patch_info is None or self._wheel_mask_local is None:
            return None
        patch, x0, y0 = patch_info

        hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        configured_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)

        for lower, upper in self.marker_hsv_ranges:
            cv2.bitwise_or(configured_mask, cv2.inRange(hsv, lower, upper), dst=configured_mask)

        cv2.bitwise_and(configured_mask, self._wheel_mask_local, dst=configured_mask)
        cv2.morphologyEx(configured_mask, cv2.MORPH_CLOSE, self._marker_kernel_3, dst=configured_mask, iterations=1)
        cv2.morphologyEx(configured_mask, cv2.MORPH_OPEN, self._marker_kernel_3, dst=configured_mask, iterations=1)

        angle = self._best_marker_angle_from_mask(
            configured_mask,
            patch,
            hsv,
            x0,
            y0,
            from_adaptive=False,
        )
        if angle is not None:
            return angle

        adaptive_mask = self._adaptive_marker_mask(hsv)
        if np.any(configured_mask):
            inverse_mask = cv2.bitwise_not(configured_mask)
            cv2.bitwise_and(adaptive_mask, inverse_mask, dst=adaptive_mask)

        return self._best_marker_angle_from_mask(
            adaptive_mask,
            patch,
            hsv,
            x0,
            y0,
            from_adaptive=True,
        )

    def _extract_texture_ring(self, frame: np.ndarray) -> Optional[np.ndarray]:
        patch_info = self._wheel_patch(frame)
        if patch_info is None or self._wheel_mask_local is None:
            return None
        patch, x0, y0 = patch_info

        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        cv2.bitwise_and(gray, gray, mask=self._wheel_mask_local, dst=gray)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)

        cx_local = self._ellipse_center[0] - x0
        cy_local = self._ellipse_center[1] - y0
        if (
            not np.isfinite(cx_local)
            or not np.isfinite(cy_local)
            or cx_local < 0
            or cy_local < 0
            or cx_local >= gray.shape[1]
            or cy_local >= gray.shape[0]
        ):
            return None

        max_radius = int(max(8.0, min(self._ellipse_axes) * 0.98))
        if max_radius <= 8:
            return None

        try:
            polar = cv2.warpPolar(
                gray,
                (360, max_radius),
                (float(cx_local), float(cy_local)),
                float(max_radius),
                cv2.WARP_POLAR_LINEAR,
            )
        except cv2.error:
            return None

        if polar is None or polar.size == 0:
            return None

        inner = int(max(4, max_radius * 0.45))
        outer = int(max(inner + 2, max_radius * 0.95))
        ring = polar[inner:outer, :]
        if ring is None or ring.size == 0 or ring.shape[0] < 3:
            return None
        ring = cv2.equalizeHist(ring)
        return np.float32(ring)

    def _estimate_texture_delta(self, current_ring: Optional[np.ndarray]) -> Optional[float]:
        if current_ring is None or self._texture_prev_ring is None:
            return None
        if current_ring.shape != self._texture_prev_ring.shape:
            return None

        shift, response = cv2.phaseCorrelate(self._texture_prev_ring, current_ring)
        shift_x = float(shift[0])
        if not np.isfinite(shift_x) or not np.isfinite(response):
            return None
        if response < 0.05:
            return None

        delta_angle = shift_x * (360.0 / max(current_ring.shape[1], 1))
        if not np.isfinite(delta_angle) or abs(delta_angle) > 95.0:
            return None
        if abs(delta_angle) < 0.06:
            return 0.0
        return float(delta_angle)

    def update(
        self,
        frame: np.ndarray,
        timestamp: datetime,
        wheel_roi: Sequence[int],
        wheel_polygon: Optional[Sequence[Sequence[int]]] = None,
    ) -> OdometerMetrics:
        self._refresh_wheel_geometry(frame.shape, wheel_roi, wheel_polygon)

        marker_angle = self._detect_marker_angle(frame)
        texture_ring = self._extract_texture_ring(frame)
        texture_delta = self._estimate_texture_delta(texture_ring)
        angle = marker_angle
        source = "marker"
        if angle is None and texture_delta is not None:
            base_angle = self._previous_angle
            if base_angle is None:
                base_angle = self._texture_virtual_angle if self._texture_virtual_angle is not None else 0.0
            angle = (base_angle + texture_delta + 360.0) % 360.0
            source = "texture"
        if angle is None and self._previous_angle is not None and self._marker_missing_streak < 4:
            angle = (self._previous_angle + self._previous_delta_deg + 360.0) % 360.0
            source = "predict"

        self._marker_missing_streak = 0 if marker_angle is not None else self._marker_missing_streak + 1
        if texture_ring is not None:
            self._texture_prev_ring = texture_ring
        if angle is not None:
            self._texture_virtual_angle = float(angle)

        if angle is None:
            self._previous_timestamp = timestamp
            self._previous_delta_deg = 0.0
            return OdometerMetrics(
                timestamp=timestamp.isoformat(),
                angle_deg=float(self._previous_angle or 0.0),
                delta_angle_deg=0.0,
                rpm=0.0,
                speed_kmh=0.0,
                total_revolutions=float(self._total_revolutions_abs),
                total_distance_m=self._distance_from_revolutions(self._total_revolutions_abs),
                direction="idle",
                running=False,
                running_streak_s=0.0,
                stop_go_frequency_per_min=0.0,
            )

        if self._previous_timestamp is None or self._previous_angle is None:
            self._previous_timestamp = timestamp
            self._previous_angle = float(angle)
            self._previous_delta_deg = 0.0
            return OdometerMetrics(
                timestamp=timestamp.isoformat(),
                angle_deg=float(angle),
                delta_angle_deg=0.0,
                rpm=0.0,
                speed_kmh=0.0,
                total_revolutions=float(self._total_revolutions_abs),
                total_distance_m=self._distance_from_revolutions(self._total_revolutions_abs),
                direction="idle",
                running=False,
                running_streak_s=0.0,
                stop_go_frequency_per_min=float(len(self._state_switches)),
            )

        dt = max((timestamp - self._previous_timestamp).total_seconds(), 1e-6)
        raw_delta = angle - self._previous_angle
        delta = self._unwrap_delta_with_history(raw_delta)
        max_delta = max(24.0, self._max_reliable_rpm * 6.0 * dt)

        if abs(delta) > max_delta:
            if source == "marker":
                delta = math.copysign(max_delta, delta)
            elif source == "texture":
                if abs(self._previous_delta_deg) > 0.1:
                    delta = math.copysign(min(max_delta, abs(self._previous_delta_deg) * 1.4), delta)
                else:
                    delta = math.copysign(max_delta, delta)
            else:
                delta = 0.0
        if abs(delta) < 0.35:
            delta = 0.0
        if delta * self._previous_delta_deg > 0:
            delta = delta * 0.72 + self._previous_delta_deg * 0.28

        revolutions_delta = delta / 360.0
        self._total_revolutions_net += revolutions_delta
        self._total_revolutions_abs += abs(revolutions_delta)
        rpm = abs(revolutions_delta) * (60.0 / dt)
        speed_kmh = self._speed_from_delta(revolutions_delta, dt)
        direction = self._resolve_direction(delta, rpm, source)

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
        self._previous_angle = float(angle)
        self._previous_delta_deg = float(delta)

        return OdometerMetrics(
            timestamp=timestamp.isoformat(),
            angle_deg=float(angle),
            delta_angle_deg=float(delta),
            rpm=float(rpm),
            speed_kmh=float(speed_kmh),
            total_revolutions=float(self._total_revolutions_abs),
            total_distance_m=self._distance_from_revolutions(self._total_revolutions_abs),
            direction=direction,
            running=running,
            running_streak_s=float(self._running_streak_s),
            stop_go_frequency_per_min=float(len(self._state_switches)),
        )

    def _distance_from_revolutions(self, revolutions: float) -> float:
        return max(float(revolutions), 0.0) * self._wheel_circumference_m

    def _speed_from_delta(self, revolutions_delta: float, dt_seconds: float) -> float:
        meters_per_second = abs(revolutions_delta) * self._wheel_circumference_m / dt_seconds
        return meters_per_second * 3.6
