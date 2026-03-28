"""
Tests for swim dashboard query helpers.
"""
import pytest
from unittest.mock import Mock
from datetime import datetime

try:
    from queries.swim import get_swim_records
except ImportError:
    from backend.queries.swim import get_swim_records


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
