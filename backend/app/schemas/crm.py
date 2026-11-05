from pydantic import BaseModel
from typing import Optional, List
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
    stage_step: int = 1
    template_id: Optional[str] = None

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
    stage_step: int = 1
    template_id: Optional[str] = None
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

class OutreachTemplateBase(BaseModel):
    name: str
    channel: str = "email"
    stage_step: int = 1
    delay_days: int = 0
    subject_template: str
    body_template: str
    is_default: bool = False

class OutreachTemplateCreate(OutreachTemplateBase):
    pass

class OutreachTemplateUpdate(BaseModel):
    name: Optional[str] = None
    channel: Optional[str] = None
    stage_step: Optional[int] = None
    delay_days: Optional[int] = None
    subject_template: Optional[str] = None
    body_template: Optional[str] = None
    is_default: Optional[bool] = None

class OutreachTemplateResponse(OutreachTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OutreachRenderRequest(BaseModel):
    template_id: Optional[str] = None
    custom_subject_template: Optional[str] = None
    custom_body_template: Optional[str] = None
    business_id: str
    freelancer_name: Optional[str] = "Deepith"
    freelancer_portfolio: Optional[str] = "https://portfolio.dev"

class OutreachRenderResponse(BaseModel):
    subject: str
    body: str
    recipient: Optional[str] = None
    channel: str
    tokens_substituted: List[str] = []

class OutreachSequenceCreate(BaseModel):
    business_id: str
    template_ids: List[str]
    recipient: Optional[str] = None
    freelancer_name: Optional[str] = "Deepith"
    freelancer_portfolio: Optional[str] = "https://portfolio.dev"
