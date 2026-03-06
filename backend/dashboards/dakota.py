"""
Dakota concert calendar dashboard module.
"""
from typing import Any, Dict
import logging

from fastapi import HTTPException

logger = logging.getLogger(__name__)

try:
    from dashboards.base import BaseDashboard, DashboardMetadata
    from config import get_db_engine
    from queries.dakota import get_upcoming_events
except ImportError:
    from backend.dashboards.base import BaseDashboard, DashboardMetadata
    from backend.config import get_db_engine
    from backend.queries.dakota import get_upcoming_events


class DakotaConcertCalendarDashboard(BaseDashboard):
    """Dakota concert calendar dashboard."""

    metadata = DashboardMetadata(
        id="dakota_concert_calendar",
        title="Dakota Concert Calendar",
        description="Upcoming concerts at Dakota Jazz Club",
        refresh_interval=1800,
        colors={"primary": "#00AEEF", "accent": "#00AEEF"},
    )

    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine("dakota")

    def _raise_internal_error(self, operation: str, error: Exception) -> None:
        logger.exception("dashboard_error dashboard_id=dakota_concert_calendar operation=%s", operation)
        raise HTTPException(
            status_code=500,
            detail=f"dakota_concert_calendar.{operation} failed: {error}",
        ) from error

    async def get_data(self) -> Dict[str, Any]:
        try:
            return {"events": await get_upcoming_events(self.engine)}
        except Exception as error:
            self._raise_internal_error("data", error)
