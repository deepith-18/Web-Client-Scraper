from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.crm import LeadNote, OutreachRecord, SuppressionRecord, FollowUpTask
from backend.app.schemas.crm import (
    LeadNoteCreate, LeadNoteResponse,
    OutreachCreate, OutreachUpdate, OutreachResponse,
    SuppressionCreate, SuppressionResponse
)

router = APIRouter(prefix="/crm", tags=["CRM"])

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

