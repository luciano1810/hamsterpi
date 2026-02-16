from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Iterable, List, Optional, Sequence, Tuple

import cv2
import numpy as np


@dataclass
class InventoryMetrics:
    timestamp: str
    water_level_ratio: float
    food_coverage_ratio: float
    gnaw_wear_index: float
    hoard_hotspots: List[dict]
    alerts: List[str]

    def to_dict(self) -> dict:
        return asdict(self)


class InventoryWatcher:
    """Monitor water, food, food-hoarding, and gnaw-object wear from image regions."""

    def __init__(
        self,
        water_roi: Sequence[int],
        food_roi: Sequence[int],
        gnaw_roi: Sequence[int],
        low_water_threshold: float,
        low_food_threshold: float,
        frame_shape: Tuple[int, int],
    ) -> None:
        self.water_roi = water_roi
        self.food_roi = food_roi
        self.gnaw_roi = gnaw_roi
        self.low_water_threshold = low_water_threshold
        self.low_food_threshold = low_food_threshold
        self._baseline_gnaw_patch: Optional[np.ndarray] = None
        self._hoard_map = np.zeros(frame_shape, dtype=np.float32)

    @staticmethod
    def _crop(frame: np.ndarray, roi: Sequence[int]) -> np.ndarray:
        x, y, w, h = roi
        return frame[y : y + h, x : x + w]

    @staticmethod
    def _clamp(value: float) -> float:
        return max(0.0, min(1.0, value))

    def _estimate_water_level(self, frame: np.ndarray) -> float:
        patch = self._crop(frame, self.water_roi)
        if patch.size == 0:
            return 0.0

        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        smooth = cv2.GaussianBlur(gray, (5, 5), 0)
        vertical_profile = np.mean(smooth, axis=1)
        grad = np.abs(np.gradient(vertical_profile))
        line_idx = int(np.argmax(grad))

        # Ratio is top-to-bottom fullness estimate.
        level = 1.0 - (line_idx / max(1, patch.shape[0] - 1))
        return self._clamp(float(level))

    def _estimate_food_coverage(self, frame: np.ndarray) -> float:
        patch = self._crop(frame, self.food_roi)
        if patch.size == 0:
            return 0.0

        hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        grain_like = ((sat > 40) & (val > 45)).astype(np.uint8) * 255
        grain_like = cv2.morphologyEx(grain_like, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)
        return self._clamp(float(np.count_nonzero(grain_like)) / float(grain_like.size))

    def _estimate_gnaw_wear(self, frame: np.ndarray) -> float:
        patch = self._crop(frame, self.gnaw_roi)
        if patch.size == 0:
            return 0.0

        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        if self._baseline_gnaw_patch is None:
            self._baseline_gnaw_patch = gray.copy()
            return 0.0

        diff = cv2.absdiff(self._baseline_gnaw_patch, gray)
        wear = float(np.mean(diff)) / 255.0
        return self._clamp(wear)

    def _update_hoard_map(self, transfer_points: Optional[Iterable[Tuple[int, int]]]) -> None:
        if not transfer_points:
            return

        for x, y in transfer_points:
            if 0 <= y < self._hoard_map.shape[0] and 0 <= x < self._hoard_map.shape[1]:
                self._hoard_map[y, x] += 1.0

        self._hoard_map = cv2.GaussianBlur(self._hoard_map, (11, 11), 0)

    def _top_hoard_hotspots(self, top_k: int = 3) -> List[dict]:
        if float(np.max(self._hoard_map)) <= 0.0:
            return []

        flat = self._hoard_map.reshape(-1)
        top_indices = np.argpartition(flat, -top_k)[-top_k:]
        top_indices = top_indices[np.argsort(flat[top_indices])[::-1]]

        hotspots = []
        max_value = float(np.max(self._hoard_map))
        width = self._hoard_map.shape[1]
        for idx in top_indices:
            y = int(idx // width)
            x = int(idx % width)
            hotspots.append(
                {
                    "x": x,
                    "y": y,
                    "intensity": round(float(flat[idx]) / max_value, 4),
                }
            )
        return hotspots

    def update(
        self,
        frame: np.ndarray,
        timestamp: datetime,
        transfer_points: Optional[Iterable[Tuple[int, int]]] = None,
    ) -> InventoryMetrics:
        water_level = self._estimate_water_level(frame)
        food_coverage = self._estimate_food_coverage(frame)
        gnaw_wear = self._estimate_gnaw_wear(frame)

        self._update_hoard_map(transfer_points)
        hotspots = self._top_hoard_hotspots(top_k=4)

        alerts = []
        if water_level < self.low_water_threshold:
            alerts.append("low_water")
        if food_coverage < self.low_food_threshold:
            alerts.append("low_food")

        return InventoryMetrics(
            timestamp=timestamp.isoformat(),
            water_level_ratio=water_level,
            food_coverage_ratio=food_coverage,
            gnaw_wear_index=gnaw_wear,
            hoard_hotspots=hotspots,
            alerts=alerts,
        )
