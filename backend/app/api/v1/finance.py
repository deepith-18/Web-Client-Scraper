from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import re

from backend.app.core.database import get_db
from backend.app.models.finance import CompanyExpense
from backend.app.models.crm import CallLog
from backend.app.models.user import User
from backend.app.schemas.finance import (
    CompanyExpenseCreate,
    CompanyExpenseUpdate,
    CompanyExpenseResponse,
    FinancialAnalyticsResponse,
    CategorySpendDetail,
    MonthlyTrendDetail,
    VendorSpendDetail
)

router = APIRouter(prefix="/finance", tags=["Company Spending & Finance"])

CATEGORY_LABELS = {
    "ai_apis": "AI & LLM Services (OpenAI, Gemini, Anthropic)",
    "cloud_deployments": "Cloud & Server Deployments (Vercel, AWS)",
    "telephony": "Telephony & VoIP Call Credits (Twilio, SIMs)",
    "proxies_scraping": "Geospatial Scraping & Proxies",
    "payroll_team": "Team Payroll & Contractor Payouts",
    "software_tools": "Software Subscriptions (Figma, GitHub)",
    "operations": "General Operations & Domains"
}

def _to_expense_response(exp: CompanyExpense, user: Optional[User] = None) -> CompanyExpenseResponse:
    target_user = user or exp.user
    return CompanyExpenseResponse(
        id=exp.id,
        title=exp.title,
        category=exp.category,
        amount=exp.amount,
        currency=exp.currency or "INR",
        vendor=exp.vendor,
        billing_type=exp.billing_type,
        notes=exp.notes,
        expense_date=exp.expense_date,
        logged_by_user_id=exp.logged_by_user_id,
        logged_by_name=target_user.full_name or target_user.email if target_user else "Admin",
        created_at=exp.created_at,
        updated_at=exp.updated_at
    )

@router.get("/expenses", response_model=List[CompanyExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):

    """Retrieve all company expenses with multi-parameter filtering."""
    query = db.query(CompanyExpense)

    if category and category != "all":
        query = query.filter(CompanyExpense.category == category)
    if vendor and vendor != "all":
        query = query.filter(CompanyExpense.vendor == vendor)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (CompanyExpense.title.ilike(s)) |
            (CompanyExpense.vendor.ilike(s)) |
            (CompanyExpense.notes.ilike(s))
        )

    expenses = query.order_by(CompanyExpense.expense_date.desc()).offset(skip).limit(limit).all()
    return [_to_expense_response(e) for e in expenses]

