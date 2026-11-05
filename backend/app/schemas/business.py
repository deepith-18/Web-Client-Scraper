from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ContactBase(BaseModel):
    contact_type: str
    raw_value: str
    normalized_value: str
    is_primary: bool = False
    verification_status: str = "unverified"
    source_url: Optional[str] = None

class ContactResponse(ContactBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class LeadScoreResponse(BaseModel):
    id: str
    total_opportunity_score: int
    priority_tier: str
    no_website_score: int = 0
    website_unavailable_score: int = 0
    mobile_score: int = 0
    missing_contact_score: int = 0
    performance_score: int = 0
    missing_info_score: int = 0
    authenticity_score: int = 0
    email_available_score: int = 0
    score_breakdown: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class WebsiteAuditSummary(BaseModel):
    id: str
    has_website: bool
    is_reachable: bool
    http_status: Optional[int] = None
    has_ssl: bool
    is_mobile_friendly: bool
    has_contact_form: bool
    load_time_ms: Optional[int] = None
    opportunities_identified: List[str] = []
    technologies_detected: List[str] = []

    class Config:
        from_attributes = True

class BusinessBase(BaseModel):
    name: str
    legal_name: Optional[str] = None
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: str
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    official_website: Optional[str] = None
    normalized_domain: Optional[str] = None
    contact_page_url: Optional[str] = None
    source_url: Optional[str] = None
    social_links: Dict[str, Any] = {}
    crm_status: str = "new"

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    official_website: Optional[str] = None
    crm_status: Optional[str] = None
    is_suppressed: Optional[bool] = None

class BusinessResponse(BusinessBase):
    id: str
    is_suppressed: bool
    first_discovered_at: datetime
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    contacts: List[ContactResponse] = []
    lead_scores: List[LeadScoreResponse] = []
    website_audits: List[WebsiteAuditSummary] = []

    class Config:
        from_attributes = True

