import pytest
from backend.app.main import root, health_check
from backend.app.core.database import SessionLocal
from backend.app.api.v1.analytics import get_analytics_overview
from backend.app.api.v1.businesses import get_businesses
from backend.app.api.v1.discovery import get_sources

def test_root_endpoint():
    data = root()
    assert data["name"] == "Demanex"
    assert data["status"] == "online"

def test_health_endpoint():
    data = health_check()
    assert data["status"] == "healthy"

def test_analytics_overview():
    db = SessionLocal()
    try:
        data = get_analytics_overview(db=db)
        assert data.total_discovered_businesses >= 0
        assert data.businesses_without_websites >= 0
        assert data.qualified_leads >= 0
    finally:
        db.close()

def test_get_businesses():
    db = SessionLocal()
    try:
        data = get_businesses(db=db)
        assert isinstance(data, list)
        if len(data) > 0:
            biz = data[0]
            assert hasattr(biz, "id") or "id" in biz
            assert hasattr(biz, "name") or "name" in biz
    finally:
        db.close()

def test_filter_businesses_by_city():
    db = SessionLocal()
    try:
        data = get_businesses(city="Bengaluru", db=db)
        assert isinstance(data, list)
        for biz in data:
            assert "Bengaluru" in biz.city
    finally:
        db.close()

def test_get_discovery_sources():
    db = SessionLocal()
    try:
        data = get_sources(db=db)
        assert len(data) > 0
        source_names = [s.name for s in data]
        assert any("OpenStreetMap" in name for name in source_names)
    finally:
        db.close()
