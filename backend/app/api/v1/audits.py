from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.services.website_analyzer import WebsiteAnalyzer

router = APIRouter(prefix="/audits", tags=["Website Audits"])

class AnalyzeUrlRequest(BaseModel):
    url: str

class AuditOverviewResponse(BaseModel):
    total_audited: int
    missing_ssl_count: int
    unresponsive_mobile_count: int
    missing_contact_form_count: int
    slow_load_time_count: int
    outdated_tech_count: int
    top_opportunities: List[Dict[str, Any]] = []

@router.post("/analyze-url")
def analyze_url_endpoint(payload: AnalyzeUrlRequest):
    analyzer = WebsiteAnalyzer()
    res = analyzer.audit_url(payload.url)
    return res.to_dict()

@router.get("/businesses/{business_id}")
def get_business_audit(business_id: str, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    if not audit:
        raise HTTPException(status_code=404, detail="No audit record exists for this business")
    return audit

@router.post("/businesses/{business_id}")
def run_business_audit(business_id: str, db: Session = Depends(get_db)):
    """
    Executes a fresh website audit on the business's official website,
    updates WebsiteAudit table, and updates LeadScore opportunities.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    analyzer = WebsiteAnalyzer()
    res = analyzer.audit_url(biz.official_website)

    # Update or insert audit record
    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).first()
    if not audit:
        audit = WebsiteAudit(business_id=biz.id)
        db.add(audit)

    audit.has_website = res.has_website
    audit.target_url = res.target_url
    audit.is_reachable = res.is_reachable
    audit.http_status = res.http_status
    audit.redirect_count = res.redirect_count
    audit.final_url = res.final_url
    audit.load_time_ms = res.load_time_ms
    audit.has_ssl = res.has_ssl
    audit.is_mobile_friendly = res.is_mobile_friendly
    audit.has_contact_form = res.has_contact_form
    audit.has_viewport_meta = res.has_viewport_meta
    audit.broken_links_count = res.broken_links_count
    audit.title = res.title
    audit.meta_description = res.meta_description
    audit.has_schema_markup = res.has_schema_markup
    audit.has_google_analytics = res.has_google_analytics
    audit.technologies_detected = res.technologies_detected
    audit.opportunities_identified = res.opportunities_identified
    audit.raw_audit_report = {
        "evidence": res.evidence,
        "diagnostics": res.raw_audit_report
    }
    audit.audited_at = datetime.utcnow()

    # Recompute Lead Score with new evidence
    score = db.query(LeadScore).filter(LeadScore.business_id == business_id).first()
    if not score:
        score = LeadScore(business_id=biz.id)
        db.add(score)

    no_web = 30 if not res.has_website else 0
    web_unavail = 25 if (res.has_website and not res.is_reachable) else 0
    ssl_score = 15 if (res.has_website and not res.has_ssl) else 0
    mob_score = 15 if (res.has_website and not res.is_mobile_friendly) else 0
    form_score = 10 if (res.has_website and not res.has_contact_form) else 0
    perf_score = 5 if (res.load_time_ms and res.load_time_ms > 3500) else 0
    auth_score = 5
    email_score = 5 if any(c.contact_type == "email" for c in biz.contacts) else 0

    total_score = min(no_web + web_unavail + ssl_score + mob_score + form_score + perf_score + auth_score + email_score, 100)
    if not res.has_website:
        total_score = max(total_score, 85)

    tier = "high" if total_score >= 80 else "good" if total_score >= 60 else "medium" if total_score >= 40 else "low"

    score.total_opportunity_score = total_score
    score.priority_tier = tier
    score.no_website_score = no_web
    score.website_unavailable_score = web_unavail
    score.mobile_score = mob_score
    score.missing_contact_score = form_score
    score.performance_score = perf_score
    score.authenticity_score = auth_score
    score.email_available_score = email_score
    score.score_breakdown = {
        "evidence": res.evidence,
        "opportunities": res.opportunities_identified,
        "calculated_tier": tier
    }
    score.calculated_at = datetime.utcnow()

    db.commit()
    db.refresh(audit)
    db.refresh(score)

    return {
        "business_id": biz.id,
        "audit": res.to_dict(),
        "opportunity_score": total_score,
        "priority_tier": tier,
        "evidence": res.evidence
    }

@router.get("/opportunities", response_model=AuditOverviewResponse)
def get_audit_opportunities(db: Session = Depends(get_db)):
    total = db.query(WebsiteAudit).count()
    no_ssl = db.query(WebsiteAudit).filter(WebsiteAudit.has_ssl == False, WebsiteAudit.has_website == True).count()
    unresponsive = db.query(WebsiteAudit).filter(WebsiteAudit.is_mobile_friendly == False, WebsiteAudit.has_website == True).count()
    missing_form = db.query(WebsiteAudit).filter(WebsiteAudit.has_contact_form == False, WebsiteAudit.has_website == True).count()
    slow = db.query(WebsiteAudit).filter(WebsiteAudit.load_time_ms > 3500).count()

    top_opportunities = [
        {"opportunity": "No Official Website", "count": db.query(WebsiteAudit).filter(WebsiteAudit.has_website == False).count(), "points": 30},
        {"opportunity": "Missing SSL / Plain HTTP", "count": no_ssl, "points": 15},
        {"opportunity": "Unresponsive Mobile Layout", "count": unresponsive, "points": 15},
        {"opportunity": "Missing Contact / Inquiry Form", "count": missing_form, "points": 10},
        {"opportunity": "Slow Page Load (>3.5s)", "count": slow, "points": 5},
    ]

    return AuditOverviewResponse(
        total_audited=total,
        missing_ssl_count=no_ssl,
        unresponsive_mobile_count=unresponsive,
        missing_contact_form_count=missing_form,
        slow_load_time_count=slow,
        outdated_tech_count=db.query(WebsiteAudit).filter(WebsiteAudit.has_schema_markup == False).count(),
        top_opportunities=top_opportunities
    )

