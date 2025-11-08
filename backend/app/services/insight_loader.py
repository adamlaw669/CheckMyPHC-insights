"""
Data loading and normalization services for CheckMyPHC insights.
Reads JSON outputs and CSV files, normalizes PHC names consistently.
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import logging

logger = logging.getLogger("app")


ALERT_LEVEL_CANONICAL = {
    "low": "Low",
    "medium": "Medium",
    "med": "Medium",
    "moderate": "Medium",
    "high": "High",
    "very high": "High",
    "critical": "High",
    "severe": "High",
}


def _first_non_empty(record: Dict, keys: List[str], default: str = "") -> str:
    """
    Return the first non-empty value found in `record` for the given keys.

    Args:
        record: Source dictionary
        keys: Candidate keys to inspect (in priority order)
        default: Value to return when no key has a value
    """
    for key in keys:
        if key in record:
            value = record.get(key)
            if value is None:
                continue
            if isinstance(value, str):
                cleaned = value.strip()
                if cleaned:
                    return cleaned
            else:
                return value
    return default


def _normalize_state_name(state_value: str) -> str:
    """Normalize state names removing trailing 'state' and standardising casing."""
    if not state_value:
        return ""

    cleaned = str(state_value).strip()
    lower_cleaned = cleaned.lower()

    if lower_cleaned.startswith("state of "):
        cleaned = cleaned[len("state of ") :]
        lower_cleaned = cleaned.lower()

    if lower_cleaned.endswith(" state"):
        cleaned = cleaned[: -len(" state")]

    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if not cleaned:
        return ""

    # Preserve common acronyms
    if cleaned.upper() in {"FCT", "F.C.T."}:
        return "FCT"

    return cleaned.title()


def _normalize_lga_name(lga_value: str) -> str:
    """Normalize LGA names by trimming whitespace and standardising casing."""
    if not lga_value:
        return ""

    cleaned = str(lga_value).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)

    if not cleaned:
        return ""

    return cleaned.title()


def _coerce_shortage_score(value) -> float:
    """Safely convert shortage score values to float."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return 0.0

    try:
        return float(value)
    except (TypeError, ValueError):
        logger.debug(f"Unable to parse shortage score '{value}', defaulting to 0")
        return 0.0


def _resolve_alert_level(raw_level, shortage_score: float) -> str:
    """
    Normalize alert level strings to Low/Medium/High.

    Falls back to shortage_score bands when level is missing or unrecognised.
    """
    if isinstance(raw_level, str):
        normalized = raw_level.strip().lower()
        if normalized in ALERT_LEVEL_CANONICAL:
            return ALERT_LEVEL_CANONICAL[normalized]

    # Derive from shortage score as fallback
    if shortage_score >= 3:
        return "High"
    if shortage_score >= 2:
        return "Medium"
    return "Low"


class DataLoadCache:
    """Simple cache for loaded data with timestamp-based expiry."""

    def __init__(self, ttl_seconds: int = 30):
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[str, Tuple[datetime, any]] = {}

    def get(self, key: str) -> Optional[any]:
        """Get cached value if still valid."""
        if key in self.cache:
            timestamp, value = self.cache[key]
            age = (datetime.utcnow() - timestamp).total_seconds()
            if age < self.ttl_seconds:
                return value
        return None

    def set(self, key: str, value: any):
        """Store value in cache with current timestamp."""
        self.cache[key] = (datetime.utcnow(), value)

    def clear(self):
        """Clear all cached data."""
        self.cache.clear()


# Global cache instance
_cache = DataLoadCache(ttl_seconds=30)


def normalize_phc_name(name: str) -> str:
    """
    Normalize PHC name for consistent matching across datasets.

    Normalization steps:
    - Convert to lowercase
    - Strip leading/trailing whitespace
    - Replace multiple spaces with single space
    - Remove leading/trailing punctuation

    Args:
        name: Original PHC name

    Returns:
        Normalized PHC name
    """
    if not name or not isinstance(name, str):
        return ""

    # Lowercase and strip
    normalized = name.lower().strip()

    # Replace multiple spaces with single space
    normalized = re.sub(r"\s+", " ", normalized)

    # Remove leading/trailing punctuation
    normalized = normalized.strip(".,;:!?-_")

    return normalized


def get_display_name(name: str) -> str:
    """
    Convert normalized name to display-friendly title case.

    Args:
        name: PHC name (normalized or original)

    Returns:
        Title-cased display name
    """
    if not name:
        return ""
    return name.strip().title()


