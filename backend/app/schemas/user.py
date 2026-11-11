from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "developer"  # admin, caller, sdr, developer
    is_active: bool = True
    phone: Optional[str] = None
    daily_call_target: int = 30
    notes: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    daily_call_target: Optional[int] = None
    notes: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None
    password: Optional[str] = None

class PermissionUpdateRequest(BaseModel):
    permissions: Dict[str, bool]


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeamMemberResponse(UserResponse):
    total_calls: int = 0
    accepted_deals: int = 0
    declined_calls: int = 0
    callbacks_scheduled: int = 0
    assigned_leads: int = 0
    conversion_rate: float = 0.0

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginJsonRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = "caller"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


