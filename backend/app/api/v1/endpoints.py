"""
API v1 endpoints for CheckMyPHC Insights.

Example curl commands:

# Get outbreak alerts with limit
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=5"

# Get underserved PHCs
curl "http://localhost:8000/api/v1/underserved?top_n=3"

# Get alerts feed with filters
curl "http://localhost:8000/api/v1/alerts-feed?limit=10&types=outbreak,resource"

# Get telecom advice
curl "http://localhost:8000/api/v1/telecom-advice?name=ikeja"
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
import logging

from app.core.config import Settings, settings as app_settings
from app.services import insight_loader
from app.api.v1 import schemas, utils

logger = logging.getLogger("app")

router = APIRouter()


def get_settings() -> Settings:
    """Dependency to inject settings."""
    return app_settings


@router.get(
    "/outbreak-alerts",
    response_model=schemas.OutbreakAlertsResponse,
    summary="Get outbreak alerts",
    description="Returns PHCs flagged for resource shortages with filtering and pagination.",
)
async def get_outbreak_alerts(
    state: Optional[str] = Query(None, description="Filter by state"),
    lga: Optional[str] = Query(None, description="Filter by LGA"),
    level: Optional[str] = Query(
        None, description="Filter by alert level (Low, Medium, High)"
    ),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    offset: int = Query(0, ge=0, description="Starting offset for pagination"),
    refresh: bool = Query(False, description="Force reload data from disk"),
    settings: Settings = Depends(get_settings),
):
    """
    Get outbreak alerts with optional filtering.

    Returns PHCs with resource shortage alerts, sorted by alert level and score.
    """
    try:
        # Load data
        records = insight_loader.load_outbreak_alerts(
            settings.OUTPUT_DIR, refresh=refresh
        )

        # Apply filters
        if state:
            records = utils.filter_by_state(records, state)
        if lga:
            records = utils.filter_by_lga(records, lga)
        if level:
            if level not in ["Low", "Medium", "High"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid level. Must be Low, Medium, or High",
                )
            records = [r for r in records if r.get("alert_level") == level]

        # Sort by alert level and shortage score
        records = utils.sort_by_alert_level(records, "alert_level", "shortage_score")

        # Get total count before pagination
        total_count = len(records)

        # Apply pagination
        paginated_records = utils.paginate(records, limit, offset)

        logger.info(
            f"Returning {len(paginated_records)} outbreak alerts (total: {total_count})"
        )

        return schemas.OutbreakAlertsResponse(
            count=len(paginated_records),
            limit=limit,
            offset=offset,
            data=paginated_records,
        )

    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"Data validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Invalid data structure: {e}")


@router.get(
    "/underserved",
    response_model=schemas.UnderservedResponse,
    summary="Get underserved PHCs",
    description="Returns underserved PHCs with summary statistics.",
)
async def get_underserved_phcs(
    top_n: int = Query(
        10,
        ge=1,
        le=100,
        description="Number of top underserved PHCs to return in summary",
    ),
    state: Optional[str] = Query(None, description="Filter by state"),
    refresh: bool = Query(False, description="Force reload data from disk"),
    settings: Settings = Depends(get_settings),
):
    """
    Get underserved PHCs with summary statistics.

    Returns all underserved PHCs with computed average index and top N list.
    """
    try:
        # Load data
        records = insight_loader.load_underserved_phcs(
            settings.OUTPUT_DIR, refresh=refresh
        )

        # Apply filters
        if state:
            records = utils.filter_by_state(records, state)

        if not records:
            return schemas.UnderservedResponse(
                summary=schemas.UnderservedSummary(
                    avg_underserved_index=0.0, top_underserved_phcs=[]
                ),
                count=0,
                data=[],
            )

        # Compute average underserved index
        avg_index = sum(r["underserved_index"] for r in records) / len(records)

        # Get top N underserved PHCs
        sorted_by_index = sorted(
            records, key=lambda x: x["underserved_index"], reverse=True
        )
        top_phcs = [
            schemas.TopUnderservedPHC(
                name=r["name"],
                display_name=r["display_name"],
                underserved_index=r["underserved_index"],
            )
            for r in sorted_by_index[:top_n]
        ]

        logger.info(
            f"Returning {len(records)} underserved PHCs with avg index {avg_index:.3f}"
        )

        return schemas.UnderservedResponse(
            summary=schemas.UnderservedSummary(
                avg_underserved_index=round(avg_index, 3), top_underserved_phcs=top_phcs
            ),
            count=len(records),
            data=records,
        )

    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"Data validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Invalid data structure: {e}")


@router.get(
    "/alerts-feed",
    response_model=schemas.AlertsFeedResponse,
    summary="Get unified alerts feed",
    description="Returns aggregated alerts from all sources for dashboard display.",
)
async def get_alerts_feed(
    limit: int = Query(
        200, ge=1, le=1000, description="Maximum number of alerts to return"
    ),
    types: Optional[str] = Query(
        None, description="Comma-separated alert types: outbreak,underserved,resource"
    ),
    state: Optional[str] = Query(None, description="Filter by state"),
    refresh: bool = Query(False, description="Force reload data from disk"),
    settings: Settings = Depends(get_settings),
):
    """
    Get unified alerts feed from all sources.

    Aggregates outbreak alerts, underserved facilities, and resource warnings
    into a single feed with consistent structure.
    """
    try:
        feed_items = []
        timestamp = datetime.utcnow().isoformat() + "Z"

        # Parse types filter
        requested_types = []
        if types:
            requested_types = [t.strip().lower() for t in types.split(",")]

        # Load outbreak alerts
        if not types or "outbreak" in requested_types:
            try:
                outbreak_records = insight_loader.load_outbreak_alerts(
                    settings.OUTPUT_DIR, refresh=refresh
                )
                for record in outbreak_records:
                    feed_items.append(
                        {
                            "id": utils.generate_alert_id(
                                record["name"], "outbreak", timestamp
                            ),
                            "phc_name": record["name"],
                            "display_name": record["display_name"],
                            "lga": record["lga"],
                            "state": record["state"],
                            "type": "Outbreak Alert",
                            "level": record["alert_level"],
                            "score": float(record["shortage_score"]),
                            "timestamp": timestamp,
                        }
                    )
            except FileNotFoundError:
                logger.warning("Outbreak alerts file not found, skipping")

        # Load underserved PHCs
        if not types or "underserved" in requested_types:
            try:
                underserved_records = insight_loader.load_underserved_phcs(
                    settings.OUTPUT_DIR, refresh=refresh
                )
                for record in underserved_records:
                    # Map underserved_index to level
                    level = (
                        "High"
                        if record["underserved_index"] >= 0.7
                        else "Medium" if record["underserved_index"] >= 0.4 else "Low"
                    )
                    feed_items.append(
                        {
                            "id": utils.generate_alert_id(
                                record["name"], "underserved", timestamp
                            ),
                            "phc_name": record["name"],
                            "display_name": record["display_name"],
                            "lga": record["lga"],
                            "state": record["state"],
                            "type": "Underserved Facility",
                            "level": level,
                            "score": record["underserved_index"],
                            "timestamp": timestamp,
                        }
                    )
            except FileNotFoundError:
                logger.warning("Underserved PHCs file not found, skipping")

        # Load resource warnings
        if not types or "resource" in requested_types:
            try:
                resource_records = insight_loader.load_resource_warnings(
                    settings.OUTPUT_DIR, refresh=refresh
                )
                for record in resource_records:
                    feed_items.append(
                        {
                            "id": utils.generate_alert_id(
                                record["name"], "resource", timestamp
                            ),
                            "phc_name": record["name"],
                            "display_name": record["display_name"],
                            "lga": record["lga"],
                            "state": record["state"],
                            "type": "Resource Risk",
                            "level": record["resource_alert"],
                            "score": record["resource_risk_score"],
                            "timestamp": timestamp,
                        }
                    )
            except FileNotFoundError:
                logger.warning("Resource warnings file not found, skipping")

        # Apply state filter
        if state:
            feed_items = utils.filter_by_state(feed_items, state)

        # Sort by level priority then score
        level_priority = {"High": 3, "Medium": 2, "Low": 1}
        feed_items.sort(key=lambda x: (-level_priority.get(x["level"], 0), -x["score"]))

        # Apply limit
        feed_items = feed_items[:limit]

        logger.info(f"Returning {len(feed_items)} alerts in feed")

        return schemas.AlertsFeedResponse(total=len(feed_items), feed=feed_items)

    except Exception as e:
        logger.error(f"Error generating alerts feed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error generating alerts feed: {e}"
        )


@router.get(
    "/telecom-advice",
    response_model=schemas.TelecomAdviceResponse,
    summary="Get telecom communication advice",
    description="Returns preferred communication channels for PHCs based on network connectivity.",
)
async def get_telecom_advice(
    name: Optional[str] = Query(None, description="Filter by PHC name (partial match)"),
    state: Optional[str] = Query(None, description="Filter by state"),
    refresh: bool = Query(False, description="Force reload data from disk"),
    settings: Settings = Depends(get_settings),
):
    """
    Get telecommunication advice for PHCs.

    Returns preferred communication channels (SMS or WhatsApp) based on
    network connectivity information.
    """
    try:
        # Load telecom advice data
        records = insight_loader.get_telecom_advice(settings.DATA_DIR, refresh=refresh)

        # Apply filters
        if name:
            records = utils.filter_by_name(records, name)
        if state:
            records = utils.filter_by_state(records, state)

        logger.info(f"Returning {len(records)} telecom advice records")

        return schemas.TelecomAdviceResponse(count=len(records), data=records)

    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error loading telecom advice: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error loading telecom advice: {e}"
        )
