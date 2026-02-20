"""Algorithm modules for hamster monitoring."""

from .behavioral_logging import BehavioralLogger
from .environment_analysis import EnvironmentAnalyzer
from .inventory_watch import InventoryWatcher
from .motion_trigger import MotionChangeAnalyzer
from .spatial_analytics import SpatialAnalyzer
from .virtual_odometer import VirtualOdometer
from .visual_health import VisualHealthScanner

__all__ = [
    "BehavioralLogger",
    "EnvironmentAnalyzer",
    "InventoryWatcher",
    "MotionChangeAnalyzer",
    "SpatialAnalyzer",
    "VirtualOdometer",
    "VisualHealthScanner",
]