def load_outbreak_alerts(output_dir: str, refresh: bool = False) -> List[Dict]:
    """
    Load outbreak alerts from JSON file.

    Args:
        output_dir: Directory containing output files
        refresh: Force reload from disk

    Returns:
        List of outbreak alert records with normalized fields

    Raises:
        FileNotFoundError: If outbreak_alerts.json doesn't exist
        ValueError: If JSON structure is invalid
    """
    cache_key = f"outbreak_alerts_{output_dir}"

    if not refresh:
        cached = _cache.get(cache_key)
        if cached is not None:
            logger.debug("Returning cached outbreak alerts")
            return cached

    file_path = Path(output_dir) / "outbreak_alerts.json"

    if not file_path.exists():
        raise FileNotFoundError(f"Outbreak alerts file not found: {file_path}")

    logger.info(f"Loading outbreak alerts from {file_path}")

    with open(file_path, "r") as f:
        data = json.load(f)

    # Normalize and validate records
    normalized_records = []
    for record in data:
        try:
            name_candidates = [
                "phc_name",
                "name",
                "Name of Primary Health Center",
                "Name of Primary Health Centre",
                "Primary Health Center",
                "Primary Health Centre",
            ]
            original_name = _first_non_empty(record, name_candidates)

            if not original_name:
                logger.debug(
                    "Skipping outbreak alert record with no recognizable PHC name keys"
                )
                continue

            normalized_name = normalize_phc_name(original_name)

            lga_raw = _first_non_empty(record, ["lga", "LGA", "PHC LGA"])
            state_raw = _first_non_empty(
                record, ["state", "State", "State of PHC", "state_of_phc"]
            )
            shortage_score_value = _coerce_shortage_score(
                _first_non_empty(
                    record,
                    [
                        "shortage_score",
                        "shortage score",
                        "Shortage Score",
                        "shortageScore",
                    ],
                    default="0",
                )
            )

            alert_level_raw = _first_non_empty(
                record,
                [
                    "alert_level",
                    "Alert Level",
                    "alertLevel",
                    "shortage_level",
                    "Shortage Level",
                ],
            )

            normalized_record = {
                "name": normalized_name,
                "display_name": get_display_name(original_name),
                "lga": _normalize_lga_name(lga_raw),
                "state": _normalize_state_name(state_raw),
                "shortage_score": max(0, int(round(shortage_score_value))),
                "alert_level": _resolve_alert_level(
                    alert_level_raw, shortage_score_value
                ),
            }
            normalized_records.append(normalized_record)
        except (KeyError, ValueError) as e:
            logger.warning(f"Skipping invalid outbreak alert record: {e}")
            continue

    logger.info(f"Loaded {len(normalized_records)} outbreak alert records")
    _cache.set(cache_key, normalized_records)

    return normalized_records


def load_underserved_phcs(output_dir: str, refresh: bool = False) -> List[Dict]:
    """
    Load underserved PHCs from JSON file.

    Args:
        output_dir: Directory containing output files
        refresh: Force reload from disk

    Returns:
        List of underserved PHC records with normalized fields

    Raises:
        FileNotFoundError: If underserved_phcs.json doesn't exist
        ValueError: If JSON structure is invalid
    """
    cache_key = f"underserved_phcs_{output_dir}"

    if not refresh:
        cached = _cache.get(cache_key)
        if cached is not None:
            logger.debug("Returning cached underserved PHCs")
            return cached

    file_path = Path(output_dir) / "underserved_phcs.json"

    if not file_path.exists():
        raise FileNotFoundError(f"Underserved PHCs file not found: {file_path}")

    logger.info(f"Loading underserved PHCs from {file_path}")

    with open(file_path, "r") as f:
        data = json.load(f)

    # Normalize and validate records
    normalized_records = []
    for record in data:
        try:
            original_name = record.get("phc_name", record.get("name", ""))
            normalized_name = normalize_phc_name(original_name)

            # Coerce underserved_index to float
            underserved_index = record.get("underserved_index", 0)
            if isinstance(underserved_index, str):
                underserved_index = float(underserved_index)

            normalized_record = {
                "name": normalized_name,
                "display_name": get_display_name(original_name),
                "lga": record.get("lga", ""),
                "state": record.get("state", ""),
                "underserved_index": float(underserved_index),
                "underserved_flag": record.get("underserved_flag", False),
            }
            normalized_records.append(normalized_record)
        except (KeyError, ValueError) as e:
            logger.warning(f"Skipping invalid underserved PHC record: {e}")
            continue

    logger.info(f"Loaded {len(normalized_records)} underserved PHC records")
    _cache.set(cache_key, normalized_records)

    return normalized_records


