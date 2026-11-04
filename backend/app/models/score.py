from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class LeadScore(Base):
    __tablename__ = "lead_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)

    total_opportunity_score = Column(Integer, default=0, nullable=False, index=True)  # 0 to 100
    priority_tier = Column(String(20), default="low", nullable=False, index=True)  # high (80-100), good (60-79), medium (40-59), low (0-39)

    # Component Scores
    no_website_score = Column(Integer, default=0, nullable=False)          # max 30
    website_unavailable_score = Column(Integer, default=0, nullable=False) # max 25
    mobile_score = Column(Integer, default=0, nullable=False)              # max 15
    missing_contact_score = Column(Integer, default=0, nullable=False)     # max 10
    performance_score = Column(Integer, default=0, nullable=False)         # max 5
    missing_info_score = Column(Integer, default=0, nullable=False)        # max 5
    authenticity_score = Column(Integer, default=0, nullable=False)        # max 5
    email_available_score = Column(Integer, default=0, nullable=False)     # max 5

    score_breakdown = Column(JSON, default=dict)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="lead_scores")

