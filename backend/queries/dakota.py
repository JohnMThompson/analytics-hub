"""
Reusable SQL query functions for Dakota concert calendar dashboard.
"""
from typing import Any, Dict, List

from sqlalchemy import Engine, text


async def get_upcoming_events(engine: Engine) -> List[Dict[str, Any]]:
    """
    Return upcoming Dakota events in calendar order.
    """
    query = text(
        """
        SELECT
            id,
            event_date,
            event_time,
            performer_name,
            genre,
            description_short,
            scraped_at,
            updated_at
        FROM dakota_events
        WHERE event_date >= CURRENT_DATE
        ORDER BY event_date ASC, event_time ASC, id ASC
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()

    return [
        {
            "id": int(row["id"]),
            "event_date": row["event_date"].isoformat() if row.get("event_date") else None,
            "event_time": row.get("event_time"),
            "performer_name": row.get("performer_name"),
            "genre": row.get("genre"),
            "description_short": row.get("description_short"),
            "scraped_at": row["scraped_at"].isoformat() if row.get("scraped_at") else None,
            "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
        }
        for row in rows
    ]
