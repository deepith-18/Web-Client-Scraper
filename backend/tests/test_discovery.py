import uuid
from unittest.mock import MagicMock, patch
from backend.app.services.discovery_engine import normalize_domain, normalize_phone, OSM_CATEGORY_MAP, DiscoveryEngine
from backend.app.core.database import SessionLocal
from backend.app.models.job import ScrapingJob, LeadSource
from backend.app.models.business import Business
from backend.app.models.crm import SuppressionRecord

def test_normalize_domain():
    assert normalize_domain("https://www.example.com/contact") == "example.com"
    assert normalize_domain("http://sub.domain.co.in") == "sub.domain.co.in"
    assert normalize_domain("mybistro.in/") == "mybistro.in"
    assert normalize_domain(None) is None
    assert normalize_domain("") is None

def test_normalize_phone():
    assert normalize_phone("+91 80 4123 4567") == "+918041234567"
    assert normalize_phone("+1 (512) 555-0198") == "+15125550198"
    assert normalize_phone("123") is None  # too short
    assert normalize_phone(None) is None

def test_osm_category_mappings_complete():
    required_categories = [
        "Restaurants and cafes",
        "Interior designers",
        "Dental clinics",
        "Coaching centres",
        "Real estate agencies",
        "Gyms and fitness centres",
        "Travel agencies",
        "Small manufacturers",
        "Salons and spas"
    ]
    for cat in required_categories:
        assert cat in OSM_CATEGORY_MAP
        assert len(OSM_CATEGORY_MAP[cat]) > 0

@patch.object(DiscoveryEngine, "get_city_bounding_box")
@patch.object(DiscoveryEngine, "query_overpass_api")
def test_discovery_job_execution(mock_query_overpass, mock_get_bbox):
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6]
    test_name_1 = f"Bengaluru Craft Roastery {unique_suffix}"
    test_name_2 = f"Quick Bites Dhaba {unique_suffix}"
    test_domain = f"craftroastery-{unique_suffix}.example.in"

    try:
        mock_get_bbox.return_value = [12.90, 13.05, 77.50, 77.70]
        mock_query_overpass.return_value = [
            {
                "type": "node",
                "id": 999111,
                "lat": 12.9716,
                "lon": 77.5946,
                "tags": {
                    "name": test_name_1,
                    "amenity": "cafe",
                    "website": f"https://{test_domain}",
                    "phone": "+91 80 8899 0011",
                    "email": f"hello@{test_domain}",
                    "addr:street": "100ft Road",
                    "addr:city": "Bengaluru"
                }
            },
            {
                "type": "node",
                "id": 999222,
                "lat": 12.9720,
                "lon": 77.5950,
                "tags": {
                    "name": test_name_2,
                    "amenity": "restaurant"
                    # No website!
                }
            }
        ]

        source = db.query(LeadSource).first()
        job = ScrapingJob(
            job_name=f"Test Discovery BLR {unique_suffix}",
            target_country="India",
            target_city="Bengaluru",
            target_category="Restaurants and cafes",
            source_id=source.id if source else None,
            status="pending"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        engine = DiscoveryEngine(db)
        engine.execute_job(job.id)

        # Refresh job state
        db.refresh(job)
        assert job.status == "completed"
        assert job.progress_pct == 100
        assert job.records_qualified >= 2

        # Check discovered business in DB
        biz = db.query(Business).filter(Business.name == test_name_1).first()
        assert biz is not None
        assert biz.city == "Bengaluru"
        assert biz.normalized_domain == test_domain

        # Check the no-website business was also created with opportunity score
        no_web_biz = db.query(Business).filter(Business.name == test_name_2).first()
        assert no_web_biz is not None
        assert no_web_biz.official_website is None
        assert no_web_biz.lead_scores[0].priority_tier == "high"

        # Test deduplication: running again with the same mock data should qualify 0 new leads
        job2 = ScrapingJob(
            job_name=f"Test Duplicate Job {unique_suffix}",
            target_country="India",
            target_city="Bengaluru",
            target_category="Restaurants and cafes",
            source_id=source.id if source else None,
            status="pending"
        )
        db.add(job2)
        db.commit()
        db.refresh(job2)

        engine2 = DiscoveryEngine(db)
        engine2.execute_job(job2.id)
        db.refresh(job2)
        assert job2.status == "completed"
        assert job2.records_qualified == 0  # Duplicates correctly prevented!

    finally:
        # Clean up test rows
        db.query(Business).filter(Business.name.in_([test_name_1, test_name_2])).delete(synchronize_session=False)
        db.commit()
        db.close()