def load_resource_warnings(output_dir: str, refresh: bool = False) -> List[Dict]:
    """
    Load resource warnings from JSON file.

    Args:
        output_dir: Directory containing output files
        refresh: Force reload from disk

    Returns:
        List of resource warning records with normalized fields

    Raises:
        FileNotFoundError: If resource_warnings.json doesn't exist
        ValueError: If JSON structure is invalid
    """
    cache_key = f"resource_warnings_{output_dir}"

    if not refresh:
        cached = _cache.get(cache_key)
        if cached is not None:
            logger.debug("Returning cached resource warnings")
            return cached

    file_path = Path(output_dir) / "resource_warnings.json"

    if not file_path.exists():
        raise FileNotFoundError(f"Resource warnings file not found: {file_path}")

    logger.info(f"Loading resource warnings from {file_path}")

    with open(file_path, "r") as f:
        data = json.load(f)

    # Normalize and validate records
    normalized_records = []
    for record in data:
        try:
            original_name = record.get("phc_name", record.get("name", ""))
            normalized_name = normalize_phc_name(original_name)

            # Coerce resource_risk_score to numeric
            risk_score = record.get("resource_risk_score", 0)
            if isinstance(risk_score, str):
                risk_score = float(risk_score)

            normalized_record = {
                "name": normalized_name,
                "display_name": get_display_name(original_name),
                "lga": record.get("lga", ""),
                "state": record.get("state", ""),
                "resource_risk_score": float(risk_score),
                "resource_alert": record.get("resource_alert", "Low"),
            }
            normalized_records.append(normalized_record)
        except (KeyError, ValueError) as e:
            logger.warning(f"Skipping invalid resource warning record: {e}")
            continue

    logger.info(f"Loaded {len(normalized_records)} resource warning records")
    _cache.set(cache_key, normalized_records)

    return normalized_records


def load_telecommunication_data(data_dir: str, refresh: bool = False) -> pd.DataFrame:
    """
    Load telecommunication data from CSV file.

    Args:
        data_dir: Directory containing source data files
        refresh: Force reload from disk

    Returns:
        DataFrame with telecommunication data and normalized PHC names

    Raises:
        FileNotFoundError: If telecommunication.csv doesn't exist
    """
    cache_key = f"telecommunication_{data_dir}"

    if not refresh:
        cached = _cache.get(cache_key)
        if cached is not None:
            logger.debug("Returning cached telecommunication data")
            return cached

    file_path = Path(data_dir) / "telecommunication.csv"

    if not file_path.exists():
        raise FileNotFoundError(f"Telecommunication file not found: {file_path}")

    logger.info(f"Loading telecommunication data from {file_path}")

    df = pd.read_csv(file_path)

    # Normalize PHC names if name column exists
    name_col = None
    for col in ["PHC Name", "phc_name", "Name", "name"]:
        if col in df.columns:
            name_col = col
            break

    if name_col:
        df["original_name"] = df[name_col]
        df["name"] = df[name_col].apply(normalize_phc_name)
        df["display_name"] = df[name_col].apply(get_display_name)

    logger.info(f"Loaded {len(df)} telecommunication records")
    _cache.set(cache_key, df)

    return df


def determine_preferred_channel(telecom_info: str) -> str:
    """
    Determine preferred communication channel based on network info.

    Logic:
    - If mentions "2g", "no network", "limited", "poor network" -> SMS
    - If mentions "3g", "4g", "good", "strong" -> WhatsApp
    - Default: SMS (when unsure)

    Args:
        telecom_info: String describing network/connectivity

    Returns:
        "SMS" or "WhatsApp"
    """
    if not telecom_info or not isinstance(telecom_info, str):
        return "SMS"

    info_lower = telecom_info.lower()

    # Check for poor connectivity indicators
    poor_indicators = ["2g", "no network", "limited", "poor", "weak", "bad"]
    if any(indicator in info_lower for indicator in poor_indicators):
        return "SMS"

    # Check for good connectivity indicators
    good_indicators = ["3g", "4g", "5g", "good", "strong", "excellent", "stable"]
    if any(indicator in info_lower for indicator in good_indicators):
        return "WhatsApp"

    # Default to SMS when unsure
    return "SMS"


def get_telecom_advice(data_dir: str, refresh: bool = False) -> List[Dict]:
    """
    Load telecom data and provide communication channel advice.

    Args:
        data_dir: Directory containing source data files
        refresh: Force reload from disk

    Returns:
        List of records with preferred communication channels
    """
    df = load_telecommunication_data(data_dir, refresh)

    # Find the transportation/connectivity column
    transport_col = None
    for col in df.columns:
        if (
            "transportation" in col.lower()
            or "network" in col.lower()
            or "connectivity" in col.lower()
        ):
            transport_col = col
            break

    records = []
    for _, row in df.iterrows():
        telecom_notes = ""
        if transport_col and pd.notna(row.get(transport_col)):
            telecom_notes = str(row[transport_col])

        record = {
            "name": row.get("name", ""),
            "display_name": row.get("display_name", ""),
            "lga": row.get("LGA", row.get("lga", "")),
            "state": row.get("State", row.get("state", "")),
            "telecom_notes": telecom_notes,
            "preferred_channel": determine_preferred_channel(telecom_notes),
        }
        records.append(record)

    return records


def clear_cache():
    """Clear all cached data. Useful for testing or forced refresh."""
    _cache.clear()
    logger.info("Data cache cleared")
