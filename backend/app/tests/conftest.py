"""
Pytest configuration and fixtures for testing.
"""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.main import app
from app.core.config import settings


@pytest.fixture(scope="session")
def test_fixtures_dir():
    """Return path to test fixtures directory."""
    return Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def configure_test_settings(test_fixtures_dir, monkeypatch):
    """Configure settings to use test fixtures."""
    # Point to test fixtures
    monkeypatch.setattr(settings, "OUTPUT_DIR", str(test_fixtures_dir))
    monkeypatch.setattr(settings, "DATA_DIR", str(test_fixtures_dir))

    # Clear cache before each test
    from app.services.insight_loader import clear_cache

    clear_cache()

    yield

    # Clear cache after each test
    clear_cache()
