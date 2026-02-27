"""
Reusable SQL query functions for mortgage rates dashboard
"""
from sqlalchemy import text, Engine
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


async def get_current_rate(engine: Engine) -> Dict[str, Any]:
    """
    Get the most recent mortgage rate record with points adjusted out.
    
    Effective rate is calculated as: rate + (points * 0.25)
    where 1 point = 0.25% rate adjustment
    
    Returns:
        Dict with latest rate data including effective rates, source, timestamp
    """
    query = text("""
        SELECT 
            id,
            source,
            timestamp,
            `30_year_fixed_rate` as rate_30yr,
            `30_year_fixed_points` as points_30yr,
            `71_arm_rate` as rate_7arm,
            `71_arm_point` as points_7arm
        FROM daily_rates
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query).fetchone()
        if result:
            rate_30yr = float(result[3]) if result[3] else None
            points_30yr = float(result[4]) if result[4] else None
            rate_7arm = float(result[5]) if result[5] else None
            points_7arm = float(result[6]) if result[6] else None
            
            # Calculate effective rates (rate without points applied)
            effective_30yr = rate_30yr + (points_30yr * 0.25) if rate_30yr and points_30yr else rate_30yr
            effective_7arm = rate_7arm + (points_7arm * 0.25) if rate_7arm and points_7arm else rate_7arm
            
            return {
                "id": result[0],
                "source": result[1],
                "timestamp": result[2].isoformat() if result[2] else None,
                "rate_30yr": rate_30yr,
                "points_30yr": points_30yr,
                "effective_rate_30yr": round(effective_30yr, 4) if effective_30yr else None,
                "rate_7arm": rate_7arm,
                "points_7arm": points_7arm,
                "effective_rate_7arm": round(effective_7arm, 4) if effective_7arm else None,
            }
        return {}


async def get_historical_rates(engine: Engine, days: Optional[int] = 365) -> List[Dict[str, Any]]:
    """
    Get historical mortgage rates for the specified number of days.
    Includes effective rates (rate + points * 0.25).
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days of history to retrieve
    
    Returns:
        List of rate records with effective rates
    """
    where_clause = "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            DATE(timestamp) as date,
            AVG(`30_year_fixed_rate`) as rate_30yr,
            AVG(`30_year_fixed_points`) as points_30yr,
            AVG(`71_arm_rate`) as rate_7arm,
            AVG(`71_arm_point`) as points_7arm
        FROM daily_rates
        {where_clause}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """)
    
    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        results = conn.execute(query, params).fetchall()
        return [
            {
                "date": result[0].isoformat() if result[0] else None,
                "rate_30yr": round(float(result[1]), 4) if result[1] else None,
                "points_30yr": round(float(result[2]), 4) if result[2] else None,
                "effective_rate_30yr": round(float(result[1]) + (float(result[2]) * 0.25), 4) if result[1] and result[2] else None,
                "rate_7arm": round(float(result[3]), 4) if result[3] else None,
                "points_7arm": round(float(result[4]), 4) if result[4] else None,
                "effective_rate_7arm": round(float(result[3]) + (float(result[4]) * 0.25), 4) if result[3] and result[4] else None,
            }
            for result in results
        ]


