"""
Reusable SQL query functions for home office temperature dashboard.
"""
from sqlalchemy import text, Engine
from typing import List, Dict, Any, Optional


async def get_current_conditions(engine: Engine) -> Dict[str, Any]:
    """Fetch the latest temperature/humidity reading."""
    query = text("""
        SELECT
            rowid,
            timestamp,
            room,
            temperature_f,
            humidity
        FROM `temperature-sensor`
        ORDER BY timestamp DESC
        LIMIT 1
    """)

    with engine.connect() as conn:
        result = conn.execute(query).fetchone()
        if not result:
            return {}
        return {
            "rowid": int(result[0]),
            "timestamp": result[1].isoformat() if result[1] else None,
            "room": result[2],
            "temperature_f": float(result[3]) if result[3] is not None else None,
            "humidity": float(result[4]) if result[4] is not None else None,
        }


async def get_temperature_trend(engine: Engine, days: Optional[int] = 365) -> List[Dict[str, Any]]:
    """
    Fetch hourly-averaged temperature/humidity trend.
    Use days=None for all available history.
    """
    where_clause = "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT
            DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as period_start,
            AVG(temperature_f) as avg_temperature_f,
            AVG(humidity) as avg_humidity
        FROM `temperature-sensor`
        {where_clause}
        GROUP BY period_start
        ORDER BY period_start ASC
    """)

    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        results = conn.execute(query, params).fetchall()
        return [
            {
                "period_start": result[0],
                "avg_temperature_f": round(float(result[1]), 2) if result[1] is not None else None,
                "avg_humidity": round(float(result[2]), 2) if result[2] is not None else None,
            }
            for result in results
        ]


async def get_temperature_stats(engine: Engine, days: Optional[int] = 365) -> Dict[str, Any]:
    """Fetch aggregate statistics for selected period."""
    where_clause = "WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)" if days is not None else ""
    query = text(f"""
        SELECT
            COUNT(*) as sample_count,
            MIN(timestamp) as start_timestamp,
            MAX(timestamp) as end_timestamp,
            AVG(temperature_f) as avg_temperature_f,
            MIN(temperature_f) as min_temperature_f,
            MAX(temperature_f) as max_temperature_f,
            AVG(humidity) as avg_humidity
        FROM `temperature-sensor`
        {where_clause}
    """)

    with engine.connect() as conn:
        params = {"days": days} if days is not None else {}
        result = conn.execute(query, params).fetchone()
        if not result:
            return {}
        return {
            "sample_count": int(result[0]) if result[0] is not None else 0,
            "start_timestamp": result[1].isoformat() if result[1] else None,
            "end_timestamp": result[2].isoformat() if result[2] else None,
            "avg_temperature_f": round(float(result[3]), 2) if result[3] is not None else None,
            "min_temperature_f": round(float(result[4]), 2) if result[4] is not None else None,
            "max_temperature_f": round(float(result[5]), 2) if result[5] is not None else None,
            "avg_humidity": round(float(result[6]), 2) if result[6] is not None else None,
        }
