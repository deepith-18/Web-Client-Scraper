import uuid
from datetime import datetime, timedelta
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.user import User
from backend.app.models.job import LeadSource, ScrapingJob, ScrapingJobLog
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.verification import VerificationRecord
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.models.crm import LeadNote, OutreachRecord, FollowUpTask, SuppressionRecord, CallLog
from backend.app.models.finance import CompanyExpense
from backend.app.core.security import get_password_hash

def seed_database():
    print("Creating all tables in database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin & Caller Users
        admin = db.query(User).filter(User.email == "admin@prospectiq.io").first()
        if not admin:
            admin = User(
                email="admin@prospectiq.io",
                hashed_password=get_password_hash("prospect123!"),
                full_name="Deepith (Lead Developer & Admin)",
                role="admin",
                is_active=True
            )
            db.add(admin)
            print("Created default admin user: admin@prospectiq.io (password: prospect123!)")
        else:
            admin.full_name = "Deepith (Lead Developer & Admin)"
            admin.role = "admin"

        caller = db.query(User).filter(User.email == "caller@prospectiq.io").first()
        if not caller:
            caller = User(
                email="caller@prospectiq.io",
                hashed_password=get_password_hash("caller123!"),
                full_name="Team Caller (Telecaller / SDR)",
                role="caller",
                is_active=True
            )
            db.add(caller)
            print("Created caller user: caller@prospectiq.io (password: caller123!)")

        db.commit()

        # 2. Lead Sources
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

        source_objs = {}
        for src_data in sources:
            existing = db.query(LeadSource).filter(LeadSource.name == src_data["name"]).first()
            if not existing:
                src = LeadSource(**src_data)
                db.add(src)
                db.commit()
                db.refresh(src)
                source_objs[src.source_type] = src
            else:
                source_objs[existing.source_type] = existing

        # 3. Check if businesses already seeded
        if db.query(Business).count() > 0:
            print("Businesses already exist in database. Skipping sample generation.")
            return

        print("Seeding sample worldwide & Bengaluru businesses with audit diagnostics and scores...")
        osm_source = source_objs.get("open_osm")

        sample_leads = [
            {
                "name": "The Green Basil Bistro",
                "category": "Restaurants and cafes",
                "city": "Bengaluru",
                "state_province": "Karnataka",
                "postal_code": "560038",
                "country": "India",
                "address_line1": "100 Feet Rd, Indiranagar",
                "official_website": "http://greenbasilbistro-blr.example.com",
                "normalized_domain": "greenbasilbistro-blr.example.com",
                "contact_email": "contact@greenbasilbistro-blr.example.com",
                "contact_phone": "+91 80 4123 4567",
                "crm_status": "qualified",
                "has_website": True,
                "has_ssl": False,
                "is_mobile_friendly": False,
                "has_contact_form": False,
                "load_time_ms": 4200,
                "opportunities": ["no_ssl", "unresponsive_mobile", "missing_contact_form", "slow_load_time"],
                "total_score": 75,
                "priority_tier": "good",
                "pitch": "I noticed Green Basil Bistro does not have an active SSL certificate (HTTPS), and customers on mobile devices struggle with the layout. A responsive menu with direct reservation integration would capture 30%+ more diner bookings."
            },
            {
                "name": "Voxel Living Interiors",
                "category": "Interior designers",
                "city": "Bengaluru",
                "state_province": "Karnataka",
                "postal_code": "560034",
                "country": "India",
                "address_line1": "80 Feet Road, Koramangala 4th Block",
                "official_website": None,  # No website!
                "normalized_domain": None,
                "contact_email": "voxelliving.blr@gmail.com",
                "contact_phone": "+91 98450 11223",
                "crm_status": "new",
                "has_website": False,
                "has_ssl": False,
                "is_mobile_friendly": False,
                "has_contact_form": False,
                "load_time_ms": None,
                "opportunities": ["no_website", "using_free_email", "missing_portfolio_showcase"],
                "total_score": 90,
                "priority_tier": "high",
                "pitch": "Voxel Living Interiors is highly rated on local listings, but has no official website to showcase its luxury portfolio. A modern portfolio site with an interactive design cost estimator could convert residential clients seamlessly."
            },
            {
                "name": "Pearl Smile Dental Clinic",
                "category": "Dental clinics",
                "city": "Bengaluru",
                "state_province": "Karnataka",
                "postal_code": "560069",
                "country": "India",
                "address_line1": "9th Block, Jayanagar",
                "official_website": "https://pearlsmiledental.example.in",
                "normalized_domain": "pearlsmiledental.example.in",
                "contact_email": "care@pearlsmiledental.example.in",
                "contact_phone": "+91 80 2665 9988",
                "crm_status": "contacted",
                "has_website": True,
                "has_ssl": True,
                "is_mobile_friendly": True,
                "has_contact_form": False,
                "load_time_ms": 1850,
                "opportunities": ["missing_online_booking", "no_schema_markup"],
                "total_score": 45,
                "priority_tier": "medium",
                "pitch": "Pearl Smile's website is clean and fast, but lacks an automated patient appointment booking widget and local dental clinic schema markup for top Google Map rankings."
            },
            # International leads (Global client acquisition)
            {
                "name": "Apex Strength & Conditioning",
                "category": "Gyms and fitness centres",
                "city": "Austin",
                "state_province": "Texas",
                "postal_code": "78701",
                "country": "United States",
                "address_line1": "412 Congress Ave",
                "official_website": "http://apexstrength-atx.example.com",
                "normalized_domain": "apexstrength-atx.example.com",
                "contact_email": "info@apexstrength-atx.example.com",
                "contact_phone": "+1 512 555 0198",
                "crm_status": "researching",
                "has_website": True,
                "has_ssl": False,
                "is_mobile_friendly": False,
                "has_contact_form": False,
                "load_time_ms": 5100,
                "opportunities": ["no_ssl", "unresponsive_mobile", "broken_membership_links", "outdated_wordpress"],
                "total_score": 85,
                "priority_tier": "high",
                "pitch": "Apex Strength has an active community in downtown Austin, but the site lacks SSL security and takes over 5 seconds to load on LTE. A modern Next.js gym portal with class schedules and membership checkout would drive direct signups."
            },
            {
                "name": "Holborn Artisan Bakery",
                "category": "Restaurants and cafes",
                "city": "London",
                "state_province": "Greater London",
                "postal_code": "WC1V 6BX",
                "country": "United Kingdom",
                "address_line1": "28 High Holborn",
                "official_website": None,  # No website
                "normalized_domain": None,
                "contact_email": "holbornbakerylondon@outlook.com",
                "contact_phone": "+44 20 7946 0912",
                "crm_status": "qualified",
                "has_website": False,
                "has_ssl": False,
                "is_mobile_friendly": False,
                "has_contact_form": False,
                "load_time_ms": None,
                "opportunities": ["no_website", "missing_catering_orders"],
                "total_score": 88,
                "priority_tier": "high",
                "pitch": "Holborn Artisan Bakery receives steady office foot-traffic, but loses corporate breakfast and catering orders because it lacks an online ordering menu. We can launch a high-converting ordering storefront in 10 days."
            },
            {
                "name": "Horizon Luxury Escapes",
                "category": "Travel agencies",
                "city": "Sydney",
                "state_province": "New South Wales",
                "postal_code": "2000",
                "country": "Australia",
                "address_line1": "100 George St, The Rocks",
                "official_website": "https://horizonluxescapes.example.au",
                "normalized_domain": "horizonluxescapes.example.au",
                "contact_email": "concierge@horizonluxescapes.example.au",
                "contact_phone": "+61 2 9123 4567",
                "crm_status": "proposal_sent",
                "has_website": True,
                "has_ssl": True,
                "is_mobile_friendly": False,
                "has_contact_form": True,
                "load_time_ms": 3800,
                "opportunities": ["unresponsive_mobile", "slow_image_loading", "missing_dynamic_inquiry_form"],
                "total_score": 68,
                "priority_tier": "good",
                "pitch": "Horizon Luxury Escapes has breathtaking travel packages, but the high-res hero images are uncompressed, causing the page to lag heavily on mobile devices. An optimized, fast-loading responsive redesign will keep wealthy travelers engaged."
            }
        ]

        for item in sample_leads:
            biz = Business(
                source_id=osm_source.id if osm_source else None,
                name=item["name"],
                category=item["category"],
                city=item["city"],
                state_province=item["state_province"],
                postal_code=item["postal_code"],
                country=item["country"],
                address_line1=item["address_line1"],
                official_website=item["official_website"],
                normalized_domain=item["normalized_domain"],
                crm_status=item["crm_status"],
                first_discovered_at=datetime.utcnow() - timedelta(days=2),
                last_verified_at=datetime.utcnow()
            )
            db.add(biz)
            db.flush()

            # Contact
            if item.get("contact_email"):
                contact_email = BusinessContact(
                    business_id=biz.id,
                    contact_type="email",
                    raw_value=item["contact_email"],
                    normalized_value=item["contact_email"].lower(),
                    is_primary=True,
                    verification_status="mx_confirmed"
                )
                db.add(contact_email)

            if item.get("contact_phone"):
                contact_phone = BusinessContact(
                    business_id=biz.id,
                    contact_type="phone",
                    raw_value=item["contact_phone"],
                    normalized_value=item["contact_phone"].replace(" ", ""),
                    is_primary=False,
                    verification_status="valid_syntax"
                )
                db.add(contact_phone)

            # Audit
            audit = WebsiteAudit(
                business_id=biz.id,
                has_website=item["has_website"],
                target_url=item["official_website"],
                is_reachable=item["has_website"],
                has_ssl=item["has_ssl"],
                is_mobile_friendly=item["is_mobile_friendly"],
                has_contact_form=item["has_contact_form"],
                load_time_ms=item["load_time_ms"],
                opportunities_identified=item["opportunities"],
                technologies_detected=["WordPress 5.4", "jQuery 1.12"] if item["has_website"] else []
            )
            db.add(audit)

            # Score
            no_web_score = 30 if not item["has_website"] else 0
            mob_score = 15 if not item["is_mobile_friendly"] else 0
            contact_score = 10 if not item["has_contact_form"] else 0
            ssl_score = 15 if not item["has_ssl"] else 0
            
            lead_score = LeadScore(
                business_id=biz.id,
                total_opportunity_score=item["total_score"],
                priority_tier=item["priority_tier"],
                no_website_score=no_web_score,
                mobile_score=mob_score,
                missing_contact_score=contact_score,
                performance_score=10 if (item["load_time_ms"] and item["load_time_ms"] > 3000) else 0,
                authenticity_score=5,
                email_available_score=5 if item.get("contact_email") else 0,
                score_breakdown={
                    "deficiencies": item["opportunities"],
                    "priority": item["priority_tier"]
                }
            )
            db.add(lead_score)

            # Outreach
            outreach = OutreachRecord(
                business_id=biz.id,
                user_id=admin.id,
                channel="email",
                recipient=item.get("contact_email"),
                subject=f"Website improvement opportunities for {item['name']}",
                generated_pitch=item["pitch"],
                status="draft",
                manual_approval_granted=False
            )
            db.add(outreach)

        db.commit()

        # 4. Seed Initial Call Logs if empty
        if db.query(CallLog).count() == 0:
            b_coffee = db.query(Business).filter(Business.name == "Third Wave Coffee Indiranagar").first()
            b_dental = db.query(Business).filter(Business.name == "Koramangala Dental Care").first()
            b_ayur = db.query(Business).filter(Business.name == "Veda Ayurveda & Wellness").first()
            b_gym = db.query(Business).filter(Business.name == "Apex Functional Fitness").first()

            if b_coffee and caller:
                db.add(CallLog(
                    business_id=b_coffee.id,
                    user_id=caller.id,
                    caller_name=caller.full_name,
                    phone_number="+91 80 4123 9988",
                    outcome="agreed",
                    duration_seconds=185,
                    project_type="Turnkey Website Build",
                    agreed_budget="₹35,000",
                    notes="Spoke with operations manager Rohit. They want an online table reservation page and mobile menu."
                ))

            if b_dental and caller:
                db.add(CallLog(
                    business_id=b_dental.id,
                    user_id=caller.id,
                    caller_name=caller.full_name,
                    phone_number="+91 80 2553 1122",
                    outcome="agreed",
                    duration_seconds=240,
                    project_type="Appointment Booking Redesign",
                    agreed_budget="₹28,000",
                    notes="Dr. Priya agreed to a modernized website with WhatsApp direct chat and appointment scheduler."
                ))

            if b_ayur and caller:
                db.add(CallLog(
                    business_id=b_ayur.id,
                    user_id=caller.id,
                    caller_name=caller.full_name,
                    phone_number="+91 80 2344 8877",
                    outcome="callback_scheduled",
                    duration_seconds=95,
                    notes="Owner was with a patient. Requested a callback on Friday at 11:30 AM.",
                    scheduled_callback_at=datetime.utcnow() + timedelta(days=2)
                ))

            if b_gym and caller:
                db.add(CallLog(
                    business_id=b_gym.id,
                    user_id=caller.id,
                    caller_name=caller.full_name,
                    phone_number="+1 512 555 0199",
                    outcome="declined",
                    duration_seconds=70,
                    decline_reason="Already has dedicated web agency handling their site.",
                    notes="Polite decline. Keeping in archive."
                ))

            db.commit()
            print("Seeded sample call logs for caller workspace.")

        # 5. Seed Company Expenses & Spending Telemetry if empty
        if db.query(CompanyExpense).count() == 0:
            expenses = [
                {
                    "title": "OpenAI GPT-4o API Pitch & Proposal Token Usage",
                    "category": "ai_apis",
                    "amount": 3250.0,
                    "currency": "INR",
                    "vendor": "OpenAI",
                    "billing_type": "usage_based",
                    "notes": "Automated cold email generation and technical proposal drafting for scraped leads.",
                    "days_ago": 4
                },
                {
                    "title": "Anthropic Claude 3.5 Sonnet Proposal Engine",
                    "category": "ai_apis",
                    "amount": 2100.0,
                    "currency": "INR",
                    "vendor": "Anthropic",
                    "billing_type": "usage_based",
                    "notes": "Deep technical code audit synthesis and client objection handling.",
                    "days_ago": 12
                },
                {
                    "title": "Vercel Pro Next.js App Hosting & Edge CDN",
                    "category": "cloud_deployments",
                    "amount": 1650.0,
                    "currency": "INR",
                    "vendor": "Vercel",
                    "billing_type": "recurring_monthly",
                    "notes": "Client dashboard and public preview sites hosting.",
                    "days_ago": 18
                },
                {
                    "title": "AWS EC2 Micro Fleet & Cloud Storage",
                    "category": "cloud_deployments",
                    "amount": 2800.0,
                    "currency": "INR",
                    "vendor": "Amazon Web Services",
                    "billing_type": "usage_based",
                    "notes": "Background Overpass scrapers and caching server nodes.",
                    "days_ago": 9
                },
                {
                    "title": "Twilio Telephony & Outbound Call Minutes",
                    "category": "telephony",
                    "amount": 4500.0,
                    "currency": "INR",
                    "vendor": "Twilio",
                    "billing_type": "usage_based",
                    "notes": "Dedicated telecaller desk calling credit for Bengaluru business numbers.",
                    "days_ago": 7
                },
                {
                    "title": "BrightData Residential Rotating Scraping Proxies",
                    "category": "proxies_scraping",
                    "amount": 1900.0,
                    "currency": "INR",
                    "vendor": "BrightData",
                    "billing_type": "recurring_monthly",
                    "notes": "Geospatial coordinate resolution and anti-block crawlers.",
                    "days_ago": 22
                },
                {
                    "title": "Figma Professional Team Workspace",
                    "category": "software_tools",
                    "amount": 1250.0,
                    "currency": "INR",
                    "vendor": "Figma",
                    "billing_type": "recurring_monthly",
                    "notes": "Rapid website mockups and client wireframing.",
                    "days_ago": 14
                },
                {
                    "title": "Team Caller Deal Commission (2 Accepted Deals)",
                    "category": "payroll_team",
                    "amount": 7000.0,
                    "currency": "INR",
                    "vendor": "Team Caller",
                    "billing_type": "one_time",
                    "notes": "Performance incentive for securing Third Wave Coffee and Dental Care deals.",
                    "days_ago": 2
                },
                {
                    "title": "Domain Registrations & SSL Wildcard Certificates",
                    "category": "operations",
                    "amount": 1450.0,
                    "currency": "INR",
                    "vendor": "Namecheap",
                    "billing_type": "one_time",
                    "notes": "New agency domains and client demo staging subdomains.",
                    "days_ago": 25
                }
            ]

            for exp_item in expenses:
                db.add(CompanyExpense(
                    title=exp_item["title"],
                    category=exp_item["category"],
                    amount=exp_item["amount"],
                    currency=exp_item["currency"],
                    vendor=exp_item["vendor"],
                    billing_type=exp_item["billing_type"],
                    notes=exp_item["notes"],
                    expense_date=datetime.utcnow() - timedelta(days=exp_item["days_ago"]),
                    logged_by_user_id=admin.id if admin else None
                ))

            db.commit()
            print("Seeded startup company expenses and spending telemetry.")

        print("Database successfully seeded with international & Bengaluru business leads!")



    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

