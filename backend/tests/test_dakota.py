"""
Tests for Dakota dashboard query helpers.
"""
import pytest
from datetime import date, datetime
from unittest.mock import Mock

try:
    from queries.dakota import get_upcoming_events
except ImportError:
    from backend.queries.dakota import get_upcoming_events


@pytest.mark.asyncio
async def test_get_upcoming_events_formats_rows():
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    rows = [
        {
            "id": 10,
            "event_date": date(2026, 3, 8),
            "event_time": "7:00 PM",
            "performer_name": "Performer A",
            "genre": "Jazz",
            "description_short": "Some description",
            "scraped_at": datetime(2026, 3, 6, 19, 42, 8),
            "updated_at": datetime(2026, 3, 6, 19, 50, 6),
        }
    ]
    mock_result_obj = Mock()
    mock_result_obj.mappings.return_value.all.return_value = rows
    mock_conn.execute.return_value = mock_result_obj

    result = await get_upcoming_events(mock_engine)

    assert len(result) == 1
    assert result[0]["id"] == 10
    assert result[0]["event_date"] == "2026-03-08"
    assert result[0]["performer_name"] == "Performer A"
    assert result[0]["scraped_at"].startswith("2026-03-06T19:42:08")


@pytest.mark.asyncio
async def test_get_upcoming_events_handles_null_optional_fields():
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    rows = [
        {
            "id": 11,
            "event_date": date(2026, 3, 9),
            "event_time": "8:30 PM",
            "performer_name": "Performer B",
            "genre": None,
            "description_short": None,
            "scraped_at": datetime(2026, 3, 6, 20, 0, 0),
            "updated_at": datetime(2026, 3, 6, 20, 1, 0),
        }
    ]
    mock_result_obj = Mock()
    mock_result_obj.mappings.return_value.all.return_value = rows
    mock_conn.execute.return_value = mock_result_obj

    result = await get_upcoming_events(mock_engine)

    assert result[0]["genre"] is None
    assert result[0]["description_short"] is None


@pytest.mark.asyncio
async def test_get_upcoming_events_query_uses_calendar_order():
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    mock_result_obj = Mock()
    mock_result_obj.mappings.return_value.all.return_value = []
    mock_conn.execute.return_value = mock_result_obj

    await get_upcoming_events(mock_engine)

    executed_query = mock_conn.execute.call_args[0][0].text
    assert "WHERE event_date >= CURRENT_DATE" in executed_query
    assert "ORDER BY event_date ASC, event_time ASC, id ASC" in executed_query
