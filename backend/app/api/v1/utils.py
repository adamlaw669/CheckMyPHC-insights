"""
Utility functions for API endpoints.
"""

import hashlib
from datetime import datetime
from typing import List, Dict


def generate_alert_id(phc_name: str, alert_type: str, timestamp: str = None) -> str:
    """
    Generate unique ID for alert feed item.

    Args:
        phc_name: PHC name
        alert_type: Type of alert
        timestamp: Optional timestamp

    Returns:
        MD5 hash-based unique ID
    """
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()

    combined = f"{phc_name}_{alert_type}_{timestamp}"
    return hashlib.md5(combined.encode()).hexdigest()[:16]


def sort_by_alert_level(
    records: List[Dict],
    level_field: str = "alert_level",
    score_field: str = "shortage_score",
) -> List[Dict]:
    """
    Sort records by alert level (High > Medium > Low) then by score descending.

    Args:
        records: List of record dictionaries
        level_field: Field name for alert level
        score_field: Field name for numeric score

    Returns:
        Sorted list of records
    """
    level_priority = {"High": 3, "Medium": 2, "Low": 1}

    def sort_key(record):
        level = record.get(level_field, "Low")
        score = record.get(score_field, 0)
        return (-level_priority.get(level, 0), -score)

    return sorted(records, key=sort_key)


def filter_by_state(records: List[Dict], state: str = None) -> List[Dict]:
    """Filter records by state if provided."""
    if not state:
        return records
    return [r for r in records if r.get("state", "").lower() == state.lower()]


def filter_by_lga(records: List[Dict], lga: str = None) -> List[Dict]:
    """Filter records by LGA if provided."""
    if not lga:
        return records
    return [r for r in records if r.get("lga", "").lower() == lga.lower()]


def filter_by_name(records: List[Dict], name: str = None) -> List[Dict]:
    """Filter records by PHC name (partial match)."""
    if not name:
        return records
    name_lower = name.lower()
    return [
        r
        for r in records
        if name_lower in r.get("name", "").lower()
        or name_lower in r.get("display_name", "").lower()
    ]


def paginate(records: List[Dict], limit: int = 100, offset: int = 0) -> List[Dict]:
    """Apply pagination to records."""
    return records[offset : offset + limit]
