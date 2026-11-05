from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.crm import LeadNote, OutreachRecord, SuppressionRecord, FollowUpTask, OutreachTemplate, CallLog
from backend.app.schemas.crm import (
    LeadNoteCreate, LeadNoteResponse,
    OutreachCreate, OutreachUpdate, OutreachResponse,
    SuppressionCreate, SuppressionResponse,
    FollowUpCreate, FollowUpUpdate, FollowUpResponse,
    OutreachTemplateCreate, OutreachTemplateUpdate, OutreachTemplateResponse,
    OutreachRenderRequest, OutreachRenderResponse, OutreachSequenceCreate,
    CallLogCreate, CallLogUpdate, CallLogResponse, CallLogStatsResponse
)
from backend.app.services.outreach_generator import OutreachGenerator

router = APIRouter(prefix="/crm", tags=["CRM"])

@router.get("/pipeline")
def get_crm_pipeline(db: Session = Depends(get_db)):
    """Retrieve leads grouped by their 12 CRM pipeline stages."""
    stages = [
        "new", "researching", "qualified", "contact_permitted",
        "contacted", "interested", "meeting_scheduled", "proposal_sent",
        "negotiation", "converted", "not_interested", "do_not_contact"
    ]
    pipeline_data: Dict[str, List[Dict[str, Any]]] = {s: [] for s in stages}
    
    businesses = db.query(Business).order_by(Business.created_at.desc()).all()
    for biz in businesses:
        score_obj = biz.lead_scores[0] if biz.lead_scores else None
        st = biz.crm_status if biz.crm_status in pipeline_data else "new"
        pipeline_data[st].append({
            "id": biz.id,
            "name": biz.name,
            "category": biz.category,
            "city": biz.city,
            "country": biz.country,
            "official_website": biz.official_website,
            "total_opportunity_score": score_obj.total_opportunity_score if score_obj else 0,
            "priority_tier": score_obj.priority_tier if score_obj else "low",
            "crm_status": biz.crm_status,
            "is_suppressed": biz.is_suppressed,
            "contacts_count": len(biz.contacts),
            "created_at": biz.created_at.isoformat()
        })
        
    return {
        "stages": stages,
        "counts": {s: len(pipeline_data[s]) for s in stages},
        "pipeline": pipeline_data
    }

@router.get("/businesses/{business_id}/notes", response_model=List[LeadNoteResponse])
def get_business_notes(business_id: str, db: Session = Depends(get_db)):
    return db.query(LeadNote).filter(LeadNote.business_id == business_id).order_by(LeadNote.created_at.desc()).all()

