"""
Comprehensive test suite for API endpoints.

Tests all four main endpoints with various scenarios including:
- Health checks
- Outbreak alerts with filtering and pagination
- Underserved PHCs with summary statistics
- Alerts feed with type filtering
- Telecom advice with preferred channels
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint returns 200 with service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data

    def test_health_check_endpoint(self, client: TestClient):
        """Test dedicated health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestOutbreakAlertsEndpoint:
    """Test /api/v1/outbreak-alerts endpoint."""

    def test_get_all_outbreak_alerts(self, client: TestClient):
        """Test getting all outbreak alerts without filters."""
        response = client.get("/api/v1/outbreak-alerts")
        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "count" in data
        assert "limit" in data
        assert "offset" in data
        assert "data" in data
        assert isinstance(data["data"], list)

        # Should return 5 records from fixture
        assert data["count"] == 5
        assert len(data["data"]) == 5

    def test_outbreak_alerts_with_limit(self, client: TestClient):
        """Test limit parameter respects pagination."""
        response = client.get("/api/v1/outbreak-alerts?limit=2")
        assert response.status_code == 200
        data = response.json()

        assert data["count"] == 2
        assert data["limit"] == 2
        assert len(data["data"]) == 2

    def test_outbreak_alerts_with_offset(self, client: TestClient):
        """Test offset parameter works correctly."""
        response = client.get("/api/v1/outbreak-alerts?limit=2&offset=2")
        assert response.status_code == 200
        data = response.json()

        assert data["count"] == 2
        assert data["offset"] == 2
        assert len(data["data"]) == 2

    def test_outbreak_alerts_filter_by_state(self, client: TestClient):
        """Test filtering by state."""
        response = client.get("/api/v1/outbreak-alerts?state=Taraba")
        assert response.status_code == 200
        data = response.json()

        # Should return 2 Taraba records
        assert data["count"] == 2
        for record in data["data"]:
            assert record["state"] == "Taraba"

    def test_outbreak_alerts_filter_by_level(self, client: TestClient):
        """Test filtering by alert level."""
        response = client.get("/api/v1/outbreak-alerts?level=High")
        assert response.status_code == 200
        data = response.json()

        # Should return 2 High level alerts
        assert data["count"] == 2
        for record in data["data"]:
            assert record["alert_level"] == "High"

    def test_outbreak_alerts_invalid_level(self, client: TestClient):
        """Test invalid alert level returns 400."""
        response = client.get("/api/v1/outbreak-alerts?level=Invalid")
        assert response.status_code == 400

    def test_outbreak_alerts_sorting(self, client: TestClient):
        """Test records are sorted by alert level and score."""
        response = client.get("/api/v1/outbreak-alerts")
        assert response.status_code == 200
        data = response.json()

        # First record should be High level with highest score
        first_record = data["data"][0]
        assert first_record["alert_level"] == "High"

        # Verify sorting order
        level_priority = {"High": 3, "Medium": 2, "Low": 1}
        for i in range(len(data["data"]) - 1):
            current = data["data"][i]
            next_record = data["data"][i + 1]

            current_priority = (
                level_priority[current["alert_level"]],
                current["shortage_score"],
            )
            next_priority = (
                level_priority[next_record["alert_level"]],
                next_record["shortage_score"],
            )

            assert current_priority >= next_priority

    def test_outbreak_alerts_record_structure(self, client: TestClient):
        """Test each record has required fields."""
        response = client.get("/api/v1/outbreak-alerts?limit=1")
        assert response.status_code == 200
        data = response.json()

        record = data["data"][0]
        assert "name" in record
        assert "display_name" in record
        assert "lga" in record
        assert "state" in record
        assert "shortage_score" in record
        assert "alert_level" in record

        # Validate types
        assert isinstance(record["shortage_score"], int)
        assert record["alert_level"] in ["Low", "Medium", "High"]


