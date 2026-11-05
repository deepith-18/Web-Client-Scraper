from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.job import ScrapingJob, ScrapingJobLog, LeadSource
from backend.app.models.user import User, default_permissions
from backend.app.schemas.job import (
    ScrapingJobResponse,
    ScrapingJobCreate,
    LeadSourceResponse,
    ScrapingJobLogResponse,
    DiscoveryActivityAuditResponse
)
from backend.app.services.discovery_engine import run_discovery_background_task

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.get("/sources", response_model=List[LeadSourceResponse])
def get_sources(db: Session = Depends(get_db)):
    return db.query(LeadSource).filter(LeadSource.is_authorized == True).all()

@router.get("/jobs", response_model=List[ScrapingJobResponse])
def get_jobs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(ScrapingJob).order_by(ScrapingJob.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/activity-audit", response_model=List[DiscoveryActivityAuditResponse])
def get_discovery_activity_audit(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve all discovery jobs executed across the startup, tracked with user identities."""
    return db.query(ScrapingJob).order_by(ScrapingJob.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/jobs/{job_id}", response_model=ScrapingJobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Discovery job not found")
    return job

@router.get("/jobs/{job_id}/logs", response_model=List[ScrapingJobLogResponse])
def get_job_logs(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Discovery job not found")
    return db.query(ScrapingJobLog).filter(ScrapingJobLog.job_id == job_id).order_by(ScrapingJobLog.timestamp.asc()).all()

@router.post("/jobs", response_model=ScrapingJobResponse)
def create_discovery_job(job_in: ScrapingJobCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Granular Access Check: If user_id is provided, verify can_discover permission
    executor_name = job_in.user_name or "Deepith (Admin)"
    if job_in.user_id:
        user = db.query(User).filter(User.id == job_in.user_id).first()
        if user:
            executor_name = user.full_name or user.email
            user_perms = user.permissions or default_permissions(user.role)
            if not user_perms.get("can_discover", True):
                raise HTTPException(
                    status_code=403,
                    detail=f"Access Denied: {executor_name} does not have permission to execute lead discovery scrapers. Contact Deepith for permission."
                )

    # Find matching source
    source = db.query(LeadSource).filter(LeadSource.source_type == job_in.source_type).first()
    if not source:
        source = db.query(LeadSource).first()

    new_job = ScrapingJob(
        job_name=job_in.job_name,
        user_id=job_in.user_id,
        user_name=executor_name,
        target_country=job_in.target_country,
        target_city=job_in.target_city,
        target_postal_code=job_in.target_postal_code,
        target_category=job_in.target_category,
        search_keywords=job_in.search_keywords,
        source_id=source.id if source else None,
        status="pending",
        progress_pct=0,
        records_found=0,
        records_qualified=0,
        created_at=datetime.utcnow()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Initial log tracking identity
    log = ScrapingJobLog(
        job_id=new_job.id,
        level="INFO",
        message=f"Job queued by {executor_name} for '{new_job.target_category}' in {new_job.target_city}, {new_job.target_country} via {source.name if source else 'Default Source'}."
    )
    db.add(log)
    db.commit()
    db.refresh(new_job)

    # Trigger background worker execution
    background_tasks.add_task(run_discovery_background_task, new_job.id)

    return new_job


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Discovery job not found")
    
    if job.status in ["completed", "failed", "cancelled"]:
        return {"message": f"Job already in terminal state: {job.status}"}

    job.status = "cancelled"
    log = ScrapingJobLog(
        job_id=job.id,
        level="WARN",
        message="Job cancelled by user request."
    )
    db.add(log)
    db.commit()
    return {"message": "Job successfully cancelled", "job_id": job_id}
