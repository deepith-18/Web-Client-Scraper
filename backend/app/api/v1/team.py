from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.user import User, default_permissions
from backend.app.models.crm import CallLog
from backend.app.models.business import Business
from backend.app.models.job import ScrapingJob
from backend.app.schemas.user import UserCreate, UserUpdate, TeamMemberResponse, PermissionUpdateRequest
from backend.app.schemas.crm import LeadAssignRequest

router = APIRouter(prefix="/team", tags=["Team & Employee Management"])

def _to_team_response(u: User, db: Session) -> TeamMemberResponse:
    total_calls = db.query(CallLog).filter(CallLog.user_id == u.id).count()
    accepted_deals = db.query(CallLog).filter(
        CallLog.user_id == u.id,
        CallLog.outcome.in_(["agreed", "accepted"])
    ).count()
    declined_calls = db.query(CallLog).filter(
        CallLog.user_id == u.id,
        CallLog.outcome.in_(["declined", "rejected"])
    ).count()
    callbacks_scheduled = db.query(CallLog).filter(
        CallLog.user_id == u.id,
        CallLog.outcome.in_(["callback_scheduled", "callback"])
    ).count()
    assigned_leads = db.query(Business).filter(Business.assigned_to_user_id == u.id).count()

    conv_rate = round((accepted_deals / total_calls * 100), 1) if total_calls > 0 else 0.0
    perms = u.permissions if (u.permissions and len(u.permissions) > 0) else default_permissions(u.role)

    return TeamMemberResponse(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
        phone=u.phone,
        daily_call_target=u.daily_call_target or 30,
        notes=u.notes,
        permissions=perms,
        created_at=u.created_at,
        updated_at=u.updated_at,
        total_calls=total_calls,
        accepted_deals=accepted_deals,
        declined_calls=declined_calls,
        callbacks_scheduled=callbacks_scheduled,
        assigned_leads=assigned_leads,
        conversion_rate=conv_rate
    )

@router.get("", response_model=List[TeamMemberResponse])
def get_team_members(db: Session = Depends(get_db)):
    """Retrieve all team members with their granular permissions and performance analytics."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [_to_team_response(u, db) for u in users]

@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def create_team_member(user_in: UserCreate, db: Session = Depends(get_db)):
    """Add a new employee or contractor with customized granular permissions."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team member with this email address already exists"
        )

    assigned_perms = user_in.permissions if user_in.permissions else default_permissions(user_in.role or "caller")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "caller",
        is_active=user_in.is_active,
        phone=user_in.phone,
        daily_call_target=user_in.daily_call_target or 30,
        notes=user_in.notes,
        permissions=assigned_perms
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _to_team_response(new_user, db)

@router.get("/{user_id}", response_model=TeamMemberResponse)
def get_team_member(user_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed profile and granular permissions for a single team member."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")
    return _to_team_response(u, db)

@router.put("/{user_id}", response_model=TeamMemberResponse)
def update_team_member(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update employee details, role, status, targets, or permissions."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")

    if user_update.full_name is not None:
        u.full_name = user_update.full_name
    if user_update.role is not None:
        u.role = user_update.role
    if user_update.is_active is not None:
        u.is_active = user_update.is_active
    if user_update.phone is not None:
        u.phone = user_update.phone
    if user_update.daily_call_target is not None:
        u.daily_call_target = user_update.daily_call_target
    if user_update.notes is not None:
        u.notes = user_update.notes
    if user_update.permissions is not None:
        u.permissions = user_update.permissions
    if user_update.password:
        u.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(u)
    return _to_team_response(u, db)

