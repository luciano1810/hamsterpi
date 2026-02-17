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
        motion_fence_polygon: Optional[Polygon] = None,
        bev_homography: Optional[np.ndarray] = None,
        meters_per_pixel: float = 0.0012,
        max_trajectory_points: int = 4000,
    ) -> None:
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.zones = {
            zone_name: np.array(polygon, dtype=np.int32)
            for zone_name, polygon in zones.items()
            if len(polygon) >= 3
        }
        self.fence_polygon = np.array(fence_polygon, dtype=np.int32)
        motion_fence = motion_fence_polygon if motion_fence_polygon is not None else fence_polygon
        self.motion_fence_polygon = np.array(motion_fence, dtype=np.int32)
        self.wheel_mask_polygon = np.array(wheel_mask_polygon, dtype=np.int32)
        self.bev_homography = np.array(bev_homography, dtype=np.float32) if bev_homography is not None else None
        self.uses_bev = self.bev_homography is not None
        self.meters_per_pixel = meters_per_pixel

        self._bg = cv2.createBackgroundSubtractorMOG2(history=600, varThreshold=32, detectShadows=False)
        self._heatmap = np.zeros((frame_height, frame_width), dtype=np.float32)
        self._previous_centroid: Optional[Point] = None
        self._path_length_pixels = 0.0
        self._zone_dwell_seconds = {zone: 0.0 for zone in zones}
        self._escape_count = 0
        self._trajectory: Deque[dict] = deque(maxlen=max_trajectory_points)
        self._centroid_heat_radius = max(2, int(round(min(frame_width, frame_height) * 0.012)))
        self._frames_seen = 0
        self._frames_rejected_high_motion = 0
        self._frames_with_centroid = 0

        self._fence_mask = np.zeros((frame_height, frame_width), dtype=np.uint8)
        if len(self.fence_polygon) >= 3:
            cv2.fillPoly(self._fence_mask, [self.fence_polygon], 255)
        else:
            self._fence_mask[:, :] = 255
        self._fence_area_pixels = max(1, int(np.count_nonzero(self._fence_mask)))
        self._max_reliable_motion_ratio = 0.42

        self._motion_fence_mask = np.zeros((frame_height, frame_width), dtype=np.uint8)
        if len(self.motion_fence_polygon) >= 3:
            cv2.fillPoly(self._motion_fence_mask, [self.motion_fence_polygon], 255)
        else:
            self._motion_fence_mask[:, :] = 255

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
        if polygon is None or len(polygon) < 3:
            return False
        return cv2.pointPolygonTest(polygon, point, False) >= 0

    def _zone_for_point(self, point: Point) -> Optional[str]:
        for zone_name, polygon in self.zones.items():
            if self._in_polygon(point, polygon):
                return zone_name
        return None

    def _project_point_to_bev(self, point: Point) -> Optional[Point]:
        if self.bev_homography is None:
            return point
        src = np.array([[[float(point[0]), float(point[1])]]], dtype=np.float32)
        projected = cv2.perspectiveTransform(src, self.bev_homography)
        x_f, y_f = float(projected[0, 0, 0]), float(projected[0, 0, 1])
        if not np.isfinite(x_f) or not np.isfinite(y_f):
            return None
        x = int(round(np.clip(x_f, 0, self.frame_width - 1)))
        y = int(round(np.clip(y_f, 0, self.frame_height - 1)))
        return (x, y)

    def _motion_mask(self, frame: np.ndarray) -> np.ndarray:
        fg = self._bg.apply(frame)
        fg = cv2.medianBlur(fg, 5)
        _, fg = cv2.threshold(fg, 190, 255, cv2.THRESH_BINARY)
        fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)
        fg = cv2.bitwise_and(fg, self._motion_fence_mask)
        if len(self.wheel_mask_polygon) >= 3:
            cv2.fillPoly(fg, [self.wheel_mask_polygon], 0)
        return fg

    def update(self, frame: np.ndarray, timestamp: datetime, dt_seconds: float) -> SpatialMetrics:
        self._frames_seen += 1
        motion = self._motion_mask(frame)
        active_pixels = int(np.count_nonzero(motion))
        motion_ratio = active_pixels / max(self._fence_area_pixels, 1)

        if motion_ratio > self._max_reliable_motion_ratio:
            self._frames_rejected_high_motion += 1
            return SpatialMetrics(
                timestamp=timestamp.isoformat(),
                centroid=None,
                in_zone=None,
                cumulative_path_length_m=self._path_length_pixels * self.meters_per_pixel,
                escape_detected=False,
                active_pixels=active_pixels,
            )

        contour = self._largest_contour(motion)
        centroid_camera = self._contour_centroid(contour) if contour is not None else None
        centroid = self._project_point_to_bev(centroid_camera) if centroid_camera is not None else None

        zone_name: Optional[str] = None
        escape_detected = False

        if centroid is not None:
            self._frames_with_centroid += 1
            if self._previous_centroid is not None:
                self._path_length_pixels += float(np.linalg.norm(np.array(centroid) - np.array(self._previous_centroid)))

            zone_name = self._zone_for_point(centroid)
            if zone_name:
                self._zone_dwell_seconds[zone_name] += dt_seconds

            escape_detected = not self._in_polygon(centroid, self.fence_polygon)
            if escape_detected:
                self._escape_count += 1

            if self._in_polygon(centroid, self.fence_polygon):
                cv2.circle(self._heatmap, centroid, self._centroid_heat_radius, 1.0, thickness=-1)

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
            "frames_seen": self._frames_seen,
            "frames_with_centroid": self._frames_with_centroid,
            "frames_rejected_high_motion": self._frames_rejected_high_motion,
        }
