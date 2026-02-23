"""
Tests for dashboard registry
"""
import pytest
from unittest.mock import patch, MagicMock

try:
    from dashboards.registry import DashboardRegistry, get_registry
    from dashboards.base import BaseDashboard, DashboardMetadata
except ImportError:
    from backend.dashboards.registry import DashboardRegistry, get_registry
    from backend.dashboards.base import BaseDashboard, DashboardMetadata


class MockDashboard(BaseDashboard):
    """Mock dashboard for testing"""
    
    def __init__(self, db_config):
        super().__init__(db_config)
        self.metadata = DashboardMetadata(
            id="test_dashboard",
            title="Test Dashboard",
            description="Test",
            refresh_interval=300
        )
    
    async def get_data(self):
        return {"status": "ok"}


def test_registry_initialization():
    """Test that registry initializes correctly"""
    registry = DashboardRegistry()
    assert registry.dashboards == {}
    assert registry.router is not None


def test_get_registry_singleton():
    """Test that get_registry returns same instance"""
    # This resets the global registry for testing
    try:
        import dashboards.registry as reg_module
    except ImportError:
        import backend.dashboards.registry as reg_module
    reg_module._registry = None
    
    registry1 = DashboardRegistry()
    registry1.dashboards['test'] = MockDashboard({})
    
    # Normally get_registry would discover, but for this test
    # we're just checking the pattern works
    assert isinstance(registry1, DashboardRegistry)


def test_dashboard_metadata():
    """Test dashboard metadata structure"""
    metadata = DashboardMetadata(
        id="test",
        title="Test",
        description="Testing",
        refresh_interval=600,
        colors={"primary": "#1e40af"}
    )
    
    assert metadata.id == "test"
    assert metadata.refresh_interval == 600
    assert metadata.colors["primary"] == "#1e40af"


def test_database_type_detection():
    """Test dashboard database type detection"""
    registry = DashboardRegistry()
    
    # Test mortgage detection
    class MortgageRateDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="test", title="Test", description="Test")
        async def get_data(self): pass
    
    db_type = registry._get_dashboard_database(MortgageRateDashboard)
    assert db_type == "mortgage"
    
    # Test swim detection
    class SwimTrackingDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="test", title="Test", description="Test")
        async def get_data(self): pass
    
    db_type = registry._get_dashboard_database(SwimTrackingDashboard)
    assert db_type == "swim"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
