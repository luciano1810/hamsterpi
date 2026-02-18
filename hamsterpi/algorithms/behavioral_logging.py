from __future__ import annotations

import base64
import json
from collections import defaultdict, deque
from dataclasses import asdict, dataclass
from datetime import date, datetime
from typing import Any, Deque, Dict, List, Optional, Sequence, Tuple

import cv2
import numpy as np
import requests

Point = Tuple[int, int]
NIGHT_HOURS = {19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6}


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
    awake_confidence: float
    vlm_used: bool
    behavior_tags: List[str]
    vlm_notes: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class VLMBehaviorSnapshot:
    awake_probability: float
    grooming_probability: float
    digging_probability: float
    stereotypy_probability: float
    behavior_tags: List[str]
    notes: str


class BehavioralLogger:
    """Track wake/sleep schedule and repetitive stress behaviors."""

    def __init__(
        self,
        hideout_polygon: Sequence[Point],
        vlm_config: Any | None = None,
        vlm_sample_interval_seconds: int = 120,
    ) -> None:
        self.hideout_polygon = np.array(hideout_polygon, dtype=np.int32)
        self.vlm_config = vlm_config
        self.vlm_sample_interval_seconds = max(15, int(vlm_sample_interval_seconds))

        self._first_out_of_nest: Dict[date, datetime] = {}
        self._last_back_to_nest: Dict[date, datetime] = {}
        self._observed_seconds_by_day = defaultdict(float)
        self._awake_seconds_by_day = defaultdict(float)
        self._observed_seconds_by_hour = defaultdict(float)
        self._awake_seconds_by_hour = defaultdict(float)
        self._awake_switch_events: Deque[float] = deque(maxlen=720)
        self._last_awake_state: Optional[bool] = None

        self._grooming_count = 0
        self._digging_seconds = 0.0

        self._recent_stereotypy_events: Deque[float] = deque(maxlen=180)
        self._last_grooming_ts: Optional[datetime] = None
        self._recent_path: Deque[Point] = deque(maxlen=200)
        self._last_vlm_sample_ts: Optional[datetime] = None
        self._last_vlm_snapshot: Optional[VLMBehaviorSnapshot] = None
        self._vlm_samples = 0

    @staticmethod
    def _in_polygon(point: Point, polygon: np.ndarray) -> bool:
        return cv2.pointPolygonTest(polygon, point, False) >= 0

    @staticmethod
    def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
        return max(low, min(high, float(value)))

    @staticmethod
    def _encode_image_b64(image: np.ndarray) -> str:
        resized = image
        height, width = image.shape[:2]
        if width > 640:
            target_width = 640
            target_height = max(1, int(round(height * target_width / max(width, 1))))
            resized = cv2.resize(image, (target_width, target_height), interpolation=cv2.INTER_AREA)
        ok, encoded = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not ok:
            raise ValueError("Failed to encode image")
        return base64.b64encode(encoded.tobytes()).decode("ascii")

    @staticmethod
    def _extract_json(raw_text: str) -> Dict[str, Any]:
        text = str(raw_text or "").strip()
        if not text:
            raise ValueError("VLM returned empty text")
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start >= 0 and end > start:
                return json.loads(text[start : end + 1])
            raise

    @staticmethod
    def _extract_content(response_json: Dict[str, Any]) -> str:
        content = response_json.get("choices", [{}])[0].get("message", {}).get("content", "")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: List[str] = []
            for item in content:
                if isinstance(item, dict) and isinstance(item.get("text"), str):
                    parts.append(item["text"])
            return "".join(parts)
        return ""

    def _query_vlm(self, image: np.ndarray, context: str) -> Optional[VLMBehaviorSnapshot]:
        if not self.vlm_config or not getattr(self.vlm_config, "enabled", False):
            return None

        api_key = self.vlm_config.resolve_api_key()
        if not api_key:
            return None

        image_b64 = self._encode_image_b64(image)
        prompt = (
            "Analyze hamster behavior from this frame and output strict JSON only. "
            "JSON keys: awake_probability, grooming_probability, digging_probability, "
            "stereotypy_probability, behavior_tags, notes. "
            "All probabilities are 0..1. behavior_tags is an array of short strings."
        )
        if context:
            prompt += f" Context: {context}"

        payload = {
            "model": self.vlm_config.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                        },
                    ],
                }
            ],
            "temperature": 0.1,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        response = requests.post(
            self.vlm_config.endpoint,
            headers=headers,
            json=payload,
            timeout=self.vlm_config.timeout_seconds,
        )
        response.raise_for_status()

        parsed = self._extract_json(self._extract_content(response.json()))
        tags_raw = parsed.get("behavior_tags", [])
        if isinstance(tags_raw, str):
            tags_raw = [item.strip() for item in tags_raw.split(",") if item.strip()]
        tags = [
            str(item).strip()[:24]
            for item in tags_raw
            if str(item).strip()
        ][:8]

        return VLMBehaviorSnapshot(
            awake_probability=self._clamp(float(parsed.get("awake_probability", 0.5))),
            grooming_probability=self._clamp(float(parsed.get("grooming_probability", 0.0))),
            digging_probability=self._clamp(float(parsed.get("digging_probability", 0.0))),
            stereotypy_probability=self._clamp(float(parsed.get("stereotypy_probability", 0.0))),
            behavior_tags=tags,
            notes=str(parsed.get("notes", "vlm-behavior")),
        )

    def _maybe_update_vlm(
        self,
        image: Optional[np.ndarray],
        timestamp: datetime,
        zone: Optional[str],
        action_probs: Dict[str, float],
    ) -> Optional[VLMBehaviorSnapshot]:
        if not self.vlm_config or not getattr(self.vlm_config, "enabled", False):
            return None

        if image is None:
            return self._last_vlm_snapshot

        should_sample = self._last_vlm_sample_ts is None or (
            timestamp - self._last_vlm_sample_ts
        ).total_seconds() >= self.vlm_sample_interval_seconds
        if not should_sample:
            return self._last_vlm_snapshot

        top_actions = sorted(
            ((k, float(v)) for k, v in action_probs.items()),
            key=lambda item: item[1],
            reverse=True,
        )[:3]
        action_text = ", ".join(f"{name}:{value:.2f}" for name, value in top_actions)
        context = f"hour={timestamp.hour}, zone={zone or 'unknown'}"
        if action_text:
            context += f", action_probs={action_text}"

        try:
            snapshot = self._query_vlm(image, context=context)
        except (requests.RequestException, ValueError, KeyError, TypeError, json.JSONDecodeError):
            snapshot = None

        if snapshot:
            self._last_vlm_sample_ts = timestamp
            self._last_vlm_snapshot = snapshot
            self._vlm_samples += 1

        return self._last_vlm_snapshot

    def _track_schedule(self, ts: datetime, awake: Optional[bool]) -> bool:
        day = ts.date()
        if awake is None:
            return False

        if awake and day not in self._first_out_of_nest:
            self._first_out_of_nest[day] = ts
        if not awake:
            self._last_back_to_nest[day] = ts

        return awake

    def _detect_stereotypy(
        self,
        ts: datetime,
        action_probs: Dict[str, float],
        vlm_stereotypy_prob: Optional[float],
    ) -> bool:
        explicit = max(action_probs.get("cage_biting", 0.0), action_probs.get("climb_top", 0.0)) > 0.6

        repetitive_path = False
        if len(self._recent_path) >= 40:
            pts = np.array(self._recent_path, dtype=np.float32)
            variance = float(np.var(pts, axis=0).mean())
            repetitive_path = variance < 1800.0

        vlm_triggered = vlm_stereotypy_prob is not None and float(vlm_stereotypy_prob) > 0.68
        detected = explicit or repetitive_path or vlm_triggered
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

    def _heuristic_awake_probability(self, centroid: Optional[Point]) -> Optional[float]:
        if centroid is None:
            return None
        in_hideout = self._in_polygon(centroid, self.hideout_polygon)
        return 0.08 if in_hideout else 0.92

    def _fuse_probability(
        self,
        base_prob: Optional[float],
        vlm_prob: Optional[float],
        base_weight: float = 0.72,
    ) -> Optional[float]:
        if base_prob is None and vlm_prob is None:
            return None
        if base_prob is None:
            return self._clamp(float(vlm_prob))
        if vlm_prob is None:
            return self._clamp(float(base_prob))
        return self._clamp(float(base_prob) * base_weight + float(vlm_prob) * (1.0 - base_weight))

    def _vlm_freshness_weight(self, timestamp: datetime, active_seconds: float) -> float:
        if self._last_vlm_sample_ts is None:
            return 0.0
        age_seconds = max(0.0, (timestamp - self._last_vlm_sample_ts).total_seconds())
        if age_seconds >= active_seconds:
            return 0.0
        return self._clamp(1.0 - age_seconds / max(active_seconds, 1e-6))

    def _update_routine_stats(self, timestamp: datetime, dt_seconds: float, awake: Optional[bool]) -> None:
        if awake is None:
            return
        dt = max(0.0, float(dt_seconds))
        if dt <= 0.0:
            return

        day = timestamp.date()
        hour = timestamp.hour
        self._observed_seconds_by_day[day] += dt
        self._observed_seconds_by_hour[hour] += dt
        if awake:
            self._awake_seconds_by_day[day] += dt
            self._awake_seconds_by_hour[hour] += dt

        if self._last_awake_state is not None and awake != self._last_awake_state:
            self._awake_switch_events.append(timestamp.timestamp())
        self._last_awake_state = awake

    def _night_activity_ratio(self) -> float:
        total_awake = sum(float(v) for v in self._awake_seconds_by_hour.values())
        if total_awake <= 1e-6:
            return 0.0
        night_awake = sum(float(self._awake_seconds_by_hour.get(h, 0.0)) for h in NIGHT_HOURS)
        return self._clamp(night_awake / total_awake)

    def _sleep_fragmentation_index(self) -> float:
        if not self._awake_switch_events:
            return 0.0
        latest = float(self._awake_switch_events[-1])
        cutoff = latest - 6.0 * 3600.0
        transitions = sum(1 for item in self._awake_switch_events if item >= cutoff)
        return self._clamp(transitions / 8.0)

    def _wake_regularity_score(self) -> float:
        if len(self._first_out_of_nest) < 2:
            return 0.6
        minutes = [
            item.hour * 60 + item.minute + item.second / 60.0
            for _, item in sorted(self._first_out_of_nest.items(), key=lambda pair: pair[0])
        ]
        std_minutes = float(np.std(np.array(minutes, dtype=np.float32)))
        return self._clamp(1.0 - std_minutes / 180.0)

    def _routine_score(self) -> float:
        night_ratio = self._night_activity_ratio()
        # Hamsters are nocturnal; ratio near 0.75 is preferred.
        night_alignment = self._clamp(1.0 - abs(night_ratio - 0.75) / 0.75)
        regularity = self._wake_regularity_score()
        fragmentation_penalty = self._sleep_fragmentation_index()
        return self._clamp(night_alignment * 0.4 + regularity * 0.35 + (1.0 - fragmentation_penalty) * 0.25)

    def update(
        self,
        timestamp: datetime,
        dt_seconds: float,
        centroid: Optional[Point],
        action_probs: Optional[Dict[str, float]] = None,
        image: Optional[np.ndarray] = None,
        zone: Optional[str] = None,
    ) -> BehaviorMetrics:
        action_probs = action_probs or {}

        if centroid is not None:
            self._recent_path.append(centroid)

        vlm_snapshot = self._maybe_update_vlm(
            image=image,
            timestamp=timestamp,
            zone=zone,
            action_probs=action_probs,
        )

        heuristic_awake = self._heuristic_awake_probability(centroid)
        fused_awake_probability = self._fuse_probability(
            base_prob=heuristic_awake,
            vlm_prob=(vlm_snapshot.awake_probability if vlm_snapshot else None),
            base_weight=1.0 - self._vlm_freshness_weight(
                timestamp,
                active_seconds=max(180.0, float(self.vlm_sample_interval_seconds) * 1.5),
            ) * 0.35,
        )
        awake_state = None if fused_awake_probability is None else fused_awake_probability >= 0.5

        self._update_routine_stats(timestamp, dt_seconds, awake_state)
        awake = self._track_schedule(timestamp, awake_state)

        event_vlm_strength = self._vlm_freshness_weight(timestamp, active_seconds=24.0) * 0.75
        event_vlm_base_weight = 1.0 - event_vlm_strength

        grooming_prob = self._fuse_probability(
            base_prob=self._clamp(float(action_probs.get("grooming", 0.0))),
            vlm_prob=(vlm_snapshot.grooming_probability if vlm_snapshot and event_vlm_strength > 0.0 else None),
            base_weight=event_vlm_base_weight,
        ) or 0.0
        grooming_detected = grooming_prob > 0.63
        if grooming_detected:
            if self._last_grooming_ts is None or (timestamp - self._last_grooming_ts).total_seconds() > 8:
                self._grooming_count += 1
                self._last_grooming_ts = timestamp

        digging_rule_prob = max(
            self._clamp(float(action_probs.get("digging", 0.0))),
            0.35 if (zone or "").strip() == "sand_bath_zone" else 0.0,
        )
        digging_prob = self._fuse_probability(
            base_prob=digging_rule_prob,
            vlm_prob=(vlm_snapshot.digging_probability if vlm_snapshot and event_vlm_strength > 0.0 else None),
            base_weight=event_vlm_base_weight,
        ) or 0.0
        digging_detected = digging_prob > 0.58
        if digging_detected:
            self._digging_seconds += dt_seconds

        stereotypy_detected = self._detect_stereotypy(
            timestamp,
            action_probs,
            vlm_stereotypy_prob=(
                vlm_snapshot.stereotypy_probability
                if vlm_snapshot and event_vlm_strength > 0.0
                else None
            ),
        )

        return BehaviorMetrics(
            timestamp=timestamp.isoformat(),
            awake=awake,
            grooming_detected=grooming_detected,
            digging_detected=digging_detected,
            stereotypy_detected=stereotypy_detected,
            anxiety_index=self._anxiety_index(),
            grooming_count=self._grooming_count,
            digging_seconds=self._digging_seconds,
            awake_confidence=round(float(fused_awake_probability or 0.0), 4),
            vlm_used=vlm_snapshot is not None,
            behavior_tags=(vlm_snapshot.behavior_tags if vlm_snapshot else []),
            vlm_notes=(vlm_snapshot.notes if vlm_snapshot else ""),
        )

    def schedule_summary(self) -> Dict[str, Any]:
        observed_days = set(self._observed_seconds_by_day.keys()) | set(self._first_out_of_nest.keys()) | set(self._last_back_to_nest.keys())
        if not observed_days:
            return {
                "day": "",
                "first_out": "",
                "last_in": "",
                "awake_ratio": 0.0,
                "night_activity_ratio": 0.0,
                "sleep_fragmentation_index": 0.0,
                "routine_score": 0.0,
                "vlm_enabled": bool(self.vlm_config and getattr(self.vlm_config, "enabled", False)),
                "vlm_samples": int(self._vlm_samples),
            }

        latest_day = max(observed_days)
        first_out = self._first_out_of_nest.get(latest_day)
        last_in = self._last_back_to_nest.get(latest_day)
        observed_seconds = float(self._observed_seconds_by_day.get(latest_day, 0.0))
        awake_seconds = float(self._awake_seconds_by_day.get(latest_day, 0.0))
        awake_ratio = awake_seconds / observed_seconds if observed_seconds > 1e-6 else 0.0
        return {
            "day": latest_day.isoformat(),
            "first_out": first_out.isoformat() if first_out else "",
            "last_in": last_in.isoformat() if last_in else "",
            "awake_ratio": round(self._clamp(awake_ratio), 4),
            "night_activity_ratio": round(self._night_activity_ratio(), 4),
            "sleep_fragmentation_index": round(self._sleep_fragmentation_index(), 4),
            "routine_score": round(self._routine_score(), 4),
            "vlm_enabled": bool(self.vlm_config and getattr(self.vlm_config, "enabled", False)),
            "vlm_samples": int(self._vlm_samples),
        }
