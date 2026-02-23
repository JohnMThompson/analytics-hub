"""
Mortgage Rates Dashboard Module

Provides current and historical mortgage rate data from the mortgage database.
"""
from typing import Dict, Any, List
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

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
        colors={"primary": "#1e40af", "accent": "#60a5fa"}
    )
    
    def __init__(self, db_config: Dict):
        super().__init__(db_config)
        self.engine = get_db_engine("mortgage")

    def _raise_internal_error(self, operation: str, error: Exception) -> None:
        """Raise a standardized API error for dashboard failures."""
        logger.exception("dashboard_error dashboard_id=mortgage_rates operation=%s", operation)
        raise HTTPException(
            status_code=500,
            detail=f"mortgage_rates.{operation} failed: {error}"
        ) from error
    
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
            self._raise_internal_error("data", e)
    
    async def get_current_rate_endpoint(self) -> Dict[str, Any]:
        """Get current mortgage rate"""
        try:
            current = await get_current_rate(self.engine)
            return current
        except Exception as e:
            self._raise_internal_error("current_rate", e)
    
    async def get_historical_endpoint(self, days: int = 365) -> List[Dict[str, Any]]:
        """Get historical rates"""
        try:
            historical = await get_historical_rates(self.engine, days=days)
            return historical
        except Exception as e:
            self._raise_internal_error("historical_rates", e)
    
    async def get_rate_comparison_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get rate comparison data"""
        try:
            comparison = await get_rate_comparison(self.engine, days=days)
            return comparison
        except Exception as e:
            self._raise_internal_error("rate_comparison", e)
    
    async def get_rate_statistics_endpoint(self, days: int = 365) -> Dict[str, Any]:
        """Get rate statistics"""
        try:
            statistics = await get_rate_statistics(self.engine, days=days)
            return statistics
        except Exception as e:
            self._raise_internal_error("rate_statistics", e)

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        """Define mortgage dashboard-specific routes."""
        return [
            {"path": "current_rate", "endpoint": self.get_current_rate_endpoint},
            {"path": "historical_rates", "endpoint": self.get_historical_endpoint},
            {"path": "rate_comparison", "endpoint": self.get_rate_comparison_endpoint},
            {"path": "rate_statistics", "endpoint": self.get_rate_statistics_endpoint},
        ]
