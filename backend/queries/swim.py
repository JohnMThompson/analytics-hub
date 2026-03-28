"""
Reusable SQL query functions for swim tracking dashboard
"""
from sqlalchemy import text, Engine
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


async def get_swim_summary(engine: Engine, days: Optional[int] = 365) -> Dict[str, Any]:
    """
    Get summary statistics for swimming over the specified period.
    
    Returns:
        Dict with total miles, workout count, total hours
    """
    where_clause = "WHERE start_date_time >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            COUNT(*) as workout_count,
            SUM(total_distance_yards) as total_yards,
            SUM(duration) as total_minutes
        FROM swim_tracking
        {where_clause}
    """)
    
    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        result = conn.execute(query, params).fetchone()
        
        if result and result[0]:
            total_yards = float(result[1]) if result[1] else 0
            total_miles = total_yards / 1760.0  # 1760 yards = 1 mile
            total_hours = float(result[2]) / 60.0 if result[2] else 0
            
            return {
                "workout_count": int(result[0]),
                "total_miles": round(total_miles, 2),
                "total_hours": round(total_hours, 2),
                "total_yards": int(total_yards),
            }
        
        return {
            "workout_count": 0,
            "total_miles": 0.0,
            "total_hours": 0.0,
            "total_yards": 0,
        }


async def get_distance_by_date(engine: Engine, days: Optional[int] = 365) -> List[Dict[str, Any]]:
    """
    Get daily swimming distance for the specified period.
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days of history to retrieve
    
    Returns:
        List of daily distance records
    """
    where_clause = "WHERE start_date_time >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            DATE(start_date_time) as date,
            SUM(total_distance_yards) as total_yards,
            COUNT(*) as workout_count
        FROM swim_tracking
        {where_clause}
        GROUP BY DATE(start_date_time)
        ORDER BY date ASC
    """)
    
    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        results = conn.execute(query, params).fetchall()
        return [
            {
                "date": result[0].isoformat() if result[0] else None,
                "total_yards": int(result[1]) if result[1] else 0,
                "workout_count": int(result[2]) if result[2] else 0,
            }
            for result in results
        ]


async def get_swim_records(engine: Engine, days: Optional[int] = 365, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get individual swim records for the specified period.
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days of history to retrieve
        limit: Maximum number of records to return
    
    Returns:
        List of swim records with details
    """
    where_clause = "WHERE start_date_time >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            id,
            start_date_time,
            duration,
            total_distance_yards,
            location,
            freestyle_distance,
            backstroke_distance,
            breaststroke_distance,
            butterfly_distance,
            comments
        FROM swim_tracking
        {where_clause}
        ORDER BY start_date_time DESC
        LIMIT :limit
    """)
    
    with engine.connect() as conn:
        params = {"limit": limit}
        if days is not None:
            params["days"] = days
        results = conn.execute(query, params).fetchall()
        return [
            {
                "id": result[0],
                "start_date_time": result[1].isoformat() if result[1] else None,
                "duration": int(result[2]) if result[2] else 0,
                "total_distance_yards": int(result[3]) if result[3] else 0,
                "location": result[4] or "—",
                "freestyle_distance": int(result[5]) if result[5] else 0,
                "backstroke_distance": int(result[6]) if result[6] else 0,
                "breaststroke_distance": int(result[7]) if result[7] else 0,
                "butterfly_distance": int(result[8]) if result[8] else 0,
                "comments": result[9],
            }
            for result in results
        ]


async def get_stroke_breakdown(engine: Engine, days: Optional[int] = 365) -> Dict[str, Any]:
    """
    Get breakdown of distance by stroke type for the specified period.
    
    Args:
        engine: SQLAlchemy engine
        days: Number of days to analyze
    
    Returns:
        Summary of distance by stroke
    """
    where_clause = "WHERE start_date_time >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT 
            SUM(freestyle_distance) as freestyle,
            SUM(backstroke_distance) as backstroke,
            SUM(breaststroke_distance) as breaststroke,
            SUM(butterfly_distance) as butterfly
        FROM swim_tracking
        {where_clause}
    """)
    
    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        result = conn.execute(query, params).fetchone()
        
        return {
            "freestyle": int(result[0]) if result[0] else 0,
            "backstroke": int(result[1]) if result[1] else 0,
            "breaststroke": int(result[2]) if result[2] else 0,
            "butterfly": int(result[3]) if result[3] else 0,
        }
