from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class LeadSource(Base):
    __tablename__ = "lead_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    source_type = Column(String(50), nullable=False)  # open_osm, google_places, public_directory, custom_import
    description = Column(String(255), nullable=True)
    reliability_score = Column(Float, default=0.85, nullable=False)
    is_authorized = Column(Boolean, default=True, nullable=False)
    rate_limit_per_minute = Column(Integer, default=60, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    businesses = relationship("Business", back_populates="source")
    jobs = relationship("ScrapingJob", back_populates="source")

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(255), nullable=True)
    source_id = Column(String(36), ForeignKey("lead_sources.id"), nullable=True)
    
    job_name = Column(String(255), nullable=False)
    target_country = Column(String(100), default="India", nullable=False)
    target_city = Column(String(100), default="Bengaluru", nullable=False)
    target_postal_code = Column(String(50), nullable=True)
    target_category = Column(String(100), nullable=False)
    search_keywords = Column(String(255), nullable=True)
    
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, failed, cancelled
    progress_pct = Column(Integer, default=0, nullable=False)
    records_found = Column(Integer, default=0, nullable=False)
    records_qualified = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    source = relationship("LeadSource", back_populates="jobs")
    logs = relationship("ScrapingJobLog", back_populates="job", cascade="all, delete-orphan")
    businesses = relationship("Business", back_populates="job")
    user = relationship("User")


class ScrapingJobLog(Base):
    __tablename__ = "scraping_job_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("scraping_jobs.id"), nullable=False)
    level = Column(String(20), default="INFO", nullable=False)  # INFO, WARN, ERROR
    message = Column(Text, nullable=False)
    extra_data = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("ScrapingJob", back_populates="logs")

