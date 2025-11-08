"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class OutbreakAlertRecord(BaseModel):
    """Single outbreak alert record."""

    name: str = Field(..., description="Normalized PHC name")
    display_name: str = Field(..., description="Display-friendly PHC name")
    lga: str = Field(..., description="Local Government Area")
    state: str = Field(..., description="State")
    shortage_score: int = Field(..., description="Resource shortage score", ge=0)
    alert_level: str = Field(
        ..., description="Alert severity level", pattern="^(Low|Medium|High)$"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "ikeja central phc",
                    "display_name": "Ikeja Central PHC",
                    "lga": "Ikeja",
                    "state": "Lagos",
                    "shortage_score": 3,
                    "alert_level": "High",
                }
            ]
        }
    }


class OutbreakAlertsResponse(BaseModel):
    """Response for outbreak alerts endpoint."""

    count: int = Field(..., description="Number of records returned")
    limit: int = Field(..., description="Max records per page")
    offset: int = Field(..., description="Starting offset")
    data: List[OutbreakAlertRecord] = Field(
        ..., description="List of outbreak alert records"
    )


class UnderservedPHCRecord(BaseModel):
    """Single underserved PHC record."""

    name: str = Field(..., description="Normalized PHC name")
    display_name: str = Field(..., description="Display-friendly PHC name")
    lga: str = Field(..., description="Local Government Area")
    state: str = Field(..., description="State")
    underserved_index: float = Field(
        ..., description="Underserved index score", ge=0, le=1
    )
    underserved_flag: bool = Field(
        ..., description="Whether PHC is flagged as underserved"
    )


class TopUnderservedPHC(BaseModel):
    """Minimal record for top underserved list."""

    name: str
    display_name: str
    underserved_index: float


class UnderservedSummary(BaseModel):
    """Summary statistics for underserved PHCs."""

    avg_underserved_index: float = Field(..., description="Average underserved index")
    top_underserved_phcs: List[TopUnderservedPHC] = Field(
        ..., description="Top N underserved facilities"
    )


class UnderservedResponse(BaseModel):
    """Response for underserved endpoint."""

    summary: UnderservedSummary
    count: int = Field(..., description="Total number of records")
    data: List[UnderservedPHCRecord] = Field(
        ..., description="List of underserved PHC records"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "summary": {
                        "avg_underserved_index": 0.67,
                        "top_underserved_phcs": [
                            {
                                "name": "example phc",
                                "display_name": "Example PHC",
                                "underserved_index": 0.98,
                            }
                        ],
                    },
                    "count": 10,
                    "data": [],
                }
            ]
        }
    }


class AlertFeedItem(BaseModel):
    """Single alert feed item with unified structure."""

    id: str = Field(..., description="Unique alert identifier")
    phc_name: str = Field(..., description="Normalized PHC name")
    display_name: str = Field(..., description="Display-friendly PHC name")
    lga: str = Field(..., description="Local Government Area")
    state: str = Field(..., description="State")
    type: str = Field(
        ...,
        description="Alert type",
        pattern="^(Outbreak Alert|Underserved Facility|Resource Risk)$",
    )
    level: str = Field(..., description="Alert severity level")
    score: float = Field(..., description="Numeric score/index")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class AlertsFeedResponse(BaseModel):
    """Response for alerts feed endpoint."""

    total: int = Field(..., description="Total number of alerts")
    feed: List[AlertFeedItem] = Field(..., description="List of alert items")


class TelecomAdviceRecord(BaseModel):
    """Single telecom advice record."""

    name: str = Field(..., description="Normalized PHC name")
    display_name: str = Field(..., description="Display-friendly PHC name")
    lga: str = Field(..., description="Local Government Area")
    state: str = Field(..., description="State")
    telecom_notes: str = Field(..., description="Network/connectivity information")
    preferred_channel: str = Field(
        ..., description="Recommended communication channel", pattern="^(SMS|WhatsApp)$"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "ikeja central phc",
                    "display_name": "Ikeja Central PHC",
                    "lga": "Ikeja",
                    "state": "Lagos",
                    "telecom_notes": "4G network available",
                    "preferred_channel": "WhatsApp",
                }
            ]
        }
    }


class TelecomAdviceResponse(BaseModel):
    """Response for telecom advice endpoint."""

    count: int = Field(..., description="Number of records returned")
    data: List[TelecomAdviceRecord] = Field(
        ..., description="List of telecom advice records"
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")
