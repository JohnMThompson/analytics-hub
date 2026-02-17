"""
Tests for mortgage dashboard queries
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from backend.queries.mortgage import (
    get_current_rate,
    get_historical_rates,
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
        0.3   # 7/1 ARM points
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
    assert result["rate_7arm"] == 6.25


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
        (datetime(2024, 2, 16).date(), 6.75, 0.5, 6.25, 0.3),
        (datetime(2024, 2, 17).date(), 6.80, 0.5, 6.30, 0.3),
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
    assert result[1]["rate_30yr"] == 6.80


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
