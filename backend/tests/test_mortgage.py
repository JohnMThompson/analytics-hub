"""
Tests for mortgage dashboard queries
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

try:
    from queries.mortgage import (
        get_current_rate,
        get_historical_rates,
        get_weekly_rates,
        get_rate_comparison,
        get_rate_statistics
    )
except ImportError:
    from backend.queries.mortgage import (
        get_current_rate,
        get_historical_rates,
        get_weekly_rates,
        get_rate_comparison,
        get_rate_statistics
    )


@pytest.mark.asyncio
async def test_get_current_rate():
    """Test fetching current rate"""
    # Mock database result
    mock_result = (
        1,  # id
        "Freddie Mac",  # source
        datetime(2024, 2, 17),  # timestamp
        6.75,  # 30yr rate
        0.5,  # 30yr points
        6.25,  # 7/1 ARM rate
        0.3,  # 7/1 ARM points
        6.1,  # 7/6 ARM rate
        0.2,  # 7/6 ARM points
    )
    
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    
    mock_result_obj = Mock()
    mock_result_obj.fetchone.return_value = mock_result
    mock_conn.execute.return_value = mock_result_obj
    
    result = await get_current_rate(mock_engine)
    
    assert result["source"] == "Freddie Mac"
    assert result["rate_30yr"] == 6.75
    assert result["rate_71arm"] == 6.25
    assert result["effective_rate_71arm"] == round(6.25 + (0.3 * 0.25), 4)
    assert result["rate_76arm"] == 6.1
    assert result["effective_rate_76arm"] == round(6.1 + (0.2 * 0.25), 4)


@pytest.mark.asyncio
async def test_get_current_rate_empty():
    """Test fetching current rate with no data"""
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    
    mock_result_obj = Mock()
    mock_result_obj.fetchone.return_value = None
    mock_conn.execute.return_value = mock_result_obj
    
    result = await get_current_rate(mock_engine)
    
    assert result == {}


@pytest.mark.asyncio
async def test_get_historical_rates():
    """Test fetching historical rates"""
    mock_results = [
        (datetime(2024, 2, 16).date(), 6.75, 0.5, 6.25, 0.3, None, None),
        (datetime(2024, 2, 17).date(), 6.80, 0.5, 6.30, 0.3, 6.15, 0.2),
    ]
    
    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)
    
    mock_result_obj = Mock()
    mock_result_obj.fetchall.return_value = mock_results
    mock_conn.execute.return_value = mock_result_obj
    
    result = await get_historical_rates(mock_engine, days=30)
    
    assert len(result) == 2
    assert result[0]["rate_30yr"] == 6.75
    assert result[0]["effective_rate_30yr"] == round(6.75 + (0.5 * 0.25), 4)
    assert result[0]["effective_rate_71arm"] == round(6.25 + (0.3 * 0.25), 4)
    assert result[0]["effective_rate_76arm"] is None
    assert result[1]["rate_30yr"] == 6.80
    assert result[1]["effective_rate_76arm"] == round(6.15 + (0.2 * 0.25), 4)


@pytest.mark.asyncio
async def test_get_weekly_rates():
    """Test fetching weekly average rates."""
    mock_results = [
        (datetime(2024, 2, 12).date(), 6.75, 0.5, 6.25, 0.3, None, None, 6.875, 6.325, None),
        (datetime(2024, 2, 19).date(), 6.8, 0.5, 6.3, 0.3, 6.1, 0.2, 6.925, 6.375, 6.15),
    ]

    mock_engine = Mock()
    mock_conn = Mock()
    mock_engine.connect.return_value.__enter__ = Mock(return_value=mock_conn)
    mock_engine.connect.return_value.__exit__ = Mock(return_value=None)

    mock_result_obj = Mock()
    mock_result_obj.fetchall.return_value = mock_results
    mock_conn.execute.return_value = mock_result_obj

    result = await get_weekly_rates(mock_engine, days=365)

    assert len(result) == 2
    assert result[0]["week_start"] == "2024-02-12"
    assert result[0]["effective_rate_30yr"] == 6.875
    assert result[0]["effective_rate_71arm"] == 6.325
    assert result[0]["effective_rate_76arm"] is None
    assert result[1]["week_start"] == "2024-02-19"
    assert result[1]["effective_rate_76arm"] == 6.15


def test_rate_change_calculation():
    """Test rate comparison calculations"""
    # This tests the logic of rate comparison
    current = 6.75
    previous = 6.50
    
    change = current - previous
    change_percent = (change / previous) * 100
    
    assert change == 0.25
    assert abs(change_percent - 3.846) < 0.01  # Approximate


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
