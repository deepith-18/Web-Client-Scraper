from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)

    has_website = Column(Boolean, default=True, nullable=False)
    target_url = Column(String(500), nullable=True)
    is_reachable = Column(Boolean, default=False, nullable=False)
    http_status = Column(Integer, nullable=True)
    redirect_count = Column(Integer, default=0, nullable=False)
    final_url = Column(String(500), nullable=True)
    load_time_ms = Column(Integer, nullable=True)

    # Core Technical Audit Points
    has_ssl = Column(Boolean, default=False, nullable=False)
    is_mobile_friendly = Column(Boolean, default=False, nullable=False)  # viewport, modern layout
    has_contact_form = Column(Boolean, default=False, nullable=False)
    has_viewport_meta = Column(Boolean, default=False, nullable=False)
    broken_links_count = Column(Integer, default=0, nullable=False)
    
    # Metadata & SEO indicators
    title = Column(String(500), nullable=True)
    meta_description = Column(String(1000), nullable=True)
    has_schema_markup = Column(Boolean, default=False, nullable=False)
    has_google_analytics = Column(Boolean, default=False, nullable=False)

    # Detected Technology Stack & Identified Deficiencies
    technologies_detected = Column(JSON, default=list)  # ["WordPress 4.9", "jQuery 1.11", "PHP 5.6", ...]
    opportunities_identified = Column(JSON, default=list)  # ["no_ssl", "unresponsive_mobile", "missing_contact_form", ...]
    raw_audit_report = Column(JSON, default=dict)

    audited_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="website_audits")

