from __future__ import annotations

import base64
import json
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, Optional

import cv2
import numpy as np
import requests


@dataclass
class HealthMetrics:
    timestamp: str
    fur_score: float
    expression_score: float
    volume_change_ratio: float
    gait_symmetry_score: float
    risk_level: str
    notes: str

    def to_dict(self) -> dict:
        return asdict(self)


class VisualHealthScanner:
    """Run health checks with optional VLM and image-based fallback heuristics."""

    def __init__(self, baseline_body_area_px: int, vlm_config: Any) -> None:
        self.baseline_body_area_px = baseline_body_area_px
        self.vlm_config = vlm_config
        self._close_kernel_5 = np.ones((5, 5), np.uint8)

    @staticmethod
    def _encode_image_b64(image: np.ndarray) -> str:
        ok, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not ok:
            raise ValueError("Failed to encode image")
        return base64.b64encode(encoded.tobytes()).decode("ascii")

    @staticmethod
    def _extract_json(raw_text: str) -> Dict[str, Any]:
        raw_text = raw_text.strip()
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            if start >= 0 and end > start:
                return json.loads(raw_text[start : end + 1])
            raise

    def _heuristic_body_area(self, image: np.ndarray) -> int:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, self._close_kernel_5, iterations=2)

        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return self.baseline_body_area_px
        area = max(cv2.contourArea(cnt) for cnt in contours)
        return int(area)

    def _heuristic_fur_score(self, image: np.ndarray) -> float:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        smoothness = float(np.std(cv2.Laplacian(l_channel, cv2.CV_64F)))
        score = max(0.0, min(1.0, 1.0 - smoothness / 120.0))
        return score

    def _heuristic_expression_score(self, image: np.ndarray) -> float:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        brightness = float(np.mean(hsv[:, :, 2])) / 255.0
        saturation = float(np.mean(hsv[:, :, 1])) / 255.0
        return max(0.0, min(1.0, brightness * 0.7 + (1.0 - saturation) * 0.3))

    @staticmethod
    def _gait_symmetry_from_keypoints(keypoints: Optional[Iterable[Dict[str, float]]]) -> float:
        if not keypoints:
            return 0.5

        left_values = []
        right_values = []
        for item in keypoints:
            if "left_step" in item:
                left_values.append(float(item["left_step"]))
            if "right_step" in item:
                right_values.append(float(item["right_step"]))

        if not left_values or not right_values:
            return 0.5

        left_mean = np.mean(left_values)
        right_mean = np.mean(right_values)
        imbalance = abs(left_mean - right_mean) / max(left_mean, right_mean, 1e-6)
        return float(max(0.0, min(1.0, 1.0 - imbalance)))

    def _query_vlm(self, image: np.ndarray, context: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.vlm_config.enabled:
            return None

        api_key = self.vlm_config.resolve_api_key()
        if not api_key:
            return None

        image_b64 = self._encode_image_b64(image)
        prompt = (
            "Analyze this hamster image for fur condition, expression/alertness, edema/weight signs, "
            "and gait symmetry clues. Return JSON with keys: fur_score, expression_score, "
            "volume_change_ratio, gait_symmetry_score, notes. Scores are 0..1."
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
            "temperature": 0.2,
        }

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        response = requests.post(
            self.vlm_config.endpoint,
            headers=headers,
            json=payload,
            timeout=self.vlm_config.timeout_seconds,
        )
        response.raise_for_status()

        data = response.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            return None

        return self._extract_json(content)

    @staticmethod
    def _risk_level(fur_score: float, expression_score: float, volume_ratio: float, gait_score: float) -> str:
        risk_score = (1 - fur_score) * 0.3 + (1 - expression_score) * 0.25 + abs(volume_ratio) * 1.8 + (1 - gait_score) * 0.3
        if risk_score >= 0.9:
            return "high"
        if risk_score >= 0.5:
            return "medium"
        return "low"

    def analyze(
        self,
        image: np.ndarray,
        timestamp: datetime,
        context: Optional[str] = None,
        keypoints: Optional[Iterable[Dict[str, float]]] = None,
    ) -> HealthMetrics:
        area = self._heuristic_body_area(image)
        volume_ratio = (area - self.baseline_body_area_px) / max(self.baseline_body_area_px, 1)

        fur_score = self._heuristic_fur_score(image)
        expression_score = self._heuristic_expression_score(image)
        gait_score = self._gait_symmetry_from_keypoints(keypoints)
        notes = "heuristic-only"

        try:
            vlm_payload = self._query_vlm(image, context=context)
            if vlm_payload:
                fur_score = float(vlm_payload.get("fur_score", fur_score))
                expression_score = float(vlm_payload.get("expression_score", expression_score))
                volume_ratio = float(vlm_payload.get("volume_change_ratio", volume_ratio))
                gait_score = float(vlm_payload.get("gait_symmetry_score", gait_score))
                notes = str(vlm_payload.get("notes", "vlm-scan"))
        except (requests.RequestException, ValueError, KeyError, json.JSONDecodeError):
            notes = "vlm-error-fallback"

        risk = self._risk_level(fur_score, expression_score, volume_ratio, gait_score)

        return HealthMetrics(
            timestamp=timestamp.isoformat(),
            fur_score=max(0.0, min(1.0, fur_score)),
            expression_score=max(0.0, min(1.0, expression_score)),
            volume_change_ratio=float(volume_ratio),
            gait_symmetry_score=max(0.0, min(1.0, gait_score)),
            risk_level=risk,
            notes=notes,
        )
