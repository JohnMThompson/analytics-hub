"""
Integration-style smoke tests for key API endpoints.
"""
from contextlib import asynccontextmanager
import pytest
import httpx
from starlette.requests import Request

try:
    from app import app, registry, get_frontend_base_url
except ImportError:
    from backend.app import app, registry, get_frontend_base_url


@asynccontextmanager
async def get_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_dashboards_endpoint_smoke():
    async with get_client() as client:
        response = await client.get("/api/dashboards")
        assert response.status_code == 200
        body = response.json()
        assert "dashboards" in body
        assert "total" in body
        assert "x-request-id" in response.headers


@pytest.mark.asyncio
async def test_openapi_groups_general_and_dashboard_tags():
    async with get_client() as client:
        response = await client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        tag_names = [tag["name"] for tag in schema["tags"]]
        assert tag_names[0] == "General"
        assert "default" not in tag_names
        assert "dashboards" not in tag_names

        assert schema["paths"]["/api/health"]["get"]["tags"] == ["General"]
        assert schema["paths"]["/api/ready"]["get"]["tags"] == ["General"]
        assert schema["paths"]["/api/dashboards"]["get"]["tags"] == ["General"]

        dashboard_operation_tags = {
            tuple(operation["tags"])
            for path, methods in schema["paths"].items()
            if path.startswith("/api/dashboards/") and path != "/api/dashboards"
            for operation in methods.values()
        }
        assert dashboard_operation_tags
        assert all(tags != ("dashboards",) for tags in dashboard_operation_tags)
        assert all(tags != ("default",) for tags in dashboard_operation_tags)
        assert all(len(tags) == 1 for tags in dashboard_operation_tags)
        assert ("Mortgage Rates",) in dashboard_operation_tags


@pytest.mark.asyncio
async def test_custom_docs_page_includes_navigation_links():
    async with get_client() as client:
        response = await client.get("/docs")
        assert response.status_code == 200
        html = response.text

        assert "Back to Analytics Hub" in html
        assert '"id": "mortgage_rates"' in html
        assert '"Open dashboard"' in html


def test_get_frontend_base_url_maps_local_backend_port_to_vite_port():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/docs",
        "headers": [],
        "server": ("localhost", 8000),
        "scheme": "http",
        "client": ("127.0.0.1", 12345),
        "root_path": "",
        "query_string": b"",
    }

    assert get_frontend_base_url(Request(scope)) == "http://localhost:3000"


@pytest.mark.asyncio
async def test_request_id_header_is_echoed():
    async with get_client() as client:
        response = await client.get("/api/health", headers={"x-request-id": "test-request-id"})
        assert response.status_code == 200
        assert response.headers.get("x-request-id") == "test-request-id"


@pytest.mark.asyncio
async def test_mortgage_current_rate_endpoint_smoke(monkeypatch):
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

    async with get_client() as client:
        response = await client.get("/api/dashboards/mortgage_rates/current_rate")
        assert response.status_code == 200
        assert response.json()["rate_30yr"] == 6.25


@pytest.mark.asyncio
async def test_mortgage_weekly_rates_endpoint_smoke(monkeypatch):
    dashboard = registry.dashboards.get("mortgage_rates")
    if dashboard is None:
        pytest.skip("Mortgage dashboard is not registered")

    async def fake_weekly_rates(_engine, days=365):
        return [{
            "week_start": "2026-01-05",
            "effective_rate_30yr": 6.4,
            "effective_rate_71arm": 6.1,
            "effective_rate_76arm": 5.9,
        }]

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_weekly_rates", fake_weekly_rates)

    async with get_client() as client:
        response = await client.get("/api/dashboards/mortgage_rates/weekly_rates")
        assert response.status_code == 200
        payload = response.json()
        assert isinstance(payload, list)
        assert payload[0]["week_start"] == "2026-01-05"


@pytest.mark.asyncio
async def test_swim_summary_endpoint_smoke(monkeypatch):
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

    async with get_client() as client:
        response = await client.get("/api/dashboards/swim_tracking/summary")
        assert response.status_code == 200
        assert response.json()["workout_count"] == 42


@pytest.mark.asyncio
async def test_home_office_temperature_current_conditions_smoke(monkeypatch):
    dashboard = registry.dashboards.get("home_office_temperature")
    if dashboard is None:
        pytest.skip("Home office temperature dashboard is not registered")

    async def fake_current_conditions(_engine):
        return {"temperature_f": 66.92, "humidity": 42.4}

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_current_conditions", fake_current_conditions)

    async with get_client() as client:
        response = await client.get("/api/dashboards/home_office_temperature/current_conditions")
        assert response.status_code == 200
        payload = response.json()
        assert payload["temperature_f"] == 66.92


@pytest.mark.asyncio
async def test_halloween_summary_endpoint_smoke(monkeypatch):
    dashboard = registry.dashboards.get("halloween_tracking")
    if dashboard is None:
        pytest.skip("Halloween dashboard is not registered")

    async def fake_summary(_engine):
        return {"latest_year": 2025, "latest_count": 144}

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_summary", fake_summary)

    async with get_client() as client:
        response = await client.get("/api/dashboards/halloween_tracking/summary")
        assert response.status_code == 200
        payload = response.json()
        assert payload["latest_year"] == 2025
        assert payload["latest_count"] == 144


@pytest.mark.asyncio
async def test_dakota_data_endpoint_smoke(monkeypatch):
    dashboard = registry.dashboards.get("dakota_concert_calendar")
    if dashboard is None:
        pytest.skip("Dakota dashboard is not registered")

    async def fake_upcoming_events(_engine):
        return [
            {
                "id": 1,
                "event_date": "2026-03-09",
                "event_time": "7:00 PM",
                "performer_name": "Sample Performer",
                "genre": "Jazz",
                "description_short": "Sample description",
                "scraped_at": "2026-03-06T19:42:08",
                "updated_at": "2026-03-06T19:50:06",
            }
        ]

    dashboard_module = __import__(
        dashboard.__class__.__module__,
        fromlist=["_placeholder"]
    )
    monkeypatch.setattr(dashboard_module, "get_upcoming_events", fake_upcoming_events)

    async with get_client() as client:
        response = await client.get("/api/dashboards/dakota_concert_calendar/data")
        assert response.status_code == 200
        payload = response.json()
        assert "events" in payload
        assert payload["events"][0]["performer_name"] == "Sample Performer"
