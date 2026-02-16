from __future__ import annotations

import json
import logging
from collections import Counter, deque
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Iterable, List, Optional, Set

from hamsterpi.config import LoggingConfig, project_root

_HANDLER_FLAG = "_hamsterpi_handler"
_LOCK = Lock()


def _normalize_level(level: str) -> str:
    upper = str(level).strip().upper()
    allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
    if upper not in allowed:
        return "INFO"
    return upper


def resolve_log_file(file_path: str | Path) -> Path:
    path = Path(file_path)
    if path.is_absolute():
        return path
    return project_root() / path


class JsonLineFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created).isoformat(timespec="seconds")
        payload: Dict[str, Any] = {
            "timestamp": ts,
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        context = getattr(record, "context", None)
        if context is not None:
            payload["context"] = context

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def _remove_managed_handlers(logger: logging.Logger) -> None:
    for handler in list(logger.handlers):
        if getattr(handler, _HANDLER_FLAG, False):
            logger.removeHandler(handler)
            try:
                handler.close()
            except OSError:
                pass


def configure_logging(logging_cfg: Optional[LoggingConfig] = None) -> Path:
    cfg = logging_cfg or LoggingConfig()
    level_name = _normalize_level(cfg.level)
    level = getattr(logging, level_name, logging.INFO)
    log_file = resolve_log_file(cfg.file_path)
    log_file.parent.mkdir(parents=True, exist_ok=True)

    with _LOCK:
        root = logging.getLogger()
        root.setLevel(logging.DEBUG)
        _remove_managed_handlers(root)

        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=cfg.max_bytes,
            backupCount=cfg.backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(JsonLineFormatter())
        setattr(file_handler, _HANDLER_FLAG, True)
        root.addHandler(file_handler)

        if cfg.console_enabled:
            console_handler = logging.StreamHandler()
            console_handler.setLevel(level)
            console_handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S",
                )
            )
            setattr(console_handler, _HANDLER_FLAG, True)
            root.addHandler(console_handler)

    return log_file


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def _candidate_log_files(log_file: Path) -> List[Path]:
    files: List[Path] = []
    pattern = f"{log_file.name}*"
    for path in log_file.parent.glob(pattern):
        if not path.is_file():
            continue
        files.append(path)
    files.sort(key=lambda p: p.stat().st_mtime)
    return files


def _parse_line(line: str) -> Optional[Dict[str, Any]]:
    raw = line.strip()
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {
            "timestamp": "",
            "level": "INFO",
            "logger": "plain",
            "message": raw,
        }

    return {
        "timestamp": str(data.get("timestamp", "")),
        "level": _normalize_level(str(data.get("level", "INFO"))),
        "logger": str(data.get("logger", "")),
        "message": str(data.get("message", "")),
        "context": data.get("context"),
        "exception": data.get("exception"),
    }


def _record_matches(record: Dict[str, Any], levels: Optional[Set[str]], keyword: str) -> bool:
    if levels and record.get("level") not in levels:
        return False

    if keyword:
        haystack = " ".join(
            [
                str(record.get("timestamp", "")),
                str(record.get("level", "")),
                str(record.get("logger", "")),
                str(record.get("message", "")),
                str(record.get("context", "")),
            ]
        ).lower()
        if keyword not in haystack:
            return False
    return True


def read_log_records(
    file_path: str | Path,
    limit: int = 1000,
    levels: Optional[Iterable[str]] = None,
    keyword: str = "",
) -> List[Dict[str, Any]]:
    size = min(max(int(limit), 1), 10000)
    level_set = {_normalize_level(level) for level in levels} if levels else None
    kw = keyword.strip().lower()

    records: deque[Dict[str, Any]] = deque(maxlen=size)
    log_file = resolve_log_file(file_path)

    for source in _candidate_log_files(log_file):
        try:
            with source.open("r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    parsed = _parse_line(line)
                    if parsed is None:
                        continue
                    if not _record_matches(parsed, level_set, kw):
                        continue
                    parsed["source_file"] = source.name
                    records.append(parsed)
        except OSError:
            continue

    return list(records)


def level_counts(file_path: str | Path) -> Dict[str, int]:
    counts: Counter[str] = Counter()
    log_file = resolve_log_file(file_path)
    for source in _candidate_log_files(log_file):
        try:
            with source.open("r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    parsed = _parse_line(line)
                    if parsed is None:
                        continue
                    counts[parsed.get("level", "INFO")] += 1
        except OSError:
            continue
    return {name: int(counts.get(name, 0)) for name in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]}
