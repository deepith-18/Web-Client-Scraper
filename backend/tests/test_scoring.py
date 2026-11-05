import pytest
import uuid
from backend.app.core.database import SessionLocal
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.services.scoring_engine import ScoringEngine, PRESET_PROFILES
from backend.app.schemas.score import ScoringWeightsConfig

def test_priority_tier_determination():
    assert ScoringEngine.determine_priority_tier(95) == "high"
    assert ScoringEngine.determine_priority_tier(80) == "high"
    assert ScoringEngine.determine_priority_tier(79) == "good"
    assert ScoringEngine.determine_priority_tier(60) == "good"
    assert ScoringEngine.determine_priority_tier(59) == "medium"
    assert ScoringEngine.determine_priority_tier(40) == "medium"
    assert ScoringEngine.determine_priority_tier(39) == "low"
    assert ScoringEngine.determine_priority_tier(0) == "low"

def test_scoring_business_without_website():
    biz = Business(
        id=str(uuid.uuid4()),
        name="Bengaluru Filter Coffee Co",
        category="Cafes & Restaurants",
        city="Bengaluru",
        country="India",
        latitude=12.9716,
        longitude=77.5946,
        official_website="",
        description="Traditional South Indian filter coffee in Indiranagar."
    )
    
    total, tier, components, factors, pitch = ScoringEngine.evaluate_business(biz)
    
    # Expect 30 pts for no website + 5 pts for corroborated location + 5 pts for missing info if address missing
    assert components["no_website"] == 30
    assert components["website_unavailable"] == 0
    assert components["mobile"] == 0
    assert total >= 35
    assert "turnkey" in pitch.lower()

def test_scoring_business_with_unreachable_website():
    biz = Business(
        id=str(uuid.uuid4()),
        name="Skyline Interior Studio",
        category="Interior Designers",
        city="Bengaluru",
        official_website="https://broken-skyline-interior.in",
        normalized_domain="broken-skyline-interior.in",
        latitude=12.9352,
        longitude=77.6245
    )
    audit = WebsiteAudit(
        business_id=biz.id,
        has_website=True,
        is_reachable=False,
        http_status=502
    )

    total, tier, components, factors, pitch = ScoringEngine.evaluate_business(biz, audit=audit)
    assert components["no_website"] == 0
    assert components["website_unavailable"] == 25
    assert "recovery" in pitch.lower() or "offline" in pitch.lower()

def test_scoring_business_with_mobile_and_form_deficiencies():
    biz = Business(
        id=str(uuid.uuid4()),
        name="SmileCare Dental Clinic",
        category="Dental Clinics",
        city="Bengaluru",
        official_website="https://smilecaredental.in",
        normalized_domain="smilecaredental.in",
        latitude=12.9250,
        longitude=77.5938
    )
    audit = WebsiteAudit(
        business_id=biz.id,
        has_website=True,
        is_reachable=True,
        http_status=200,
        is_mobile_friendly=False,
        has_contact_form=False,
        load_time_ms=3800
    )
    contact = BusinessContact(
        business_id=biz.id,
        contact_type="email",
        raw_value="dr.smith@smilecaredental.in",
        normalized_value="dr.smith@smilecaredental.in"
    )

    total, tier, components, factors, pitch = ScoringEngine.evaluate_business(
        biz, audit=audit, contacts=[contact]
    )
    assert components["mobile"] == 15
    assert components["missing_contact"] == 10
    assert components["performance"] == 5
    assert components["email_available"] == 5
    assert "responsive" in pitch.lower() or "mobile" in pitch.lower()

def test_scoring_custom_weights_profile():
    biz = Business(
        id=str(uuid.uuid4()),
        name="Artisan Roasters",
        category="Cafes",
        city="Austin",
        country="USA",
        official_website=""
    )
    custom_weights = ScoringWeightsConfig(
        no_website=45,
        website_unavailable=20,
        poor_mobile=10,
        missing_contact=5,
        missing_info=5,
        performance_issues=0,
        identity_corroborated=5,
        email_available=5
    )

    total, tier, components, factors, pitch = ScoringEngine.evaluate_business(
        biz, weights=custom_weights
    )
    assert components["no_website"] == 45

def test_scoring_database_persistence():
    db = SessionLocal()
    try:
        biz_id = str(uuid.uuid4())
        test_biz = Business(
            id=biz_id,
            name=f"Test Scoring Biz {biz_id[:8]}",
            category="Small Manufacturers",
            city="Bengaluru",
            country="India",
            official_website="https://manufacturing-test-prospect.in",
            normalized_domain="manufacturing-test-prospect.in",
            latitude=12.9716,
            longitude=77.5946
        )
        db.add(test_biz)
        db.commit()

        audit = WebsiteAudit(
            business_id=biz_id,
            has_website=True,
            is_reachable=True,
            http_status=200,
            is_mobile_friendly=False,
            has_contact_form=False
        )
        db.add(audit)
        db.commit()

        score_rec = ScoringEngine.score_business(db, biz_id)
        assert score_rec is not None
        assert score_rec.total_opportunity_score > 0
        assert score_rec.mobile_score == 15
        assert score_rec.missing_contact_score == 10
        assert "factors" in score_rec.score_breakdown

        # Bulk recalculate test
        bulk_res = ScoringEngine.bulk_recalculate(db, category="Small Manufacturers")
        assert bulk_res["total_recalculated"] >= 1
        assert "tier_distribution" in bulk_res

        # Teardown
        db.query(LeadScore).filter(LeadScore.business_id == biz_id).delete()
        db.query(WebsiteAudit).filter(WebsiteAudit.business_id == biz_id).delete()
        db.query(Business).filter(Business.id == biz_id).delete()
        db.commit()
    finally:
        db.close()

def test_scoring_api_router():
    from backend.app.api.v1.scoring import get_scoring_presets, get_default_weights, get_scoring_summary

    db = SessionLocal()
    try:
        # 1. Presets endpoint
        presets = get_scoring_presets()
        assert len(presets) >= 4
        preset_ids = [p.id for p in presets]
        assert "balanced" in preset_ids
        assert "new_builds" in preset_ids
        assert "redesign_mobile" in preset_ids

        # 2. Default weights endpoint
        weights = get_default_weights()
        assert weights.no_website == 30
        assert weights.poor_mobile == 15

        # 3. Summary endpoint
        summary = get_scoring_summary(db=db)
        assert "total_scored" in summary
        assert "average_opportunity_score" in summary
    finally:
        db.close()


