from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LeadNoteCreate(BaseModel):
    content: str

class LeadNoteResponse(BaseModel):
    id: str
    business_id: str
    user_id: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class OutreachCreate(BaseModel):
    channel: str = "email"
    recipient: Optional[str] = None
    subject: Optional[str] = None
    generated_pitch: str

class OutreachUpdate(BaseModel):
    sent_pitch: Optional[str] = None
    status: Optional[str] = None  # draft, approved, sent, replied, declined
    manual_approval_granted: Optional[bool] = None

class OutreachResponse(BaseModel):
    id: str
    business_id: str
    channel: str
    recipient: Optional[str] = None
    subject: Optional[str] = None
    generated_pitch: str
    sent_pitch: Optional[str] = None
    status: str
    manual_approval_granted: bool
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FollowUpCreate(BaseModel):
    title: str
    due_date: datetime

class FollowUpUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class FollowUpResponse(BaseModel):
    id: str
    business_id: str
    title: str
    due_date: datetime
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SuppressionCreate(BaseModel):
    value: str
    suppression_type: str  # domain, email, phone, business_name
    reason: Optional[str] = None

class SuppressionResponse(BaseModel):
    id: str
    value: str
    suppression_type: str
    reason: Optional[str] = None
    requested_at: datetime

    class Config:
        from_attributes = True

