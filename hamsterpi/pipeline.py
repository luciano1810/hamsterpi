from __future__ import annotations

import base64
import time
from collections import deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Deque, Dict, Iterable, List, Optional, Sequence, Tuple

import cv2
import numpy as np

from hamsterpi.algorithms.behavioral_logging import BehavioralLogger
from hamsterpi.algorithms.environment_analysis import EnvironmentAnalyzer
from hamsterpi.algorithms.inventory_watch import InventoryWatcher
from hamsterpi.algorithms.motion_trigger import MotionTriggeredRecorder
from hamsterpi.algorithms.spatial_analytics import SpatialAnalyzer
from hamsterpi.algorithms.virtual_odometer import VirtualOdometer
from hamsterpi.algorithms.visual_health import VisualHealthScanner
from hamsterpi.config import SystemConfig
from hamsterpi.logging_system import get_logger
from hamsterpi.notifier import MacNotifier
from hamsterpi.video_capture import apply_video_orientation, open_video_capture

LOGGER = get_logger(__name__)


class HamsterVisionPipeline:
    """Unified real-video processing optimized for Raspberry Pi Zero 2W."""

    def __init__(self, config: SystemConfig, always_analyze: bool = False) -> None:
        self.config = config
        self.always_analyze = always_analyze

        self.analysis_width, self.analysis_height = self._analysis_size()
        self.video_scale_x = self.analysis_width / max(self.config.video.frame_width, 1)
        self.video_scale_y = self.analysis_height / max(self.config.video.frame_height, 1)
        self.spatial_scale_x = self.analysis_width / max(self.config.spatial.frame_width, 1)
        self.spatial_scale_y = self.analysis_height / max(self.config.spatial.frame_height, 1)

        marker_ranges = [(entry.lower, entry.upper) for entry in config.wheel.marker_hsv_ranges]
        vlm_cfg = config.health.vlm
        if self.config.runtime.low_memory_mode and self.config.runtime.profile.lower() == "rpi_zero2w":
            vlm_cfg = vlm_cfg.model_copy(update={"enabled": False})

        self._wheel_roi = self._scale_roi(config.wheel.roi)
        self._water_roi = self._scale_roi(config.inventory.water_roi)
        self._food_roi = self._scale_roi(config.inventory.food_roi)
        self._gnaw_roi = self._scale_roi(config.inventory.gnaw_roi)
        self._bedding_roi = self._scale_roi(config.environment.bedding_roi)

        scaled_fence = self._scale_polygon(config.spatial.fence_polygon)
        scaled_wheel_mask = self._scale_polygon(config.spatial.wheel_mask_polygon)
        scaled_zones = {name: self._scale_polygon(poly) for name, poly in config.spatial.zones.items()}
        self._spatial_bev_homography, spatial_fence, spatial_zones = self._build_spatial_bev(scaled_fence, scaled_zones)
        self._spatial_bev_enabled = self._spatial_bev_homography is not None
        self._spatial_bev_inverse_homography: Optional[np.ndarray] = None
        if self._spatial_bev_homography is not None:
            try:
                inv = np.linalg.inv(self._spatial_bev_homography)
                if np.isfinite(inv).all():
                    self._spatial_bev_inverse_homography = inv.astype(np.float32)
            except np.linalg.LinAlgError:
                self._spatial_bev_inverse_homography = None

        self.odometer = VirtualOdometer(
            wheel_diameter_cm=config.wheel.diameter_cm,
            marker_hsv_ranges=marker_ranges,
            min_rpm_for_running=config.wheel.min_rpm_for_running,
        )
        self.spatial = SpatialAnalyzer(
            frame_width=self.analysis_width,
            frame_height=self.analysis_height,
            zones=spatial_zones,
            fence_polygon=spatial_fence,
            wheel_mask_polygon=scaled_wheel_mask,
            motion_fence_polygon=scaled_fence,
            bev_homography=self._spatial_bev_homography,
        )
        self.health = VisualHealthScanner(
            baseline_body_area_px=max(1, int(config.health.baseline_body_area_px * self.video_scale_x * self.video_scale_y)),
            vlm_config=vlm_cfg,
        )
        self.inventory = InventoryWatcher(
            water_roi=self._water_roi,
            food_roi=self._food_roi,
            gnaw_roi=self._gnaw_roi,
            low_water_threshold=config.inventory.low_water_threshold,
            low_food_threshold=config.inventory.low_food_threshold,
            frame_shape=(self.analysis_height, self.analysis_width),
        )
        self.behavior = BehavioralLogger(
            hideout_polygon=spatial_zones.get("hideout_zone", spatial_fence),
        )
        self.environment = EnvironmentAnalyzer(
            low_light_threshold=config.environment.low_light_threshold,
            high_light_threshold=config.environment.high_light_threshold,
            hygiene_dark_ratio_threshold=config.environment.hygiene_dark_ratio_threshold,
            clutter_edge_threshold=config.environment.clutter_edge_threshold,
            bedding_roi=self._bedding_roi,
            max_history=max(120, config.runtime.max_frame_results),
        )

        self.motion_trigger: Optional[MotionTriggeredRecorder] = None
        if config.motion_trigger.enabled:
            self.motion_trigger = MotionTriggeredRecorder(
                downscale_width=config.motion_trigger.downscale_width,
                blur_kernel=config.motion_trigger.blur_kernel,
                diff_threshold=config.motion_trigger.diff_threshold,
                min_motion_ratio=config.motion_trigger.min_motion_ratio,
                start_trigger_frames=config.motion_trigger.start_trigger_frames,
                stop_trigger_frames=config.motion_trigger.stop_trigger_frames,
                min_capture_seconds=config.motion_trigger.min_capture_seconds,
                cool_down_seconds=config.motion_trigger.cool_down_seconds,
                output_dir=config.motion_trigger.output_dir,
                record_video=config.motion_trigger.record_video,
                output_fps=config.motion_trigger.output_fps,
                codec=config.motion_trigger.codec,
            )

        self.notifier = MacNotifier(command=config.alerts.mac_notifier_command)

        self._last_frame_ts: Optional[datetime] = None
        self._last_health_capture: Optional[datetime] = None
        self._frame_index = 0
        self._featured_candidates: List[Dict[str, Any]] = []
        self._featured_candidate_limit = 42
        self._analysis_frame_buffer: Optional[np.ndarray] = None

    @staticmethod
    def _order_quad(points: np.ndarray) -> np.ndarray:
        sums = points.sum(axis=1)
        diffs = np.diff(points, axis=1).reshape(-1)
        ordered = np.zeros((4, 2), dtype=np.float32)
        ordered[0] = points[np.argmin(sums)]  # top-left
        ordered[2] = points[np.argmax(sums)]  # bottom-right
        ordered[1] = points[np.argmin(diffs)]  # top-right
        ordered[3] = points[np.argmax(diffs)]  # bottom-left
        return ordered

    @staticmethod
    def _quad_is_valid(quad: np.ndarray) -> bool:
        if quad.shape != (4, 2):
            return False
        if not np.isfinite(quad).all():
            return False
        ordered = HamsterVisionPipeline._order_quad(quad.astype(np.float32))
        unique = np.unique(ordered.round(decimals=2), axis=0)
        if unique.shape[0] < 4:
            return False
        return abs(cv2.contourArea(ordered.astype(np.float32))) >= 20.0

    @staticmethod
    def _quad_boundary_error(quad: np.ndarray, boundary: np.ndarray) -> float:
        if not HamsterVisionPipeline._quad_is_valid(quad):
            return float("inf")

        src_quad = HamsterVisionPipeline._order_quad(quad.astype(np.float32))
        dst_quad = np.array(
            [
                [0.0, 0.0],
                [1.0, 0.0],
                [1.0, 1.0],
                [0.0, 1.0],
            ],
            dtype=np.float32,
        )
        homography = cv2.getPerspectiveTransform(src_quad, dst_quad)
        if not np.isfinite(homography).all():
            return float("inf")
        if abs(np.linalg.det(homography)) < 1e-9:
            return float("inf")

        src = boundary.astype(np.float32).reshape(-1, 1, 2)
        projected = cv2.perspectiveTransform(src, homography).reshape(-1, 2)
        if projected.shape[0] == 0 or not np.isfinite(projected).all():
            return float("inf")

        x = projected[:, 0]
        y = projected[:, 1]
        edge_distance = np.minimum.reduce([np.abs(x), np.abs(1.0 - x), np.abs(y), np.abs(1.0 - y)])
        outside_penalty = (
            np.maximum(0.0, -x)
            + np.maximum(0.0, x - 1.0)
            + np.maximum(0.0, -y)
            + np.maximum(0.0, y - 1.0)
        )
        # Blend average and tail error; heavily penalize boundary points outside the target rectangle.
        return float(np.mean(edge_distance) + np.percentile(edge_distance, 75) + np.mean(outside_penalty) * 2.5)

    @staticmethod
    def _quad_corner_anchor_error(quad: np.ndarray, boundary: np.ndarray) -> float:
        if not HamsterVisionPipeline._quad_is_valid(quad):
            return float("inf")
        if boundary.shape[0] < 3:
            return 0.0

        contour = boundary.astype(np.float32).reshape(-1, 1, 2)
        span = np.ptp(boundary.astype(np.float32), axis=0)
        norm = max(float(np.linalg.norm(span)), 1e-6)

        ordered = HamsterVisionPipeline._order_quad(quad.astype(np.float32))
        distances: List[float] = []
        for x, y in ordered:
            dist = cv2.pointPolygonTest(contour, (float(x), float(y)), True)
            distances.append(abs(float(dist)) / norm)
        return float(np.mean(distances))

    @staticmethod
    def _quad_perspective_ratio_error(quad: np.ndarray, boundary: np.ndarray) -> float:
        if not HamsterVisionPipeline._quad_is_valid(quad):
            return float("inf")
        if boundary.shape[0] < 4:
            return 0.0

        ordered = HamsterVisionPipeline._order_quad(quad.astype(np.float32))
        top_len = float(np.linalg.norm(ordered[1] - ordered[0]))
        bottom_len = float(np.linalg.norm(ordered[2] - ordered[3]))
        if top_len < 1e-6 or bottom_len < 1e-6:
            return float("inf")
        candidate_ratio = top_len / max(bottom_len, 1e-6)

        y_min = float(np.min(boundary[:, 1]))
        y_max = float(np.max(boundary[:, 1]))
        y_span = y_max - y_min
        if y_span < 1e-3:
            return 0.0

        band = max(2.0, y_span * 0.30)
        top_points = boundary[boundary[:, 1] <= y_min + band]
        bottom_points = boundary[boundary[:, 1] >= y_max - band]
        if top_points.shape[0] < 2 or bottom_points.shape[0] < 2:
            return 0.0

        top_width = float(np.max(top_points[:, 0]) - np.min(top_points[:, 0]))
        bottom_width = float(np.max(bottom_points[:, 0]) - np.min(bottom_points[:, 0]))
        if top_width < 1e-3 or bottom_width < 1e-3:
            return 0.0
        expected_ratio = top_width / max(bottom_width, 1e-6)

        # Compare in log domain to treat expansion/shrinkage symmetrically.
        return abs(float(np.log((candidate_ratio + 1e-4) / (expected_ratio + 1e-4))))

    @staticmethod
    def _quad_selection_error(quad: np.ndarray, boundary: np.ndarray) -> float:
        boundary_error = HamsterVisionPipeline._quad_boundary_error(quad, boundary)
        if not np.isfinite(boundary_error):
            return float("inf")

        corner_error = HamsterVisionPipeline._quad_corner_anchor_error(quad, boundary)
        ratio_error = HamsterVisionPipeline._quad_perspective_ratio_error(quad, boundary)
        if not np.isfinite(corner_error) or not np.isfinite(ratio_error):
            return float("inf")

        # Encourage perspective-consistent quads: corners should stay close to drawn fence edges,
        # and top/bottom width ratio should match camera tilt implied by fence points.
        return float(boundary_error + corner_error * 2.0 + ratio_error * 0.45)

    @staticmethod
    def _top_bottom_lr_quad(points: np.ndarray) -> Optional[np.ndarray]:
        if points.shape[0] < 4:
            return None

        y_min = float(np.min(points[:, 1]))
        y_max = float(np.max(points[:, 1]))
        y_span = y_max - y_min
        if y_span < 1e-3:
            return None

        band = max(2.0, y_span * 0.35)
        top_candidates = points[points[:, 1] <= y_min + band]
        bottom_candidates = points[points[:, 1] >= y_max - band]

        if top_candidates.shape[0] < 2:
            top_candidates = points[np.argsort(points[:, 1])[:2]]
        if bottom_candidates.shape[0] < 2:
            bottom_candidates = points[np.argsort(points[:, 1])[-2:]]

        top_left = top_candidates[np.argmin(top_candidates[:, 0])]
        top_right = top_candidates[np.argmax(top_candidates[:, 0])]
        bottom_left = bottom_candidates[np.argmin(bottom_candidates[:, 0])]
        bottom_right = bottom_candidates[np.argmax(bottom_candidates[:, 0])]

        quad = np.array([top_left, top_right, bottom_right, bottom_left], dtype=np.float32)
        ordered = HamsterVisionPipeline._order_quad(quad)
        if not HamsterVisionPipeline._quad_is_valid(ordered):
            return None
        return ordered

    def _polygon_to_quad(self, polygon: Sequence[Sequence[int]]) -> Optional[np.ndarray]:
        if len(polygon) < 3:
            return None
        pts = np.array(polygon, dtype=np.float32)
        if pts.ndim != 2 or pts.shape[1] != 2:
            return None

        hull = cv2.convexHull(pts).reshape(-1, 2) if pts.shape[0] >= 3 else pts
        boundary = hull if hull.shape[0] >= 4 else pts
        if boundary.shape[0] < 4:
            return None

        candidates: List[np.ndarray] = []
        seen: set[Tuple[float, ...]] = set()

        def push(candidate: Optional[np.ndarray]) -> None:
            if candidate is None:
                return
            ordered = self._order_quad(np.array(candidate, dtype=np.float32))
            if not self._quad_is_valid(ordered):
                return
            key = tuple(np.round(ordered.reshape(-1), 1).tolist())
            if key in seen:
                return
            seen.add(key)
            candidates.append(ordered)

        push(self._top_bottom_lr_quad(boundary))
        if boundary.shape[0] == 4:
            push(boundary)

        perimeter = float(cv2.arcLength(boundary.reshape(-1, 1, 2), True))
        if perimeter > 1e-6:
            for ratio in np.linspace(0.01, 0.14, 16):
                approx = cv2.approxPolyDP(boundary.reshape(-1, 1, 2), perimeter * float(ratio), True).reshape(-1, 2)
                if approx.shape[0] == 4:
                    push(approx)

        sums = boundary.sum(axis=1)
        diffs = np.diff(boundary, axis=1).reshape(-1)
        push(
            np.array(
                [
                    boundary[np.argmin(sums)],
                    boundary[np.argmin(diffs)],
                    boundary[np.argmax(sums)],
                    boundary[np.argmax(diffs)],
                ],
                dtype=np.float32,
            )
        )

        rect = cv2.minAreaRect(boundary)
        push(cv2.boxPoints(rect))

        if not candidates:
            return None

        return min(candidates, key=lambda quad: self._quad_selection_error(quad, boundary))

    def _transform_polygon(self, polygon: Sequence[Sequence[int]], matrix: np.ndarray) -> List[Tuple[int, int]]:
        if len(polygon) < 3:
            return [(int(p[0]), int(p[1])) for p in polygon]

        src = np.array(polygon, dtype=np.float32).reshape(-1, 1, 2)
        projected = cv2.perspectiveTransform(src, matrix).reshape(-1, 2)
        out: List[Tuple[int, int]] = []
        for x, y in projected:
            px = int(round(np.clip(float(x), 0, self.analysis_width - 1)))
            py = int(round(np.clip(float(y), 0, self.analysis_height - 1)))
            out.append((px, py))
        unique = list(dict.fromkeys(out))
        return unique

    def _build_spatial_bev(
        self,
        scaled_fence: List[Tuple[int, int]],
        scaled_zones: Dict[str, List[Tuple[int, int]]],
    ) -> Tuple[Optional[np.ndarray], List[Tuple[int, int]], Dict[str, List[Tuple[int, int]]]]:
        src_quad = self._polygon_to_quad(scaled_fence)
        if src_quad is None:
            return None, scaled_fence, scaled_zones

        dst_quad = np.array(
            [
                [0.0, 0.0],
                [float(self.analysis_width - 1), 0.0],
                [float(self.analysis_width - 1), float(self.analysis_height - 1)],
                [0.0, float(self.analysis_height - 1)],
            ],
            dtype=np.float32,
        )
        homography = cv2.getPerspectiveTransform(src_quad, dst_quad)
        if not np.isfinite(homography).all():
            return None, scaled_fence, scaled_zones
        if abs(np.linalg.det(homography)) < 1e-9:
            return None, scaled_fence, scaled_zones

        bev_fence = [(int(round(x)), int(round(y))) for x, y in dst_quad]

        bev_zones: Dict[str, List[Tuple[int, int]]] = {}
        for name, polygon in scaled_zones.items():
            transformed = self._transform_polygon(polygon, homography)
            bev_zones[name] = transformed if len(transformed) >= 3 else polygon
        return homography, bev_fence, bev_zones

    def _analysis_size(self) -> Tuple[int, int]:
        base_width = max(self.config.video.frame_width, self.config.spatial.frame_width)
        base_height = max(self.config.video.frame_height, self.config.spatial.frame_height)
        width = int(base_width * self.config.runtime.analysis_scale)
        height = int(base_height * self.config.runtime.analysis_scale)

        width = min(max(width, 64), self.config.runtime.max_analysis_width)
        height = min(max(height, 64), self.config.runtime.max_analysis_height)
        return width, height

    def _scale_roi(self, roi: Sequence[int]) -> List[int]:
        x, y, w, h = roi
        return [
            int(round(x * self.video_scale_x)),
            int(round(y * self.video_scale_y)),
            max(1, int(round(w * self.video_scale_x))),
            max(1, int(round(h * self.video_scale_y))),
        ]

    def _scale_polygon(self, polygon: Sequence[Sequence[int]]) -> List[Tuple[int, int]]:
        result = []
        for x, y in polygon:
            result.append((int(round(x * self.spatial_scale_x)), int(round(y * self.spatial_scale_y))))
        return result

    def _to_original_point(self, point: Optional[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
        if point is None:
            return None
        x = int(round(point[0] / max(self.spatial_scale_x, 1e-6)))
        y = int(round(point[1] / max(self.spatial_scale_y, 1e-6)))
        return x, y

    def _prepare_frame(self, frame: np.ndarray) -> np.ndarray:
        if frame.shape[1] == self.analysis_width and frame.shape[0] == self.analysis_height:
            return frame
        target_shape = (self.analysis_height, self.analysis_width, *frame.shape[2:])
        if (
            self._analysis_frame_buffer is None
            or self._analysis_frame_buffer.shape != target_shape
            or self._analysis_frame_buffer.dtype != frame.dtype
        ):
            self._analysis_frame_buffer = np.empty(target_shape, dtype=frame.dtype)
        return cv2.resize(
            frame,
            (self.analysis_width, self.analysis_height),
            dst=self._analysis_frame_buffer,
            interpolation=cv2.INTER_AREA,
        )

    def _analysis_to_camera_point(self, point: Tuple[float, float]) -> Optional[Tuple[float, float]]:
        if not self._spatial_bev_enabled or self._spatial_bev_inverse_homography is None:
            x = float(np.clip(point[0], 0, self.analysis_width - 1))
            y = float(np.clip(point[1], 0, self.analysis_height - 1))
            return (x, y)

        src = np.array([[[float(point[0]), float(point[1])]]], dtype=np.float32)
        projected = cv2.perspectiveTransform(src, self._spatial_bev_inverse_homography)
        x_f, y_f = float(projected[0, 0, 0]), float(projected[0, 0, 1])
        if not np.isfinite(x_f) or not np.isfinite(y_f):
            return None
        x = float(np.clip(x_f, 0, self.analysis_width - 1))
        y = float(np.clip(y_f, 0, self.analysis_height - 1))
        return (x, y)

    def _collect_featured_candidate(self, frame: np.ndarray, payload: Dict[str, object], video_second: float) -> None:
        candidate = self._extract_featured_candidate(frame=frame, payload=payload, video_second=video_second)
        if candidate is None:
            return
        self._featured_candidates.append(candidate)
        self._prune_featured_candidates()

    def _extract_featured_candidate(
        self,
        frame: np.ndarray,
        payload: Dict[str, object],
        video_second: float,
    ) -> Optional[Dict[str, Any]]:
        if payload.get("skipped"):
            return None

        spatial = payload.get("spatial")
        if not isinstance(spatial, dict):
            return None
        if bool(spatial.get("escape_detected", False)):
            return None

        raw_h, raw_w = frame.shape[:2]
        if raw_w < 64 or raw_h < 64:
            return None

        centroid_camera: Optional[Tuple[float, float]] = None
        camera_centroid_value = spatial.get("camera_centroid")
        if (
            isinstance(camera_centroid_value, (list, tuple, np.ndarray))
            and len(camera_centroid_value) == 2
        ):
            try:
                cx_cam = float(camera_centroid_value[0])
                cy_cam = float(camera_centroid_value[1])
                if np.isfinite(cx_cam) and np.isfinite(cy_cam):
                    centroid_camera = (cx_cam, cy_cam)
            except (TypeError, ValueError):
                centroid_camera = None

        if centroid_camera is None:
            centroid_value = spatial.get("centroid")
            if (
                not isinstance(centroid_value, (list, tuple, np.ndarray))
                or len(centroid_value) != 2
            ):
                return None
            try:
                cx_out = float(centroid_value[0])
                cy_out = float(centroid_value[1])
            except (TypeError, ValueError):
                return None
            if self._spatial_bev_enabled:
                centroid_scaled = (cx_out, cy_out)
            else:
                centroid_scaled = (cx_out * self.spatial_scale_x, cy_out * self.spatial_scale_y)
            centroid_camera = self._analysis_to_camera_point(centroid_scaled)
            if centroid_camera is None:
                return None

        raw_cx = float(np.clip(centroid_camera[0] * raw_w / max(self.analysis_width, 1), 0, raw_w - 1))
        raw_cy = float(np.clip(centroid_camera[1] * raw_h / max(self.analysis_height, 1), 0, raw_h - 1))

        raw_scale_x = raw_w / max(self.analysis_width, 1)
        raw_scale_y = raw_h / max(self.analysis_height, 1)
        raw_scale = min(raw_scale_x, raw_scale_y)

        bbox_camera_value = spatial.get("camera_bbox")
        raw_bbox: Optional[Tuple[float, float, float, float]] = None
        bbox_w_raw = 0.0
        bbox_h_raw = 0.0
        tracked_area = float(spatial.get("tracked_area", 0.0) or 0.0)
        contour_density = 0.0
        if (
            isinstance(bbox_camera_value, (list, tuple, np.ndarray))
            and len(bbox_camera_value) == 4
        ):
            try:
                bx = float(bbox_camera_value[0])
                by = float(bbox_camera_value[1])
                bw = float(bbox_camera_value[2])
                bh = float(bbox_camera_value[3])
                if bw > 1.0 and bh > 1.0:
                    bx = float(np.clip(bx, 0.0, self.analysis_width - 1.0))
                    by = float(np.clip(by, 0.0, self.analysis_height - 1.0))
                    bw = float(np.clip(bw, 1.0, self.analysis_width - bx))
                    bh = float(np.clip(bh, 1.0, self.analysis_height - by))
                    bbox_w_raw = max(1.0, bw * raw_scale_x)
                    bbox_h_raw = max(1.0, bh * raw_scale_y)
                    rbx1 = float(np.clip(bx * raw_scale_x, 0.0, raw_w - 1.0))
                    rby1 = float(np.clip(by * raw_scale_y, 0.0, raw_h - 1.0))
                    rbx2 = float(np.clip(rbx1 + bbox_w_raw, 1.0, raw_w))
                    rby2 = float(np.clip(rby1 + bbox_h_raw, 1.0, raw_h))
                    raw_bbox = (rbx1, rby1, rbx2, rby2)
                    contour_density = tracked_area / max(bw * bh, 1.0)
            except (TypeError, ValueError):
                raw_bbox = None

        active_pixels = float(spatial.get("active_pixels", 0.0) or 0.0)
        active_radius = np.sqrt(max(active_pixels, 1.0) / np.pi)

        min_side = min(raw_w, raw_h)
        aspect_w_over_h = 0.72
        h_floor = max(112.0, min_side * 0.2)
        h_ceiling = max(h_floor, min_side * 0.58)
        if raw_bbox is not None:
            subject_span = max(bbox_w_raw, bbox_h_raw)
            suggested_h = max(min_side * 0.22, subject_span * 3.0)
        else:
            suggested_h = max(min_side * 0.25, active_radius * raw_scale * 5.8)
        crop_h = int(round(np.clip(suggested_h, h_floor, h_ceiling)))
        crop_w = int(round(crop_h * aspect_w_over_h))
        if crop_w < 78 or crop_h < 102:
            return None

        x1 = int(np.clip(round(raw_cx - crop_w / 2.0), 0, raw_w - crop_w))
        y1 = int(np.clip(round(raw_cy - crop_h / 2.0), 0, raw_h - crop_h))
        x2 = x1 + crop_w
        y2 = y1 + crop_h
        if x2 > raw_w or y2 > raw_h:
            return None

        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        gradient = cv2.magnitude(sobel_x, sobel_y)
        lap_abs = np.abs(cv2.Laplacian(gray, cv2.CV_32F))

        local_cx = float(np.clip(raw_cx - x1, 0, crop_w - 1))
        local_cy = float(np.clip(raw_cy - y1, 0, crop_h - 1))
        subject_mask = np.zeros(gray.shape, dtype=np.uint8)

        if raw_bbox is not None:
            rbx1, rby1, rbx2, rby2 = raw_bbox
            lbx1 = int(np.clip(np.floor(rbx1 - x1), 0, crop_w - 1))
            lby1 = int(np.clip(np.floor(rby1 - y1), 0, crop_h - 1))
            lbx2 = int(np.clip(np.ceil(rbx2 - x1), 1, crop_w))
            lby2 = int(np.clip(np.ceil(rby2 - y1), 1, crop_h))
            if lbx2 > lbx1 + 4 and lby2 > lby1 + 4:
                axis_x = int(np.clip(round((lbx2 - lbx1) * 0.56), 12, crop_w * 0.44))
                axis_y = int(np.clip(round((lby2 - lby1) * 0.62), 14, crop_h * 0.48))
                center = (int(round((lbx1 + lbx2) / 2.0)), int(round((lby1 + lby2) / 2.0)))
                cv2.ellipse(subject_mask, center, (axis_x, axis_y), 0, 0, 360, 255, thickness=-1)
                inner_pad_x = max(2, int(round((lbx2 - lbx1) * 0.15)))
                inner_pad_y = max(2, int(round((lby2 - lby1) * 0.15)))
                ix1 = int(np.clip(lbx1 + inner_pad_x, 0, crop_w - 1))
                iy1 = int(np.clip(lby1 + inner_pad_y, 0, crop_h - 1))
                ix2 = int(np.clip(lbx2 - inner_pad_x, 1, crop_w))
                iy2 = int(np.clip(lby2 - inner_pad_y, 1, crop_h))
                if ix2 > ix1 and iy2 > iy1:
                    cv2.rectangle(subject_mask, (ix1, iy1), (ix2, iy2), 255, thickness=-1)

        min_subject_pixels = max(320, int(crop_w * crop_h * 0.018))
        if int(np.count_nonzero(subject_mask)) < min_subject_pixels:
            fallback_radius = int(
                np.clip(
                    max(active_radius * raw_scale * 1.45, min(crop_w, crop_h) * 0.14),
                    16.0,
                    min(crop_w, crop_h) * 0.32,
                )
            )
            cv2.circle(
                subject_mask,
                (int(round(local_cx)), int(round(local_cy))),
                fallback_radius,
                255,
                thickness=-1,
            )

        subject_idx = subject_mask > 0
        subject_pixels = int(np.count_nonzero(subject_idx))
        if subject_pixels < 220:
            return None

        subject_gray = gray[subject_idx]
        subject_grad = gradient[subject_idx]
        subject_lap = lap_abs[subject_idx]
        if subject_gray.size == 0 or subject_grad.size == 0 or subject_lap.size == 0:
            return None

        bg_grad = gradient[~subject_idx]
        if bg_grad.size == 0:
            bg_grad = np.array([1e-3], dtype=np.float32)

        lap_p80 = float(np.percentile(subject_lap, 80))
        grad_p88 = float(np.percentile(subject_grad, 88))
        bg_grad_p80 = float(np.percentile(bg_grad, 80))
        contrast = float(np.std(subject_gray))

        sharp_score = float(np.clip(lap_p80 / 24.0, 0.0, 1.0))
        detail_score = float(np.clip(grad_p88 / 72.0, 0.0, 1.0))
        focus_ratio = (grad_p88 + 1e-3) / max(bg_grad_p80, 1e-3)
        focus_score = float(np.clip((focus_ratio - 0.92) / 0.72, 0.0, 1.0))
        contrast_score = float(np.clip(contrast / 48.0, 0.0, 1.0))

        brightness = float(np.mean(subject_gray))
        dark_ratio = float(np.mean(subject_gray < 24))
        bright_ratio = float(np.mean(subject_gray > 232))
        exposure_score = float(np.clip(1.0 - (dark_ratio + bright_ratio) * 1.65, 0.0, 1.0))
        brightness_score = float(max(0.0, 1.0 - abs(brightness - 138.0) / 102.0))

        coverage = subject_pixels / max(crop_w * crop_h, 1)
        size_score = float(np.clip(1.0 - abs(coverage - 0.20) / 0.20, 0.0, 1.0))
        contour_conf_score = float(np.clip((contour_density - 0.09) / 0.62, 0.0, 1.0))

        center_dx = abs(raw_cx - raw_w / 2.0) / max(raw_w, 1)
        center_dy = abs(raw_cy - raw_h / 2.0) / max(raw_h, 1)
        center_score = float(np.clip(1.0 - np.hypot(center_dx, center_dy) / 0.56, 0.0, 1.0))
        edge_gap = min(raw_cx, raw_cy, raw_w - 1 - raw_cx, raw_h - 1 - raw_cy)
        edge_score = float(np.clip(edge_gap / max(crop_h * 0.20, 1.0), 0.0, 1.0))

        if sharp_score < 0.18 and detail_score < 0.2:
            return None
        if focus_score < 0.06 and contour_conf_score < 0.14:
            return None
        if exposure_score < 0.08:
            return None

        base_score = (
            sharp_score * 0.31
            + detail_score * 0.22
            + focus_score * 0.17
            + contrast_score * 0.08
            + exposure_score * 0.08
            + brightness_score * 0.06
            + contour_conf_score * 0.05
            + size_score * 0.02
            + edge_score * 0.01
        )
        base_score *= 0.95 + 0.05 * center_score
        base_score = float(np.clip(base_score, 0.0, 1.0))

        target_h = min(500, crop_h)
        target_w = int(round(target_h * aspect_w_over_h))
        if crop_w != target_w or crop_h != target_h:
            crop = cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_AREA)

        ok, encoded = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 93])
        if not ok:
            return None
        image_b64 = base64.b64encode(encoded.tobytes()).decode("ascii")

        candidate_id = f"f{int(round(video_second * 1000)):09d}_{self._frame_index:07d}"
        feature_vector = [
            round(sharp_score, 6),
            round(detail_score, 6),
            round(focus_score, 6),
            round(exposure_score, 6),
            round(brightness_score, 6),
            round(size_score, 6),
            round(contour_conf_score, 6),
            round(center_score, 6),
        ]

        return {
            "candidate_id": candidate_id,
            "timestamp": str(payload.get("timestamp", "")),
            "video_second": round(float(video_second), 3),
            "score": round(float(base_score), 6),
            "width": int(crop.shape[1]),
            "height": int(crop.shape[0]),
            "image_b64": image_b64,
            "feature_vector": feature_vector,
        }

    def _prune_featured_candidates(self) -> None:
        if not self._featured_candidates:
            return

        ranked = sorted(self._featured_candidates, key=lambda item: float(item.get("score", 0.0)), reverse=True)
        selected: List[Dict[str, Any]] = []
        min_seconds_gap = 0.9

        for candidate in ranked:
            sec = float(candidate.get("video_second", 0.0))
            too_close = any(abs(sec - float(item.get("video_second", 0.0))) < min_seconds_gap for item in selected)
            if too_close and len(selected) >= 8:
                continue
            selected.append(candidate)
            if len(selected) >= self._featured_candidate_limit:
                break

        self._featured_candidates = selected

    def _featured_photo_payload(self) -> Optional[Dict[str, object]]:
        if not self._featured_candidates:
            return None
        best = max(self._featured_candidates, key=lambda item: float(item.get("score", 0.0)))
        return {
            "candidate_id": str(best.get("candidate_id", "")),
            "timestamp": str(best.get("timestamp", "")),
            "score": round(float(best.get("score", 0.0)), 4),
            "width": int(best.get("width", 0)),
            "height": int(best.get("height", 0)),
            "image_b64": str(best.get("image_b64", "")),
        }

    def _featured_photo_candidates_payload(self, limit: int = 24) -> List[Dict[str, object]]:
        if not self._featured_candidates:
            return []
        ranked = sorted(self._featured_candidates, key=lambda item: float(item.get("score", 0.0)), reverse=True)
        out: List[Dict[str, object]] = []
        for candidate in ranked[: max(limit, 1)]:
            out.append(
                {
                    "candidate_id": str(candidate.get("candidate_id", "")),
                    "timestamp": str(candidate.get("timestamp", "")),
                    "video_second": float(candidate.get("video_second", 0.0)),
                    "score": round(float(candidate.get("score", 0.0)), 6),
                    "width": int(candidate.get("width", 0)),
                    "height": int(candidate.get("height", 0)),
                    "image_b64": str(candidate.get("image_b64", "")),
                    "feature_vector": [
                        float(v)
                        for v in candidate.get("feature_vector", [])
                        if isinstance(v, (int, float))
                    ],
                }
            )
        return out

    def _dt_seconds(self, timestamp: datetime) -> float:
        if self._last_frame_ts is None:
            self._last_frame_ts = timestamp
            return 1.0 / max(self.config.video.fps, 1)

        dt = max((timestamp - self._last_frame_ts).total_seconds(), 1e-3)
        self._last_frame_ts = timestamp
        return dt

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp: datetime,
        action_probs: Optional[Dict[str, float]] = None,
        transfer_points: Optional[Iterable[Tuple[int, int]]] = None,
        keypoints: Optional[Iterable[Dict[str, float]]] = None,
    ) -> Dict[str, object]:
        self._frame_index += 1
        analysis_frame = self._prepare_frame(frame)

        motion_payload = None
        should_analyze = True
        if self.motion_trigger is not None:
            motion_state = self.motion_trigger.update(analysis_frame, timestamp)
            motion_payload = motion_state.to_dict()
            if not self.always_analyze:
                should_analyze = motion_state.capture_active or motion_state.is_motion or motion_state.start_capture

        if not should_analyze:
            return {
                "timestamp": timestamp.isoformat(),
                "skipped": True,
                "motion": motion_payload,
            }

        dt = self._dt_seconds(timestamp)

        odometer_metrics = self.odometer.update(analysis_frame, timestamp, self._wheel_roi).to_dict()
        spatial_metrics = self.spatial.update(analysis_frame, timestamp, dt).to_dict()

        centroid_scaled = tuple(spatial_metrics["centroid"]) if spatial_metrics["centroid"] else None
        centroid_output = centroid_scaled if self._spatial_bev_enabled else self._to_original_point(centroid_scaled)

        behavior_metrics = self.behavior.update(
            timestamp=timestamp,
            dt_seconds=dt,
            centroid=centroid_scaled,
            action_probs=action_probs,
        ).to_dict()

        scaled_transfer_points = None
        if transfer_points is not None:
            scaled_transfer_points = [
                (
                    int(round(point[0] * self.video_scale_x)),
                    int(round(point[1] * self.video_scale_y)),
                )
                for point in transfer_points
            ]

        inventory_metrics = self.inventory.update(
            frame=analysis_frame,
            timestamp=timestamp,
            transfer_points=scaled_transfer_points,
        ).to_dict()

        environment_metrics = None
        if self.config.environment.enabled and self._frame_index % self.config.environment.sample_every_nth_frame == 0:
            environment_metrics = self.environment.update(analysis_frame, timestamp).to_dict()

        if spatial_metrics["escape_detected"] and self.config.alerts.escape_enabled:
            self.notifier.notify(
                title="HamsterPi Escape Alert",
                subtitle="Virtual Fence Breach",
                message=f"Hamster detected outside fence at {timestamp.isoformat()}",
            )

        health_metrics = None
        if self._last_health_capture is None or (
            timestamp - self._last_health_capture
        ).total_seconds() >= self.config.health.capture_interval_seconds:
            health_metrics = self.health.analyze(
                image=analysis_frame,
                timestamp=timestamp,
                keypoints=keypoints,
            ).to_dict()
            self._last_health_capture = timestamp

        return {
            "timestamp": timestamp.isoformat(),
            "skipped": False,
            "motion": motion_payload,
            "odometer": odometer_metrics,
            "spatial": {
                **spatial_metrics,
                "centroid": centroid_output,
            },
            "behavior": behavior_metrics,
            "inventory": inventory_metrics,
            "environment": environment_metrics,
            "health": health_metrics,
        }

    def _frame_step(self, source_fps: float) -> int:
        if source_fps <= 0:
            return self.config.runtime.process_every_nth_frame

        fps_step = max(1, int(round(source_fps / max(self.config.runtime.max_fps, 1))))
        return max(self.config.runtime.process_every_nth_frame, fps_step)

    def process_video(
        self,
        video_path: str | Path,
        max_frames: Optional[int] = None,
    ) -> Dict[str, object]:
        wall_start = time.perf_counter()
        LOGGER.info(
            "Pipeline process_video started",
            extra={"context": {"video_path": str(video_path), "max_frames": max_frames}},
        )
        cap, orientation = open_video_capture(video_path)
        if not cap.isOpened():
            LOGGER.error(
                "Pipeline failed to open video",
                extra={"context": {"video_path": str(video_path)}},
            )
            raise RuntimeError(f"Failed to open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or self.config.video.fps or 10
        step = self._frame_step(fps)
        start_time = datetime.now()

        max_items = self.config.runtime.max_frame_results if self.config.runtime.low_memory_mode else 5000
        frames: Deque[Dict[str, object]] = deque(maxlen=max_items)

        frame_idx = 0
        processed_count = 0
        analyzed_count = 0
        skipped_count = 0

        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frame = apply_video_orientation(frame, orientation)

                if frame_idx % step != 0:
                    frame_idx += 1
                    continue

                timestamp = start_time + timedelta(seconds=frame_idx / fps)
                payload = self.process_frame(frame=frame, timestamp=timestamp)
                video_second = float(frame_idx / max(fps, 1e-6))
                self._collect_featured_candidate(
                    frame=frame,
                    payload=payload,
                    video_second=video_second,
                )

                processed_count += 1
                if payload.get("skipped"):
                    skipped_count += 1
                else:
                    analyzed_count += 1

                if (
                    not self.config.runtime.low_memory_mode
                    or not payload.get("skipped")
                    or (payload.get("motion") or {}).get("start_capture")
                    or (payload.get("motion") or {}).get("stop_capture")
                ):
                    frames.append(payload)

                frame_idx += 1
                if max_frames is not None and frame_idx >= max_frames:
                    break
        finally:
            cap.release()
            if self.motion_trigger is not None:
                self.motion_trigger.close()

        trajectory = self.spatial.trajectory()
        if self.config.runtime.low_memory_mode and len(trajectory) > max_items:
            trajectory = trajectory[-max_items:]

        total_elapsed_s = max(time.perf_counter() - wall_start, 1e-9)
        total_elapsed_ms = total_elapsed_s * 1000.0
        processed_fps = processed_count / total_elapsed_s
        analyzed_fps = analyzed_count / total_elapsed_s
        avg_frame_ms = total_elapsed_ms / max(processed_count, 1)

        LOGGER.info(
            "Pipeline process_video completed",
            extra={
                "context": {
                    "video_path": str(video_path),
                    "source_fps": round(float(fps), 3),
                    "frame_step": step,
                    "orientation_meta": int(orientation.metadata_angle),
                    "orientation_auto": bool(orientation.auto_enabled),
                    "orientation_manual": int(orientation.manual_angle),
                    "processed_count": processed_count,
                    "analyzed_count": analyzed_count,
                    "skipped_count": skipped_count,
                }
            },
        )
        LOGGER.info(
            "[PERF] process_video",
            extra={
                "context": {
                    "is_perf": True,
                    "perf_category": "pipeline",
                    "video_path": str(video_path),
                    "max_frames": max_frames,
                    "processed_count": processed_count,
                    "analyzed_count": analyzed_count,
                    "skipped_count": skipped_count,
                    "elapsed_ms": round(float(total_elapsed_ms), 3),
                    "avg_frame_ms": round(float(avg_frame_ms), 3),
                    "processed_fps": round(float(processed_fps), 3),
                    "analyzed_fps": round(float(analyzed_fps), 3),
                    "frame_step": step,
                    "source_fps": round(float(fps), 3),
                }
            },
        )

        return {
            "frames": list(frames),
            "summary": {
                "source_fps": round(float(fps), 3),
                "frame_step": step,
                "processed_count": processed_count,
                "analyzed_count": analyzed_count,
                "skipped_count": skipped_count,
                "analysis_width": self.analysis_width,
                "analysis_height": self.analysis_height,
                "spatial_bev_enabled": self._spatial_bev_enabled,
                "spatial": self.spatial.summary(),
                "zone_dwell": self.spatial.zone_dwell_seconds(),
                "trajectory": trajectory,
                "heatmap": self.spatial.heatmap(),
                "featured_photo": self._featured_photo_payload(),
                "featured_photo_candidates": self._featured_photo_candidates_payload(limit=24),
                "schedule": self.behavior.schedule_summary(),
                "environment": self.environment.summary(),
                "environment_history": self.environment.history(),
                "motion_segments": self.motion_trigger.segments() if self.motion_trigger else [],
            },
        }
