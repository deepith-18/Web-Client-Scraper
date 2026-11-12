import os
import sys
import uuid
import secrets
import warnings
from datetime import datetime
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.user import User, default_permissions
from backend.app.models.job import LeadSource, ScrapingJob, ScrapingJobLog
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.verification import VerificationRecord
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.models.crm import LeadNote, OutreachRecord, FollowUpTask, SuppressionRecord, CallLog, OutreachTemplate
from backend.app.models.finance import CompanyExpense
from backend.app.core.security import get_password_hash

def clear_all_temporary_data(db):
    """
    Purges all temporary and fake scraped data:
    - scraping_job_logs & scraping_jobs
    - call_logs, outreach_records, lead_notes, follow_up_tasks
    - lead_scores, website_audits, verification_records, business_contacts, businesses
    - removes obsolete prospectiq test users (preserving real users)
    """
    print("Purging all fake and temporary discovered data...")
    db.query(ScrapingJobLog).delete()
    db.query(CallLog).delete()
    db.query(OutreachRecord).delete()
    db.query(LeadNote).delete()
    db.query(FollowUpTask).delete()
    db.query(LeadScore).delete()
    db.query(WebsiteAudit).delete()
    db.query(VerificationRecord).delete()
    db.query(BusinessContact).delete()
    db.query(Business).delete()
    db.query(ScrapingJob).delete()
    db.query(CompanyExpense).delete()

    # Remove obsolete test accounts
    db.query(User).filter(User.email.in_(["admin@prospectiq.io", "caller@prospectiq.io"])).delete()

    db.commit()
    print("All fake leads, temporary scraping jobs, logs, and sample data have been completely removed.")

def seed_database(clear_first: bool = False):
    print("Ensuring all database tables exist...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if clear_first:
            clear_all_temporary_data(db)

        # 1. Ensure Demanex Admin User exists
        # Seed password comes from environment — NEVER hardcode in source
        admin_password = os.environ.get("ADMIN_SEED_PASSWORD")
        if not admin_password:
            warnings.warn(
                "ADMIN_SEED_PASSWORD not set. Using a random one-time password for this session. "
                "Set this environment variable to persist a known admin password.",
                UserWarning
            )
            admin_password = secrets.token_urlsafe(16)

        admin = db.query(User).filter(User.email == "admin@demanex.io").first()
        if not admin:
            admin = User(
                email="admin@demanex.io",
                hashed_password=get_password_hash(admin_password),
                full_name="Deepith (Founder & Admin)",
                role="admin",
                is_active=True,
                daily_call_target=30,
                permissions=default_permissions("admin")
            )
            db.add(admin)
            print("Created Demanex admin user: admin@demanex.io")
        else:
            admin.role = "admin"
            admin.is_active = True
            if not admin.permissions:
                admin.permissions = default_permissions("admin")

        # 2. Ensure Demanex Caller User exists
        caller_password = os.environ.get("CALLER_SEED_PASSWORD")
        if not caller_password:
            warnings.warn(
                "CALLER_SEED_PASSWORD not set. Using a random one-time password for this session. "
                "Set this environment variable to persist a known caller password.",
                UserWarning
            )
            caller_password = secrets.token_urlsafe(16)

        caller = db.query(User).filter(User.email == "caller@demanex.io").first()
        if not caller:
            caller = User(
                email="caller@demanex.io",
                hashed_password=get_password_hash(caller_password),
                full_name="Team Caller",
                role="caller",
                is_active=True,
                daily_call_target=30,
                permissions=default_permissions("caller")
            )
            db.add(caller)
            print("Created Demanex caller user: caller@demanex.io")
        else:
            if not caller.permissions:
                caller.permissions = default_permissions("caller")

        db.commit()

        # 3. Lead Sources Setup (Core engine registry)
        sources = [
            {
                "name": "OpenStreetMap / Overpass Engine",
                "source_type": "open_osm",
                "description": "Global open geospatial business registry (Worldwide)",
                "reliability_score": 0.88,
                "is_authorized": True,
                "rate_limit_per_minute": 60
            },
            {
                "name": "Google Places API",
                "source_type": "google_places",
                "description": "Global commercial business listings and verified contact points",
                "reliability_score": 0.95,
                "is_authorized": True,
                "rate_limit_per_minute": 120
            },
            {
                "name": "Public Business Web Crawler",
                "source_type": "public_directory",
                "description": "Direct crawler for public business domains and contact pages",
                "reliability_score": 0.82,
                "is_authorized": True,
                "rate_limit_per_minute": 30
            }
        ]

        for src_data in sources:
            existing = db.query(LeadSource).filter(LeadSource.source_type == src_data["source_type"]).first()
            if not existing:
                src = LeadSource(**src_data)
                db.add(src)
                db.commit()

        # 4. Default Outreach Pitch Templates
        if db.query(OutreachTemplate).count() == 0:
            templates = [
                {
                    "name": "Turnkey Website Pitch (No Website Found)",
                    "channel": "email",
                    "stage_step": 1,
                    "delay_days": 0,
                    "subject_template": "Quick question regarding {business_name}'s online presence in {city}",
                    "body_template": "Hi team,\n\nI was searching for services in {city} and came across {business_name}. I noticed you don't currently have an official website listed.\n\nWe build high-converting, modern websites that help businesses in {city} attract and book local customers directly from mobile search.\n\nWould you be open to seeing a 2-minute wireframe concept we designed for {business_name}?\n\nBest regards,\n{freelancer_name}\nFounder, Demanex",
                    "is_default": True
                },
                {
                    "name": "Website Redesign & Speed Optimization",
                    "channel": "email",
                    "stage_step": 1,
                    "delay_days": 0,
                    "subject_template": "{business_name} website audit - mobile layout & speed suggestions",
                    "body_template": "Hello {owner_name},\n\nI recently analyzed {business_name}'s website ({website}) and noted {opportunity_summary}.\n\nWith over 70% of clients searching on smartphones, resolving these layout and load speed points typically increases inquiry conversion by 30%+.\n\nCould I send over a complimentary 1-page technical audit report for your review?\n\nBest regards,\n{freelancer_name}\nDemanex Digital",
                    "is_default": True
                }
            ]
            for t_data in templates:
                db.add(OutreachTemplate(**t_data))
            db.commit()

        print("Database verification complete. Clean state ready for real scraped data.")

    except Exception as e:
        db.rollback()
        print(f"Error in seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clear = "--clear" in sys.argv
    seed_database(clear_first=clear)
