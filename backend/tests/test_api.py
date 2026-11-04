import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "ProspectIQ"
    assert data["status"] == "online"

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_analytics_overview(client):
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_discovered_businesses" in data
    assert data["total_discovered_businesses"] > 0
    assert "businesses_without_websites" in data
    assert "qualified_leads" in data

def test_get_businesses(client):
    response = client.get("/api/v1/businesses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    biz = data[0]
    assert "id" in biz
    assert "name" in biz
    assert "lead_scores" in biz
    assert "website_audits" in biz

def test_filter_businesses_by_city(client):
    response = client.get("/api/v1/businesses?city=Bengaluru")
    assert response.status_code == 200
    data = response.json()
    for biz in data:
        assert "Bengaluru" in biz["city"]

def test_get_discovery_sources(client):
    response = client.get("/api/v1/discovery/sources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    source_names = [s["name"] for s in data]
    assert any("OpenStreetMap" in name for name in source_names)
