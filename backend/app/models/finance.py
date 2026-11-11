from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

class CompanyExpense(Base):
    __tablename__ = "company_expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    # categories: 'ai_apis', 'cloud_deployments', 'telephony', 'proxies_scraping', 'payroll_team', 'software_tools', 'operations'
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)  # INR, USD, EUR
    vendor = Column(String(100), nullable=False)  # e.g. OpenAI, Vercel, Twilio, AWS, Anthropic, Supabase
    billing_type = Column(String(50), default="recurring_monthly", nullable=False)  # recurring_monthly, one_time, usage_based
    notes = Column(Text, nullable=True)
    expense_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    logged_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")

