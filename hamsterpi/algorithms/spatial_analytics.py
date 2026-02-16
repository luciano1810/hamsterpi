from __future__ import annotations

from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Deque, Dict, List, Optional, Sequence, Tuple

import cv2
import numpy as np

Point = Tuple[int, int]
Polygon = Sequence[Point]


@dataclass
class SpatialMetrics:
    timestamp: str
    centroid: Optional[Point]
    in_zone: Optional[str]
    cumulative_path_length_m: float
    escape_detected: bool
    active_pixels: int

    def to_dict(self) -> dict:
        return asdict(self)


class SpatialAnalyzer:
    """Analyze cage occupancy with foreground motion and centroid tracking."""

    def __init__(
        self,
        frame_width: int,
        frame_height: int,
        zones: Dict[str, Polygon],
        fence_polygon: Polygon,
        wheel_mask_polygon: Polygon,
        meters_per_pixel: float = 0.0012,
        max_trajectory_points: int = 4000,
    ) -> None:
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.zones = zones
        self.fence_polygon = np.array(fence_polygon, dtype=np.int32)
        self.wheel_mask_polygon = np.array(wheel_mask_polygon, dtype=np.int32)
        self.meters_per_pixel = meters_per_pixel

        self._bg = cv2.createBackgroundSubtractorMOG2(history=600, varThreshold=32, detectShadows=False)
        self._heatmap = np.zeros((frame_height, frame_width), dtype=np.float32)
        self._previous_centroid: Optional[Point] = None
        self._path_length_pixels = 0.0
        self._zone_dwell_seconds = {zone: 0.0 for zone in zones}
        self._escape_count = 0
        self._trajectory: Deque[dict] = deque(maxlen=max_trajectory_points)

    @staticmethod
    def _largest_contour(mask: np.ndarray) -> Optional[np.ndarray]:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < 35:
            return None
        return contour

    @staticmethod
    def _contour_centroid(contour: np.ndarray) -> Optional[Point]:
        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            return None
        return int(moments["m10"] / moments["m00"]), int(moments["m01"] / moments["m00"])

    @staticmethod
    def _in_polygon(point: Point, polygon: np.ndarray) -> bool:
        return cv2.pointPolygonTest(polygon, point, False) >= 0

    def _zone_for_point(self, point: Point) -> Optional[str]:
        for zone_name, polygon in self.zones.items():
            if self._in_polygon(point, np.array(polygon, dtype=np.int32)):
                return zone_name
        return None

    def _motion_mask(self, frame: np.ndarray) -> np.ndarray:
        fg = self._bg.apply(frame)
        fg = cv2.medianBlur(fg, 5)
        _, fg = cv2.threshold(fg, 190, 255, cv2.THRESH_BINARY)
        fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)
        cv2.fillPoly(fg, [self.wheel_mask_polygon], 0)
        return fg

    def update(self, frame: np.ndarray, timestamp: datetime, dt_seconds: float) -> SpatialMetrics:
        motion = self._motion_mask(frame)
        self._heatmap += motion / 255.0
        active_pixels = int(np.count_nonzero(motion))

        contour = self._largest_contour(motion)
        centroid = self._contour_centroid(contour) if contour is not None else None

        zone_name: Optional[str] = None
        escape_detected = False

        if centroid is not None:
            if self._previous_centroid is not None:
                self._path_length_pixels += float(np.linalg.norm(np.array(centroid) - np.array(self._previous_centroid)))

            zone_name = self._zone_for_point(centroid)
            if zone_name:
                self._zone_dwell_seconds[zone_name] += dt_seconds

            escape_detected = not self._in_polygon(centroid, self.fence_polygon)
            if escape_detected:
                self._escape_count += 1

            self._trajectory.append(
                {
                    "timestamp": timestamp.isoformat(),
                    "x": centroid[0],
                    "y": centroid[1],
                    "zone": zone_name,
                    "escape": escape_detected,
                }
            )

            self._previous_centroid = centroid

        return SpatialMetrics(
            timestamp=timestamp.isoformat(),
            centroid=centroid,
            in_zone=zone_name,
            cumulative_path_length_m=self._path_length_pixels * self.meters_per_pixel,
            escape_detected=escape_detected,
            active_pixels=active_pixels,
        )

    def zone_dwell_seconds(self) -> Dict[str, float]:
        return dict(self._zone_dwell_seconds)

    def trajectory(self) -> List[dict]:
        return list(self._trajectory)

    def heatmap(self, width: int = 64, height: int = 36) -> List[List[float]]:
        resized = cv2.resize(self._heatmap, (width, height), interpolation=cv2.INTER_AREA)
        if resized.max() > 0:
            resized = resized / resized.max()
        return resized.round(4).tolist()

    def summary(self) -> dict:
        total_dwell = sum(self._zone_dwell_seconds.values())
        zone_ratio = {
            zone: (seconds / total_dwell if total_dwell > 0 else 0.0)
            for zone, seconds in self._zone_dwell_seconds.items()
        }
        return {
            "path_length_m": self._path_length_pixels * self.meters_per_pixel,
            "escape_count": self._escape_count,
            "zone_dwell_seconds": dict(self._zone_dwell_seconds),
            "zone_ratio": zone_ratio,
        }
