from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)

    entity_type = Column(String(50), nullable=False)  # website, email, phone, business_identity
    status = Column(String(50), nullable=False)  # passed, failed, warning
    
    # Specific verification diagnostics
    dns_mx_valid = Column(Boolean, nullable=True)
    ssl_valid = Column(Boolean, nullable=True)
    ssl_issuer = Column(String(255), nullable=True)
    ssl_days_to_expiry = Column(Integer, nullable=True)
    
    phone_e164 = Column(String(50), nullable=True)
    phone_country_code = Column(String(10), nullable=True)
    phone_carrier_type = Column(String(50), nullable=True)
    
    evidence = Column(JSON, default=dict)  # structured logs / details
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="verifications")

