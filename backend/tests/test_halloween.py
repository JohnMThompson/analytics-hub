"""
Tests for halloween dashboard query helpers.
"""
import pytest
from unittest.mock import Mock
from datetime import datetime

try:
    from queries.halloween import get_yearly_counts, get_summary
except ImportError:
    from backend.queries.halloween import get_yearly_counts, get_summary


@pytest.mark.asyncio
async def test_get_yearly_counts_with_explicit_columns():
    rows = [
        {"year": 2022, "trick_or_treaters": 120},
        {"year": 2023, "trick_or_treaters": 136},
        {"year": 2024, "trick_or_treaters": 131},
    ]

    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_execute_result = Mock()
    mock_execute_result.mappings.return_value.all.return_value = rows
    mock_conn.execute.return_value = mock_execute_result

    result = await get_yearly_counts(mock_engine)

    assert result == [
        {"year": 2022, "count": 120},
        {"year": 2023, "count": 136},
        {"year": 2024, "count": 131},
    ]


@pytest.mark.asyncio
async def test_get_yearly_counts_falls_back_to_date_and_single_numeric_value():
    rows = [
        {"id": 1, "date": datetime(2023, 10, 31, 18, 0), "kids": 90},
        {"id": 2, "date": datetime(2023, 10, 31, 19, 0), "kids": 30},
    ]

    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_execute_result = Mock()
    mock_execute_result.mappings.return_value.all.return_value = rows
    mock_conn.execute.return_value = mock_execute_result

    result = await get_yearly_counts(mock_engine)

    assert result == [{"year": 2023, "count": 120}]


@pytest.mark.asyncio
async def test_get_summary_calculates_yoy_change():
    rows = [
        {"year": 2023, "trick_or_treaters": 100},
        {"year": 2024, "trick_or_treaters": 125},
    ]

    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    mock_execute_result = Mock()
    mock_execute_result.mappings.return_value.all.return_value = rows
    mock_conn.execute.return_value = mock_execute_result

    result = await get_summary(mock_engine)

    assert result["years_tracked"] == 2
    assert result["total_trick_or_treaters"] == 225
    assert result["latest_year"] == 2024
    assert result["latest_count"] == 125
    assert result["yoy_change"] == 25
    assert result["yoy_change_percent"] == 25.0

