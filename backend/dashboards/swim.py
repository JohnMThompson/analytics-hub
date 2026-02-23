"""
Swim Tracking Dashboard Module

Provides swim tracking data from the swimming database.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query

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

# Create router for swim endpoints
router = APIRouter(prefix="/api/dashboards/swim_tracking", tags=["swim"])


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


# Global instance for router
_swim_dashboard: SwimTrackingDashboard = None

def get_swim_dashboard() -> SwimTrackingDashboard:
    """Dependency to inject swim dashboard"""
    if _swim_dashboard is None:
        raise ValueError("Swim dashboard not initialized")
    return _swim_dashboard

def set_swim_dashboard(dashboard: SwimTrackingDashboard):
    """Set the global swim dashboard instance"""
    global _swim_dashboard
    _swim_dashboard = dashboard


# Router endpoints using Depends to avoid closure issues
@router.get("/data")
async def swim_data(dashboard: SwimTrackingDashboard = Depends(get_swim_dashboard)):
    return await dashboard.get_data()

@router.get("/summary")
async def swim_summary(
    days: int = Query(365),
    dashboard: SwimTrackingDashboard = Depends(get_swim_dashboard)
):
    return await dashboard.get_summary_endpoint(days=days)

@router.get("/distance_by_date")
async def swim_distance(
    days: int = Query(365),
    dashboard: SwimTrackingDashboard = Depends(get_swim_dashboard)
):
    return await dashboard.get_distance_by_date_endpoint(days=days)

@router.get("/records")
async def swim_records(
    days: int = Query(365),
    limit: int = Query(50),
    dashboard: SwimTrackingDashboard = Depends(get_swim_dashboard)
):
    return await dashboard.get_records_endpoint(days=days, limit=limit)

@router.get("/stroke_breakdown")
async def swim_strokes(
    days: int = Query(365),
    dashboard: SwimTrackingDashboard = Depends(get_swim_dashboard)
):
    return await dashboard.get_stroke_breakdown_endpoint(days=days)
