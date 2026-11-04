from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.score import LeadScore
from backend.app.models.audit import WebsiteAudit
from backend.app.schemas.analytics import AnalyticsOverviewResponse, CategoryDistribution, OpportunityDistribution, CRMStatusDistribution

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    total_businesses = db.query(Business).count()
    
    # Businesses without website
    no_websites = db.query(Business).filter(
        (Business.official_website.is_(None)) | (Business.official_website == "")
    ).count()

    # Contacts available (distinct businesses with at least one verified/syntax contact)
    contacts_count = db.query(func.count(func.distinct(BusinessContact.business_id))).scalar() or 0

    # Verified identities (businesses with verified contact or corroborated info)
    verified_count = db.query(Business).filter(Business.last_verified_at.isnot(None)).count()

    # Website improvement opportunities (audits with identified issues)
    opportunities_count = db.query(WebsiteAudit).filter(WebsiteAudit.has_ssl == False).count() + no_websites

    # Qualified, Interested, Converted
    qualified_count = db.query(Business).filter(Business.crm_status.in_(["qualified", "contact_permitted"])).count()
    interested_count = db.query(Business).filter(Business.crm_status.in_(["interested", "meeting_scheduled", "proposal_sent", "negotiation"])).count()
    converted_count = db.query(Business).filter(Business.crm_status == "converted").count()

    # Category distribution
    cat_counts = (
        db.query(Business.category, func.count(Business.id))
        .group_by(Business.category)
        .order_by(func.count(Business.id).desc())
        .limit(10)
        .all()
    )
    category_distribution = [CategoryDistribution(category=cat, count=cnt) for cat, cnt in cat_counts]

    # Opportunity distribution (by tier)
    score_counts = (
        db.query(LeadScore.priority_tier, func.count(LeadScore.id))
        .group_by(LeadScore.priority_tier)
        .all()
    )
    opportunity_distribution = [OpportunityDistribution(tier=tier, count=cnt) for tier, cnt in score_counts]

    # CRM Pipeline distribution
    crm_counts = (
        db.query(Business.crm_status, func.count(Business.id))
        .group_by(Business.crm_status)
        .all()
    )
    crm_distribution = [CRMStatusDistribution(status=st, count=cnt) for st, cnt in crm_counts]

    return AnalyticsOverviewResponse(
        total_discovered_businesses=total_businesses,
        verified_identities=verified_count,
        contacts_available=contacts_count,
        businesses_without_websites=no_websites,
        website_improvement_opportunities=opportunities_count,
        qualified_leads=qualified_count,
        interested_prospects=interested_count,
        converted_clients=converted_count,
        category_distribution=category_distribution,
        opportunity_distribution=opportunity_distribution,
        crm_distribution=crm_distribution
    )

