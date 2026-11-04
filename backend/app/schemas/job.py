from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ScrapingJobLogResponse(BaseModel):
    id: str
    level: str
    message: str
    extra_data: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ScrapingJobCreate(BaseModel):
    job_name: str
    target_country: str = "India"
    target_city: str = "Bengaluru"
    target_postal_code: Optional[str] = None
    target_category: str
    search_keywords: Optional[str] = None
    source_type: Optional[str] = "open_osm"  # open_osm, google_places, public_directory, custom_import

class ScrapingJobResponse(BaseModel):
    id: str
    job_name: str
    target_country: str
    target_city: str
    target_postal_code: Optional[str] = None
    target_category: str
    search_keywords: Optional[str] = None
    status: str
    progress_pct: int
    records_found: int
    records_qualified: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    logs: List[ScrapingJobLogResponse] = []

    class Config:
        from_attributes = True

class LeadSourceResponse(BaseModel):
    id: str
    name: str
    source_type: str
    description: Optional[str] = None
    reliability_score: float
    is_authorized: bool
    rate_limit_per_minute: int

    class Config:
        from_attributes = True

