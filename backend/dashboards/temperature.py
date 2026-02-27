"""
Home Office Temperature Dashboard Module.
"""
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

try:
    from dashboards.base import BaseDashboard, DashboardMetadata
    from config import get_db_engine
    from queries.temperature import (
        get_current_conditions,
        get_temperature_trend,
        get_temperature_stats,
    )
except ImportError:
    from backend.dashboards.base import BaseDashboard, DashboardMetadata
    from backend.config import get_db_engine
    from backend.queries.temperature import (
        get_current_conditions,
        get_temperature_trend,
        get_temperature_stats,
    )


class HomeOfficeTemperatureDashboard(BaseDashboard):
    """Dashboard for Raspberry Pi home-office temperature and humidity readings."""

    metadata = DashboardMetadata(
        id="home_office_temperature",
        title="Home Office Temperature",
        description="Raspberry Pi DHT22 sensor readings for temperature and humidity",
        refresh_interval=3600,
        colors={"primary": "#0e7490", "accent": "#06b6d4"},
    )

    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine("rpi")

    def _raise_internal_error(self, operation: str, error: Exception) -> None:
        logger.exception("dashboard_error dashboard_id=home_office_temperature operation=%s", operation)
        raise HTTPException(
            status_code=500,
            detail=f"home_office_temperature.{operation} failed: {error}"
        ) from error

    async def get_data(self) -> Dict[str, Any]:
        """Aggregate response for dashboard bootstrap."""
        try:
            current = await get_current_conditions(self.engine)
            stats = await get_temperature_stats(self.engine, days=None)
            trend = await get_temperature_trend(self.engine, days=None)
            return {
                "current_conditions": current,
                "statistics": stats,
                "temperature_trend": trend,
            }
        except Exception as e:
            self._raise_internal_error("data", e)

    async def get_current_conditions_endpoint(self) -> Dict[str, Any]:
        try:
            return await get_current_conditions(self.engine)
        except Exception as e:
            self._raise_internal_error("current_conditions", e)

    async def get_temperature_trend_endpoint(self, days: int = 365, all_time: bool = False) -> List[Dict[str, Any]]:
        try:
            days_filter: Optional[int] = None if all_time else days
            return await get_temperature_trend(self.engine, days=days_filter)
        except Exception as e:
            self._raise_internal_error("temperature_trend", e)

    async def get_statistics_endpoint(self, days: int = 365, all_time: bool = False) -> Dict[str, Any]:
        try:
            days_filter: Optional[int] = None if all_time else days
            return await get_temperature_stats(self.engine, days=days_filter)
        except Exception as e:
            self._raise_internal_error("statistics", e)

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        return [
            {"path": "current_conditions", "endpoint": self.get_current_conditions_endpoint},
            {"path": "temperature_trend", "endpoint": self.get_temperature_trend_endpoint},
            {"path": "statistics", "endpoint": self.get_statistics_endpoint},
        ]
