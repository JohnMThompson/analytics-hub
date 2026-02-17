"""
Dashboard discovery and registration system
"""
import importlib
import inspect
import logging
from pathlib import Path
from typing import Dict, Type, List
from fastapi import APIRouter

# Handle both Docker (flat structure) and local (backend.* imports)
try:
    from dashboards.base import BaseDashboard
    from config import get_db_config
except ImportError:
    from backend.dashboards.base import BaseDashboard
    from backend.config import get_db_config

logger = logging.getLogger(__name__)


class DashboardRegistry:
    """
    Discovers and manages all dashboard modules.
    Handles auto-registration of dashboard routes.
    """
    
    def __init__(self):
        self.dashboards: Dict[str, BaseDashboard] = {}
        self.router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])
    
    def discover_and_register(self) -> None:
        """
        Scan dashboards directory, discover modules, instantiate dashboards,
        and register their routes.
        """
        dashboards_dir = Path(__file__).parent
        
        # Find all Python files in dashboards directory
        dashboard_files = [
            f.stem for f in dashboards_dir.glob("*.py")
            if f.name not in ["__init__.py", "base.py"]
        ]
        
        logger.info(f"Discovered dashboard files: {dashboard_files}")
        
        for module_name in dashboard_files:
            try:
                self._load_dashboard(module_name)
            except Exception as e:
                logger.error(f"Failed to load dashboard {module_name}: {e}")
    
    def _load_dashboard(self, module_name: str) -> None:
        """
        Load a single dashboard module and instantiate it.
        
        Args:
            module_name: Name of the module (without .py)
        """
        # Import the module - handle both Docker (flat) and local (backend.* imports)
        try:
            module = importlib.import_module(f"dashboards.{module_name}")
        except ImportError:
            module = importlib.import_module(f"backend.dashboards.{module_name}")
        
        # Find all BaseDashboard subclasses
        for name, obj in inspect.getmembers(module):
            if (inspect.isclass(obj) and 
                issubclass(obj, BaseDashboard) and 
                obj is not BaseDashboard):
                
                # Determine which database this dashboard uses
                db_type = self._get_dashboard_database(obj)
                
                # Get database config
                try:
                    db_config = get_db_config(db_type)
                except ValueError as e:
                    logger.warning(f"Database not configured for {name}: {e}")
                    return
                
                # Instantiate the dashboard
                instance = obj(db_config)
                dashboard_id = instance.metadata.id
                
                # Register it
                self.dashboards[dashboard_id] = instance
                
                # Register routes
                self._register_routes(instance)
                
                logger.info(f"Registered dashboard: {dashboard_id}")
    
    def _get_dashboard_database(self, dashboard_class: Type[BaseDashboard]) -> str:
        """
        Determine which database a dashboard should use.
        
        Convention: class name determines database.
        - MortgageRateDashboard -> mortgage
        - SwimTrackingDashboard -> swim
        """
        class_name = dashboard_class.__name__
        
        if "Mortgage" in class_name:
            return "mortgage"
        elif "Swim" in class_name:
            return "swim"
        else:
            # Default to first part of name in lowercase
            parts = class_name.replace("Dashboard", "").lower()
            return parts
    
    def _register_routes(self, dashboard: BaseDashboard) -> None:
        """
        Register routes for a dashboard.
        
        Automatically registers:
        - GET /api/dashboards/{dashboard_id}/data
        - Any method ending with _endpoint gets registered as a route
        """
        dashboard_id = dashboard.metadata.id
        
        # Use a factory to properly capture the dashboard instance
        def create_handler(dash):
            async def get_dashboard_data():
                """Get dashboard data"""
                return await dash.get_data()
            return get_dashboard_data
        
        # Register the main data route
        route_path = f"/{dashboard_id}/data"
        handler = create_handler(dashboard)
        self.router.add_api_route(
            route_path,
            handler,
            methods=["GET"],
            name=f"{dashboard_id}_data"
        )
        
        # Auto-register specific endpoints for swim dashboard
        if dashboard.metadata.id == "swim_tracking":
            if hasattr(dashboard, 'get_summary_endpoint'):
                def create_summary_handler(dash):
                    async def handler():
                        return await dash.get_summary_endpoint()
                    return handler
                self.router.add_api_route(
                    f"/{dashboard_id}/summary",
                    create_summary_handler(dashboard),
                    methods=["GET"],
                    name=f"{dashboard_id}_summary"
                )
            
            if hasattr(dashboard, 'get_distance_by_date_endpoint'):
                def create_distance_handler(dash):
                    async def handler(days: int = 365):
                        return await dash.get_distance_by_date_endpoint(days=days)
                    return handler
                self.router.add_api_route(
                    f"/{dashboard_id}/distance_by_date",
                    create_distance_handler(dashboard),
                    methods=["GET"],
                    name=f"{dashboard_id}_distance_by_date"
                )
            
            if hasattr(dashboard, 'get_records_endpoint'):
                def create_records_handler(dash):
                    async def handler(days: int = 365, limit: int = 50):
                        return await dash.get_records_endpoint(days=days, limit=limit)
                    return handler
                self.router.add_api_route(
                    f"/{dashboard_id}/records",
                    create_records_handler(dashboard),
                    methods=["GET"],
                    name=f"{dashboard_id}_records"
                )
            
            if hasattr(dashboard, 'get_stroke_breakdown_endpoint'):
                def create_stroke_handler(dash):
                    async def handler(days: int = 365):
                        return await dash.get_stroke_breakdown_endpoint(days=days)
                    return handler
                self.router.add_api_route(
                    f"/{dashboard_id}/stroke_breakdown",
                    create_stroke_handler(dashboard),
                    methods=["GET"],
                    name=f"{dashboard_id}_stroke_breakdown"
                )
    
    def get_metadata(self) -> List[Dict]:
        """Get metadata for all registered dashboards"""
        return [
            {
                "id": dashboard.metadata.id,
                "title": dashboard.metadata.title,
                "description": dashboard.metadata.description,
                "refreshInterval": dashboard.metadata.refresh_interval,
                "colors": dashboard.metadata.colors or {}
            }
            for dashboard in self.dashboards.values()
        ]


# Global registry instance
_registry: DashboardRegistry = None


def get_registry() -> DashboardRegistry:
    """Get or create the global dashboard registry"""
    global _registry
    if _registry is None:
        _registry = DashboardRegistry()
        _registry.discover_and_register()
    return _registry
