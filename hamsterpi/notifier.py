from __future__ import annotations

import shutil
import subprocess
from datetime import datetime, timedelta
from typing import Optional


class MacNotifier:
    """Send local notifications on macOS via terminal-notifier."""

    def __init__(self, command: str = "terminal-notifier", cooldown_seconds: int = 45) -> None:
        self.command = command
        self.cooldown = timedelta(seconds=max(cooldown_seconds, 1))
        self._last_sent_at: Optional[datetime] = None

    def is_available(self) -> bool:
        return shutil.which(self.command) is not None

    def notify(self, title: str, message: str, subtitle: str = "HamsterPi Alert") -> bool:
        now = datetime.now()
        if self._last_sent_at and now - self._last_sent_at < self.cooldown:
            return False

        if not self.is_available():
            return False

        subprocess.run(
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
        self._last_sent_at = now
        return True
