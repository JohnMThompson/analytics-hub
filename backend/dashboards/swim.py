"""
Swim Tracking Dashboard Module

Provides swim tracking data from the swimming database.
"""
from typing import Dict, Any

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
    
    Shows swim statistics, daily distances, and individual workout records.
    """
    
    metadata = DashboardMetadata(
        id="swim_tracking",
        title="Swim Tracking",
        description="Personal swimming statistics and workout history",
        refresh_interval=3600,  # 1 hour
        colors={
            "primary": "#0284c7",
            "accent": "#06b6d4",
            "success": "#10b981",
            "danger": "#ef4444"
        }
    )
    
    def __init__(self, db_config: Dict[str, Any]):
        super().__init__(db_config)
        self.engine = get_db_engine("swim")
    
    async def get_data(self) -> Dict[str, Any]:
        """
        Get all swim tracking data
        
        Returns:
            Dictionary with summary, daily data, records, and stroke breakdown
        """
        try:
            summary = await get_swim_summary(self.engine, days=365)
            daily = await get_distance_by_date(self.engine, days=365)
            records = await get_swim_records(self.engine, days=365, limit=50)
            strokes = await get_stroke_breakdown(self.engine, days=365)
            
            return {
                "success": True,
                "summary": summary,
                "daily": daily,
                "records": records,
                "strokes": strokes,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_summary_endpoint(self) -> Dict[str, Any]:
        """Get swim summary statistics"""
        try:
            return await get_swim_summary(self.engine, days=365)
        except Exception as e:
            return {"error": str(e)}
    
    async def get_distance_by_date_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get daily distance data"""
        try:
            return await get_distance_by_date(self.engine, days=days)
        except Exception as e:
            return {"error": str(e)}
    
    async def get_records_endpoint(self, days: int = 365, limit: int = 50) -> Dict[str, Any]:
        """Get individual swim records"""
        try:
            return await get_swim_records(self.engine, days=days, limit=limit)
        except Exception as e:
            return {"error": str(e)}
    
    async def get_stroke_breakdown_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get stroke type breakdown"""
        try:
            return await get_stroke_breakdown(self.engine, days=days)
        except Exception as e:
            return {"error": str(e)}
