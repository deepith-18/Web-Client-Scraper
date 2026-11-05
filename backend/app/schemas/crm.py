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

class CallLogBase(BaseModel):
    business_id: str
    phone_number: str
    outcome: str  # agreed, declined, callback_scheduled, no_answer, gatekeeper, wrong_number
    duration_seconds: int = 0
    caller_name: Optional[str] = None
    project_type: Optional[str] = None
    agreed_budget: Optional[str] = None
    notes: Optional[str] = None
    decline_reason: Optional[str] = None
    scheduled_callback_at: Optional[datetime] = None

class CallLogCreate(CallLogBase):
    user_id: Optional[str] = None
    add_to_suppression: Optional[bool] = False

class CallLogUpdate(BaseModel):
    outcome: Optional[str] = None
    duration_seconds: Optional[int] = None
    caller_name: Optional[str] = None
    project_type: Optional[str] = None
    agreed_budget: Optional[str] = None
    notes: Optional[str] = None
    decline_reason: Optional[str] = None
    scheduled_callback_at: Optional[datetime] = None

class CallLogResponse(CallLogBase):
    id: str
    user_id: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    business_city: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CallLogStatsResponse(BaseModel):
    total_calls_today: int
    total_calls_all_time: int
    total_agreed: int
    total_declined: int
    total_callbacks: int
    acceptance_rate: float
    top_converting_category: Optional[str] = None

class LeadAssignRequest(BaseModel):
    lead_ids: List[str]
    user_id: Optional[str] = None  # None unassigns