@router.patch("/{user_id}/permissions", response_model=TeamMemberResponse)
def update_team_member_permissions(user_id: str, perm_req: PermissionUpdateRequest, db: Session = Depends(get_db)):
    """Granular RBAC: Admin updates specific feature access toggles for an employee."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")

    existing_perms = u.permissions or default_permissions(u.role)
    updated_perms = {**existing_perms, **perm_req.permissions}
    u.permissions = updated_perms

    db.commit()
    db.refresh(u)
    return _to_team_response(u, db)

@router.get("/{user_id}/activity")
def get_member_activity_audit(user_id: str, db: Session = Depends(get_db)):
    """Retrieve complete audit history for this employee (scrapers run, calls logged, leads assigned)."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")

    # 1. Scraping jobs triggered by this employee
    jobs = db.query(ScrapingJob).filter(ScrapingJob.user_id == user_id).order_by(ScrapingJob.created_at.desc()).limit(20).all()
    job_events = [{
        "type": "discovery",
        "title": f"Executed Scraper: {j.job_name}",
        "details": f"{j.target_category} in {j.target_city}, {j.target_country} ({j.records_found} leads found)",
        "status": j.status,
        "timestamp": j.created_at.isoformat()
    } for j in jobs]

    # 2. Calls logged by this employee
    calls = db.query(CallLog).filter(CallLog.user_id == user_id).order_by(CallLog.created_at.desc()).limit(20).all()
    call_events = [{
        "type": "call",
        "title": f"Logged Call: {c.outcome.upper()}",
        "details": f"Called {c.phone_number} • Scope: {c.project_type or 'General'} • Budget: {c.agreed_budget or 'N/A'}",
        "status": c.outcome,
        "timestamp": c.created_at.isoformat()
    } for c in calls]

    # Combine and sort by timestamp
    all_events = sorted(job_events + call_events, key=lambda x: x["timestamp"], reverse=True)

    return {
        "user_id": user_id,
        "user_name": u.full_name or u.email,
        "total_scrapers_run": len(jobs),
        "total_calls_logged": len(calls),
        "activity_timeline": all_events
    }

@router.delete("/{user_id}")
def delete_team_member(user_id: str, db: Session = Depends(get_db)):
    """Delete a team member or employee."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Prevent deleting the last active admin
    if u.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the sole active administrator")

    # Unassign leads
    db.query(Business).filter(Business.assigned_to_user_id == user_id).update({"assigned_to_user_id": None})
    db.delete(u)
    db.commit()
    return {"message": f"Team member {u.email} successfully removed", "id": user_id}

@router.post("/assign-leads")
def assign_leads_to_member(req: LeadAssignRequest, db: Session = Depends(get_db)):
    """Bulk assign or reassign leads to a specific team member."""
    if req.user_id:
        target_user = db.query(User).filter(User.id == req.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target team member not found")

    updated_count = db.query(Business).filter(Business.id.in_(req.lead_ids)).update(
        {"assigned_to_user_id": req.user_id},
        synchronize_session=False
    )
    db.commit()

    return {
        "message": f"Successfully assigned {updated_count} leads",
        "assigned_to": req.user_id,
        "lead_count": updated_count
    }


@router.delete("/{user_id}")
def delete_team_member(user_id: str, db: Session = Depends(get_db)):
    """Delete a team member or employee."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Prevent deleting the last active admin
    if u.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the sole active administrator")

    # Unassign leads
    db.query(Business).filter(Business.assigned_to_user_id == user_id).update({"assigned_to_user_id": None})
    db.delete(u)
    db.commit()
    return {"message": f"Team member {u.email} successfully removed", "id": user_id}

@router.post("/assign-leads")
def assign_leads_to_member(req: LeadAssignRequest, db: Session = Depends(get_db)):
    """Bulk assign or reassign leads to a specific team member."""
    if req.user_id:
        target_user = db.query(User).filter(User.id == req.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target team member not found")

    updated_count = db.query(Business).filter(Business.id.in_(req.lead_ids)).update(
        {"assigned_to_user_id": req.user_id},
        synchronize_session=False
    )
    db.commit()

    return {
        "message": f"Successfully assigned {updated_count} leads",
        "assigned_to": req.user_id,
        "lead_count": updated_count
    }

