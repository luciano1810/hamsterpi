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

LOGGER = get_logger(__name__)


class HamsterVisionPipeline:
    """Unified real-video processing optimized for Raspberry Pi Zero 2W."""

    def __init__(self, config: SystemConfig) -> None:
        self.config = config

        self.analysis_width, self.analysis_height = self._analysis_size()
        self.scale_x = self.analysis_width / max(self.config.video.frame_width, 1)
        self.scale_y = self.analysis_height / max(self.config.video.frame_height, 1)

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

        self.odometer = VirtualOdometer(
            wheel_diameter_cm=config.wheel.diameter_cm,
            marker_hsv_ranges=marker_ranges,
            min_rpm_for_running=config.wheel.min_rpm_for_running,
        )
        self.spatial = SpatialAnalyzer(
            frame_width=self.analysis_width,
            frame_height=self.analysis_height,
            zones=scaled_zones,
            fence_polygon=scaled_fence,
            wheel_mask_polygon=scaled_wheel_mask,
        )
        self.health = VisualHealthScanner(
            baseline_body_area_px=max(1, int(config.health.baseline_body_area_px * self.scale_x * self.scale_y)),
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
            hideout_polygon=scaled_zones.get("hideout_zone", scaled_fence),
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

    def _analysis_size(self) -> Tuple[int, int]:
        width = int(self.config.video.frame_width * self.config.runtime.analysis_scale)
        height = int(self.config.video.frame_height * self.config.runtime.analysis_scale)

        width = min(max(width, 64), self.config.runtime.max_analysis_width)
        height = min(max(height, 64), self.config.runtime.max_analysis_height)
        return width, height

    def _scale_roi(self, roi: Sequence[int]) -> List[int]:
        x, y, w, h = roi
        return [
            int(round(x * self.scale_x)),
            int(round(y * self.scale_y)),
            max(1, int(round(w * self.scale_x))),
            max(1, int(round(h * self.scale_y))),
        ]

    def _scale_polygon(self, polygon: Sequence[Sequence[int]]) -> List[Tuple[int, int]]:
        result = []
        for x, y in polygon:
            result.append((int(round(x * self.scale_x)), int(round(y * self.scale_y))))
        return result

    def _to_original_point(self, point: Optional[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
        if point is None:
            return None
        x = int(round(point[0] / max(self.scale_x, 1e-6)))
        y = int(round(point[1] / max(self.scale_y, 1e-6)))
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
        centroid_original = self._to_original_point(centroid_scaled)

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
                    int(round(point[0] * self.scale_x)),
                    int(round(point[1] * self.scale_y)),
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
                "centroid": centroid_original,
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
        cap = cv2.VideoCapture(str(video_path))
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