@router.post("/expenses", response_model=CompanyExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense_in: CompanyExpenseCreate, db: Session = Depends(get_db)):
    """Record a new company operational or technology expense."""
    exp = CompanyExpense(
        title=expense_in.title,
        category=expense_in.category,
        amount=expense_in.amount,
        currency=expense_in.currency or "INR",
        vendor=expense_in.vendor,
        billing_type=expense_in.billing_type,
        notes=expense_in.notes,
        expense_date=expense_in.expense_date or datetime.utcnow(),
        logged_by_user_id=expense_in.logged_by_user_id
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    return _to_expense_response(exp)

@router.get("/expenses/{expense_id}", response_model=CompanyExpenseResponse)
def get_expense(expense_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single expense entry."""
    exp = db.query(CompanyExpense).filter(CompanyExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")
    return _to_expense_response(exp)

@router.put("/expenses/{expense_id}", response_model=CompanyExpenseResponse)
def update_expense(expense_id: str, expense_update: CompanyExpenseUpdate, db: Session = Depends(get_db)):
    """Update an existing company expense."""
    exp = db.query(CompanyExpense).filter(CompanyExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    if expense_update.title is not None:
        exp.title = expense_update.title
    if expense_update.category is not None:
        exp.category = expense_update.category
    if expense_update.amount is not None:
        exp.amount = expense_update.amount
    if expense_update.currency is not None:
        exp.currency = expense_update.currency
    if expense_update.vendor is not None:
        exp.vendor = expense_update.vendor
    if expense_update.billing_type is not None:
        exp.billing_type = expense_update.billing_type
    if expense_update.notes is not None:
        exp.notes = expense_update.notes
    if expense_update.expense_date is not None:
        exp.expense_date = expense_update.expense_date

    db.commit()
    db.refresh(exp)
    return _to_expense_response(exp)

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    """Delete a company expense entry."""
    exp = db.query(CompanyExpense).filter(CompanyExpense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully", "id": expense_id}

@router.get("/analytics", response_model=FinancialAnalyticsResponse)
def get_financial_analytics(db: Session = Depends(get_db)):
    """Aggregate company spending telemetry, AI/cloud burn rates, and client deal ROI."""
    all_expenses = db.query(CompanyExpense).all()

    now = datetime.utcnow()
    current_month_start = datetime(now.year, now.month, 1)

    total_all_time = sum(e.amount for e in all_expenses)
    total_this_month = sum(e.amount for e in all_expenses if e.expense_date >= current_month_start)

    # 1. Category Breakdown
    cat_totals: Dict[str, Dict[str, Any]] = {}
    for e in all_expenses:
        cat = e.category
        if cat not in cat_totals:
            cat_totals[cat] = {"amount": 0.0, "count": 0}
        cat_totals[cat]["amount"] += e.amount
        cat_totals[cat]["count"] += 1

    category_breakdown: List[CategorySpendDetail] = []
    for cat_key, label in CATEGORY_LABELS.items():
        data = cat_totals.get(cat_key, {"amount": 0.0, "count": 0})
        amt = data["amount"]
        pct = round((amt / total_all_time * 100), 1) if total_all_time > 0 else 0.0
        category_breakdown.append(CategorySpendDetail(
            category_key=cat_key,
            category_name=label,
            total_amount=round(amt, 2),
            percentage=pct,
            count=data["count"]
        ))

    # Sort categories by highest spend
    category_breakdown.sort(key=lambda x: x.total_amount, reverse=True)

    # 2. Top Vendors
    vendor_totals: Dict[str, float] = {}
    for e in all_expenses:
        vendor_totals[e.vendor] = vendor_totals.get(e.vendor, 0.0) + e.amount

    sorted_vendors = sorted(vendor_totals.items(), key=lambda x: x[1], reverse=True)[:6]
    top_vendors = [
        VendorSpendDetail(
            vendor=v[0],
            total_amount=round(v[1], 2),
            percentage=round((v[1] / total_all_time * 100), 1) if total_all_time > 0 else 0.0
        )
        for v in sorted_vendors
    ]

    # 3. Monthly Trends (Last 6 Months)
    monthly_trends: List[MonthlyTrendDetail] = []
    for i in range(5, -1, -1):
        # Calculate target month
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1

        m_start = datetime(year, month, 1)
        if month == 12:
            m_end = datetime(year + 1, 1, 1)
        else:
            m_end = datetime(year, month + 1, 1)

        m_label = m_start.strftime("%b %Y")
        m_expenses = [e for e in all_expenses if m_start <= e.expense_date < m_end]

        t_spend = sum(e.amount for e in m_expenses)
        ai_spend = sum(e.amount for e in m_expenses if e.category == "ai_apis")
        cloud_spend = sum(e.amount for e in m_expenses if e.category == "cloud_deployments")
        tel_spend = sum(e.amount for e in m_expenses if e.category == "telephony")
        other_spend = t_spend - (ai_spend + cloud_spend + tel_spend)

        monthly_trends.append(MonthlyTrendDetail(
            month_label=m_label,
            total_spend=round(t_spend, 2),
            ai_spend=round(ai_spend, 2),
            cloud_spend=round(cloud_spend, 2),
            telephony_spend=round(tel_spend, 2),
            other_spend=round(max(other_spend, 0.0), 2)
        ))

    # 4. Pipeline Revenue & ROI from Agreed Website Deals
    agreed_calls = db.query(CallLog).filter(CallLog.outcome.in_(["agreed", "accepted"])).all()
    pipeline_revenue = 0.0

    for c in agreed_calls:
        if c.agreed_budget:
            # Extract digits from e.g. "₹35,000", "₹25,000 - ₹50,000"
            digits = re.findall(r"\d+", c.agreed_budget.replace(",", ""))
            if len(digits) == 1:
                pipeline_revenue += float(digits[0])
            elif len(digits) >= 2:
                # Average range
                pipeline_revenue += (float(digits[0]) + float(digits[1])) / 2.0
            else:
                pipeline_revenue += 30000.0  # standard website estimate
        else:
            pipeline_revenue += 30000.0

    total_clients_acquired = len(agreed_calls)
    net_profit = pipeline_revenue - total_all_time
    profit_margin = round((net_profit / pipeline_revenue * 100), 1) if pipeline_revenue > 0 else 0.0
    cac = round((total_all_time / total_clients_acquired), 2) if total_clients_acquired > 0 else 0.0

    # Calculate average monthly burn from trend
    burn_rates = [m.total_spend for m in monthly_trends if m.total_spend > 0]
    avg_burn = round(sum(burn_rates) / len(burn_rates), 2) if burn_rates else round(total_all_time, 2)

    return FinancialAnalyticsResponse(
        total_spend_all_time=round(total_all_time, 2),
        total_spend_this_month=round(total_this_month, 2),
        average_monthly_burn=avg_burn,
        category_breakdown=category_breakdown,
        monthly_trends=monthly_trends,
        top_vendors=top_vendors,
        pipeline_deal_revenue=round(pipeline_revenue, 2),
        net_profit=round(net_profit, 2),
        profit_margin_pct=profit_margin,
        cost_per_acquired_client=cac,
        total_clients_acquired=total_clients_acquired
    )
