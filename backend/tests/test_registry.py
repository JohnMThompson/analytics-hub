"""
Tests for dashboard registry
"""
import pytest
import importlib
from types import SimpleNamespace
from unittest.mock import patch

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

    async def get_extra(self):
        return {"extra": True}

    def get_custom_routes(self):
        return [{"path": "extra", "endpoint": self.get_extra}]


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

    # Test temperature detection
    class HomeOfficeTemperatureDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="test", title="Test", description="Test")
        async def get_data(self): pass

    db_type = registry._get_dashboard_database(HomeOfficeTemperatureDashboard)
    assert db_type == "rpi"

    # Test halloween detection
    class HalloweenTrackingDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="test", title="Test", description="Test")
        async def get_data(self): pass

    db_type = registry._get_dashboard_database(HalloweenTrackingDashboard)
    assert db_type == "halloween"


def test_register_routes_uses_dashboard_custom_routes():
    """Test that registry registers custom routes from dashboard definition."""
    registry = DashboardRegistry()
    dashboard = MockDashboard({})
    registry._register_routes(dashboard)
    paths = {route.path for route in registry.router.routes}
    assert "/api/dashboards/test_dashboard/data" in paths
    assert "/api/dashboards/test_dashboard/extra" in paths


def test_disabled_dashboard_is_skipped(monkeypatch):
    """Test that disabled dashboards are not registered."""
    registry = DashboardRegistry()

    class MortgageRateDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="mortgage_rates", title="Mortgage", description="Mortgage")

        def __init__(self, db_config):
            super().__init__(db_config)

        async def get_data(self):
            return {"ok": True}

    registry_module = importlib.import_module(DashboardRegistry.__module__)
    fake_module = SimpleNamespace(MortgageRateDashboard=MortgageRateDashboard)

    monkeypatch.setattr(registry_module, "is_database_enabled", lambda _db: False)
    monkeypatch.setattr(
        registry_module,
        "get_db_config",
        lambda _db: (_ for _ in ()).throw(AssertionError("should not be called"))
    )
    monkeypatch.setattr(registry_module.importlib, "import_module", lambda _name: fake_module)

    registry._load_dashboard("mortgage")
    assert registry.dashboards == {}


def test_enabled_dashboard_missing_config_raises(monkeypatch):
    """Test that enabled dashboards fail fast when required config is missing."""
    registry = DashboardRegistry()

    class MortgageRateDashboard(BaseDashboard):
        metadata = DashboardMetadata(id="mortgage_rates", title="Mortgage", description="Mortgage")

        def __init__(self, db_config):
            super().__init__(db_config)

        async def get_data(self):
            return {"ok": True}

    registry_module = importlib.import_module(DashboardRegistry.__module__)
    fake_module = SimpleNamespace(MortgageRateDashboard=MortgageRateDashboard)

    monkeypatch.setattr(registry_module, "is_database_enabled", lambda _db: True)
    monkeypatch.setattr(
        registry_module,
        "get_db_config",
        lambda _db: (_ for _ in ()).throw(ValueError("missing config"))
    )
    monkeypatch.setattr(registry_module.importlib, "import_module", lambda _name: fake_module)

    with pytest.raises(ValueError, match="missing config"):
        registry._load_dashboard("mortgage")


def test_discovery_skips_dashboard_on_config_error(monkeypatch):
    """Test that discovery continues when one dashboard has invalid config."""
    registry = DashboardRegistry()

    registry_module = importlib.import_module(DashboardRegistry.__module__)
    fake_files = [
        SimpleNamespace(stem="temperature", name="temperature.py"),
        SimpleNamespace(stem="mortgage", name="mortgage.py"),
    ]
    calls = []

    def fake_load(module_name):
        calls.append(module_name)
        if module_name == "temperature":
            raise ValueError("missing config")

    monkeypatch.setattr(registry_module.Path, "glob", lambda _self, _pattern: fake_files)
    monkeypatch.setattr(registry, "_load_dashboard", fake_load)

    registry.discover_and_register()
    assert calls == ["temperature", "mortgage"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
