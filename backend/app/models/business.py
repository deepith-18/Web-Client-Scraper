from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("scraping_jobs.id"), nullable=True)
    source_id = Column(String(36), ForeignKey("lead_sources.id"), nullable=True)

    name = Column(String(255), nullable=False, index=True)
    legal_name = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    sub_category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    # Location (Worldwide support)
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state_province = Column(String(100), nullable=True)
    postal_code = Column(String(50), nullable=True, index=True)
    country = Column(String(100), default="India", nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Online Presence
    official_website = Column(String(500), nullable=True)
    normalized_domain = Column(String(255), nullable=True, index=True)
    contact_page_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)
    social_links = Column(JSON, default=dict)  # {"linkedin": "", "instagram": "", "facebook": ""}

    # CRM Pipeline state
    crm_status = Column(String(50), default="new", nullable=False, index=True)
    is_suppressed = Column(Boolean, default=False, nullable=False, index=True)

    # Provenance and Timestamps
    first_discovered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("ScrapingJob", back_populates="businesses")
    source = relationship("LeadSource", back_populates="businesses")
    contacts = relationship("BusinessContact", back_populates="business", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="business", cascade="all, delete-orphan")
    website_audits = relationship("WebsiteAudit", back_populates="business", cascade="all, delete-orphan")
    lead_scores = relationship("LeadScore", back_populates="business", cascade="all, delete-orphan")
    notes = relationship("LeadNote", back_populates="business", cascade="all, delete-orphan")
    outreach_records = relationship("OutreachRecord", back_populates="business", cascade="all, delete-orphan")
    follow_up_tasks = relationship("FollowUpTask", back_populates="business", cascade="all, delete-orphan")

