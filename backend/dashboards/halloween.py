"""
Halloween dashboard module.

Provides trick-or-treater yearly count trends.
"""
from typing import Any, Dict, List
import logging

from fastapi import HTTPException

logger = logging.getLogger(__name__)

try:
    from dashboards.base import BaseDashboard, DashboardMetadata
    from config import get_db_engine
    from queries.halloween import (
        get_cumulative_by_minute,
        get_quarter_hour_breakdown,
        get_summary,
        get_yearly_counts,
    )
except ImportError:
    from backend.dashboards.base import BaseDashboard, DashboardMetadata
    from backend.config import get_db_engine
    from backend.queries.halloween import (
        get_cumulative_by_minute,
        get_quarter_hour_breakdown,
        get_summary,
        get_yearly_counts,
    )


class HalloweenDashboard(BaseDashboard):
    """Halloween trick-or-treater analytics dashboard."""

    metadata = DashboardMetadata(
        id="halloween_tracking",
        title="Halloween Tracking",
        description="Annual trick-or-treater counts",
        refresh_interval=86400,
        colors={"primary": "#f97316", "accent": "#f59e0b"},
    )

    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine("halloween")

    def _raise_internal_error(self, operation: str, error: Exception) -> None:
        logger.exception("dashboard_error dashboard_id=halloween_tracking operation=%s", operation)
        raise HTTPException(
            status_code=500,
            detail=f"halloween_tracking.{operation} failed: {error}",
        ) from error

    async def get_data(self) -> Dict[str, Any]:
        try:
            summary = await get_summary(self.engine)
            yearly = await get_yearly_counts(self.engine)
            cumulative = await get_cumulative_by_minute(self.engine)
            quarter_hour = await get_quarter_hour_breakdown(self.engine)
            return {
                "summary": summary,
                "yearly_counts": yearly,
                "cumulative_by_minute": cumulative,
                "quarter_hour_breakdown": quarter_hour,
            }
        except Exception as error:
            self._raise_internal_error("data", error)

    async def get_summary_endpoint(self) -> Dict[str, Any]:
        try:
            return await get_summary(self.engine)
        except Exception as error:
            self._raise_internal_error("summary", error)

    async def get_yearly_counts_endpoint(self) -> List[Dict[str, Any]]:
        try:
            return await get_yearly_counts(self.engine)
        except Exception as error:
            self._raise_internal_error("yearly_counts", error)

    async def get_cumulative_by_minute_endpoint(self) -> Dict[str, Any]:
        try:
            return await get_cumulative_by_minute(self.engine)
        except Exception as error:
            self._raise_internal_error("cumulative_by_minute", error)

    async def get_quarter_hour_breakdown_endpoint(self) -> Dict[str, Any]:
        try:
            return await get_quarter_hour_breakdown(self.engine)
        except Exception as error:
            self._raise_internal_error("quarter_hour_breakdown", error)

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        return [
            {"path": "summary", "endpoint": self.get_summary_endpoint},
            {"path": "yearly_counts", "endpoint": self.get_yearly_counts_endpoint},
            {"path": "cumulative_by_minute", "endpoint": self.get_cumulative_by_minute_endpoint},
            {"path": "quarter_hour_breakdown", "endpoint": self.get_quarter_hour_breakdown_endpoint},
        ]
