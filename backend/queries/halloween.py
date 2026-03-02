"""
Reusable SQL query functions for halloween trick-or-treater tracking.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy import Engine, text

TABLE_NAME = "halloween_tracking"
YEAR_COLUMN_CANDIDATES = ("year", "halloween_year", "event_year")
COUNT_COLUMN_CANDIDATES = (
    "trick_or_treaters",
    "trick_or_treater_count",
    "count",
    "total_count",
    "total_trick_or_treaters",
    "num_trick_or_treaters",
    "counter_value",
    "increment",
)
DATE_COLUMN_CANDIDATES = ("date", "halloween_date", "created_at", "event_date", "event_ts")
ID_LIKE_COLUMNS = ("id", "rowid")


def _normalize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    return {str(key).lower(): value for key, value in record.items()}


def _safe_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _resolve_year(record: Dict[str, Any]) -> Optional[int]:
    for candidate in YEAR_COLUMN_CANDIDATES:
        year_value = _safe_int(record.get(candidate))
        if year_value:
            return year_value

    for candidate in DATE_COLUMN_CANDIDATES:
        value = record.get(candidate)
        if value is None:
            continue
        if hasattr(value, "year"):
            return int(value.year)
        if isinstance(value, str) and len(value) >= 4 and value[:4].isdigit():
            return int(value[:4])
    return None


def _resolve_count(record: Dict[str, Any], year_column: Optional[str]) -> Optional[int]:
    for candidate in COUNT_COLUMN_CANDIDATES:
        if candidate in record:
            return _safe_int(record.get(candidate))

    numeric_candidates: List[tuple[str, int]] = []
    for key, value in record.items():
        if key == year_column or key in ID_LIKE_COLUMNS:
            continue
        as_int = _safe_int(value)
        if as_int is not None:
            numeric_candidates.append((key, as_int))
    if numeric_candidates:
        return numeric_candidates[0][1]
    return None


async def get_yearly_counts(engine: Engine) -> List[Dict[str, Any]]:
    """
    Read halloween tracking records and return normalized yearly counts.
    """
    query = text(f"SELECT * FROM {TABLE_NAME}")
    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()

    normalized: List[Dict[str, Any]] = []
    for row in rows:
        record = _normalize_record(dict(row))
        year = _resolve_year(record)
        year_column = next((col for col in YEAR_COLUMN_CANDIDATES if col in record), None)
        metric_type = "sum"
        if "counter_value" in record:
            metric_type = "max"
            count = _safe_int(record.get("counter_value"))
        elif "increment" in record:
            count = _safe_int(record.get("increment"))
        else:
            count = _resolve_count(record, year_column=year_column)
        if year is None or count is None:
            continue
        normalized.append({"year": year, "count": count, "metric_type": metric_type})

    yearly_totals: Dict[int, Dict[str, Any]] = {}
    for entry in normalized:
        year = entry["year"]
        if year not in yearly_totals:
            yearly_totals[year] = {"sum": 0, "max": None, "has_max_metric": False}
        yearly_totals[year]["sum"] += entry["count"]
        if entry["metric_type"] == "max":
            yearly_totals[year]["has_max_metric"] = True
        if yearly_totals[year]["max"] is None or entry["count"] > yearly_totals[year]["max"]:
            yearly_totals[year]["max"] = entry["count"]

    output: List[Dict[str, Any]] = []
    for year in sorted(yearly_totals.keys()):
        totals = yearly_totals[year]
        use_max = totals["has_max_metric"] and totals["max"] is not None
        output.append({"year": year, "count": totals["max"] if use_max else totals["sum"]})
    return output


async def get_summary(engine: Engine) -> Dict[str, Any]:
    """
    Get summary statistics derived from yearly halloween counts.
    """
    yearly_counts = await get_yearly_counts(engine)
    if not yearly_counts:
        return {
            "years_tracked": 0,
            "total_trick_or_treaters": 0,
            "average_per_year": 0.0,
            "latest_year": None,
            "latest_count": None,
            "max_year": None,
            "max_count": None,
            "min_year": None,
            "min_count": None,
            "yoy_change": None,
            "yoy_change_percent": None,
        }

    total = sum(entry["count"] for entry in yearly_counts)
    years = len(yearly_counts)
    latest = yearly_counts[-1]
    max_entry = max(yearly_counts, key=lambda entry: entry["count"])
    min_entry = min(yearly_counts, key=lambda entry: entry["count"])

    yoy_change = None
    yoy_change_percent = None
    if len(yearly_counts) >= 2:
        prior = yearly_counts[-2]
        yoy_change = latest["count"] - prior["count"]
        if prior["count"] != 0:
            yoy_change_percent = round((yoy_change / prior["count"]) * 100, 2)

    return {
        "years_tracked": years,
        "total_trick_or_treaters": total,
        "average_per_year": round(total / years, 2) if years else 0.0,
        "latest_year": latest["year"],
        "latest_count": latest["count"],
        "max_year": max_entry["year"],
        "max_count": max_entry["count"],
        "min_year": min_entry["year"],
        "min_count": min_entry["count"],
        "yoy_change": yoy_change,
        "yoy_change_percent": yoy_change_percent,
    }
