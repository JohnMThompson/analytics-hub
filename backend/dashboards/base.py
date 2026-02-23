"""
Base classes and utilities for dashboard modules
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel


class DashboardMetadata(BaseModel):
    """Dashboard metadata schema"""
    id: str
    title: str
    description: str
    refresh_interval: int = 3600  # Default 1 hour
    colors: Optional[Dict[str, str]] = None  # Custom color scheme


class BaseDashboard(ABC):
    """
    Base class for all dashboard modules.
    Each dashboard extends this and registers endpoints.
    """
    
    metadata: DashboardMetadata
    
    def __init__(self, db_config: Dict[str, Any]):
        """
        Initialize dashboard with database configuration
        
        Args:
            db_config: Dictionary with host, user, password, database, port
        """
        self.db_config = db_config
    
    @abstractmethod
    async def get_data(self) -> Dict[str, Any]:
        """
        Return primary data for the dashboard.
        Implement in subclass.
        """
        pass
    
    def get_metadata(self) -> DashboardMetadata:
        """Get dashboard metadata"""
        return self.metadata

    def get_custom_routes(self) -> List[Dict[str, Any]]:
        """
        Return dashboard-specific routes.

        Each route config should include:
        - path: route suffix under /api/dashboards/{dashboard_id}
        - endpoint: bound handler function
        Optional:
        - methods: list of HTTP methods (defaults to ["GET"])
        - name: route name suffix (defaults to path with '/' replaced by '_')
        """
        return []
