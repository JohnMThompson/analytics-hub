"""
Swim Tracking Dashboard Module

Provides swim tracking data from the swimming database.
"""
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

# Handle both Docker (flat structure) and local (backend.* imports)
try:
    from dashboards.base import BaseDashboard, DashboardMetadata
    from config import get_db_engine
    from queries.swim import (
        get_swim_summary,
        get_distance_by_date,
        get_swim_records,
        get_stroke_breakdown
    )
except ImportError:
    from backend.dashboards.base import BaseDashboard, DashboardMetadata
    from backend.config import get_db_engine
    from backend.queries.swim import (
        get_swim_summary,
        get_distance_by_date,
        get_swim_records,
        get_stroke_breakdown
    )

class SwimTrackingDashboard(BaseDashboard):
    """
    Swim Tracking Dashboard
    
    Shows swim workouts, distances, stroke breakdowns, and personal records.
    """
    
    metadata = DashboardMetadata(
        id="swim_tracking",
        title="Swim Tracking",
        description="Personal swim workout tracking",
        refresh_interval=3600,
        colors={"primary": "#0891b2", "accent": "#06b6d4"}
    )
    
    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine("swim")

    def _raise_internal_error(self, operation: str, error: Exception) -> None:
        """Raise a standardized API error for dashboard failures."""
        logger.exception("dashboard_error dashboard_id=swim_tracking operation=%s", operation)
        raise HTTPException(
            status_code=500,
            detail=f"swim_tracking.{operation} failed: {error}"
        ) from error
    
    async def get_data(self) -> Dict[str, Any]:
        """Get all swim data"""
        try:
            summary = await get_swim_summary(self.engine)
            return summary
        except Exception as e:
            self._raise_internal_error("data", e)
    
    async def get_summary_endpoint(self, days: int = 365, all_time: bool = False) -> Dict[str, Any]:
        """Get swim summary for a time period"""
        try:
            days_filter: Optional[int] = None if all_time else days
            summary = await get_swim_summary(self.engine, days=days_filter)
            return summary
        except Exception as e:
            self._raise_internal_error("summary", e)
    
    async def get_distance_by_date_endpoint(self, days: int = 365, all_time: bool = False) -> List[Dict[str, Any]]:
        """Get daily distances"""
        try:
            days_filter: Optional[int] = None if all_time else days
            distance_data = await get_distance_by_date(self.engine, days=days_filter)
            return distance_data
        except Exception as e:
            self._raise_internal_error("distance_by_date", e)
    
    async def get_records_endpoint(self, days: int = 365, limit: int = 50, all_time: bool = False) -> List[Dict[str, Any]]:
        """Get personal swimming records"""
        try:
            days_filter: Optional[int] = None if all_time else days
            records = await get_swim_records(self.engine, days=days_filter, limit=limit)
            return records
        except Exception as e:
            self._raise_internal_error("records", e)
    
    async def get_stroke_breakdown_endpoint(self, days: int = 365, all_time: bool = False) -> Dict[str, Any]:
        """Get stroke type breakdown"""
        try:
            days_filter: Optional[int] = None if all_time else days
            breakdown = await get_stroke_breakdown(self.engine, days=days_filter)
            return breakdown
        except Exception as e:
            self._raise_internal_error("stroke_breakdown", e)

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        """Define swim dashboard-specific routes."""
        return [
            {"path": "summary", "endpoint": self.get_summary_endpoint},
            {"path": "distance_by_date", "endpoint": self.get_distance_by_date_endpoint},
            {"path": "records", "endpoint": self.get_records_endpoint},
            {"path": "stroke_breakdown", "endpoint": self.get_stroke_breakdown_endpoint},
        ]
