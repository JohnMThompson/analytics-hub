"""
Tests for standardized dashboard error responses.
"""
import pytest
from fastapi import HTTPException

try:
    import dashboards.mortgage as mortgage_module
    import dashboards.swim as swim_module
    import dashboards.halloween as halloween_module
    import dashboards.dakota as dakota_module
    from dashboards.mortgage import MortgageRateDashboard
    from dashboards.swim import SwimTrackingDashboard
    from dashboards.halloween import HalloweenDashboard
    from dashboards.dakota import DakotaConcertCalendarDashboard
except ImportError:
    import backend.dashboards.mortgage as mortgage_module
    import backend.dashboards.swim as swim_module
    import backend.dashboards.halloween as halloween_module
    import backend.dashboards.dakota as dakota_module
    from backend.dashboards.mortgage import MortgageRateDashboard
    from backend.dashboards.swim import SwimTrackingDashboard
    from backend.dashboards.halloween import HalloweenDashboard
    from backend.dashboards.dakota import DakotaConcertCalendarDashboard


@pytest.mark.asyncio
async def test_mortgage_endpoint_raises_http_500_on_failure(monkeypatch):
    dashboard = MortgageRateDashboard.__new__(MortgageRateDashboard)
    dashboard.engine = object()

    async def raise_error(_engine):
        raise RuntimeError("db failure")

    monkeypatch.setattr(mortgage_module, "get_current_rate", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        await dashboard.get_current_rate_endpoint()

    assert exc_info.value.status_code == 500
    assert "mortgage_rates.current_rate failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_swim_endpoint_raises_http_500_on_failure(monkeypatch):
    dashboard = SwimTrackingDashboard.__new__(SwimTrackingDashboard)
    dashboard.engine = object()

    async def raise_error(_engine, days=365):
        raise RuntimeError("db failure")

    monkeypatch.setattr(swim_module, "get_swim_summary", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        await dashboard.get_summary_endpoint()

    assert exc_info.value.status_code == 500
    assert "swim_tracking.summary failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_halloween_endpoint_raises_http_500_on_failure(monkeypatch):
    dashboard = HalloweenDashboard.__new__(HalloweenDashboard)
    dashboard.engine = object()

    async def raise_error(_engine):
        raise RuntimeError("db failure")

    monkeypatch.setattr(halloween_module, "get_summary", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        await dashboard.get_summary_endpoint()

    assert exc_info.value.status_code == 500
    assert "halloween_tracking.summary failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_dakota_data_endpoint_raises_http_500_on_failure(monkeypatch):
    dashboard = DakotaConcertCalendarDashboard.__new__(DakotaConcertCalendarDashboard)
    dashboard.engine = object()

    async def raise_error(_engine):
        raise RuntimeError("db failure")

    monkeypatch.setattr(dakota_module, "get_upcoming_events", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        await dashboard.get_data()

    assert exc_info.value.status_code == 500
    assert "dakota_concert_calendar.data failed" in exc_info.value.detail
