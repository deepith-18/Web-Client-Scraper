from pydantic import BaseModel
from typing import Dict, List, Any

class CategoryDistribution(BaseModel):
    category: str
    count: int

class OpportunityDistribution(BaseModel):
    tier: str
    count: int

class CRMStatusDistribution(BaseModel):
    status: str
    count: int

class AnalyticsOverviewResponse(BaseModel):
    total_discovered_businesses: int
    verified_identities: int
    contacts_available: int
    businesses_without_websites: int
    website_improvement_opportunities: int
    qualified_leads: int
    interested_prospects: int
    converted_clients: int
    category_distribution: List[CategoryDistribution] = []
    opportunity_distribution: List[OpportunityDistribution] = []
    crm_distribution: List[CRMStatusDistribution] = []

class CategoryAcceptanceRate(BaseModel):
    category: str
    total_called: int
    accepted_count: int
    rejected_count: int
    acceptance_rate_pct: float

class AcceptanceAnalyticsResponse(BaseModel):
    overall_calls: int
    total_accepted: int
    total_rejected: int
    overall_acceptance_rate_pct: float
    best_converting_category: str
    category_breakdown: List[CategoryAcceptanceRate] = []