class TestUnderservedEndpoint:
    """Test /api/v1/underserved endpoint."""

    def test_get_underserved_phcs(self, client: TestClient):
        """Test getting underserved PHCs with summary."""
        response = client.get("/api/v1/underserved")
        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "summary" in data
        assert "count" in data
        assert "data" in data

        # Validate summary
        summary = data["summary"]
        assert "avg_underserved_index" in summary
        assert "top_underserved_phcs" in summary
        assert isinstance(summary["avg_underserved_index"], float)
        assert isinstance(summary["top_underserved_phcs"], list)

    def test_underserved_summary_calculations(self, client: TestClient):
        """Test summary statistics are calculated correctly."""
        response = client.get("/api/v1/underserved")
        assert response.status_code == 200
        data = response.json()

        summary = data["summary"]

        # Average should be reasonable (between 0 and 1)
        assert 0 <= summary["avg_underserved_index"] <= 1

        # Top PHCs should be sorted by index descending
        top_phcs = summary["top_underserved_phcs"]
        if len(top_phcs) > 1:
            for i in range(len(top_phcs) - 1):
                assert (
                    top_phcs[i]["underserved_index"]
                    >= top_phcs[i + 1]["underserved_index"]
                )

    def test_underserved_top_n_parameter(self, client: TestClient):
        """Test top_n parameter limits top underserved list."""
        response = client.get("/api/v1/underserved?top_n=3")
        assert response.status_code == 200
        data = response.json()

        top_phcs = data["summary"]["top_underserved_phcs"]
        assert len(top_phcs) <= 3

    def test_underserved_filter_by_state(self, client: TestClient):
        """Test filtering underserved PHCs by state."""
        response = client.get("/api/v1/underserved?state=Taraba")
        assert response.status_code == 200
        data = response.json()

        # All records should be from Taraba
        for record in data["data"]:
            assert record["state"] == "Taraba"

    def test_underserved_record_structure(self, client: TestClient):
        """Test each record has required fields."""
        response = client.get("/api/v1/underserved")
        assert response.status_code == 200
        data = response.json()

        if data["data"]:
            record = data["data"][0]
            assert "name" in record
            assert "display_name" in record
            assert "lga" in record
            assert "state" in record
            assert "underserved_index" in record
            assert "underserved_flag" in record

            # Validate types
            assert isinstance(record["underserved_index"], float)
            assert isinstance(record["underserved_flag"], bool)
            assert 0 <= record["underserved_index"] <= 1


class TestAlertsFeedEndpoint:
    """Test /api/v1/alerts-feed endpoint."""

    def test_get_alerts_feed(self, client: TestClient):
        """Test getting unified alerts feed."""
        response = client.get("/api/v1/alerts-feed")
        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "total" in data
        assert "feed" in data
        assert isinstance(data["feed"], list)

        # Should have alerts from all three sources
        assert data["total"] > 0

    def test_alerts_feed_item_structure(self, client: TestClient):
        """Test each feed item has required fields."""
        response = client.get("/api/v1/alerts-feed?limit=1")
        assert response.status_code == 200
        data = response.json()

        if data["feed"]:
            item = data["feed"][0]
            assert "id" in item
            assert "phc_name" in item
            assert "display_name" in item
            assert "lga" in item
            assert "state" in item
            assert "type" in item
            assert "level" in item
            assert "score" in item
            assert "timestamp" in item

            # Validate types
            assert item["type"] in [
                "Outbreak Alert",
                "Underserved Facility",
                "Resource Risk",
            ]
            assert item["level"] in ["Low", "Medium", "High"]
            assert isinstance(item["score"], (int, float))

    def test_alerts_feed_unique_ids(self, client: TestClient):
        """Test that feed items have unique IDs."""
        response = client.get("/api/v1/alerts-feed")
        assert response.status_code == 200
        data = response.json()

        ids = [item["id"] for item in data["feed"]]
        # IDs should be unique
        assert len(ids) == len(set(ids))

    def test_alerts_feed_type_filter(self, client: TestClient):
        """Test filtering by alert types."""
        response = client.get("/api/v1/alerts-feed?types=outbreak")
        assert response.status_code == 200
        data = response.json()

        # All items should be Outbreak Alerts
        for item in data["feed"]:
            assert item["type"] == "Outbreak Alert"

    def test_alerts_feed_multiple_type_filter(self, client: TestClient):
        """Test filtering by multiple alert types."""
        response = client.get("/api/v1/alerts-feed?types=outbreak,resource")
        assert response.status_code == 200
        data = response.json()

        # Items should only be outbreak or resource types
        for item in data["feed"]:
            assert item["type"] in ["Outbreak Alert", "Resource Risk"]

    def test_alerts_feed_state_filter(self, client: TestClient):
        """Test filtering feed by state."""
        response = client.get("/api/v1/alerts-feed?state=Taraba")
        assert response.status_code == 200
        data = response.json()

        # All items should be from Taraba
        for item in data["feed"]:
            assert item["state"] == "Taraba"

    def test_alerts_feed_limit(self, client: TestClient):
        """Test limit parameter."""
        response = client.get("/api/v1/alerts-feed?limit=5")
        assert response.status_code == 200
        data = response.json()

        assert len(data["feed"]) <= 5

    def test_alerts_feed_sorting(self, client: TestClient):
        """Test feed is sorted by level priority and score."""
        response = client.get("/api/v1/alerts-feed")
        assert response.status_code == 200
        data = response.json()

        if len(data["feed"]) > 1:
            level_priority = {"High": 3, "Medium": 2, "Low": 1}

            for i in range(len(data["feed"]) - 1):
                current = data["feed"][i]
                next_item = data["feed"][i + 1]

                current_priority = (level_priority[current["level"]], current["score"])
                next_priority = (level_priority[next_item["level"]], next_item["score"])

                assert current_priority >= next_priority