async def get_weekly_rates(engine: Engine, days: Optional[int] = 365) -> List[Dict[str, Any]]:
    """
    Get weekly-average mortgage rates for the specified number of days.
    Weekly values are averaged per ISO week with effective rates included.
    """
    where_clause = "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT
            MIN(DATE_SUB(DATE(timestamp), INTERVAL WEEKDAY(timestamp) DAY)) as week_start,
            AVG(`30_year_fixed_rate`) as rate_30yr,
            AVG(`30_year_fixed_points`) as points_30yr,
            AVG(`71_arm_rate`) as rate_7arm,
            AVG(`71_arm_point`) as points_7arm,
            AVG(`30_year_fixed_rate` + (COALESCE(`30_year_fixed_points`, 0) * 0.25)) as effective_rate_30yr,
            AVG(`71_arm_rate` + (COALESCE(`71_arm_point`, 0) * 0.25)) as effective_rate_7arm
        FROM daily_rates
        {where_clause}
        GROUP BY YEAR(timestamp), WEEK(timestamp, 1)
        ORDER BY week_start ASC
    """)

    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        results = conn.execute(query, params).fetchall()
        return [
            {
                "week_start": result[0].isoformat() if result[0] else None,
                "rate_30yr": round(float(result[1]), 4) if result[1] else None,
                "points_30yr": round(float(result[2]), 4) if result[2] else None,
                "effective_rate_30yr": round(float(result[5]), 4) if result[5] else None,
                "rate_7arm": round(float(result[3]), 4) if result[3] else None,
                "points_7arm": round(float(result[4]), 4) if result[4] else None,
                "effective_rate_7arm": round(float(result[6]), 4) if result[6] else None,
            }
            for result in results
        ]


async def get_rate_comparison(engine: Engine, days: Optional[int] = 365) -> Dict[str, Any]:
    """
    Get rate comparison: current vs previous period (using effective rates).
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days to look back
    
    Returns:
        Comparison data with current, previous, and change
    """
    current_query = text("""
        SELECT `30_year_fixed_rate`, `30_year_fixed_points`
        FROM daily_rates
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    
    previous_where = (
        "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) AND timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)"
        if days is not None
        else "WHERE timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)"
    )
    previous_query = text(f"""
        SELECT AVG(`30_year_fixed_rate`), AVG(`30_year_fixed_points`)
        FROM daily_rates
        {previous_where}
    """)
    
    with engine.connect() as conn:
        current_result = conn.execute(current_query).fetchone()
        previous_params = {"days": days} if days is not None else {}
        previous_result = conn.execute(previous_query, previous_params).fetchone()
        
        current_rate = float(current_result[0]) if current_result and current_result[0] else None
        current_points = float(current_result[1]) if current_result and current_result[1] else None
        previous_rate = float(previous_result[0]) if previous_result and previous_result[0] else None
        previous_points = float(previous_result[1]) if previous_result and previous_result[1] else None
        
        # Calculate effective rates
        current_effective = current_rate + (current_points * 0.25) if current_rate and current_points else current_rate
        previous_effective = previous_rate + (previous_points * 0.25) if previous_rate and previous_points else previous_rate
        
        change = None
        change_percent = None
        if current_effective and previous_effective:
            change = current_effective - previous_effective
            change_percent = (change / previous_effective) * 100
        
        return {
            "current_rate": round(current_effective, 4) if current_effective else None,
            "previous_rate": round(previous_effective, 4) if previous_effective else None,
            "change": round(change, 4) if change else None,
            "change_percent": round(change_percent, 2) if change_percent else None,
        }


async def get_rate_statistics(engine: Engine, days: Optional[int] = 365) -> Dict[str, Any]:
    """
    Get statistical summary of rates (using effective rates).
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days to analyze
    
    Returns:
        Min, max, average effective rates
    """
    where_clause = "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            MIN(`30_year_fixed_rate`) as min_rate,
            MAX(`30_year_fixed_rate`) as max_rate,
            AVG(`30_year_fixed_rate`) as avg_rate,
            STD(`30_year_fixed_rate`) as std_rate,
            AVG(`30_year_fixed_points`) as avg_points
        FROM daily_rates
        {where_clause}
    """)
    
    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        result = conn.execute(query, params).fetchone()
        
        min_rate = float(result[0]) if result[0] else None
        max_rate = float(result[1]) if result[1] else None
        avg_rate = float(result[2]) if result[2] else None
        std_rate = float(result[3]) if result[3] else None
        avg_points = float(result[4]) if result[4] else None
        
        return {
            "min": round(min_rate, 4) if min_rate else None,
            "max": round(max_rate, 4) if max_rate else None,
            "average": round(avg_rate, 4) if avg_rate else None,
            "std_dev": round(std_rate, 4) if std_rate else None,
            "avg_points": round(avg_points, 4) if avg_points else None,
        }
