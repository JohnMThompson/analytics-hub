"""
Tests for swim dashboard query helpers.
"""
import pytest
from unittest.mock import Mock
from datetime import datetime

try:
    import dashboards.swim as swim_dashboard_module
    from queries.swim import get_swim_records
    from dashboards.swim import SwimTrackingDashboard
except ImportError:
    import backend.dashboards.swim as swim_dashboard_module
    from backend.queries.swim import get_swim_records
    from backend.dashboards.swim import SwimTrackingDashboard


@pytest.mark.asyncio
async def test_get_swim_records_includes_location_field():
    """Swim records payload should include workout location for dashboard display."""
    mock_results = [
        (
            1,  # id
            datetime(2026, 1, 28, 16, 13),  # start_date_time
            20,  # duration
            650,  # total_distance_yards
            "Downtown YMCA",  # location
            650,  # freestyle_distance
            0,  # backstroke_distance
            0,  # breaststroke_distance
            0,  # butterfly_distance
            "13 x 50 FS",  # comments
        ),
    ]

    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    mock_result_obj = Mock()
    mock_result_obj.fetchall.return_value = mock_results
    mock_conn.execute.return_value = mock_result_obj

    records = await get_swim_records(mock_engine, days=365, limit=50)

    assert len(records) == 1
    assert records[0]["id"] == 1
    assert records[0]["total_distance_yards"] == 650
    assert records[0]["location"] == "Downtown YMCA"

    query_text = str(mock_conn.execute.call_args.args[0])
    params = mock_conn.execute.call_args.args[1]

    assert "LIMIT :limit" in query_text
    assert params["limit"] == 50


@pytest.mark.asyncio
async def test_get_swim_records_omits_limit_when_not_requested():
    """Swim records query should return all filtered rows when limit is omitted."""
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    mock_result_obj = Mock()
    mock_result_obj.fetchall.return_value = []
    mock_conn.execute.return_value = mock_result_obj

    records = await get_swim_records(mock_engine, days=None, limit=None)

    assert records == []

    query_text = str(mock_conn.execute.call_args.args[0])
    params = mock_conn.execute.call_args.args[1]

    assert "LIMIT :limit" not in query_text
    assert params == {}


@pytest.mark.asyncio
async def test_swim_dashboard_records_endpoint_uses_unlimited_all_time(monkeypatch):
    """All-time records requests should not inject a row limit."""
    captured = {}

    async def fake_swim_records(_engine, days=365, limit=50):
        captured["days"] = days
        captured["limit"] = limit
        return [{"id": 1}]

    dashboard = SwimTrackingDashboard(db_config={})
    monkeypatch.setattr(swim_dashboard_module, "get_swim_records", fake_swim_records)

    response = await dashboard.get_records_endpoint(all_time=True)

    assert response == [{"id": 1}]
    assert captured == {"days": None, "limit": None}
