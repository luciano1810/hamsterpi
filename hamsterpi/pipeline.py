from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Deque, Dict, Iterable, List, Optional, Sequence, Tuple

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

        # Degenerate selection (e.g., same point picked twice) should fallback.
        unique = np.unique(quad.round(decimals=2), axis=0)
        if unique.shape[0] < 4:
            return None

        if abs(cv2.contourArea(quad.astype(np.float32))) < 20.0:
            return None
        return quad

    def _polygon_to_quad(self, polygon: Sequence[Sequence[int]]) -> Optional[np.ndarray]:
        if len(polygon) < 3:
            return None
        pts = np.array(polygon, dtype=np.float32)

        hull = cv2.convexHull(pts).reshape(-1, 2)
        candidate = self._top_bottom_lr_quad(hull if hull.shape[0] >= 4 else pts)
        if candidate is not None:
            return candidate

        # Fallback: keep previous ordering strategy from rectangle approximation.
        rect = cv2.minAreaRect(pts)
        quad = cv2.boxPoints(rect)
        ordered = self._order_quad(np.array(quad, dtype=np.float32))
        if abs(cv2.contourArea(ordered.astype(np.float32))) < 20.0:
            return None
        return ordered

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

        bev_fence = self._transform_polygon(scaled_fence, homography)
        if len(bev_fence) < 3:
            return None, scaled_fence, scaled_zones

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
        return cv2.resize(frame, (self.analysis_width, self.analysis_height), interpolation=cv2.INTER_AREA)

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
                "schedule": self.behavior.schedule_summary(),
                "environment": self.environment.summary(),
                "environment_history": self.environment.history(),
                "motion_segments": self.motion_trigger.segments() if self.motion_trigger else [],
            },
        }
