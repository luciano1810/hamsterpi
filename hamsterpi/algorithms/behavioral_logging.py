from __future__ import annotations

from collections import deque
from dataclasses import asdict, dataclass
from datetime import date, datetime
from typing import Deque, Dict, Optional, Sequence, Tuple

import cv2
import numpy as np

Point = Tuple[int, int]


@dataclass
class BehaviorMetrics:
    timestamp: str
    awake: bool
    grooming_detected: bool
    digging_detected: bool
    stereotypy_detected: bool
    anxiety_index: float
    grooming_count: int
    digging_seconds: float

    def to_dict(self) -> dict:
        return asdict(self)


class BehavioralLogger:
    """Track wake/sleep schedule and repetitive stress behaviors."""

    def __init__(self, hideout_polygon: Sequence[Point]) -> None:
        self.hideout_polygon = np.array(hideout_polygon, dtype=np.int32)
        self._first_out_of_nest: Dict[date, datetime] = {}
        self._last_back_to_nest: Dict[date, datetime] = {}

        self._grooming_count = 0
        self._digging_seconds = 0.0

        self._recent_stereotypy_events: Deque[float] = deque(maxlen=180)
        self._last_grooming_ts: Optional[datetime] = None
        self._recent_path: Deque[Point] = deque(maxlen=200)

    @staticmethod
    def _in_polygon(point: Point, polygon: np.ndarray) -> bool:
        return cv2.pointPolygonTest(polygon, point, False) >= 0

    def _track_schedule(self, ts: datetime, centroid: Optional[Point]) -> bool:
        day = ts.date()
        if centroid is None:
            return False

        in_hideout = self._in_polygon(centroid, self.hideout_polygon)
        awake = not in_hideout

        if awake and day not in self._first_out_of_nest:
            self._first_out_of_nest[day] = ts
        if not awake:
            self._last_back_to_nest[day] = ts

        return awake

    def _detect_stereotypy(self, ts: datetime, action_probs: Dict[str, float]) -> bool:
        explicit = max(action_probs.get("cage_biting", 0.0), action_probs.get("climb_top", 0.0)) > 0.6

        repetitive_path = False
        if len(self._recent_path) >= 40:
            pts = np.array(self._recent_path, dtype=np.float32)
            variance = float(np.var(pts, axis=0).mean())
            repetitive_path = variance < 1800.0

        detected = explicit or repetitive_path
        ts_epoch = ts.timestamp()
        if detected:
            self._recent_stereotypy_events.append(ts_epoch)

        cutoff = ts_epoch - 3600.0
        while self._recent_stereotypy_events and self._recent_stereotypy_events[0] < cutoff:
            self._recent_stereotypy_events.popleft()

        return detected

    def _anxiety_index(self) -> float:
        # 12 events/hour is considered severe.
        return max(0.0, min(1.0, len(self._recent_stereotypy_events) / 12.0))

    def update(
        self,
        timestamp: datetime,
        dt_seconds: float,
        centroid: Optional[Point],
        action_probs: Optional[Dict[str, float]] = None,
    ) -> BehaviorMetrics:
        action_probs = action_probs or {}

        if centroid is not None:
            self._recent_path.append(centroid)

        awake = self._track_schedule(timestamp, centroid)

        grooming_detected = action_probs.get("grooming", 0.0) > 0.65
        if grooming_detected:
            if self._last_grooming_ts is None or (timestamp - self._last_grooming_ts).total_seconds() > 8:
                self._grooming_count += 1
                self._last_grooming_ts = timestamp

        digging_detected = action_probs.get("digging", 0.0) > 0.6
        if digging_detected:
            self._digging_seconds += dt_seconds

        stereotypy_detected = self._detect_stereotypy(timestamp, action_probs)

        return BehaviorMetrics(
            timestamp=timestamp.isoformat(),
            awake=awake,
            grooming_detected=grooming_detected,
            digging_detected=digging_detected,
            stereotypy_detected=stereotypy_detected,
            anxiety_index=self._anxiety_index(),
            grooming_count=self._grooming_count,
            digging_seconds=self._digging_seconds,
        )

    def schedule_summary(self) -> Dict[str, str]:
        if not self._first_out_of_nest:
            return {"first_out": "", "last_in": ""}

        latest_day = max(self._first_out_of_nest.keys())
        first_out = self._first_out_of_nest.get(latest_day)
        last_in = self._last_back_to_nest.get(latest_day)
        return {
            "day": latest_day.isoformat(),
            "first_out": first_out.isoformat() if first_out else "",
            "last_in": last_in.isoformat() if last_in else "",
        }
