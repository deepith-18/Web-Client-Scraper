from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.score import LeadScore
from backend.app.models.crm import SuppressionRecord
from backend.app.schemas.business import BusinessResponse, BusinessCreate, BusinessUpdate
from backend.app.services.scoring_engine import ScoringEngine
from backend.app.services.discovery_engine import normalize_domain

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.get("", response_model=List[BusinessResponse])
def get_businesses(
    skip: int = 0,
    limit: int = 50,
    city: Optional[str] = None,
    country: Optional[str] = None,
    category: Optional[str] = None,
    crm_status: Optional[str] = None,
    priority_tier: Optional[str] = None,
    search: Optional[str] = None,
    has_website: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Business)

    if country and not hasattr(country, "default"):
        query = query.filter(Business.country.ilike(f"%{country}%"))
    if city and not hasattr(city, "default"):
        query = query.filter(Business.city.ilike(f"%{city}%"))
    if category and not hasattr(category, "default"):
        query = query.filter(Business.category == category)
    if crm_status and not hasattr(crm_status, "default"):
        query = query.filter(Business.crm_status == crm_status)
    if has_website is not None and not hasattr(has_website, "default"):
        if has_website:
            query = query.filter(Business.official_website.isnot(None), Business.official_website != "")
        else:
            query = query.filter((Business.official_website.is_(None)) | (Business.official_website == ""))
            
    if priority_tier and not hasattr(priority_tier, "default"):
        query = query.join(LeadScore).filter(LeadScore.priority_tier == priority_tier)
        
    if search and not hasattr(search, "default"):
        search_filter = f"%{search}%"
        query = query.filter(
            (Business.name.ilike(search_filter)) |
            (Business.address_line1.ilike(search_filter)) |
            (Business.normalized_domain.ilike(search_filter))
        )

    businesses = query.order_by(Business.created_at.desc()).offset(skip).limit(limit).all()
    return businesses

@router.post("", response_model=BusinessResponse, status_code=201)
def create_manual_business(biz_in: BusinessCreate, db: Session = Depends(get_db)):
    """Create a manual lead with duplicate detection and automatic initial scoring."""
    norm_domain = normalize_domain(biz_in.official_website) if biz_in.official_website else None

    # Check suppression
    is_suppressed = False
    if norm_domain:
        if db.query(SuppressionRecord).filter(SuppressionRecord.value == norm_domain).first():
            is_suppressed = True

    # Duplicate check by normalized domain or name + city
    if norm_domain:
        dup = db.query(Business).filter(Business.normalized_domain == norm_domain).first()
        if dup:
            raise HTTPException(status_code=409, detail=f"Duplicate detected: A business with domain '{norm_domain}' already exists ({dup.name}).")

    name_city_dup = db.query(Business).filter(
        Business.name.ilike(biz_in.name),
        Business.city.ilike(biz_in.city)
    ).first()
    if name_city_dup:
        raise HTTPException(status_code=409, detail=f"Duplicate detected: '{biz_in.name}' in '{biz_in.city}' already exists.")

    biz = Business(
        name=biz_in.name,
        legal_name=biz_in.legal_name,
        category=biz_in.category,
        sub_category=biz_in.sub_category,
        description=biz_in.description,
        address_line1=biz_in.address_line1,
        address_line2=biz_in.address_line2,
        city=biz_in.city,
        state_province=biz_in.state_province,
        postal_code=biz_in.postal_code,
        country=biz_in.country or "India",
        latitude=biz_in.latitude,
        longitude=biz_in.longitude,
        official_website=biz_in.official_website,
        normalized_domain=norm_domain,
        contact_page_url=biz_in.contact_page_url,
        crm_status="new" if not is_suppressed else "do_not_contact",
        is_suppressed=is_suppressed
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)

    # Calculate initial lead score
    try:
        ScoringEngine.score_business(db, biz.id)
        db.refresh(biz)
    except Exception:
        pass

    return biz

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(business_id: str, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz

@router.patch("/{business_id}", response_model=BusinessResponse)
def update_business(business_id: str, updates: BusinessUpdate, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(biz, field, val)

    db.commit()
    db.refresh(biz)
    return biz

@router.delete("/{business_id}")
def delete_business(business_id: str, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    db.delete(biz)
    db.commit()
    return {"message": "Business deleted successfully", "id": business_id}

@router.delete("")
def clear_all_businesses(db: Session = Depends(get_db)):
    """Delete all business leads and associated child records."""
    from backend.app.models.contact import BusinessContact
    from backend.app.models.audit import WebsiteAudit
    from backend.app.models.score import LeadScore
    from backend.app.models.crm import LeadNote, CallLog, OutreachRecord, FollowUpTask

    db.query(CallLog).delete()
    db.query(OutreachRecord).delete()
    db.query(LeadNote).delete()
    db.query(FollowUpTask).delete()
    db.query(LeadScore).delete()
    db.query(WebsiteAudit).delete()
    db.query(BusinessContact).delete()
    deleted_count = db.query(Business).delete()
    db.commit()
    return {"message": f"Successfully cleared {deleted_count} businesses and their records"}
