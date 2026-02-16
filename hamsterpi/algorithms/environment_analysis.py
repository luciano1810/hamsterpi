from __future__ import annotations

from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Deque, Dict, List, Sequence

import cv2
import numpy as np


@dataclass
class EnvironmentMetrics:
    timestamp: str
    brightness: float
    contrast: float
    dark_ratio: float
    edge_density: float
    bedding_evenness: float
    cleanliness_score: float
    lighting_score: float
    comfort_index: float
    risk_level: str

    def to_dict(self) -> dict:
        return asdict(self)


class EnvironmentAnalyzer:
    """Analyze cage living environment quality from low-cost visual features."""

    def __init__(
        self,
        low_light_threshold: float,
        high_light_threshold: float,
        hygiene_dark_ratio_threshold: float,
        clutter_edge_threshold: float,
        bedding_roi: Sequence[int],
        max_history: int = 720,
    ) -> None:
        self.low_light_threshold = low_light_threshold
        self.high_light_threshold = high_light_threshold
        self.hygiene_dark_ratio_threshold = hygiene_dark_ratio_threshold
        self.clutter_edge_threshold = clutter_edge_threshold
        self.bedding_roi = bedding_roi
        self._history: Deque[EnvironmentMetrics] = deque(maxlen=max_history)

    @staticmethod
    def _clamp(value: float, low: float, high: float) -> float:
        return max(low, min(high, value))

    @staticmethod
    def _risk_label(comfort: float) -> str:
        if comfort < 0.45:
            return "high"
        if comfort < 0.7:
            return "medium"
        return "low"

    @staticmethod
    def _crop(frame: np.ndarray, roi: Sequence[int]) -> np.ndarray:
        x, y, w, h = roi
        x = max(0, x)
        y = max(0, y)
        w = max(1, w)
        h = max(1, h)
        return frame[y : y + h, x : x + w]

    def _bedding_evenness(self, frame: np.ndarray) -> float:
        bedding = self._crop(frame, self.bedding_roi)
        if bedding.size == 0:
            return 0.5

        gray = cv2.cvtColor(bedding, cv2.COLOR_BGR2GRAY)
        sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        grad = cv2.magnitude(sobel_x, sobel_y)
        roughness = float(np.std(grad)) / 120.0
        return self._clamp(1.0 - roughness, 0.0, 1.0)

    def update(self, frame: np.ndarray, timestamp: datetime) -> EnvironmentMetrics:
        small = cv2.resize(frame, (0, 0), fx=0.35, fy=0.35, interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        brightness = float(np.mean(blur)) / 255.0
        contrast = float(np.std(blur)) / 255.0

        dark_ratio = float(np.count_nonzero(blur < 42)) / float(blur.size)

        edges = cv2.Canny(blur, 60, 150)
        edge_density = float(np.count_nonzero(edges)) / float(edges.size)

        bedding_evenness = self._bedding_evenness(frame)

        if brightness < self.low_light_threshold:
            lighting_score = self._clamp(brightness / max(self.low_light_threshold, 1e-6), 0.0, 1.0)
        elif brightness > self.high_light_threshold:
            lighting_score = self._clamp(1.0 - (brightness - self.high_light_threshold) / max(1.0 - self.high_light_threshold, 1e-6), 0.0, 1.0)
        else:
            lighting_score = 1.0

        cleanliness_score = self._clamp(
            1.0 - (dark_ratio / max(self.hygiene_dark_ratio_threshold, 1e-6)),
            0.0,
            1.0,
        )

        clutter_score = self._clamp(
            1.0 - (edge_density / max(self.clutter_edge_threshold, 1e-6)),
            0.0,
            1.0,
        )

        comfort = self._clamp(
            lighting_score * 0.28
            + cleanliness_score * 0.30
            + bedding_evenness * 0.24
            + clutter_score * 0.18,
            0.0,
            1.0,
        )

        metrics = EnvironmentMetrics(
            timestamp=timestamp.isoformat(),
            brightness=round(brightness, 4),
            contrast=round(contrast, 4),
            dark_ratio=round(dark_ratio, 4),
            edge_density=round(edge_density, 4),
            bedding_evenness=round(bedding_evenness, 4),
            cleanliness_score=round(cleanliness_score, 4),
            lighting_score=round(lighting_score, 4),
            comfort_index=round(comfort, 4),
            risk_level=self._risk_label(comfort),
        )
        self._history.append(metrics)
        return metrics

    def history(self) -> List[dict]:
        return [item.to_dict() for item in self._history]

    def summary(self) -> Dict[str, float | str]:
        if not self._history:
            return {
                "avg_comfort_index": 0.0,
                "avg_cleanliness_score": 0.0,
                "avg_lighting_score": 0.0,
                "latest_risk_level": "unknown",
            }

        comfort = float(np.mean([x.comfort_index for x in self._history]))
        clean = float(np.mean([x.cleanliness_score for x in self._history]))
        light = float(np.mean([x.lighting_score for x in self._history]))
        latest_risk = self._history[-1].risk_level

        return {
            "avg_comfort_index": round(comfort, 4),
            "avg_cleanliness_score": round(clean, 4),
            "avg_lighting_score": round(light, 4),
            "latest_risk_level": latest_risk,
        }
