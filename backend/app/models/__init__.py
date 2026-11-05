import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime

def generate_uuid():
    return str(uuid.uuid4())

class TimeStampedModel:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# Import all models to register with declarative Base registry
from backend.app.models.user import User
from backend.app.models.job import LeadSource, ScrapingJob, ScrapingJobLog
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.verification import VerificationRecord
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.models.crm import LeadNote, OutreachRecord, FollowUpTask, SuppressionRecord, OutreachTemplate, CallLog

__all__ = [
    "generate_uuid",
    "TimeStampedModel",
    "User",
    "LeadSource",
    "ScrapingJob",
    "ScrapingJobLog",
    "Business",
    "BusinessContact",
    "VerificationRecord",
    "WebsiteAudit",
    "LeadScore",
    "LeadNote",
    "OutreachRecord",
    "FollowUpTask",
    "SuppressionRecord",
    "OutreachTemplate",
    "CallLog",
]
