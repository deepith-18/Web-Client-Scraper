from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.score import LeadScore
from backend.app.schemas.business import BusinessResponse, BusinessCreate, BusinessUpdate

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
