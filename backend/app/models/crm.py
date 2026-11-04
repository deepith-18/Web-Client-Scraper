from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="notes")

class OutreachRecord(Base):
    __tablename__ = "outreach_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    channel = Column(String(50), default="email", nullable=False)  # email, phone, manual, linkedin
    recipient = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    generated_pitch = Column(Text, nullable=False)
    sent_pitch = Column(Text, nullable=True)
    status = Column(String(50), default="draft", nullable=False)  # draft, approved, sent, replied, declined
    manual_approval_granted = Column(Boolean, default=False, nullable=False)
    
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="outreach_records")

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    title = Column(String(255), nullable=False)
    due_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="follow_up_tasks")

class SuppressionRecord(Base):
    __tablename__ = "suppression_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    value = Column(String(255), unique=True, index=True, nullable=False)  # domain, email, or phone
    suppression_type = Column(String(50), nullable=False)  # domain, email, phone, business_name
    reason = Column(String(255), nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

