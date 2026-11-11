import pytest
from datetime import datetime
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.finance import CompanyExpense
from backend.app.schemas.finance import CompanyExpenseCreate, CompanyExpenseUpdate
from backend.app.api.v1.finance import (
    get_expenses,
    create_expense,
    get_expense,
    update_expense,
    delete_expense,
    get_financial_analytics
)
from fastapi import HTTPException

def test_company_expenses_crud_and_analytics():
    db = SessionLocal()
    admin = db.query(User).filter(User.role == "admin").first()
    expense_id = None

    try:
        # 1. Create Expense
        exp_in = CompanyExpenseCreate(
            title="Test OpenAI GPT-4o Token Refill",
            category="ai_apis",
            amount=2500.0,
            currency="INR",
            vendor="OpenAI",
            billing_type="usage_based",
            notes="API tokens for proposal drafting",
            logged_by_user_id=admin.id if admin else None
        )
        created = create_expense(exp_in, db=db)
        assert created.id is not None
        assert created.title == "Test OpenAI GPT-4o Token Refill"
        assert created.category == "ai_apis"
        assert created.amount == 2500.0
        expense_id = created.id

        # 2. Retrieve single expense
        fetched = get_expense(expense_id, db=db)
        assert fetched.id == expense_id
        assert fetched.vendor == "OpenAI"

        # 3. Filter expenses
        expenses_ai = get_expenses(category="ai_apis", db=db)
        assert any(e.id == expense_id for e in expenses_ai)

        # 4. Search expenses
        expenses_search = get_expenses(search="OpenAI", db=db)
        assert any(e.id == expense_id for e in expenses_search)

        # 5. Update expense
        updated = update_expense(expense_id, CompanyExpenseUpdate(amount=3000.0, notes="Upgraded quota"), db=db)
        assert updated.amount == 3000.0
        assert updated.notes == "Upgraded quota"

        # 6. Test Financial Analytics Aggregation
        analytics = get_financial_analytics(db=db)
        assert analytics.total_spend_all_time >= 3000.0
        assert len(analytics.category_breakdown) > 0
        assert len(analytics.monthly_trends) == 6
        assert analytics.pipeline_deal_revenue >= 0.0

        # Verify AI category exists in breakdown
        ai_breakdown = next((c for c in analytics.category_breakdown if c.category_key == "ai_apis"), None)
        assert ai_breakdown is not None
        assert ai_breakdown.total_amount >= 3000.0

        # 7. Delete expense
        del_res = delete_expense(expense_id, db=db)
        assert del_res["id"] == expense_id
        expense_id = None

        with pytest.raises(HTTPException) as exc_info:
            get_expense(del_res["id"], db=db)
        assert exc_info.value.status_code == 404

    finally:
        if expense_id:
            delete_expense(expense_id, db=db)
        db.close()

