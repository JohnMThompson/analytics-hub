"""
Mortgage Rates Dashboard Module

Provides current and historical mortgage rate data from the mortgage database.
"""
from typing import Dict, Any

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
        colors={
            "primary": "#1e40af",
            "accent": "#60a5fa",
            "success": "#10b981",
            "danger": "#ef4444"
        }
    )
    
    def __init__(self, db_config: Dict[str, Any]):
        super().__init__(db_config)
        self.engine = get_db_engine("mortgage")
    
    async def get_data(self) -> Dict[str, Any]:
        """
        Get all mortgage rates data
        
        Returns:
            Dictionary with current rates, historical data, and statistics
        """
        try:
            current = await get_current_rate(self.engine)
            historical = await get_historical_rates(self.engine, days=365)
            comparison = await get_rate_comparison(self.engine, days=365)
            statistics = await get_rate_statistics(self.engine, days=365)
            
            return {
                "success": True,
                "current": current,
                "historical": historical,
                "comparison": comparison,
                "statistics": statistics,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_current_rate_endpoint(self) -> Dict[str, Any]:
        """Get only current rate (for quick endpoint)"""
        try:
            current = await get_current_rate(self.engine)
            return current
        except Exception as e:
            return {"error": str(e)}
    
    async def get_historical_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get historical rates for specified period"""
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
