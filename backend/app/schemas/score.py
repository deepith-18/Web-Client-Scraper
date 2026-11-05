from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ScoringWeightsConfig(BaseModel):
    no_website: int = Field(default=30, ge=0, le=60, description="Points if business has no official website")
    website_unavailable: int = Field(default=25, ge=0, le=50, description="Points if website domain exists but is offline/erroring")
    poor_mobile: int = Field(default=15, ge=0, le=40, description="Points for non-responsive / poor mobile experience")
    missing_contact: int = Field(default=10, ge=0, le=30, description="Points if no contact form or direct CTA found")
    missing_info: int = Field(default=5, ge=0, le=20, description="Points if critical info like address/hours missing")
    performance_issues: int = Field(default=5, ge=0, le=30, description="Points for slow load time (>3s) or unoptimized assets")
    identity_corroborated: int = Field(default=5, ge=0, le=20, description="Points if business identity is authentic & verified")
    email_available: int = Field(default=5, ge=0, le=20, description="Points if public email exists for outreach feasibility")

class PresetProfile(BaseModel):
    id: str
    name: str
    description: str
    weights: ScoringWeightsConfig

class ScoreRecalculateRequest(BaseModel):
    category: Optional[str] = None
    city: Optional[str] = None
    weights: Optional[ScoringWeightsConfig] = None

class ScoreFactorDetail(BaseModel):
    factor_name: str
    points_awarded: int
    max_possible: int
    reason: str
    evidence: Optional[str] = None

class ScoreBreakdownDetail(BaseModel):
    business_id: str
    business_name: str
    total_opportunity_score: int
    priority_tier: str  # high, good, medium, low
    verification_confidence: str  # verified, unverified, suspected
    factors: List[ScoreFactorDetail]
    disclaimer: str = "Lead opportunity score indicates technical potential for freelance web services, not guaranteed purchasing intent."
    recommended_pitch_angle: str
    calculated_at: datetime
