from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.crm import LeadNote, OutreachRecord, SuppressionRecord, FollowUpTask
from backend.app.schemas.crm import (
    LeadNoteCreate, LeadNoteResponse,
    OutreachCreate, OutreachUpdate, OutreachResponse,
    SuppressionCreate, SuppressionResponse,
    FollowUpCreate, FollowUpUpdate, FollowUpResponse
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
def generate_business_outreach(business_id: str, db: Session = Depends(get_db)):
    """Generates an evidence-backed email proposal draft based on audit findings."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if biz.is_suppressed:
        raise HTTPException(status_code=400, detail="Cannot generate outreach for suppressed / do-not-contact business")

    audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).order_by(WebsiteAudit.audited_at.desc()).first()
    email_contact = db.query(BusinessContact).filter(
        BusinessContact.business_id == business_id,
        BusinessContact.contact_type == "email"
    ).first()

    recipient = email_contact.normalized_value if email_contact else None
    pitch_data = OutreachGenerator.generate_pitch(biz, audit=audit, recipient_email=recipient)

    outreach = OutreachRecord(
        business_id=biz.id,
        channel="email",
        recipient=recipient,
        subject=pitch_data["subject"],
        generated_pitch=pitch_data["body"],
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
