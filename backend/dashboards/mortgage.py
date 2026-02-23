"""
Mortgage Rates Dashboard Module

Provides current and historical mortgage rate data from the mortgage database.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query

# Handle both Docker (flat structure) and local (backend.* imports)
try:
    from dashboards.base import BaseDashboard, DashboardMetadata
    from config import get_db_engine
    from queries.mortgage import (
        get_current_rate,
        get_historical_rates,
        get_rate_comparison,
        get_rate_statistics
    )
except ImportError:
    from backend.dashboards.base import BaseDashboard, DashboardMetadata
    from backend.config import get_db_engine
    from backend.queries.mortgage import (
        get_current_rate,
        get_historical_rates,
        get_rate_comparison,
        get_rate_statistics
    )

# Create router for mortgage endpoints
router = APIRouter(prefix="/api/dashboards/mortgage_rates", tags=["mortgage"])


class MortgageRateDashboard(BaseDashboard):
    """
    Mortgage Rates Dashboard
    
    Shows current mortgage rates, historical trends, and comparisons.
    """
    
    metadata = DashboardMetadata(
        id="mortgage_rates",
        title="Mortgage Rates",
        description="Current mortgage rates and historical trends",
        refresh_interval=3600,  # 1 hour
        colors={"primary": "#1e40af", "accent": "#60a5fa"}
    )
    
    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine(db_config)
    
    async def get_data(self) -> Dict[str, Any]:
        """Get all data for this dashboard"""
        try:
            current = await get_current_rate(self.engine)
            historical = await get_historical_rates(self.engine, days=365)
            return {
                "current_rate": current,
                "historical_rates": historical
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def get_current_rate_endpoint(self) -> Dict[str, Any]:
        """Get current mortgage rate"""
        try:
            current = await get_current_rate(self.engine)
            return current
        except Exception as e:
            return {"error": str(e)}
    
    async def get_historical_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get historical rates"""
        try:
            historical = await get_historical_rates(self.engine, days=days)
            return historical
        except Exception as e:
            return {"error": str(e)}
    
    async def get_rate_comparison_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get rate comparison data"""
        try:
            comparison = await get_rate_comparison(self.engine, days=days)
            return comparison
        except Exception as e:
            return {"error": str(e)}
    
    async def get_rate_statistics_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get rate statistics"""
        try:
            statistics = await get_rate_statistics(self.engine, days=days)
            return statistics
        except Exception as e:
            return {"error": str(e)}


# Global instance for router
_mortgage_dashboard: MortgageRateDashboard = None

def get_mortgage_dashboard() -> MortgageRateDashboard:
    """Dependency to inject mortgage dashboard"""
    if _mortgage_dashboard is None:
        raise ValueError("Mortgage dashboard not initialized")
    return _mortgage_dashboard

def set_mortgage_dashboard(dashboard: MortgageRateDashboard):
    """Set the global mortgage dashboard instance"""
    global _mortgage_dashboard
    _mortgage_dashboard = dashboard


# Router endpoints using Depends to avoid closure issues
@router.get("/data")
async def mortgage_data(dashboard: MortgageRateDashboard = Depends(get_mortgage_dashboard)):
    return await dashboard.get_data()

@router.get("/current_rate")
async def mortgage_current(dashboard: MortgageRateDashboard = Depends(get_mortgage_dashboard)):
    return await dashboard.get_current_rate_endpoint()

@router.get("/historical_rates")
async def mortgage_historical(
    days: int = Query(365),
    dashboard: MortgageRateDashboard = Depends(get_mortgage_dashboard)
):
    return await dashboard.get_historical_endpoint(days=days)

@router.get("/rate_comparison")
async def mortgage_comparison(
    days: int = Query(365),
    dashboard: MortgageRateDashboard = Depends(get_mortgage_dashboard)
):
    return await dashboard.get_rate_comparison_endpoint(days=days)

@router.get("/rate_statistics")
async def mortgage_stats(
    days: int = Query(365),
    dashboard: MortgageRateDashboard = Depends(get_mortgage_dashboard)
):
    return await dashboard.get_rate_statistics_endpoint(days=days)
