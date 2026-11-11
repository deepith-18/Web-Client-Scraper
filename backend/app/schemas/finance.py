from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class CompanyExpenseBase(BaseModel):
    title: str
    category: str  # ai_apis, cloud_deployments, telephony, proxies_scraping, payroll_team, software_tools, operations
    amount: float
    currency: str = "INR"
    vendor: str  # OpenAI, Vercel, Twilio, AWS, Anthropic, Supabase, Freelancer
    billing_type: str = "recurring_monthly"  # recurring_monthly, one_time, usage_based
    notes: Optional[str] = None
    expense_date: Optional[datetime] = None

class CompanyExpenseCreate(CompanyExpenseBase):
    logged_by_user_id: Optional[str] = None

class CompanyExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    vendor: Optional[str] = None
    billing_type: Optional[str] = None
    notes: Optional[str] = None
    expense_date: Optional[datetime] = None

class CompanyExpenseResponse(CompanyExpenseBase):
    id: str
    logged_by_user_id: Optional[str] = None
    logged_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CategorySpendDetail(BaseModel):
    category_key: str
    category_name: str
    total_amount: float
    percentage: float
    count: int

class MonthlyTrendDetail(BaseModel):
    month_label: str
    total_spend: float
    ai_spend: float
    cloud_spend: float
    telephony_spend: float
    other_spend: float

class VendorSpendDetail(BaseModel):
    vendor: str
    total_amount: float
    percentage: float

class FinancialAnalyticsResponse(BaseModel):
    total_spend_all_time: float
    total_spend_this_month: float
    average_monthly_burn: float
    category_breakdown: List[CategorySpendDetail]
    monthly_trends: List[MonthlyTrendDetail]
    top_vendors: List[VendorSpendDetail]
    pipeline_deal_revenue: float
    net_profit: float
    profit_margin_pct: float
    cost_per_acquired_client: float
    total_clients_acquired: int