@router.post("/businesses/{business_id}/notes", response_model=LeadNoteResponse)
def add_business_note(business_id: str, note_in: LeadNoteCreate, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    note = LeadNote(
        business_id=business_id,
        content=note_in.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/outreach", response_model=List[OutreachResponse])
def get_outreach_records(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(OutreachRecord).order_by(OutreachRecord.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/outreach/generate/{business_id}", response_model=OutreachResponse)
def generate_business_outreach(
    business_id: str,
    template_id: Optional[str] = Query(None),
    freelancer_name: str = Query("Deepith"),
    freelancer_portfolio: str = Query("https://portfolio.dev"),
    db: Session = Depends(get_db)
):
    """Generates an evidence-backed proposal draft based on audit findings and template selection."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if biz.is_suppressed:
        raise HTTPException(status_code=400, detail="Cannot generate outreach for suppressed / do-not-contact business")

    tpl = None
    if template_id and not hasattr(template_id, "default"):
        tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == template_id).first()

    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    email_contact = db.query(BusinessContact).filter(
        BusinessContact.business_id == business_id,
        BusinessContact.contact_type == "email"
    ).first()

    recipient = email_contact.normalized_value if email_contact else None
    pitch_data = OutreachGenerator.generate_pitch(
        biz,
        audit=audit,
        recipient_email=recipient,
        template=tpl,
        freelancer_name=freelancer_name,
        freelancer_portfolio=freelancer_portfolio
    )

    outreach = OutreachRecord(
        business_id=biz.id,
        channel=pitch_data.get("channel", "email"),
        recipient=recipient,
        subject=pitch_data["subject"],
        generated_pitch=pitch_data["body"],
        stage_step=pitch_data.get("stage_step", 1),
        template_id=tpl.id if tpl else None,
        status="draft",
        manual_approval_granted=False
    )
    db.add(outreach)
    db.commit()
    db.refresh(outreach)
    return outreach

@router.post("/outreach/{outreach_id}/approve", response_model=OutreachResponse)
def approve_outreach(outreach_id: str, db: Session = Depends(get_db)):
    """Explicit developer manual approval gate required before any outreach."""
    outreach = db.query(OutreachRecord).filter(OutreachRecord.id == outreach_id).first()
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")

    outreach.manual_approval_granted = True
    outreach.status = "approved"
    db.commit()
    db.refresh(outreach)
    return outreach

@router.post("/outreach/{outreach_id}/send", response_model=OutreachResponse)
def mark_outreach_sent(outreach_id: str, db: Session = Depends(get_db)):
    """Records manually dispatched communication outcome."""
    outreach = db.query(OutreachRecord).filter(OutreachRecord.id == outreach_id).first()
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")

    if not outreach.manual_approval_granted:
        raise HTTPException(status_code=400, detail="Manual approval required before recording outreach as sent")

    outreach.status = "sent"
    outreach.sent_at = datetime.utcnow()
    outreach.sent_pitch = outreach.sent_pitch or outreach.generated_pitch

    # Advance CRM status
    biz = db.query(Business).filter(Business.id == outreach.business_id).first()
    if biz and biz.crm_status in ["new", "researching", "qualified", "contact_permitted"]:
        biz.crm_status = "contacted"

    db.commit()
    db.refresh(outreach)
    return outreach

@router.patch("/outreach/{outreach_id}", response_model=OutreachResponse)
def update_outreach(outreach_id: str, updates: OutreachUpdate, db: Session = Depends(get_db)):
    outreach = db.query(OutreachRecord).filter(OutreachRecord.id == outreach_id).first()
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")

    if updates.sent_pitch is not None:
        outreach.sent_pitch = updates.sent_pitch
    if updates.status is not None:
        outreach.status = updates.status
        if updates.status == "sent":
            outreach.sent_at = datetime.utcnow()
    if updates.manual_approval_granted is not None:
        outreach.manual_approval_granted = updates.manual_approval_granted

    db.commit()
    db.refresh(outreach)
    return outreach

@router.get("/suppression", response_model=List[SuppressionResponse])
def get_suppression_list(db: Session = Depends(get_db)):
    return db.query(SuppressionRecord).order_by(SuppressionRecord.requested_at.desc()).all()

@router.post("/suppression", response_model=SuppressionResponse)
def add_to_suppression(item: SuppressionCreate, db: Session = Depends(get_db)):
    existing = db.query(SuppressionRecord).filter(SuppressionRecord.value == item.value).first()
    if existing:
        return existing

    rec = SuppressionRecord(
        value=item.value,
        suppression_type=item.suppression_type,
        reason=item.reason
    )
    db.add(rec)
    
    # Also update any business with this domain or email to is_suppressed = True
    db.query(Business).filter(
        (Business.normalized_domain == item.value) |
        (Business.official_website.ilike(f"%{item.value}%"))
    ).update({"is_suppressed": True, "crm_status": "do_not_contact"}, synchronize_session=False)

    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/suppression/{suppression_id}")
def delete_suppression(suppression_id: str, db: Session = Depends(get_db)):
    rec = db.query(SuppressionRecord).filter(SuppressionRecord.id == suppression_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Suppression record not found")
    db.delete(rec)
    db.commit()
    return {"message": "Record removed from suppression list"}

@router.get("/tasks", response_model=List[FollowUpResponse])
def get_all_tasks(is_completed: Optional[bool] = None, db: Session = Depends(get_db)):
    """Retrieve all follow-up calendar reminders."""
    query = db.query(FollowUpTask)
    if is_completed is not None:
        query = query.filter(FollowUpTask.is_completed == is_completed)
    return query.order_by(FollowUpTask.due_date.asc()).all()

@router.get("/businesses/{business_id}/tasks", response_model=List[FollowUpResponse])
def get_business_tasks(business_id: str, db: Session = Depends(get_db)):
    """Retrieve follow-up tasks for a specific lead."""
    return db.query(FollowUpTask).filter(FollowUpTask.business_id == business_id).order_by(FollowUpTask.due_date.asc()).all()

@router.post("/businesses/{business_id}/tasks", response_model=FollowUpResponse)
def create_business_task(business_id: str, task_in: FollowUpCreate, db: Session = Depends(get_db)):
    """Schedule a follow-up reminder for a lead."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    task = FollowUpTask(
        business_id=business_id,
        title=task_in.title,
        due_date=task_in.due_date,
        is_completed=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/tasks/{task_id}", response_model=FollowUpResponse)
def update_task(task_id: str, updates: FollowUpUpdate, db: Session = Depends(get_db)):
    """Update task completion status or due date."""
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Follow-up task not found")

    if updates.title is not None:
        task.title = updates.title
    if updates.due_date is not None:
        task.due_date = updates.due_date
    if updates.is_completed is not None:
        task.is_completed = updates.is_completed
        if updates.is_completed:
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Follow-up task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

# -------------------------------------------------------------
# Template Studio & Outreach Sequences (Phase 8)
# -------------------------------------------------------------

@router.get("/templates", response_model=List[OutreachTemplateResponse])
def get_templates(channel: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve all available outreach pitch templates, auto-seeding defaults if empty."""
    OutreachGenerator.ensure_default_templates(db)
    query = db.query(OutreachTemplate)
    if channel and not hasattr(channel, "default"):
        query = query.filter(OutreachTemplate.channel == channel)
    return query.order_by(OutreachTemplate.stage_step.asc(), OutreachTemplate.name.asc()).all()

@router.post("/templates", response_model=OutreachTemplateResponse)
def create_template(tpl_in: OutreachTemplateCreate, db: Session = Depends(get_db)):
    """Create a new custom outreach sequence template."""
    new_tpl = OutreachTemplate(
        name=tpl_in.name,
        channel=tpl_in.channel,
        stage_step=tpl_in.stage_step,
        delay_days=tpl_in.delay_days,
        subject_template=tpl_in.subject_template,
        body_template=tpl_in.body_template,
        is_default=tpl_in.is_default
    )
    db.add(new_tpl)
    db.commit()
    db.refresh(new_tpl)
    return new_tpl

@router.get("/templates/{template_id}", response_model=OutreachTemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tpl

@router.put("/templates/{template_id}", response_model=OutreachTemplateResponse)
def update_template(template_id: str, updates: OutreachTemplateUpdate, db: Session = Depends(get_db)):
    tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if updates.name is not None:
        tpl.name = updates.name
    if updates.channel is not None:
        tpl.channel = updates.channel
    if updates.stage_step is not None:
        tpl.stage_step = updates.stage_step
    if updates.delay_days is not None:
        tpl.delay_days = updates.delay_days
    if updates.subject_template is not None:
        tpl.subject_template = updates.subject_template
    if updates.body_template is not None:
        tpl.body_template = updates.body_template
    if updates.is_default is not None:
        tpl.is_default = updates.is_default

    db.commit()
    db.refresh(tpl)
    return tpl

@router.delete("/templates/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.post("/outreach/render", response_model=OutreachRenderResponse)
def render_outreach_preview(req: OutreachRenderRequest, db: Session = Depends(get_db)):
    """Renders a dynamic outreach pitch preview for a lead without saving it."""
    biz = db.query(Business).filter(Business.id == req.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == req.business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    email_contact = db.query(BusinessContact).filter(
        BusinessContact.business_id == req.business_id,
        BusinessContact.contact_type == "email"
    ).first()

    variables = OutreachGenerator.get_template_variables(
        business=biz,
        audit=audit,
        freelancer_name=req.freelancer_name or "Deepith",
        freelancer_portfolio=req.freelancer_portfolio or "https://portfolio.dev"
    )

    subject_tpl = req.custom_subject_template
    body_tpl = req.custom_body_template
    channel = "email"

    if req.template_id:
        tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == req.template_id).first()
        if tpl:
            subject_tpl = tpl.subject_template
            body_tpl = tpl.body_template
            channel = tpl.channel

    if not subject_tpl or not body_tpl:
        pitch = OutreachGenerator.generate_pitch(
            biz,
            audit=audit,
            recipient_email=email_contact.normalized_value if email_contact else None,
            freelancer_name=req.freelancer_name or "Deepith",
            freelancer_portfolio=req.freelancer_portfolio or "https://portfolio.dev"
        )
        return OutreachRenderResponse(
            subject=pitch["subject"],
            body=pitch["body"],
            recipient=email_contact.normalized_value if email_contact else None,
            channel=pitch.get("channel", "email"),
            tokens_substituted=pitch.get("tokens_substituted", [])
        )

    sub, body, tokens = OutreachGenerator.render_template(subject_tpl, body_tpl, variables)
    return OutreachRenderResponse(
        subject=sub,
        body=body,
        recipient=email_contact.normalized_value if email_contact else None,
        channel=channel,
        tokens_substituted=tokens
    )

@router.post("/outreach/create-sequence", response_model=List[OutreachResponse])
def create_outreach_sequence(seq: OutreachSequenceCreate, db: Session = Depends(get_db)):
    """Creates a multi-touch outreach sequence (e.g. Touch 1, Touch 2, Touch 3) and calendar tasks."""
    biz = db.query(Business).filter(Business.id == seq.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if biz.is_suppressed:
        raise HTTPException(status_code=400, detail="Cannot generate outreach for suppressed lead")

    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == seq.business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    email_contact = db.query(BusinessContact).filter(
        BusinessContact.business_id == seq.business_id,
        BusinessContact.contact_type == "email"
    ).first()

    recipient = seq.recipient or (email_contact.normalized_value if email_contact else None)
    created_records = []

    for tpl_id in seq.template_ids:
        tpl = db.query(OutreachTemplate).filter(OutreachTemplate.id == tpl_id).first()
        if not tpl:
            continue

        pitch_data = OutreachGenerator.generate_pitch(
            biz,
            audit=audit,
            recipient_email=recipient,
            template=tpl,
            freelancer_name=seq.freelancer_name or "Deepith",
            freelancer_portfolio=seq.freelancer_portfolio or "https://portfolio.dev"
        )

        rec = OutreachRecord(
            business_id=biz.id,
            channel=tpl.channel,
            recipient=recipient,
            subject=pitch_data["subject"],
            generated_pitch=pitch_data["body"],
            stage_step=tpl.stage_step,
            template_id=tpl.id,
            status="draft",
            manual_approval_granted=False
        )
        db.add(rec)
        created_records.append(rec)

        # If delay_days > 0, automatically schedule a follow-up task reminder
        if tpl.delay_days > 0:
            from datetime import timedelta
            due_at = datetime.utcnow() + timedelta(days=tpl.delay_days)
            task = FollowUpTask(
                business_id=biz.id,
                title=f"Sequence Touch {tpl.stage_step}: {tpl.name} for {biz.name}",
                due_date=due_at,
                is_completed=False
            )
            db.add(task)

    db.commit()
    for r in created_records:
        db.refresh(r)

    return created_records

# ============================================================================
# CALL LOGS CRUD & AUDIT HISTORY
# ============================================================================

def _to_call_log_response(call: CallLog, biz: Business = None) -> CallLogResponse:
    target_biz = biz or call.business
    return CallLogResponse(
        id=call.id,
        business_id=call.business_id,
        business_name=target_biz.name if target_biz else "Unknown Business",
        business_category=target_biz.category if target_biz else "General",
        business_city=target_biz.city if target_biz else "",
        user_id=call.user_id,
        caller_name=call.caller_name or "Team Caller",
        phone_number=call.phone_number,
        outcome=call.outcome,
        duration_seconds=call.duration_seconds or 0,
        project_type=call.project_type,
        agreed_budget=call.agreed_budget,
        notes=call.notes,
        decline_reason=call.decline_reason,
        scheduled_callback_at=call.scheduled_callback_at,
        created_at=call.created_at,
        updated_at=call.updated_at
    )

@router.get("/call-logs", response_model=List[CallLogResponse])
def get_call_logs(
    outcome: Optional[str] = None,
    business_id: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):

    """Retrieve call logs with multi-parameter filtering and full prospect details."""
    query = db.query(CallLog).join(Business, CallLog.business_id == Business.id)

    if outcome:
        if outcome == "agreed":
            query = query.filter(CallLog.outcome.in_(["agreed", "accepted"]))
        elif outcome == "declined":
            query = query.filter(CallLog.outcome.in_(["declined", "rejected"]))
        elif outcome == "callback":
            query = query.filter(CallLog.outcome.in_(["callback_scheduled", "callback"]))
        else:
            query = query.filter(CallLog.outcome == outcome)

    if business_id:
        query = query.filter(CallLog.business_id == business_id)

    if user_id:
        query = query.filter(CallLog.user_id == user_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Business.name.ilike(s)) |
            (CallLog.phone_number.ilike(s)) |
            (CallLog.caller_name.ilike(s)) |
            (CallLog.notes.ilike(s)) |
            (Business.city.ilike(s))
        )

    calls = query.order_by(CallLog.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_call_log_response(c) for c in calls]

@router.post("/call-logs", response_model=CallLogResponse)
def create_call_log(call_in: CallLogCreate, db: Session = Depends(get_db)):
    """Create a new call log entry, update lead CRM status, and trigger side effects."""
    biz = db.query(Business).filter(Business.id == call_in.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    call = CallLog(
        business_id=call_in.business_id,
        user_id=call_in.user_id,
        caller_name=call_in.caller_name or "Team Caller",
        phone_number=call_in.phone_number,
        outcome=call_in.outcome,
        duration_seconds=call_in.duration_seconds,
        project_type=call_in.project_type,
        agreed_budget=call_in.agreed_budget,
        notes=call_in.notes,
        decline_reason=call_in.decline_reason,
        scheduled_callback_at=call_in.scheduled_callback_at
    )
    db.add(call)

    # Automatically synchronize CRM status and notes
    normalized_outcome = call_in.outcome.lower()
    if normalized_outcome in ["agreed", "accepted"]:
        biz.crm_status = "interested"
        note_text = f"[Call Log: AGREED] Caller: {call.caller_name} | Scope: {call_in.project_type or 'Turnkey Website'} | Budget: {call_in.agreed_budget or 'Custom'}."
        if call_in.notes:
            note_text += f"\nNotes: {call_in.notes}"
        db.add(LeadNote(business_id=biz.id, content=note_text))

    elif normalized_outcome in ["declined", "rejected"]:
        biz.crm_status = "not_interested"
        note_text = f"[Call Log: DECLINED] Reason: {call_in.decline_reason or 'Not specified'}."
        if call_in.notes:
            note_text += f"\nNotes: {call_in.notes}"
        db.add(LeadNote(business_id=biz.id, content=note_text))

        if call_in.add_to_suppression:
            biz.is_suppressed = True
            biz.crm_status = "do_not_contact"
            suppress_val = call_in.phone_number
            existing_sup = db.query(SuppressionRecord).filter(SuppressionRecord.value == suppress_val).first()
            if not existing_sup:
                db.add(SuppressionRecord(
                    value=suppress_val,
                    suppression_type="phone",
                    reason=f"Declined call: {call_in.decline_reason or 'No interest'}"
                ))

    elif normalized_outcome in ["callback_scheduled", "callback"]:
        biz.crm_status = "contacted"
        if call_in.scheduled_callback_at:
            db.add(FollowUpTask(
                business_id=biz.id,
                title=f"Scheduled Callback: {biz.name} ({call_in.phone_number})",
                due_date=call_in.scheduled_callback_at,
                is_completed=False
            ))
        if call_in.notes:
            db.add(LeadNote(business_id=biz.id, content=f"[Call Log: CALLBACK] Notes: {call_in.notes}"))

    db.commit()
    db.refresh(call)
    db.refresh(biz)

    return _to_call_log_response(call, biz)

@router.get("/call-logs/{call_id}", response_model=CallLogResponse)
def get_call_log(call_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single call log."""
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call log not found")
    return _to_call_log_response(call)

@router.put("/call-logs/{call_id}", response_model=CallLogResponse)
def update_call_log(call_id: str, call_update: CallLogUpdate, db: Session = Depends(get_db)):
    """Update an existing call log entry (edit notes, scope, budget, or outcome)."""
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call log not found")

    if call_update.outcome is not None:
        call.outcome = call_update.outcome
    if call_update.duration_seconds is not None:
        call.duration_seconds = call_update.duration_seconds
    if call_update.caller_name is not None:
        call.caller_name = call_update.caller_name
    if call_update.project_type is not None:
        call.project_type = call_update.project_type
    if call_update.agreed_budget is not None:
        call.agreed_budget = call_update.agreed_budget
    if call_update.notes is not None:
        call.notes = call_update.notes
    if call_update.decline_reason is not None:
        call.decline_reason = call_update.decline_reason
    if call_update.scheduled_callback_at is not None:
        call.scheduled_callback_at = call_update.scheduled_callback_at

    db.commit()
    db.refresh(call)
    return _to_call_log_response(call)

@router.delete("/call-logs/{call_id}")
def delete_call_log(call_id: str, db: Session = Depends(get_db)):
    """Delete a call log entry."""
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call log not found")

    db.delete(call)
    db.commit()
    return {"message": "Call log deleted successfully", "id": call_id}

@router.get("/call-logs/history/{business_id}", response_model=List[CallLogResponse])
def get_business_call_history(business_id: str, db: Session = Depends(get_db)):
    """Retrieve full chronological call audit history for a specific business."""
    calls = db.query(CallLog).filter(CallLog.business_id == business_id).order_by(CallLog.created_at.desc()).all()
    return [_to_call_log_response(c) for c in calls]

@router.get("/call-logs-summary/stats", response_model=CallLogStatsResponse)
def get_call_logs_summary_stats(db: Session = Depends(get_db)):
    """Retrieve overall call log KPI stats for the calling desk."""
    from datetime import datetime, time
    today_start = datetime.combine(datetime.utcnow().date(), time.min)

    today_calls = db.query(CallLog).filter(CallLog.created_at >= today_start).count()
    all_calls = db.query(CallLog).count()
    agreed = db.query(CallLog).filter(CallLog.outcome.in_(["agreed", "accepted"])).count()
    declined = db.query(CallLog).filter(CallLog.outcome.in_(["declined", "rejected"])).count()
    callbacks = db.query(CallLog).filter(CallLog.outcome.in_(["callback_scheduled", "callback"])).count()

    conv_rate = round((agreed / all_calls * 100), 1) if all_calls > 0 else 0.0

    # Best converting category
    category_counts: Dict[str, Dict[str, int]] = {}
    calls_with_biz = db.query(CallLog, Business.category).join(Business, CallLog.business_id == Business.id).all()
    for _, cat in calls_with_biz:
        if cat not in category_counts:
            category_counts[cat] = {"calls": 0, "agreed": 0}
        category_counts[cat]["calls"] += 1

    for c, cat in calls_with_biz:
        if c.outcome in ["agreed", "accepted"]:
            category_counts[cat]["agreed"] += 1

    best_cat = None
    best_rate = -1.0
    for cat, stats in category_counts.items():
        if stats["calls"] >= 2:
            rate = stats["agreed"] / stats["calls"]
            if rate > best_rate:
                best_rate = rate
                best_cat = cat

    return CallLogStatsResponse(
        total_calls_today=today_calls,
        total_calls_all_time=all_calls,
        total_agreed=agreed,
        total_declined=declined,
        total_callbacks=callbacks,
        acceptance_rate=conv_rate,
        top_converting_category=best_cat or "Cafes & Restaurants"
    )