class TestTelecomAdviceEndpoint:
    """Test /api/v1/telecom-advice endpoint."""

    def test_get_telecom_advice(self, client: TestClient):
        """Test getting telecom advice."""
        response = client.get("/api/v1/telecom-advice")
        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "count" in data
        assert "data" in data
        assert isinstance(data["data"], list)

        # Should have records from fixture
        assert data["count"] > 0

    def test_telecom_advice_record_structure(self, client: TestClient):
        """Test each record has required fields."""
        response = client.get("/api/v1/telecom-advice?limit=1")
        assert response.status_code == 200
        data = response.json()

        if data["data"]:
            record = data["data"][0]
            assert "name" in record
            assert "display_name" in record
            assert "lga" in record
            assert "state" in record
            assert "telecom_notes" in record
            assert "preferred_channel" in record

            # Validate channel values
            assert record["preferred_channel"] in ["SMS", "WhatsApp"]

    def test_telecom_advice_preferred_channels(self, client: TestClient):
        """Test preferred channel logic works correctly."""
        response = client.get("/api/v1/telecom-advice")
        assert response.status_code == 200
        data = response.json()

        # Verify channel assignment based on network info
        for record in data["data"]:
            notes = record["telecom_notes"].lower()
            channel = record["preferred_channel"]

            # If notes mention 2G or poor network, should be SMS
            if any(term in notes for term in ["2g", "poor", "limited", "no network"]):
                assert channel == "SMS", f"Expected SMS for: {notes}"

            # If notes mention 4G or good network, should be WhatsApp
            elif any(term in notes for term in ["4g", "good", "strong", "excellent"]):
                assert channel == "WhatsApp", f"Expected WhatsApp for: {notes}"

    def test_telecom_advice_filter_by_name(self, client: TestClient):
        """Test filtering by PHC name."""
        response = client.get("/api/v1/telecom-advice?name=ikeja")
        assert response.status_code == 200
        data = response.json()

        # Should find Ikeja Central PHC
        assert data["count"] >= 1
        found_ikeja = any("ikeja" in r["name"].lower() for r in data["data"])
        assert found_ikeja

    def test_telecom_advice_filter_by_state(self, client: TestClient):
        """Test filtering by state."""
        response = client.get("/api/v1/telecom-advice?state=Taraba")
        assert response.status_code == 200
        data = response.json()

        # All records should be from Taraba
        for record in data["data"]:
            assert record["state"] == "Taraba"


class TestDataNormalization:
    """Test PHC name normalization and consistency."""

    def test_name_normalization_consistency(self, client: TestClient):
        """Test that PHC names are normalized consistently."""
        response = client.get("/api/v1/outbreak-alerts")
        assert response.status_code == 200
        data = response.json()

        for record in data["data"]:
            # Normalized names should be lowercase
            assert record["name"] == record["name"].lower()
            # Display names should be title case
            assert record["display_name"][0].isupper() or not record["display_name"]


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_invalid_limit_parameter(self, client: TestClient):
        """Test invalid limit values are handled."""
        response = client.get("/api/v1/outbreak-alerts?limit=0")
        # Should return 422 for validation error
        assert response.status_code == 422

    def test_negative_offset_parameter(self, client: TestClient):
        """Test negative offset values are handled."""
        response = client.get("/api/v1/outbreak-alerts?offset=-1")
        # Should return 422 for validation error
        assert response.status_code == 422

    def test_refresh_parameter(self, client: TestClient):
        """Test refresh parameter forces data reload."""
        # First call
        response1 = client.get("/api/v1/outbreak-alerts")
        assert response1.status_code == 200

        # Second call with refresh
        response2 = client.get("/api/v1/outbreak-alerts?refresh=true")
        assert response2.status_code == 200

        # Results should be the same
        assert response1.json() == response2.json()
