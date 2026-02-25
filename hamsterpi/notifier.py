from __future__ import annotations

import shutil
import subprocess
from datetime import datetime, timedelta
from typing import Optional

import requests

from hamsterpi.logging_system import get_logger

LOGGER = get_logger(__name__)


class BaseNotifier:
    def __init__(self, cooldown_seconds: int = 45) -> None:
        self.cooldown = timedelta(seconds=max(int(cooldown_seconds), 1))
        self._last_sent_at: Optional[datetime] = None

    def _acquire_slot(self, name: str) -> Optional[datetime]:
        now = datetime.now()
        if self._last_sent_at and now - self._last_sent_at < self.cooldown:
            LOGGER.debug("%s notifier cooldown active", name)
            return None
        return now

    def _mark_sent(self, when: datetime) -> None:
        self._last_sent_at = when

    def notify(self, title: str, message: str, subtitle: str = "HamsterPi Alert") -> bool:
        raise NotImplementedError


class NullNotifier(BaseNotifier):
    def notify(self, title: str, message: str, subtitle: str = "HamsterPi Alert") -> bool:
        return False


class MacNotifier(BaseNotifier):
    """Send local notifications on macOS via terminal-notifier."""

    def __init__(self, command: str = "terminal-notifier", cooldown_seconds: int = 45) -> None:
        super().__init__(cooldown_seconds=cooldown_seconds)
        self.command = str(command or "").strip()

    def is_available(self) -> bool:
        return bool(self.command) and shutil.which(self.command) is not None

    def notify(self, title: str, message: str, subtitle: str = "HamsterPi Alert") -> bool:
        now = self._acquire_slot("Mac")
        if now is None:
            return False

        if not self.is_available():
            LOGGER.warning(
                "Mac notifier command is unavailable",
                extra={"context": {"command": self.command}},
            )
            return False

        try:
            result = subprocess.run(
                [
                    self.command,
                    "-title",
                    title,
                    "-subtitle",
                    subtitle,
                    "-message",
                    message,
                ],
                check=False,
            )
        except OSError as exc:
            LOGGER.warning(
                "Mac notifier execution failed",
                extra={"context": {"command": self.command, "error": str(exc)}},
            )
            return False

        if result.returncode != 0:
            LOGGER.warning(
                "Mac notifier command returned non-zero exit code",
                extra={"context": {"command": self.command, "returncode": result.returncode}},
            )
            return False

        self._mark_sent(now)
        LOGGER.info(
            "Mac notification sent",
            extra={"context": {"title": title, "subtitle": subtitle}},
        )
        return True


class BarkNotifier(BaseNotifier):
    """Send push notifications via Bark service."""

    def __init__(
        self,
        server: str = "https://api.day.app",
        device_key: str = "",
        group: str = "HamsterPi",
        sound: str = "",
        cooldown_seconds: int = 45,
        timeout_seconds: float = 6.0,
    ) -> None:
        super().__init__(cooldown_seconds=cooldown_seconds)
        self.server = str(server or "https://api.day.app").strip().rstrip("/")
        self.device_key = str(device_key or "").strip()
        self.group = str(group or "").strip()
        self.sound = str(sound or "").strip()
        self.timeout_seconds = max(float(timeout_seconds), 1.0)

    def endpoint(self) -> str:
        return f"{self.server}/{self.device_key}"

    def notify(self, title: str, message: str, subtitle: str = "HamsterPi Alert") -> bool:
        now = self._acquire_slot("Bark")
        if now is None:
            return False

        if not self.device_key:
            LOGGER.warning("Bark notifier device key is empty")
            return False

        payload = {
            "title": title,
            "subtitle": subtitle,
            "body": message,
        }
        if self.group:
            payload["group"] = self.group
        if self.sound:
            payload["sound"] = self.sound

        try:
            resp = requests.post(self.endpoint(), json=payload, timeout=self.timeout_seconds)
            resp.raise_for_status()
        except requests.RequestException as exc:
            LOGGER.warning(
                "Bark notification request failed",
                extra={"context": {"endpoint": self.endpoint(), "error": str(exc)}},
            )
            return False

        try:
            data = resp.json()
        except ValueError:
            data = None
        if isinstance(data, dict) and int(data.get("code", 200)) != 200:
            LOGGER.warning(
                "Bark notification rejected",
                extra={"context": {"endpoint": self.endpoint(), "response": data}},
            )
            return False

        self._mark_sent(now)
        LOGGER.info(
            "Bark notification sent",
            extra={"context": {"title": title, "subtitle": subtitle, "endpoint": self.endpoint()}},
        )
        return True


def build_notifier(
    provider: str = "mac",
    cooldown_seconds: int = 45,
    mac_command: str = "terminal-notifier",
    bark_server: str = "https://api.day.app",
    bark_device_key: str = "",
    bark_group: str = "HamsterPi",
    bark_sound: str = "",
) -> BaseNotifier:
    selected = str(provider or "mac").strip().lower()
    if selected in {"none", "off", "disabled"}:
        return NullNotifier(cooldown_seconds=cooldown_seconds)
    if selected == "bark":
        return BarkNotifier(
            server=bark_server,
            device_key=bark_device_key,
            group=bark_group,
            sound=bark_sound,
            cooldown_seconds=cooldown_seconds,
        )
    return MacNotifier(command=mac_command, cooldown_seconds=cooldown_seconds)
