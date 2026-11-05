import pytest
import uuid
from datetime import datetime, timedelta
from backend.app.core.database import SessionLocal
from backend.app.models.business import Business
from backend.app.models.crm import LeadNote, OutreachRecord, FollowUpTask, SuppressionRecord
from backend.app.schemas.business import BusinessCreate
from backend.app.schemas.crm import LeadNoteCreate, FollowUpCreate, FollowUpUpdate, SuppressionCreate
from backend.app.api.v1.businesses import create_manual_business, delete_business
from backend.app.api.v1.crm import (
    get_crm_pipeline,
    add_business_note,
    get_business_notes,
    generate_business_outreach,
    approve_outreach,
    mark_outreach_sent,
    add_to_suppression,
    get_suppression_list,
    delete_suppression,
    create_business_task,
    get_business_tasks,
    update_task,
    delete_task,
)
from fastapi import HTTPException

def test_manual_lead_creation_and_duplicate_detection():
    db = SessionLocal()
    biz_id = None
    try:
        unique_domain = f"test-crm-{uuid.uuid4().hex[:6]}.com"
        unique_name = f"Apex Creative Studio {uuid.uuid4().hex[:4]}"
        
        # 1. Create Lead
        new_lead = BusinessCreate(
            name=unique_name,
            category="Interior Designers",
            city="Bengaluru",
            country="India",
            official_website=f"https://{unique_domain}",
            crm_status="new"
        )
        created = create_manual_business(new_lead, db=db)
        biz_id = created.id
        assert created.id is not None
        assert created.normalized_domain == unique_domain
        assert created.crm_status == "new"

        # 2. Duplicate Detection by domain should raise 409
        with pytest.raises(HTTPException) as exc_info:
            create_manual_business(new_lead, db=db)
        assert exc_info.value.status_code == 409
        assert "Duplicate" in exc_info.value.detail
    finally:
        if biz_id:
            db.query(Business).filter(Business.id == biz_id).delete()
            db.commit()
        db.close()

def test_lead_notes_and_followup_tasks():
    db = SessionLocal()
    biz_id = None
    try:
        # Create temp business
        biz = Business(
            id=str(uuid.uuid4()),
            name=f"Note Test Studio {uuid.uuid4().hex[:4]}",
            category="Cafes",
            city="Bengaluru",
            country="India"
        )
        db.add(biz)
        db.commit()
        biz_id = biz.id

        # 1. Add Note
        note = add_business_note(biz_id, LeadNoteCreate(content="Discussed responsive redesign with founder."), db=db)
        assert note.id is not None
        assert "Discussed responsive redesign" in note.content

        notes = get_business_notes(biz_id, db=db)
        assert len(notes) >= 1

        # 2. Add Follow-up Task
        due = datetime.utcnow() + timedelta(days=2)
        task = create_business_task(biz_id, FollowUpCreate(title="Send website proposal PDF", due_date=due), db=db)
        assert task.id is not None
        assert task.is_completed is False

        # 3. Mark Task Completed
        updated = update_task(task.id, FollowUpUpdate(is_completed=True), db=db)
        assert updated.is_completed is True
        assert updated.completed_at is not None

        # Clean task
        delete_task(task.id, db=db)
    finally:
        if biz_id:
            db.query(LeadNote).filter(LeadNote.business_id == biz_id).delete()
            db.query(FollowUpTask).filter(FollowUpTask.business_id == biz_id).delete()
            db.query(Business).filter(Business.id == biz_id).delete()
            db.commit()
        db.close()

def test_outreach_manual_approval_guardrail():
    db = SessionLocal()
    biz_id = None
    outreach_id = None
    try:
        biz = Business(
            id=str(uuid.uuid4()),
            name="Urban Fitness Lab",
            category="Gyms",
            city="Austin",
            country="USA",
            crm_status="qualified"
        )
        db.add(biz)
        db.commit()
        biz_id = biz.id

        # 1. Generate Proposal Draft
        outreach = generate_business_outreach(biz_id, db=db)
        outreach_id = outreach.id
        assert outreach.status == "draft"
        assert outreach.manual_approval_granted is False
        assert "Austin" in outreach.generated_pitch

        # 2. Attempting to mark sent without manual approval MUST raise 400
        with pytest.raises(HTTPException) as exc_info:
            mark_outreach_sent(outreach_id, db=db)
        assert exc_info.value.status_code == 400
        assert "Manual approval required" in exc_info.value.detail

        # 3. Approve Outreach
        approved = approve_outreach(outreach_id, db=db)
        assert approved.manual_approval_granted is True
        assert approved.status == "approved"

        # 4. Record Sent
        sent = mark_outreach_sent(outreach_id, db=db)
        assert sent.status == "sent"
        assert sent.sent_at is not None

        # Verify CRM status auto-advanced to contacted
        db.refresh(biz)
        assert biz.crm_status == "contacted"
    finally:
        if outreach_id:
            db.query(OutreachRecord).filter(OutreachRecord.id == outreach_id).delete()
        if biz_id:
            db.query(Business).filter(Business.id == biz_id).delete()
        db.commit()
        db.close()

def test_suppression_list_and_pipeline():
    db = SessionLocal()
    test_domain = f"optout-{uuid.uuid4().hex[:6]}.com"
    biz_id = None
    supp_id = None
    try:
        # Create business with this domain
        biz = Business(
            id=str(uuid.uuid4()),
            name="Opted Out Firm",
            category="Legal",
            city="London",
            country="UK",
            official_website=f"https://{test_domain}",
            normalized_domain=test_domain,
            crm_status="qualified"
        )
        db.add(biz)
        db.commit()
        biz_id = biz.id

        # 1. Add to suppression
        supp = add_to_suppression(
            SuppressionCreate(value=test_domain, suppression_type="domain", reason="Customer opt-out request"),
            db=db
        )
        supp_id = supp.id
        assert supp.value == test_domain

        # Verify business was automatically suppressed and marked do_not_contact
        db.refresh(biz)
        assert biz.is_suppressed is True
        assert biz.crm_status == "do_not_contact"

        # 2. Verify outreach cannot be generated for suppressed business
        with pytest.raises(HTTPException) as exc:
            generate_business_outreach(biz_id, db=db)
        assert exc.value.status_code == 400
        assert "suppressed" in exc.value.detail

        # 3. Check Pipeline endpoint
        pipe = get_crm_pipeline(db=db)
        assert "stages" in pipe
        assert "pipeline" in pipe
        assert len(pipe["pipeline"]["do_not_contact"]) >= 1

        # Delete suppression
        delete_suppression(supp_id, db=db)
    finally:
        if supp_id:
            db.query(SuppressionRecord).filter(SuppressionRecord.id == supp_id).delete()
        if biz_id:
            db.query(Business).filter(Business.id == biz_id).delete()
        db.commit()
        db.close()

