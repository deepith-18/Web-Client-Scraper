from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.verification import VerificationRecord
from backend.app.models.audit import WebsiteAudit
from backend.app.services.verification_service import VerificationService
from backend.app.services.contact_extractor import ContactExtractor
from backend.app.core.security import is_safe_url

router = APIRouter(prefix="/verification", tags=["Verification Centre"])

class EmailVerifyRequest(BaseModel):
    email: str

class PhoneVerifyRequest(BaseModel):
    phone: str
    country_code: Optional[str] = "IN"

class VerificationSummaryResponse(BaseModel):
    total_contacts: int
    mx_confirmed_emails: int
    valid_syntax_emails: int
    invalid_emails: int
    disposable_emails: int
    valid_e164_phones: int
    unverified_phones: int
    ssl_secured_websites: int
    insecure_websites: int

@router.post("/verify-email")
def verify_email_endpoint(payload: EmailVerifyRequest):
    result = VerificationService.verify_email(payload.email)
    return result.to_dict()

@router.post("/verify-phone")
def verify_phone_endpoint(payload: PhoneVerifyRequest):
    result = VerificationService.verify_phone(payload.phone, payload.country_code or "IN")
    return result.to_dict()

@router.get("/businesses/{business_id}")
def get_business_verifications(business_id: str, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    records = db.query(VerificationRecord).filter(VerificationRecord.business_id == business_id).all()
    return records

@router.post("/businesses/{business_id}")
def verify_business_contacts(business_id: str, db: Session = Depends(get_db)):
    """
    Executes deep verification for all existing contacts and website of a business.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    verification_results = []

    # 1. Verify Contacts
    for contact in biz.contacts:
        if contact.contact_type == "email":
            email_res = VerificationService.verify_email(contact.raw_value)
            contact.verification_status = email_res.verification_status

            v_record = VerificationRecord(
                business_id=biz.id,
                entity_type="email",
                status="passed" if email_res.has_mx_records else ("warning" if email_res.is_valid_syntax else "failed"),
                dns_mx_valid=email_res.has_mx_records,
                evidence=email_res.to_dict(),
                checked_at=datetime.utcnow()
            )
            db.add(v_record)
            verification_results.append(email_res.to_dict())

        elif contact.contact_type == "phone":
            phone_res = VerificationService.verify_phone(contact.raw_value, biz.country or "IN")
            contact.verification_status = phone_res.verification_status
            if phone_res.e164_format:
                contact.normalized_value = phone_res.e164_format

            v_record = VerificationRecord(
                business_id=biz.id,
                entity_type="phone",
                status="passed" if phone_res.is_valid_format else "warning",
                phone_e164=phone_res.e164_format,
                phone_country_code=phone_res.country_code,
                phone_carrier_type=phone_res.carrier_type,
                evidence=phone_res.to_dict(),
                checked_at=datetime.utcnow()
            )
            db.add(v_record)
            verification_results.append(phone_res.to_dict())

    # 2. Verify Website SSL & Reachability
    if biz.official_website:
        domain = biz.normalized_domain
        if domain:
            ssl_info = VerificationService.verify_ssl_certificate(domain)
            v_record = VerificationRecord(
                business_id=biz.id,
                entity_type="website",
                status="passed" if ssl_info.get("is_valid") else "warning",
                ssl_valid=ssl_info.get("is_valid"),
                ssl_issuer=ssl_info.get("issuer"),
                ssl_days_to_expiry=ssl_info.get("days_remaining"),
                evidence=ssl_info,
                checked_at=datetime.utcnow()
            )
            db.add(v_record)

    biz.last_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(biz)

    return {
        "business_id": biz.id,
        "name": biz.name,
        "verified_at": biz.last_verified_at,
        "results": verification_results
    }

@router.post("/businesses/{business_id}/extract")
def extract_website_contacts(business_id: str, db: Session = Depends(get_db)):
    """
    Crawls official business website with SSRF protection to extract public emails,
    phones, social media handles, and contact page URL.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if not biz.official_website:
        raise HTTPException(status_code=400, detail="Business has no official website listed")

    extractor = ContactExtractor()
    extracted = extractor.extract_from_website(biz.official_website)

    # Update contact page if discovered
    if extracted.contact_page_url and not biz.contact_page_url:
        biz.contact_page_url = extracted.contact_page_url

    # Update social links
    if extracted.social_links:
        current_socials = biz.social_links or {}
        current_socials.update(extracted.social_links)
        biz.social_links = current_socials

    new_contacts_added = 0
    existing_normalized = {c.normalized_value for c in biz.contacts}

    # Add discovered emails
    for email in extracted.emails:
        norm_email = email.lower().strip()
        if norm_email not in existing_normalized:
            verify_res = VerificationService.verify_email(norm_email)
            contact = BusinessContact(
                business_id=biz.id,
                contact_type="email",
                raw_value=email,
                normalized_value=norm_email,
                is_primary=False,
                verification_status=verify_res.verification_status,
                source_url=extracted.contact_page_url or biz.official_website
            )
            db.add(contact)
            existing_normalized.add(norm_email)
            new_contacts_added += 1

    # Add discovered phones
    for phone in extracted.phones:
        phone_res = VerificationService.verify_phone(phone, biz.country or "IN")
        norm_phone = phone_res.e164_format or phone
        if norm_phone not in existing_normalized:
            contact = BusinessContact(
                business_id=biz.id,
                contact_type="phone",
                raw_value=phone,
                normalized_value=norm_phone,
                is_primary=False,
                verification_status=phone_res.verification_status,
                source_url=extracted.contact_page_url or biz.official_website
            )
            db.add(contact)
            existing_normalized.add(norm_phone)
            new_contacts_added += 1

    db.commit()
    db.refresh(biz)

    return {
        "business_id": biz.id,
        "new_contacts_added": new_contacts_added,
        "contact_page_url": biz.contact_page_url,
        "social_links": biz.social_links,
        "scanned_pages": extracted.pages_scanned
    }

@router.get("/summary", response_model=VerificationSummaryResponse)
def get_verification_summary(db: Session = Depends(get_db)):
    total = db.query(BusinessContact).count()
    mx_valid = db.query(BusinessContact).filter(BusinessContact.verification_status == "mx_confirmed").count()
    syntax_valid = db.query(BusinessContact).filter(BusinessContact.verification_status == "valid_syntax").count()
    invalid_e = db.query(BusinessContact).filter(BusinessContact.verification_status == "invalid").count()
    disposable_e = db.query(BusinessContact).filter(BusinessContact.verification_status == "disposable").count()

    ssl_valid = db.query(WebsiteAudit).filter(WebsiteAudit.has_ssl == True).count()
    ssl_insecure = db.query(WebsiteAudit).filter(WebsiteAudit.has_ssl == False, WebsiteAudit.has_website == True).count()

    return VerificationSummaryResponse(
        total_contacts=total,
        mx_confirmed_emails=mx_valid,
        valid_syntax_emails=syntax_valid,
        invalid_emails=invalid_e,
        disposable_emails=disposable_e,
        valid_e164_phones=syntax_valid,
        unverified_phones=total - mx_valid - syntax_valid,
        ssl_secured_websites=ssl_valid,
        insecure_websites=ssl_insecure
    )

