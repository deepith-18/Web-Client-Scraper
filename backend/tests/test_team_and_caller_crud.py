import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.business import Business
from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.schemas.crm import CallLogCreate, CallLogUpdate, LeadAssignRequest
from backend.app.api.v1.team import (
    get_team_members,
    create_team_member,
    get_team_member,
    update_team_member,
    delete_team_member,
    assign_leads_to_member
)
from backend.app.api.v1.crm import (
    get_call_logs,
    create_call_log,
    get_call_log,
    update_call_log,
    delete_call_log,
    get_business_call_history,
    get_call_logs_summary_stats
)
from fastapi import HTTPException

def test_team_crud_and_lead_assignment():
    db = SessionLocal()
    user_id = None
    try:
        # 1. Create a new employee / team member
        new_emp = UserCreate(
            email="sarah.sdr@prospectiq.io",
            password="sdrPassword123!",
            full_name="Sarah Jenkins",
            role="sdr",
            is_active=True,
            phone="+91 98450 11223",
            daily_call_target=40,
            notes="Experienced B2B cold caller for Indian and US retail markets"
        )
        created = create_team_member(new_emp, db=db)
        assert created.email == "sarah.sdr@prospectiq.io"
        assert created.role == "sdr"
        assert created.daily_call_target == 40
        user_id = created.id

        # 2. Duplicate email should fail with 400
        with pytest.raises(HTTPException) as exc_info:
            create_team_member(new_emp, db=db)
        assert exc_info.value.status_code == 400

        # 3. Retrieve all team members
        members = get_team_members(db=db)
        assert any(m.id == user_id for m in members)

        # 4. Update employee details
        update_data = UserUpdate(
            daily_call_target=50,
            phone="+91 98450 99999",
            notes="Promoted to Senior SDR Lead"
        )
        updated = update_team_member(user_id, update_data, db=db)
        assert updated.daily_call_target == 50
        assert updated.phone == "+91 98450 99999"

        # 5. Assign leads to employee
        biz = db.query(Business).first()
        assert biz is not None

        assign_res = assign_leads_to_member(LeadAssignRequest(lead_ids=[biz.id], user_id=user_id), db=db)
        assert assign_res["lead_count"] == 1

        # Verify assigned count in member profile
        member_stats = get_team_member(user_id, db=db)
        assert member_stats.assigned_leads >= 1

        # 6. Delete team member
        del_res = delete_team_member(user_id, db=db)
        assert del_res["id"] == user_id
        user_id = None

    finally:
        if user_id:
            db.query(User).filter(User.id == user_id).delete()
            db.commit()
        db.close()

def test_call_logs_crud_and_history():
    db = SessionLocal()
    call_id = None
    try:
        biz = db.query(Business).first()
        caller = db.query(User).filter(User.role == "caller").first()
        assert biz is not None

        # 1. Create a Call Log: AGREED
        call_in = CallLogCreate(
            business_id=biz.id,
            user_id=caller.id if caller else None,
            caller_name="Test Caller",
            phone_number="+91 80 1234 5678",
            outcome="agreed",
            duration_seconds=195,
            project_type="Turnkey Website Build",
            agreed_budget="₹35,000",
            notes="Owner agreed, wants to see initial demo by next Monday."
        )
        created_call = create_call_log(call_in, db=db)
        assert created_call.outcome == "agreed"
        assert created_call.agreed_budget == "₹35,000"
        call_id = created_call.id

        # Verify business status automatically updated to "interested"
        db.refresh(biz)
        assert biz.crm_status == "interested"

        # 2. Get Single Call Log
        single = get_call_log(call_id, db=db)
        assert single.id == call_id

        # 3. Update Call Log (Edit Notes & Scope)
        update_data = CallLogUpdate(
            agreed_budget="₹45,000",
            notes="Upgraded scope to include online ordering menu."
        )
        updated_call = update_call_log(call_id, update_data, db=db)
        assert updated_call.agreed_budget == "₹45,000"

        # 4. Filter Call Logs
        logs = get_call_logs(outcome="agreed", db=db)
        assert any(l.id == call_id for l in logs)

        # 5. Check Chronological History for this business
        hist = get_business_call_history(biz.id, db=db)
        assert len(hist) >= 1
        assert hist[0].id == call_id

        # 6. Check Call Logs Summary Stats
        stats = get_call_logs_summary_stats(db=db)
        assert stats.total_agreed >= 1
        assert stats.total_calls_all_time >= 1

        # 7. Delete Call Log
        del_res = delete_call_log(call_id, db=db)
        assert del_res["id"] == call_id
        call_id = None

        with pytest.raises(HTTPException) as exc_info:
            get_call_log(del_res["id"], db=db)
        assert exc_info.value.status_code == 404

    finally:
        if call_id:
            delete_call_log(call_id, db=db)
        db.close()
