import pytest
import uuid
from backend.app.core.database import SessionLocal, Base, engine, run_migrations
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.crm import OutreachTemplate, OutreachRecord, FollowUpTask
from backend.app.schemas.crm import (
    OutreachTemplateCreate,
    OutreachTemplateUpdate,
    OutreachRenderRequest,
    OutreachSequenceCreate
)
from backend.app.services.outreach_generator import OutreachGenerator
from backend.app.api.v1.crm import (
    get_templates,
    create_template,
    get_template,
    update_template,
    delete_template,
    render_outreach_preview,
    create_outreach_sequence
)

# Ensure tables are created
Base.metadata.create_all(bind=engine)
run_migrations()

def test_default_template_seeding_and_retrieval():
    db = SessionLocal()
    try:
        templates = get_templates(db=db)
        assert len(templates) >= 5
        names = [t.name for t in templates]
        assert any("Turnkey Web Build" in n for n in names)
        assert any("Website Audit & Redesign" in n for n in names)
        assert any("Follow-Up" in n for n in names)
    finally:
        db.close()

def test_dynamic_token_substitution():
    biz = Business(
        id=str(uuid.uuid4()),
        name="Indiranagar Specialty Clinic",
        category="Clinics & Healthcare",
        city="Bengaluru",
        official_website="http://insecure-clinic.example.com"
    )
    audit = WebsiteAudit(
        id=str(uuid.uuid4()),
        business_id=biz.id,
        has_ssl=False,
        is_mobile_friendly=False,
        has_contact_form=False,
        load_time_ms=4200
    )

    variables = OutreachGenerator.get_template_variables(
        business=biz,
        audit=audit,
        freelancer_name="Alex Designer",
        freelancer_portfolio="https://alex.design"
    )

    assert variables["business_name"] == "Indiranagar Specialty Clinic"
    assert variables["city"] == "Bengaluru"
    assert variables["freelancer_name"] == "Alex Designer"
    assert "Insecure Connection" in variables["deficiencies_list"]
    assert "Mobile Viewport" in variables["deficiencies_list"]

    subject_tpl = "Custom Pitch for {{business_name}} in {{city}}"
    body_tpl = "Hello {{business_name}}, here are issues: {{deficiencies_list}}. From {{freelancer_name}}."

    sub, body, substituted = OutreachGenerator.render_template(subject_tpl, body_tpl, variables)
    assert sub == "Custom Pitch for Indiranagar Specialty Clinic in Bengaluru"
    assert "Indiranagar Specialty Clinic" in body
    assert "Alex Designer" in body
    assert "Insecure Connection" in body
    assert "business_name" in substituted
    assert "city" in substituted
    assert "deficiencies_list" in substituted
    assert "freelancer_name" in substituted

def test_custom_template_crud():
    db = SessionLocal()
    created_id = None
    try:
        unique_name = f"Specialist VIP Pitch {uuid.uuid4().hex[:6]}"
        tpl_in = OutreachTemplateCreate(
            name=unique_name,
            channel="email",
            stage_step=1,
            delay_days=0,
            subject_template="VIP Proposal for {{business_name}}",
            body_template="Dear {{business_name}} Leadership,\n\nWe noticed {{deficiencies_list_short}} in {{city}}.",
            is_default=False
        )

        # 1. Create
        created = create_template(tpl_in, db=db)
        assert created.id is not None
        assert created.name == unique_name
        created_id = created.id

        # 2. Get
        fetched = get_template(created_id, db=db)
        assert fetched.name == unique_name

        # 3. Update
        updated = update_template(
            created_id,
            OutreachTemplateUpdate(delay_days=2, subject_template="Updated Subject for {{business_name}}"),
            db=db
        )
        assert updated.delay_days == 2
        assert updated.subject_template == "Updated Subject for {{business_name}}"

        # 4. Delete
        res = delete_template(created_id, db=db)
        assert "deleted successfully" in res["message"]
        created_id = None

    finally:
        if created_id:
            tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == created_id).first()
            if tpl:
                db.delete(tpl)
                db.commit()
        db.close()

def test_outreach_sequence_and_calendar_task_generation():
    db = SessionLocal()
    biz_id = None
    try:
        # 1. Create a test lead
        biz = Business(
            id=str(uuid.uuid4()),
            name=f"Sequence Test Cafe {uuid.uuid4().hex[:4]}",
            category="Cafes & Restaurants",
            city="Bengaluru",
            country="India",
            official_website="https://test-sequence-cafe.in"
        )
        db.add(biz)
        db.commit()
        biz_id = biz.id

        # 2. Ensure default templates
        templates = get_templates(db=db)
        initial_tpl = next((t for t in templates if t.stage_step == 1), templates[0])
        followup_tpl = next((t for t in templates if t.stage_step == 2), templates[1])

        # 3. Create Sequence (Touch 1 + Touch 2)
        seq_in = OutreachSequenceCreate(
            business_id=biz.id,
            template_ids=[initial_tpl.id, followup_tpl.id],
            recipient="owner@sequence-cafe.in",
            freelancer_name="Deepith"
        )
        outreach_records = create_outreach_sequence(seq_in, db=db)

        assert len(outreach_records) == 2
        assert outreach_records[0].stage_step == initial_tpl.stage_step
        assert outreach_records[0].recipient == "owner@sequence-cafe.in"
        assert outreach_records[1].stage_step == followup_tpl.stage_step

        # 4. Verify calendar task was automatically created for follow-up
        tasks = db.query(FollowUpTask).filter(FollowUpTask.business_id == biz.id).all()
        assert len(tasks) >= 1
        assert any("Sequence Touch" in t.title for t in tasks)

    finally:
        if biz_id:
            db.query(FollowUpTask).filter(FollowUpTask.business_id == biz_id).delete()
            db.query(OutreachRecord).filter(OutreachRecord.business_id == biz_id).delete()
            db.query(Business).filter(Business.id == biz_id).delete()
            db.commit()
        db.close()
