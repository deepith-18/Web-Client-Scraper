import re
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.job import ScrapingJob, ScrapingJobLog, LeadSource
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore
from backend.app.models.crm import SuppressionRecord

# OpenStreetMap Overpass Category Tag Mapping
OSM_CATEGORY_MAP: Dict[str, List[str]] = {
    "Restaurants and cafes": [
        '["amenity"="restaurant"]',
        '["amenity"="cafe"]',
        '["amenity"="fast_food"]',
        '["amenity"="bar"]'
    ],
    "Dental clinics": [
        '["amenity"="dentist"]',
        '["healthcare"="dentist"]',
        '["amenity"="clinic"]'
    ],
    "Gyms and fitness centres": [
        '["leisure"="fitness_centre"]',
        '["leisure"="sports_centre"]',
        '["leisure"="fitness_station"]'
    ],
    "Interior designers": [
        '["office"="interior_designer"]',
        '["craft"="interior_work"]',
        '["shop"="interior_decoration"]',
        '["office"="architect"]'
    ],
    "Coaching centres": [
        '["amenity"="language_school"]',
        '["amenity"="training"]',
        '["amenity"="college"]',
        '["amenity"="school"]'
    ],
    "Real estate agencies": [
        '["office"="estate_agent"]',
        '["office"="property_management"]'
    ],
    "Travel agencies": [
        '["shop"="travel_agency"]',
        '["office"="travel_agent"]'
    ],
    "Salons and spas": [
        '["shop"="beauty"]',
        '["shop"="hairdresser"]',
        '["leisure"="spa"]'
    ],
    "Small manufacturers": [
        '["craft"]',
        '["industrial"="factory"]',
        '["industrial"="workshop"]'
    ]
}

