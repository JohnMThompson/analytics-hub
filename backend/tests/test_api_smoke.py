"""
Integration-style smoke tests for key API endpoints.
"""
import pytest
import httpx
import pytest_asyncio

try:
    from app import app, registry
except ImportError:
    from backend.app import app, registry


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_dashboards_endpoint_smoke(client):
    response = await client.get("/api/dashboards")
    assert response.status_code == 200
    body = response.json()
    assert "dashboards" in body
    assert "total" in body
    assert "x-request-id" in response.headers


@pytest.mark.asyncio
async def test_request_id_header_is_echoed(client):
    response = await client.get("/api/health", headers={"x-request-id": "test-request-id"})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == "test-request-id"


@pytest.mark.asyncio
async def test_mortgage_current_rate_endpoint_smoke(client, monkeypatch):
    dashboard = registry.dashboards.get("mortgage_rates")
    if dashboard is None:
        pytest.skip("Mortgage dashboard is not registered")

    async def fake_current_rate(_engine):
        return {"rate_30yr": 6.25}

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_current_rate", fake_current_rate)

    response = await client.get("/api/dashboards/mortgage_rates/current_rate")
    assert response.status_code == 200
    assert response.json()["rate_30yr"] == 6.25


@pytest.mark.asyncio
async def test_mortgage_weekly_rates_endpoint_smoke(client, monkeypatch):
    dashboard = registry.dashboards.get("mortgage_rates")
    if dashboard is None:
        pytest.skip("Mortgage dashboard is not registered")

    async def fake_weekly_rates(_engine, days=365):
        return [{"week_start": "2026-01-05", "effective_rate_30yr": 6.4, "effective_rate_7arm": 6.1}]

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_weekly_rates", fake_weekly_rates)

    response = await client.get("/api/dashboards/mortgage_rates/weekly_rates")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert payload[0]["week_start"] == "2026-01-05"


@pytest.mark.asyncio
async def test_swim_summary_endpoint_smoke(client, monkeypatch):
    dashboard = registry.dashboards.get("swim_tracking")
    if dashboard is None:
        pytest.skip("Swim dashboard is not registered")

    async def fake_swim_summary(_engine, days=365):
        return {"workout_count": 42}

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_swim_summary", fake_swim_summary)

    response = await client.get("/api/dashboards/swim_tracking/summary")
    assert response.status_code == 200
    assert response.json()["workout_count"] == 42
