from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

from hamsterpi.config import SystemConfig

Point = Tuple[float, float]


def _polygon_center(polygon: Sequence[Sequence[float]]) -> Point:
    arr = np.array(polygon, dtype=np.float32)
    return float(np.mean(arr[:, 0])), float(np.mean(arr[:, 1]))


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _risk_label(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def _comfort_label(score: float) -> str:
    if score < 0.45:
        return "high"
    if score < 0.7:
        return "medium"
    return "low"


class VirtualDatasetGenerator:
    """Generate detailed synthetic hamster telemetry for frontend demo and API testing."""

    def __init__(self, config: SystemConfig, seed: Optional[int] = None) -> None:
        self.config = config
        self.rng = np.random.default_rng(seed)
        self.zone_centers = {
            name: _polygon_center(poly)
            for name, poly in self.config.spatial.zones.items()
        }
        self.zone_centers["wheel_zone"] = _polygon_center(self.config.spatial.wheel_mask_polygon)

    def _activity_level(self, ts: datetime) -> float:
        hour = ts.hour + ts.minute / 60.0
        nocturnal = 1.0 if (hour >= 19.0 or hour <= 6.5) else 0.0
        circadian = 0.15 + 0.8 * nocturnal
        micro_cycle = 0.12 * (1.0 + math.sin(2.0 * math.pi * hour / 3.5))
        return _clamp(circadian + micro_cycle, 0.05, 1.0)

    def _choose_zone(self, activity: float, running: bool) -> str:
        if running and self.rng.random() < 0.82:
            return "wheel_zone"

        candidates = ["food_zone", "sand_bath_zone", "hideout_zone"]
        if activity < 0.25:
            probs = [0.15, 0.15, 0.70]
        elif activity < 0.55:
            probs = [0.45, 0.25, 0.30]
        else:
            probs = [0.40, 0.40, 0.20]
        return str(self.rng.choice(candidates, p=probs))

    def _sample_position(self, zone_name: str) -> Point:
        cx, cy = self.zone_centers[zone_name]
        spread = 32.0 if zone_name == "wheel_zone" else 55.0
        x = float(cx + self.rng.normal(0.0, spread))
        y = float(cy + self.rng.normal(0.0, spread))
        x = _clamp(x, 0.0, float(self.config.video.frame_width - 1))
        y = _clamp(y, 0.0, float(self.config.video.frame_height - 1))
        return x, y

    def _lighting_score(self, brightness: float) -> float:
        low = self.config.environment.low_light_threshold
        high = self.config.environment.high_light_threshold
        if brightness < low:
            return _clamp(brightness / max(low, 1e-6), 0.0, 1.0)
        if brightness > high:
            return _clamp(1.0 - (brightness - high) / max(1.0 - high, 1e-6), 0.0, 1.0)
        return 1.0

    def generate(self, history_minutes: Optional[int] = None) -> Dict[str, object]:
        history = history_minutes or self.config.frontend.history_minutes
        now = datetime.now().replace(second=0, microsecond=0)
        start = now - timedelta(minutes=history - 1)

        wheel_circumference_m = math.pi * (self.config.wheel.diameter_cm / 100.0)
        min_rpm_for_run = self.config.wheel.min_rpm_for_running

        time_series: List[Dict[str, object]] = []
        trajectory: List[Dict[str, object]] = []
        alerts: List[Dict[str, str]] = []

        zone_dwell_seconds = defaultdict(float)
        hourly_distance = defaultdict(float)
        hourly_grooming = defaultdict(int)
        hourly_digging_seconds = defaultdict(float)

        direction_counts = {"forward": 0, "reverse": 0, "idle": 0}

        total_distance_m = 0.0
        patrol_length_m = 0.0
        running_minutes = 0
        stop_go_switches = []
        running_state_prev = False
        running_streak_min = 0.0
        max_running_streak_min = 0.0

        water_level = 0.93
        food_level = 0.87
        gnaw_wear = 0.05
        anxiety_index = 0.22

        # Environment state.
        brightness = 0.74
        cleanliness = 0.87
        bedding_evenness = 0.82

        position_prev: Optional[Point] = None
        escape_events: List[Dict[str, object]] = []
        hoard_hotspots_map = np.zeros((24, 40), dtype=np.float32)
        heatmap = np.zeros((24, 40), dtype=np.float32)

        health_scans: List[Dict[str, object]] = []
        water_series: List[Dict[str, object]] = []
        food_series: List[Dict[str, object]] = []
        gnaw_series: List[Dict[str, object]] = []
        anxiety_series: List[Dict[str, object]] = []

        environment_series: List[Dict[str, object]] = []
        environment_hourly = defaultdict(list)

        motion_series: List[Dict[str, object]] = []
        motion_segments: List[Dict[str, str | float]] = []
        capture_active = False
        motion_streak = 0
        idle_streak = 0
        segment_start: Optional[datetime] = None

        volume_trend = 0.0
        grooming_count = 0
        digging_seconds_total = 0.0

        first_out = None
        last_in = None

        for idx in range(history):
            ts = start + timedelta(minutes=idx)
            activity = self._activity_level(ts)

            rpm = max(0.0, float(self.rng.normal(loc=activity * 28.0, scale=4.8)))
            if self.rng.random() < (0.28 + (1.0 - activity) * 0.5):
                rpm *= self.rng.uniform(0.0, 0.3)

            running = rpm >= min_rpm_for_run
            if running:
                running_minutes += 1
                running_streak_min += 1.0
                max_running_streak_min = max(max_running_streak_min, running_streak_min)
            else:
                running_streak_min = 0.0

            if running != running_state_prev:
                stop_go_switches.append(ts)
            running_state_prev = running

            if not running:
                direction = "idle"
            else:
                direction = "reverse" if self.rng.random() < 0.13 else "forward"
            direction_counts[direction] += 1

            direction_sign = -1.0 if direction == "reverse" else 1.0
            rev_delta = rpm * direction_sign
            distance_delta_m = abs(rev_delta) * wheel_circumference_m
            total_distance_m += distance_delta_m
            speed_kmh = abs(rpm) * wheel_circumference_m * 0.06

            zone = self._choose_zone(activity, running)
            x, y = self._sample_position(zone)

            if position_prev is not None:
                dx = x - position_prev[0]
                dy = y - position_prev[1]
                if zone != "wheel_zone":
                    patrol_length_m += math.sqrt(dx * dx + dy * dy) * 0.0012
            position_prev = (x, y)

            if zone in self.config.spatial.zones:
                zone_dwell_seconds[zone] += 60.0

            if zone != "hideout_zone" and first_out is None:
                first_out = ts
            if zone == "hideout_zone":
                last_in = ts

            escape = self.rng.random() < 0.0009
            if escape:
                escape_event = {"timestamp": ts.isoformat(), "x": int(x), "y": int(y)}
                escape_events.append(escape_event)
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "escape",
                        "severity": "high",
                        "message": "Virtual fence crossed",
                    }
                )

            row = int(_clamp(y / self.config.video.frame_height * heatmap.shape[0], 0, heatmap.shape[0] - 1))
            col = int(_clamp(x / self.config.video.frame_width * heatmap.shape[1], 0, heatmap.shape[1] - 1))
            heatmap[row, col] += 1.0

            # Resource consumption and refill cycles.
            water_level -= (0.0018 + activity * 0.0012)
            food_level -= (0.0015 + activity * 0.0014)
            if water_level < 0.16 and self.rng.random() < 0.08:
                water_level = self.rng.uniform(0.82, 0.96)
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "water_refill",
                        "severity": "info",
                        "message": "Water bottle refilled",
                    }
                )
            if food_level < 0.21 and self.rng.random() < 0.06:
                food_level = self.rng.uniform(0.75, 0.9)
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "food_refill",
                        "severity": "info",
                        "message": "Food bowl replenished",
                    }
                )

            water_level = _clamp(water_level, 0.0, 1.0)
            food_level = _clamp(food_level, 0.0, 1.0)

            gnaw_wear = _clamp(gnaw_wear + (0.0002 + activity * 0.00025), 0.0, 1.0)

            if water_level < self.config.inventory.low_water_threshold:
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "low_water",
                        "severity": "high",
                        "message": f"Water level dropped below {int(self.config.inventory.low_water_threshold * 100)}%",
                    }
                )
            if food_level < self.config.inventory.low_food_threshold:
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "low_food",
                        "severity": "medium",
                        "message": f"Food coverage dropped below {int(self.config.inventory.low_food_threshold * 100)}%",
                    }
                )

            grooming_event = (not running) and (zone != "hideout_zone") and self.rng.random() < (0.04 + activity * 0.03)
            if grooming_event:
                grooming_count += 1
                hourly_grooming[ts.hour] += 1

            digging_detected = zone == "sand_bath_zone" and self.rng.random() < (0.07 + activity * 0.06)
            if digging_detected:
                digging_seconds_total += 60.0
                hourly_digging_seconds[ts.hour] += 60.0
                bedding_evenness = _clamp(bedding_evenness - self.rng.uniform(0.003, 0.01), 0.2, 1.0)
            else:
                bedding_evenness = _clamp(bedding_evenness + self.rng.uniform(0.0002, 0.002), 0.2, 1.0)

            stereotypy_signal = 0.08
            if zone == "wheel_zone" and not running:
                stereotypy_signal += 0.18
            if water_level < 0.25 or food_level < 0.28:
                stereotypy_signal += 0.14
            stereotypy_signal += self.rng.uniform(-0.03, 0.04)

            anxiety_index = _clamp(anxiety_index * 0.94 + stereotypy_signal * 0.06, 0.0, 1.0)
            anxiety_series.append({"timestamp": ts.isoformat(), "anxiety_index": round(anxiety_index, 4)})

            if anxiety_index > self.config.alerts.max_stereotypy_index and self.rng.random() < 0.05:
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "stereotypy",
                        "severity": "medium",
                        "message": "Stereotyped behavior index is elevated",
                    }
                )

            # Hoarding activity points.
            if zone == "food_zone" and self.rng.random() < 0.05:
                target_zone = self.rng.choice(["sand_bath_zone", "hideout_zone"])
                hx, hy = self._sample_position(str(target_zone))
                hr = int(_clamp(hy / self.config.video.frame_height * hoard_hotspots_map.shape[0], 0, hoard_hotspots_map.shape[0] - 1))
                hc = int(_clamp(hx / self.config.video.frame_width * hoard_hotspots_map.shape[1], 0, hoard_hotspots_map.shape[1] - 1))
                hoard_hotspots_map[hr, hc] += 1.0

            # Environment modeling.
            hour = ts.hour + ts.minute / 60.0
            day_light_wave = 0.15 * (1.0 + math.sin(2 * math.pi * (hour - 6.0) / 24.0))
            brightness = _clamp(
                brightness * 0.86 + (0.55 + day_light_wave - activity * 0.08 + self.rng.normal(0.0, 0.02)) * 0.14,
                0.05,
                0.98,
            )

            cleanliness = _clamp(cleanliness - (0.0006 + activity * 0.0005), 0.18, 1.0)
            if self.rng.random() < 0.02:
                cleanliness = _clamp(cleanliness + self.rng.uniform(0.08, 0.22), 0.18, 1.0)

            dark_ratio = _clamp((1.0 - cleanliness) * 0.42 + self.rng.normal(0.03, 0.015), 0.01, 0.75)
            edge_density = _clamp(0.07 + activity * 0.12 + self.rng.normal(0.0, 0.015), 0.02, 0.55)
            lighting_score = self._lighting_score(brightness)
            cleanliness_score = _clamp(1.0 - dark_ratio / max(self.config.environment.hygiene_dark_ratio_threshold, 1e-6), 0.0, 1.0)
            clutter_score = _clamp(1.0 - edge_density / max(self.config.environment.clutter_edge_threshold, 1e-6), 0.0, 1.0)

            comfort = _clamp(
                lighting_score * 0.28
                + cleanliness_score * 0.30
                + bedding_evenness * 0.24
                + clutter_score * 0.18,
                0.0,
                1.0,
            )
            env_risk = _comfort_label(comfort)

            environment_series.append(
                {
                    "timestamp": ts.isoformat(),
                    "brightness": round(brightness, 4),
                    "dark_ratio": round(dark_ratio, 4),
                    "edge_density": round(edge_density, 4),
                    "cleanliness_score": round(cleanliness_score, 4),
                    "bedding_evenness": round(bedding_evenness, 4),
                    "lighting_score": round(lighting_score, 4),
                    "comfort_index": round(comfort, 4),
                    "risk_level": env_risk,
                }
            )
            environment_hourly[ts.hour].append(comfort)

            if comfort < 0.45 and self.rng.random() < 0.05:
                alerts.append(
                    {
                        "timestamp": ts.isoformat(),
                        "type": "environment_risk",
                        "severity": "medium",
                        "message": "Living environment comfort index is low",
                    }
                )

            # Motion-trigger simulation.
            motion_ratio = _clamp(activity * 0.014 + (0.006 if running else 0.0) + self.rng.normal(0.0, 0.0022), 0.0, 0.09)
            is_motion = motion_ratio >= self.config.motion_trigger.min_motion_ratio
            if is_motion:
                motion_streak += 1
                idle_streak = 0
            else:
                idle_streak += 1
                motion_streak = 0

            start_capture = False
            stop_capture = False

            if (not capture_active) and motion_streak >= self.config.motion_trigger.start_trigger_frames:
                capture_active = True
                segment_start = ts
                start_capture = True

            if capture_active and idle_streak >= self.config.motion_trigger.stop_trigger_frames:
                capture_active = False
                stop_capture = True
                if segment_start is not None:
                    motion_segments.append(
                        {
                            "start": segment_start.isoformat(),
                            "end": ts.isoformat(),
                            "duration_s": round((ts - segment_start).total_seconds(), 2),
                        }
                    )
                    segment_start = None

            motion_series.append(
                {
                    "timestamp": ts.isoformat(),
                    "motion_ratio": round(motion_ratio, 5),
                    "is_motion": is_motion,
                    "capture_active": capture_active,
                    "start_capture": start_capture,
                    "stop_capture": stop_capture,
                }
            )

            hourly_distance[ts.hour] += distance_delta_m / 1000.0

            if idx % 3 == 0:
                trajectory.append(
                    {
                        "timestamp": ts.isoformat(),
                        "x": round(x, 2),
                        "y": round(y, 2),
                        "zone": zone,
                    }
                )

            time_series.append(
                {
                    "timestamp": ts.isoformat(),
                    "rpm": round(rpm, 3),
                    "speed_kmh": round(speed_kmh, 3),
                    "distance_m_total": round(total_distance_m, 3),
                    "running": running,
                    "direction": direction,
                    "running_streak_min": round(running_streak_min, 2),
                    "x": round(x, 2),
                    "y": round(y, 2),
                    "zone": zone,
                    "water_level_ratio": round(water_level, 4),
                    "food_coverage_ratio": round(food_level, 4),
                    "gnaw_wear_index": round(gnaw_wear, 4),
                    "grooming_count_total": grooming_count,
                    "digging_seconds_total": int(digging_seconds_total),
                    "anxiety_index": round(anxiety_index, 4),
                    "comfort_index": round(comfort, 4),
                    "motion_ratio": round(motion_ratio, 5),
                    "capture_active": capture_active,
                }
            )

            water_series.append({"timestamp": ts.isoformat(), "value": round(water_level, 4)})
            food_series.append({"timestamp": ts.isoformat(), "value": round(food_level, 4)})
            gnaw_series.append({"timestamp": ts.isoformat(), "value": round(gnaw_wear, 4)})

            capture_every_min = max(1, self.config.health.capture_interval_seconds // 60)
            if idx % capture_every_min == 0:
                volume_trend = _clamp(volume_trend + self.rng.normal(0.0, 0.003), -0.18, 0.18)
                volume_ratio = _clamp(
                    volume_trend + (0.22 - food_level) * 0.22 + self.rng.normal(0.0, 0.01),
                    -0.22,
                    0.26,
                )
                fur_score = _clamp(0.85 - anxiety_index * 0.3 + self.rng.normal(0.0, 0.03), 0.25, 0.99)
                expression_score = _clamp(0.88 - anxiety_index * 0.35 + self.rng.normal(0.0, 0.04), 0.2, 0.99)
                gait_score = _clamp(0.87 - abs(volume_ratio) * 0.9 + self.rng.normal(0.0, 0.04), 0.15, 0.99)

                risk_numeric = _clamp(
                    (1.0 - fur_score) * 0.25
                    + (1.0 - expression_score) * 0.25
                    + abs(volume_ratio) * 1.4
                    + (1.0 - gait_score) * 0.25,
                    0.0,
                    1.0,
                )
                risk = _risk_label(risk_numeric)

                if risk == "high":
                    alerts.append(
                        {
                            "timestamp": ts.isoformat(),
                            "type": "health_risk",
                            "severity": "high",
                            "message": "Visual health score indicates potential issue",
                        }
                    )

                health_scans.append(
                    {
                        "timestamp": ts.isoformat(),
                        "fur_score": round(fur_score, 4),
                        "expression_score": round(expression_score, 4),
                        "volume_change_ratio": round(volume_ratio, 4),
                        "gait_symmetry_score": round(gait_score, 4),
                        "risk_level": risk,
                        "risk_numeric": round(risk_numeric, 4),
                        "notes": "synthetic-vlm",
                    }
                )

        if capture_active and segment_start is not None:
            motion_segments.append(
                {
                    "start": segment_start.isoformat(),
                    "end": now.isoformat(),
                    "duration_s": round((now - segment_start).total_seconds(), 2),
                }
            )

        # Aggregate metrics
        reverse_ratio = direction_counts["reverse"] / max(direction_counts["forward"] + direction_counts["reverse"], 1)
        running_ratio = running_minutes / max(history, 1)

        max_heat = float(np.max(heatmap)) if float(np.max(heatmap)) > 0 else 1.0
        heatmap_norm = (heatmap / max_heat).round(4).tolist()

        hoard_hotspots: List[Dict[str, object]] = []
        if float(np.max(hoard_hotspots_map)) > 0:
            max_hoard = float(np.max(hoard_hotspots_map))
            flat = hoard_hotspots_map.reshape(-1)
            top_n = 6
            idxs = np.argpartition(flat, -top_n)[-top_n:]
            idxs = idxs[np.argsort(flat[idxs])[::-1]]
            for i in idxs:
                row = int(i // hoard_hotspots_map.shape[1])
                col = int(i % hoard_hotspots_map.shape[1])
                hoard_hotspots.append(
                    {
                        "grid_row": row,
                        "grid_col": col,
                        "intensity": round(float(flat[i]) / max_hoard, 4),
                    }
                )

        total_zone_dwell = sum(zone_dwell_seconds.values())
        zone_ratio = {
            zone: round(seconds / total_zone_dwell, 4) if total_zone_dwell > 0 else 0.0
            for zone, seconds in zone_dwell_seconds.items()
        }

        stop_go_per_hour = defaultdict(int)
        for switch_ts in stop_go_switches:
            stop_go_per_hour[switch_ts.hour] += 1

        odometer_hourly = [
            {
                "hour": f"{hour:02d}:00",
                "distance_km": round(hourly_distance.get(hour, 0.0), 4),
                "stop_go_events": int(stop_go_per_hour.get(hour, 0)),
            }
            for hour in range(24)
        ]

        behavior_hourly = [
            {
                "hour": f"{hour:02d}:00",
                "grooming_count": int(hourly_grooming.get(hour, 0)),
                "digging_minutes": round(hourly_digging_seconds.get(hour, 0.0) / 60.0, 2),
            }
            for hour in range(24)
        ]

        environment_hourly_series = [
            {
                "hour": f"{hour:02d}:00",
                "comfort_index": round(float(np.mean(environment_hourly[hour])) if environment_hourly[hour] else 0.0, 4),
            }
            for hour in range(24)
        ]

        alerts = sorted(alerts, key=lambda a: a["timestamp"])
        latest_health = health_scans[-1] if health_scans else None
        latest = time_series[-1]
        latest_env = environment_series[-1] if environment_series else None

        summary = {
            "distance_km_24h": round(total_distance_m / 1000.0, 3),
            "patrol_length_m_24h": round(patrol_length_m, 3),
            "avg_speed_kmh": round(float(np.mean([x["speed_kmh"] for x in time_series])), 3),
            "max_speed_kmh": round(float(np.max([x["speed_kmh"] for x in time_series])), 3),
            "running_ratio": round(running_ratio, 4),
            "reverse_ratio": round(reverse_ratio, 4),
            "max_running_streak_min": round(max_running_streak_min, 2),
            "escape_count": len(escape_events),
            "water_level_ratio": latest["water_level_ratio"],
            "food_coverage_ratio": latest["food_coverage_ratio"],
            "gnaw_wear_index": latest["gnaw_wear_index"],
            "anxiety_index": latest["anxiety_index"],
            "grooming_count_total": latest["grooming_count_total"],
            "digging_minutes_total": round(latest["digging_seconds_total"] / 60.0, 2),
            "health_risk_level": latest_health["risk_level"] if latest_health else "unknown",
            "environment_comfort_index": latest_env["comfort_index"] if latest_env else 0.0,
            "environment_risk_level": latest_env["risk_level"] if latest_env else "unknown",
            "capture_segments": len(motion_segments),
        }

        awake_seconds_by_hour = defaultdict(float)
        observed_seconds_by_hour = defaultdict(float)
        awake_switches = 0
        prev_awake: Optional[bool] = None
        for idx in range(len(time_series) - 1):
            current = time_series[idx]
            nxt = time_series[idx + 1]
            try:
                ts_curr = datetime.fromisoformat(str(current.get("timestamp", "")))
                ts_next = datetime.fromisoformat(str(nxt.get("timestamp", "")))
            except ValueError:
                continue

            dt_seconds = max(0.0, (ts_next - ts_curr).total_seconds())
            if dt_seconds <= 0:
                continue

            awake = str(current.get("zone", "")) != "hideout_zone"
            hour = ts_curr.hour
            observed_seconds_by_hour[hour] += dt_seconds
            if awake:
                awake_seconds_by_hour[hour] += dt_seconds
            if prev_awake is not None and awake != prev_awake:
                awake_switches += 1
            prev_awake = awake

        observed_seconds_total = float(sum(observed_seconds_by_hour.values()))
        awake_seconds_total = float(sum(awake_seconds_by_hour.values()))
        awake_ratio = awake_seconds_total / observed_seconds_total if observed_seconds_total > 1e-6 else 0.0
        night_awake_seconds = float(
            sum(awake_seconds_by_hour[h] for h in [19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6])
        )
        night_activity_ratio = night_awake_seconds / awake_seconds_total if awake_seconds_total > 1e-6 else 0.0
        sleep_fragmentation_index = _clamp(awake_switches / 8.0, 0.0, 1.0)
        night_alignment = _clamp(1.0 - abs(night_activity_ratio - 0.75) / 0.75, 0.0, 1.0)
        routine_score = _clamp(night_alignment * 0.4 + 0.6 * 0.35 + (1.0 - sleep_fragmentation_index) * 0.25, 0.0, 1.0)

        schedule = {
            "day": now.date().isoformat(),
            "first_out": first_out.isoformat() if first_out else "",
            "last_in": last_in.isoformat() if last_in else "",
            "awake_ratio": round(awake_ratio, 4),
            "night_activity_ratio": round(night_activity_ratio, 4),
            "sleep_fragmentation_index": round(sleep_fragmentation_index, 4),
            "routine_score": round(routine_score, 4),
            "vlm_enabled": bool(self.config.health.vlm.enabled),
            "vlm_samples": 0,
        }

        return {
            "generated_at": now.isoformat(),
            "meta": {
                "history_minutes": history,
                "frame_width": self.config.video.frame_width,
                "frame_height": self.config.video.frame_height,
                "source": "virtual-data",
                "runtime_profile": self.config.runtime.profile,
            },
            "summary": summary,
            "timeseries": time_series,
            "odometer": {
                "hourly": odometer_hourly,
                "direction_distribution": direction_counts,
                "stop_go_switches": [x.isoformat() for x in stop_go_switches[-120:]],
            },
            "spatial": {
                "heatmap": heatmap_norm,
                "heatmap_rows": len(heatmap_norm),
                "heatmap_cols": len(heatmap_norm[0]) if heatmap_norm else 0,
                "trajectory": trajectory,
                "zone_dwell_seconds": {k: round(v, 2) for k, v in zone_dwell_seconds.items()},
                "zone_dwell_ratio": zone_ratio,
                "escape_events": escape_events,
            },
            "health": {
                "latest": latest_health,
                "scans": health_scans,
            },
            "inventory": {
                "water_series": water_series,
                "food_series": food_series,
                "gnaw_series": gnaw_series,
                "hoard_hotspots": hoard_hotspots,
            },
            "behavior": {
                "schedule": schedule,
                "hourly": behavior_hourly,
                "anxiety_series": anxiety_series,
            },
            "environment": {
                "latest": latest_env,
                "series": environment_series,
                "hourly": environment_hourly_series,
            },
            "overview": {
                "featured_photo": None,
            },
            "motion": {
                "series": motion_series,
                "segments": motion_segments,
            },
            "alerts": alerts[-300:],
        }
