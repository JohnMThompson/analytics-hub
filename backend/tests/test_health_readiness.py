"""
Tests for health and readiness endpoints.
"""
import json
import pytest

try:
    from app import health_check, readiness_check, registry
except ImportError:
    from backend.app import health_check, readiness_check, registry


class _ReadyConnection:
    def __enter__(self):
        return self

    def __exit__(self, _exc_type, _exc, _tb):
        return None

    def execute(self, _query):
        return None


class _ReadyEngine:
    def connect(self):
        return _ReadyConnection()


class _FailingEngine:
    def connect(self):
        raise RuntimeError("db down")


@pytest.mark.asyncio
async def test_health_check():
    body = await health_check()
    assert body["status"] == "healthy"
    assert "dashboards_count" in body


@pytest.mark.asyncio
async def test_readiness_success_when_all_dashboards_connect(monkeypatch):
    for dashboard in registry.dashboards.values():
        monkeypatch.setattr(dashboard, "engine", _ReadyEngine(), raising=False)

    body = await readiness_check()
    assert body["status"] == "ready"
    assert set(body["checks"].keys()) == set(registry.dashboards.keys())
    assert all(result["ready"] for result in body["checks"].values())


@pytest.mark.asyncio
async def test_readiness_returns_503_when_any_dashboard_fails(monkeypatch):
    dashboard_ids = list(registry.dashboards.keys())
    if not dashboard_ids:
        pytest.skip("No dashboards registered to validate readiness failure")

    first_dashboard_id = dashboard_ids[0]
    for dashboard_id, dashboard in registry.dashboards.items():
        engine = _FailingEngine() if dashboard_id == first_dashboard_id else _ReadyEngine()
        monkeypatch.setattr(dashboard, "engine", engine, raising=False)

    response = await readiness_check()
    assert response.status_code == 503
    body = json.loads(response.body.decode("utf-8"))
    assert body["status"] == "not_ready"
    assert body["checks"][first_dashboard_id]["ready"] is False
