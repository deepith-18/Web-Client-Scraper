from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class BusinessContact(Base):
    __tablename__ = "business_contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    
    contact_type = Column(String(50), nullable=False)  # email, phone, whatsapp, contact_form
    raw_value = Column(String(255), nullable=False)
    normalized_value = Column(String(255), nullable=False, index=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    
    # Verification indicator (Syntax / MX / Active / Unverified)
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, valid_syntax, mx_confirmed, invalid, disposable
    source_url = Column(String(500), nullable=True)  # Provenance
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="contacts")

