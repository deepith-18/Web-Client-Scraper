from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
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
    stage_step = Column(Integer, default=1, nullable=False)  # 1: Initial, 2: Follow-up 1, 3: Follow-up 2
    template_id = Column(String(36), nullable=True)
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

class OutreachTemplate(Base):
    __tablename__ = "outreach_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    channel = Column(String(50), default="email", nullable=False)  # email, linkedin, phone
    stage_step = Column(Integer, default=1, nullable=False)  # 1: Initial, 2: Follow-up 1, 3: Follow-up 2
    delay_days = Column(Integer, default=0, nullable=False)  # Days to wait before sending
    subject_template = Column(String(255), nullable=False)
    body_template = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


