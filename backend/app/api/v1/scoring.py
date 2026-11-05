from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.score import LeadScore
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.verification import VerificationRecord
from backend.app.schemas.score import (
    ScoringWeightsConfig,
    PresetProfile,
    ScoreRecalculateRequest,
    ScoreBreakdownDetail
)
from backend.app.schemas.business import LeadScoreResponse
from backend.app.services.scoring_engine import ScoringEngine, PRESET_PROFILES

router = APIRouter(prefix="/scoring", tags=["Intelligent Lead Scoring"])

@router.get("/presets", response_model=List[PresetProfile])
def get_scoring_presets():
    """Retrieve available scoring strategy presets."""
    return ScoringEngine.get_presets()

@router.get("/weights", response_model=ScoringWeightsConfig)
def get_default_weights():
    """Retrieve the standard default balanced scoring weights."""
    return PRESET_PROFILES["balanced"].weights

@router.post("/calculate/{business_id}", response_model=LeadScoreResponse)
def calculate_lead_score(
    business_id: str,
    weights: Optional[ScoringWeightsConfig] = None,
    db: Session = Depends(get_db)
):
    """Compute and persist the lead opportunity score for a single business."""
    try:
        score_record = ScoringEngine.score_business(db, business_id, weights)
        return score_record
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/recalculate-all")
def recalculate_all_scores(
    request: Optional[ScoreRecalculateRequest] = None,
    db: Session = Depends(get_db)
):
    """Bulk recalculate opportunity scores across all discovered businesses."""
    req = request or ScoreRecalculateRequest()
    result = ScoringEngine.bulk_recalculate(
        db=db,
        category=req.category,
        city=req.city,
        weights=req.weights
    )
    return result

@router.get("/breakdown/{business_id}", response_model=ScoreBreakdownDetail)
def get_score_breakdown(business_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed factor breakdown, evidence, and pitch recommendation for a business."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    contacts = db.query(BusinessContact).filter(BusinessContact.business_id == business_id).all()
    verifications = db.query(VerificationRecord).filter(VerificationRecord.business_id == business_id).all()

    total_score, priority_tier, components, factors, pitch = ScoringEngine.evaluate_business(
        business=biz,
        audit=audit,
        contacts=contacts
    )

    # Determine data verification confidence separately
    is_verified = any(v.verification_status == "valid" for v in verifications)
    confidence = "verified" if is_verified else ("corroborated" if (biz.latitude or biz.source_url) else "unverified")

    return ScoreBreakdownDetail(
        business_id=biz.id,
        business_name=biz.name,
        total_opportunity_score=total_score,
        priority_tier=priority_tier,
        verification_confidence=confidence,
        factors=factors,
        recommended_pitch_angle=pitch,
        calculated_at=datetime.utcnow()
    )

@router.get("/summary")
def get_scoring_summary(db: Session = Depends(get_db)):
    """Get aggregated statistics on opportunity scores and priority tiers."""
    total_scored = db.query(LeadScore).count()
    if total_scored == 0:
        return {
            "total_scored": 0,
            "average_opportunity_score": 0,
            "high_priority_count": 0,
            "good_opportunity_count": 0,
            "medium_priority_count": 0,
            "low_priority_count": 0,
        }

    avg_score = db.query(func.avg(LeadScore.total_opportunity_score)).scalar() or 0
    high_count = db.query(LeadScore).filter(LeadScore.priority_tier == "high").count()
    good_count = db.query(LeadScore).filter(LeadScore.priority_tier == "good").count()
    med_count = db.query(LeadScore).filter(LeadScore.priority_tier == "medium").count()
    low_count = db.query(LeadScore).filter(LeadScore.priority_tier == "low").count()

    return {
        "total_scored": total_scored,
        "average_opportunity_score": round(float(avg_score), 1),
        "high_priority_count": high_count,
        "good_opportunity_count": good_count,
        "medium_priority_count": med_count,
        "low_priority_count": low_count,
    }
