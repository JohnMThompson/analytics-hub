"""
Swim Tracking Dashboard Module

Provides swim tracking data from the swimming database.
"""
from typing import Dict, Any, List

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
    
    async def get_data(self) -> Dict[str, Any]:
        """Get all swim data"""
        try:
            summary = await get_swim_summary(self.engine)
            return summary
        except Exception as e:
            return {"error": str(e)}
    
    async def get_summary_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get swim summary for a time period"""
        try:
            summary = await get_swim_summary(self.engine, days=days)
            return summary
        except Exception as e:
            return {"error": str(e)}
    
    async def get_distance_by_date_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get daily distances"""
        try:
            distance_data = await get_distance_by_date(self.engine, days=days)
            return distance_data
        except Exception as e:
            return {"error": str(e)}
    
    async def get_records_endpoint(self, days: int = 365, limit: int = 50) -> Dict[str, Any]:
        """Get personal swimming records"""
        try:
            records = await get_swim_records(self.engine, days=days, limit=limit)
            return records
        except Exception as e:
            return {"error": str(e)}
    
    async def get_stroke_breakdown_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get stroke type breakdown"""
        try:
            breakdown = await get_stroke_breakdown(self.engine, days=days)
            return breakdown
        except Exception as e:
            return {"error": str(e)}

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        """Define swim dashboard-specific routes."""
        return [
            {"path": "summary", "endpoint": self.get_summary_endpoint},
            {"path": "distance_by_date", "endpoint": self.get_distance_by_date_endpoint},
            {"path": "records", "endpoint": self.get_records_endpoint},
            {"path": "stroke_breakdown", "endpoint": self.get_stroke_breakdown_endpoint},
        ]
