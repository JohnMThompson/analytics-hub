"""
Tests for home office temperature query helpers.
"""
import pytest
from unittest.mock import Mock
from datetime import datetime

try:
    from queries.temperature import (
        get_current_conditions,
        get_temperature_trend,
        get_temperature_stats,
    )
except ImportError:
    from backend.queries.temperature import (
        get_current_conditions,
        get_temperature_trend,
        get_temperature_stats,
    )


@pytest.mark.asyncio
async def test_get_current_conditions():
    mock_result = (
        123,  # rowid
        datetime(2022, 4, 27, 11, 8, 41),  # timestamp
        "Cozy Office",  # room
        66.92,  # temperature_f
        42.40,  # humidity
    )
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_result_obj = Mock()
    mock_result_obj.fetchone.return_value = mock_result
    mock_conn.execute.return_value = mock_result_obj

    result = await get_current_conditions(mock_engine)
    assert result["rowid"] == 123
    assert result["room"] == "Cozy Office"
    assert result["temperature_f"] == 66.92
    assert result["humidity"] == 42.4


@pytest.mark.asyncio
async def test_get_temperature_trend():
    mock_rows = [
        ("2022-04-27 10:00:00", 66.11, 41.21),
        ("2022-04-27 11:00:00", 66.92, 42.40),
    ]
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_result_obj = Mock()
    mock_result_obj.fetchall.return_value = mock_rows
    mock_conn.execute.return_value = mock_result_obj

    result = await get_temperature_trend(mock_engine, days=365)
    assert len(result) == 2
    assert result[1]["period_start"] == "2022-04-27 11:00:00"
    assert result[1]["avg_temperature_f"] == 66.92
    assert result[1]["avg_humidity"] == 42.4


@pytest.mark.asyncio
async def test_get_temperature_stats():
    mock_row = (
        100,  # sample_count
        datetime(2022, 4, 1, 0, 0, 0),  # start
        datetime(2022, 4, 27, 11, 8, 41),  # end
        68.1,  # avg temp
        64.2,  # min temp
        73.8,  # max temp
        43.9,  # avg humidity
    )
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_result_obj = Mock()
    mock_result_obj.fetchone.return_value = mock_row
    mock_conn.execute.return_value = mock_result_obj

    result = await get_temperature_stats(mock_engine, days=None)
    assert result["sample_count"] == 100
    assert result["avg_temperature_f"] == 68.1
    assert result["max_temperature_f"] == 73.8
    assert result["avg_humidity"] == 43.9