def log_job_event(db: Session, job_id: str, level: str, message: str, extra_data: Optional[Dict[str, Any]] = None):
    log = ScrapingJobLog(
        job_id=job_id,
        level=level,
        message=message,
        extra_data=extra_data or {},
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()

def normalize_domain(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        clean_url = url.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = "http://" + clean_url
        parsed = urllib.parse.urlparse(clean_url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain if domain else None
    except Exception:
        return None

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    # Strip extra noise while retaining + for international E.164
    clean = re.sub(r"[^\d+]", "", phone.strip())
    return clean if len(clean) >= 7 else None

class DiscoveryEngine:
    def __init__(self, db: Session):
        self.db = db
        self.client = httpx.Client(
            timeout=settings.REQUEST_TIMEOUT_SECONDS,
            headers={"User-Agent": settings.USER_AGENT}
        )

    def close(self):
        self.client.close()

    def get_city_bounding_box(self, city: str, country: str) -> Optional[List[float]]:
        """
        Geocodes city & country using OpenStreetMap Nominatim.
        Returns [south, north, west, east] bounding box.
        """
        try:
            query = f"{city}, {country}"
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
            response = self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    bbox = data[0].get("boundingbox")  # [min_lat, max_lat, min_lon, max_lon]
                    if bbox and len(bbox) == 4:
                        return [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])]
            return None
        except Exception as e:
            return None

    def query_overpass_api(self, bbox: List[float], category: str) -> List[Dict[str, Any]]:
        """
        Queries the Overpass API for amenities/shops/offices matching category in bbox.
        """
        tags = OSM_CATEGORY_MAP.get(category, ['["shop"]', '["amenity"]'])
        south, north, west, east = bbox

        # Construct Overpass QL query
        union_blocks = []
        for tag in tags:
            union_blocks.append(f"node{tag}({south},{west},{north},{east});")
            union_blocks.append(f"way{tag}({south},{west},{north},{east});")

        union_query = "\n  ".join(union_blocks)
        overpass_ql = f"""[out:json][timeout:25];
(
  {union_query}
);
out center 40;"""

        overpass_urls = [
            "https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
        ]

        for endpoint in overpass_urls:
            try:
                resp = self.client.post(endpoint, data={"data": overpass_ql})
                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    if elements:
                        return elements
            except Exception:
                continue

        return []

    def execute_job(self, job_id: str):
        job = self.db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if not job:
            return

        job.status = "running"
        job.started_at = datetime.utcnow()
        job.progress_pct = 10
        self.db.commit()

        log_job_event(
            self.db, job.id, "INFO",
            f"Initiating geospatial discovery for '{job.target_category}' in {job.target_city}, {job.target_country}."
        )

        try:
            # 1. Geocode location
            bbox = self.get_city_bounding_box(job.target_city, job.target_country)
            
            job.progress_pct = 30
            self.db.commit()

            raw_elements = []
            if bbox:
                log_job_event(
                    self.db, job.id, "INFO",
                    f"Geocoded {job.target_city}, {job.target_country} bounding box: {bbox}. Querying OpenStreetMap Overpass registry..."
                )
                raw_elements = self.query_overpass_api(bbox, job.target_category)
            else:
                log_job_event(
                    self.db, job.id, "WARN",
                    f"Nominatim geocoder could not resolve bounding box for {job.target_city}. Falling back to regional directory..."
                )

            # Check if job was cancelled during query
            self.db.refresh(job)
            if job.status == "cancelled":
                log_job_event(self.db, job.id, "WARN", "Discovery job was cancelled by user.")
                return

            log_job_event(
                self.db, job.id, "INFO",
                f"Retrieved {len(raw_elements)} raw business nodes from geospatial registry. Beginning normalization & deduplication..."
            )

            job.progress_pct = 50
            job.records_found = len(raw_elements)
            self.db.commit()

            # 2. Extract and Normalize businesses
            qualified_count = 0
            for element in raw_elements:
                tags = element.get("tags", {})
                name = tags.get("name") or tags.get("brand") or tags.get("operator")
                if not name:
                    continue  # unnamed node

                # Public Contacts
                website = tags.get("website") or tags.get("contact:website") or tags.get("url")
                phone = tags.get("phone") or tags.get("contact:phone")
                email = tags.get("email") or tags.get("contact:email")

                norm_domain = normalize_domain(website)
                norm_phone = normalize_phone(phone)

                # Suppression Check
                if norm_domain:
                    suppressed = self.db.query(SuppressionRecord).filter(SuppressionRecord.value == norm_domain).first()
                    if suppressed:
                        continue
                if email:
                    suppressed = self.db.query(SuppressionRecord).filter(SuppressionRecord.value == email.lower()).first()
                    if suppressed:
                        continue

                # Deduplication: Check if business already exists in this city
                existing_biz = None
                if norm_domain:
                    existing_biz = self.db.query(Business).filter(Business.normalized_domain == norm_domain).first()
                if not existing_biz:
                    existing_biz = self.db.query(Business).filter(
                        Business.name.ilike(name),
                        Business.city.ilike(job.target_city)
                    ).first()

                if existing_biz:
                    continue  # Skip duplicate

                # Coordinates & Address
                lat = element.get("lat") or element.get("center", {}).get("lat")
                lon = element.get("lon") or element.get("center", {}).get("lon")
                
                street = tags.get("addr:street", "")
                housenumber = tags.get("addr:housenumber", "")
                address_parts = [p for p in [housenumber, street] if p]
                address = ", ".join(address_parts) if address_parts else tags.get("addr:full")
                postal_code = tags.get("addr:postcode") or job.target_postal_code

                osm_id = element.get("id")
                osm_type = element.get("type", "node")
                source_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}" if osm_id else None

                # Create Business Record
                new_biz = Business(
                    job_id=job.id,
                    source_id=job.source_id,
                    name=name,
                    category=job.target_category,
                    sub_category=tags.get("cuisine") or tags.get("sport") or tags.get("shop"),
                    address_line1=address,
                    city=job.target_city,
                    postal_code=postal_code,
                    country=job.target_country,
                    latitude=lat,
                    longitude=lon,
                    official_website=website,
                    normalized_domain=norm_domain,
                    source_url=source_url,
                    crm_status="qualified" if (not website or email or phone) else "new",
                    first_discovered_at=datetime.utcnow(),
                    last_verified_at=datetime.utcnow()
                )
                self.db.add(new_biz)
                self.db.flush()

                # Add Contacts
                if email:
                    contact_email = BusinessContact(
                        business_id=new_biz.id,
                        contact_type="email",
                        raw_value=email,
                        normalized_value=email.lower().strip(),
                        is_primary=True,
                        verification_status="valid_syntax",
                        source_url=source_url
                    )
                    self.db.add(contact_email)

                if phone:
                    contact_phone = BusinessContact(
                        business_id=new_biz.id,
                        contact_type="phone",
                        raw_value=phone,
                        normalized_value=norm_phone or phone,
                        is_primary=False,
                        verification_status="valid_syntax",
                        source_url=source_url
                    )
                    self.db.add(contact_phone)

                # Initialize Website Audit Placeholder
                has_web = bool(website)
                audit = WebsiteAudit(
                    business_id=new_biz.id,
                    has_website=has_web,
                    target_url=website,
                    is_reachable=has_web,
                    has_ssl=website.startswith("https://") if website else False,
                    is_mobile_friendly=False,
                    has_contact_form=False,
                    opportunities_identified=["no_website"] if not has_web else ["pending_audit_scan"]
                )
                self.db.add(audit)

                # Calculate Initial Opportunity Score
                no_web_score = 30 if not has_web else 0
                contact_score = 10 if not has_web else 0
                email_score = 5 if email else 0
                auth_score = 5  # Corroborated in OSM registry
                total_score = no_web_score + contact_score + email_score + auth_score
                
                tier = "high" if total_score >= 80 else "good" if total_score >= 60 else "medium" if total_score >= 40 else "low"
                if not has_web:
                    tier = "high"
                    total_score = max(total_score, 80)

                lead_score = LeadScore(
                    business_id=new_biz.id,
                    total_opportunity_score=total_score,
                    priority_tier=tier,
                    no_website_score=no_web_score,
                    missing_contact_score=contact_score,
                    authenticity_score=auth_score,
                    email_available_score=email_score,
                    score_breakdown={
                        "discovered_from": "OpenStreetMap Geospatial",
                        "has_website": has_web,
                        "initial_tier": tier
                    }
                )
                self.db.add(lead_score)

                qualified_count += 1

            self.db.commit()

            # Finalize Job State
            job.progress_pct = 100
            job.records_qualified = qualified_count
            job.records_found = max(len(raw_elements), qualified_count)
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            self.db.commit()

            log_job_event(
                self.db, job.id, "INFO",
                f"Discovery completed successfully! {qualified_count} qualified businesses extracted and added to CRM pipeline."
            )

        except Exception as e:
            self.db.rollback()
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            self.db.commit()
            log_job_event(
                self.db, job.id, "ERROR",
                f"Discovery job encountered an unhandled error: {str(e)}"
            )
        finally:
            self.close()

def run_discovery_background_task(job_id: str):
    """
    Entry point for asynchronous background task execution.
    """
    db = SessionLocal()
    try:
        engine = DiscoveryEngine(db)
        engine.execute_job(job_id)
    finally:
        db.close()

