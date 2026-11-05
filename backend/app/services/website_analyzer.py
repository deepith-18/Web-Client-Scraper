import re
import time
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
from backend.app.core.config import settings
from backend.app.core.security import is_safe_url
from backend.app.services.verification_service import VerificationService

CTA_KEYWORDS = [
    "book now", "schedule", "order online", "get a quote", "free quote",
    "contact us", "reserve", "sign up", "consultation", "buy now",
    "call now", "inquire", "request appointment"
]

OUTDATED_TECH_SIGNATURES = [
    (r"jquery[- /]1\.", "Legacy jQuery 1.x library detected (security & performance risk)", True),
    (r"jquery[- /]2\.", "Legacy jQuery 2.x library detected (obsolete version)", True),
    (r"wp-content", "WordPress CMS", False),
    (r"elementor", "Elementor Page Builder", False),
    (r"bootstrap[- /]3\.", "Legacy Bootstrap 3 CSS framework", True),
    (r"adobe[- /]flash|<embed|<object", "Adobe Flash elements detected", True),
]

class WebsiteAuditResult:
    def __init__(
        self,
        target_url: str,
        has_website: bool,
        is_reachable: bool,
        http_status: Optional[int],
        redirect_count: int,
        final_url: Optional[str],
        load_time_ms: Optional[int],
        has_ssl: bool,
        is_mobile_friendly: bool,
        has_contact_form: bool,
        has_viewport_meta: bool,
        broken_links_count: int,
        title: Optional[str],
        meta_description: Optional[str],
        has_schema_markup: bool,
        has_google_analytics: bool,
        technologies_detected: List[str],
        opportunities_identified: List[str],
        evidence: Dict[str, str],
        raw_audit_report: Dict[str, Any]
    ):
        self.target_url = target_url
        self.has_website = has_website
        self.is_reachable = is_reachable
        self.http_status = http_status
        self.redirect_count = redirect_count
        self.final_url = final_url
        self.load_time_ms = load_time_ms
        self.has_ssl = has_ssl
        self.is_mobile_friendly = is_mobile_friendly
        self.has_contact_form = has_contact_form
        self.has_viewport_meta = has_viewport_meta
        self.broken_links_count = broken_links_count
        self.title = title
        self.meta_description = meta_description
        self.has_schema_markup = has_schema_markup
        self.has_google_analytics = has_google_analytics
        self.technologies_detected = technologies_detected
        self.opportunities_identified = opportunities_identified
        self.evidence = evidence
        self.raw_audit_report = raw_audit_report

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_url": self.target_url,
            "has_website": self.has_website,
            "is_reachable": self.is_reachable,
            "http_status": self.http_status,
            "redirect_count": self.redirect_count,
            "final_url": self.final_url,
            "load_time_ms": self.load_time_ms,
            "has_ssl": self.has_ssl,
            "is_mobile_friendly": self.is_mobile_friendly,
            "has_contact_form": self.has_contact_form,
            "has_viewport_meta": self.has_viewport_meta,
            "broken_links_count": self.broken_links_count,
            "title": self.title,
            "meta_description": self.meta_description,
            "has_schema_markup": self.has_schema_markup,
            "has_google_analytics": self.has_google_analytics,
            "technologies_detected": self.technologies_detected,
            "opportunities_identified": self.opportunities_identified,
            "evidence": self.evidence,
            "raw_audit_report": self.raw_audit_report
        }

class WebsiteAnalyzer:
    def __init__(self):
        self.client = httpx.Client(
            timeout=settings.REQUEST_TIMEOUT_SECONDS,
            follow_redirects=True,
            headers={"User-Agent": settings.USER_AGENT}
        )

    def close(self):
        self.client.close()

    def audit_url(self, url: Optional[str]) -> WebsiteAuditResult:
        if not url:
            return WebsiteAuditResult(
                target_url="",
                has_website=False,
                is_reachable=False,
                http_status=None,
                redirect_count=0,
                final_url=None,
                load_time_ms=None,
                has_ssl=False,
                is_mobile_friendly=False,
                has_contact_form=False,
                has_viewport_meta=False,
                broken_links_count=0,
                title=None,
                meta_description=None,
                has_schema_markup=False,
                has_google_analytics=False,
                technologies_detected=[],
                opportunities_identified=["no_website"],
                evidence={"no_website": "Business has no registered official website (+30 points)."},
                raw_audit_report={"status": "no_website"}
            )

        clean_url = url.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = "https://" + clean_url

        if not is_safe_url(clean_url):
            return WebsiteAuditResult(
                target_url=clean_url,
                has_website=True,
                is_reachable=False,
                http_status=None,
                redirect_count=0,
                final_url=None,
                load_time_ms=None,
                has_ssl=False,
                is_mobile_friendly=False,
                has_contact_form=False,
                has_viewport_meta=False,
                broken_links_count=0,
                title=None,
                meta_description=None,
                has_schema_markup=False,
                has_google_analytics=False,
                technologies_detected=[],
                opportunities_identified=["ssrf_blocked_destination"],
                evidence={"security": "Destination blocked by SSRF Shield (private network or metadata endpoint)."},
                raw_audit_report={"error": "ssrf_rejected"}
            )

        opportunities: List[str] = []
        evidence: Dict[str, str] = {}
        technologies: List[str] = []

        start_time = time.time()
        try:
            resp = self.client.get(clean_url)
            load_time_ms = int((time.time() - start_time) * 1000)
            final_url = str(resp.url)
            redirect_count = len(resp.history)
            http_status = resp.status_code
            is_reachable = (200 <= http_status < 400)

            # SSL Check
            has_ssl = final_url.startswith("https://")
            if not has_ssl:
                opportunities.append("missing_ssl")
                evidence["missing_ssl"] = f"Final destination {final_url} is serving plain HTTP without SSL encryption."
            else:
                technologies.append("HTTPS/TLS")

            if not is_reachable:
                opportunities.append("website_unavailable")
                evidence["website_unavailable"] = f"Website returned HTTP status {http_status}."
                return WebsiteAuditResult(
                    target_url=clean_url,
                    has_website=True,
                    is_reachable=False,
                    http_status=http_status,
                    redirect_count=redirect_count,
                    final_url=final_url,
                    load_time_ms=load_time_ms,
                    has_ssl=has_ssl,
                    is_mobile_friendly=False,
                    has_contact_form=False,
                    has_viewport_meta=False,
                    broken_links_count=0,
                    title=None,
                    meta_description=None,
                    has_schema_markup=False,
                    has_google_analytics=False,
                    technologies_detected=technologies,
                    opportunities_identified=opportunities,
                    evidence=evidence,
                    raw_audit_report={"http_status": http_status}
                )

            # Parse HTML content
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # 1. Performance check
            if load_time_ms > 3500:
                opportunities.append("slow_load_time")
                evidence["slow_load_time"] = f"Initial HTML load time was {load_time_ms}ms (exceeds 3.5s benchmark)."

            # 2. Mobile viewport test
            viewport_meta = soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)})
            has_viewport_meta = bool(viewport_meta and "width=" in (viewport_meta.get("content") or "").lower())
            is_mobile_friendly = has_viewport_meta
            if not has_viewport_meta:
                opportunities.append("unresponsive_mobile")
                evidence["unresponsive_mobile"] = "Missing `<meta name='viewport'>` tag, causing desktop zoom breakage on mobile phones."

            # 3. Contact form detection
            forms = soup.find_all("form")
            has_contact_form = False
            for f in forms:
                inputs = f.find_all(["input", "textarea"])
                if len(inputs) >= 2:
                    has_contact_form = True
                    break

            if not has_contact_form:
                opportunities.append("missing_contact_form")
                evidence["missing_contact_form"] = "No interactive contact/inquiry form detected on the primary page."

            # 4. Call-to-action (CTA) check
            page_text = soup.get_text(separator=" ").lower()
            has_cta = any(cta in page_text for cta in CTA_KEYWORDS)
            if not has_cta:
                opportunities.append("missing_call_to_action")
                evidence["missing_call_to_action"] = "No direct call-to-action buttons (e.g. 'Book Now', 'Order Online', 'Get a Quote') found."

            # 5. SEO & Metadata
            title_tag = soup.find("title")
            title = title_tag.get_text().strip() if title_tag else None
            meta_desc_tag = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
            meta_description = meta_desc_tag.get("content", "").strip() if meta_desc_tag else None

            if not title or len(title) < 5:
                opportunities.append("missing_seo_title")
                evidence["missing_seo_title"] = "Page title tag is missing or shorter than 5 characters."
            if not meta_description:
                opportunities.append("missing_meta_description")
                evidence["missing_meta_description"] = "Meta description tag is missing, harming Google SERP click-through rates."

            # 6. Schema.org / Structured Data
            schema_scripts = soup.find_all("script", attrs={"type": "application/ld+json"})
            has_schema_markup = len(schema_scripts) > 0
            if not has_schema_markup:
                opportunities.append("missing_schema_markup")
                evidence["missing_schema_markup"] = "No Schema.org JSON-LD structured data found for local business rich snippets."
            else:
                technologies.append("Schema.org JSON-LD")

            # 7. Analytics check
            has_google_analytics = "google-analytics.com" in html or "googletagmanager.com" in html or "gtag(" in html
            if has_google_analytics:
                technologies.append("Google Analytics / GTM")

            # 8. Outdated Copyright Year
            current_year = datetime.utcnow().year
            copyright_matches = re.findall(r"(?:©|&copy;|copyright)\s*(?:20\d\d[-–])?\s*(20\d\d)", html, re.I)
            for year_str in copyright_matches:
                try:
                    c_year = int(year_str)
                    if c_year <= (current_year - 3):
                        opportunities.append("outdated_copyright")
                        evidence["outdated_copyright"] = f"Footer copyright displays {c_year}, signaling an unmaintained, stale website."
                        break
                except ValueError:
                    pass

            # 9. Technology signature detection
            for pattern, desc, is_risk in OUTDATED_TECH_SIGNATURES:
                if re.search(pattern, html, re.I):
                    technologies.append(desc)
                    if is_risk:
                        opportunities.append("legacy_technology")
                        evidence["legacy_technology"] = desc

            # 10. Broken internal links sample audit
            broken_links = 0
            links = soup.find_all("a", href=True)
            for a in links[:15]:
                href = a["href"].strip()
                if href.startswith(("#", "javascript:", "mailto:", "tel:")):
                    continue
                if href.startswith("/"):
                    resolved = urllib.parse.urljoin(final_url, href)
                    # Quick head request for first few links
                    try:
                        if is_safe_url(resolved):
                            head_res = self.client.head(resolved, timeout=3.0)
                            if head_res.status_code in [404, 500, 502]:
                                broken_links += 1
                    except Exception:
                        pass

            if broken_links > 0:
                opportunities.append("broken_links_detected")
                evidence["broken_links_detected"] = f"Detected {broken_links} broken internal navigation links (HTTP 404/5xx)."

            return WebsiteAuditResult(
                target_url=clean_url,
                has_website=True,
                is_reachable=is_reachable,
                http_status=http_status,
                redirect_count=redirect_count,
                final_url=final_url,
                load_time_ms=load_time_ms,
                has_ssl=has_ssl,
                is_mobile_friendly=is_mobile_friendly,
                has_contact_form=has_contact_form,
                has_viewport_meta=has_viewport_meta,
                broken_links_count=broken_links,
                title=title,
                meta_description=meta_description,
                has_schema_markup=has_schema_markup,
                has_google_analytics=has_google_analytics,
                technologies_detected=technologies,
                opportunities_identified=opportunities,
                evidence=evidence,
                raw_audit_report={
                    "load_time_ms": load_time_ms,
                    "redirect_count": redirect_count,
                    "technologies": technologies,
                    "broken_links": broken_links
                }
            )

        except Exception as e:
            return WebsiteAuditResult(
                target_url=clean_url,
                has_website=True,
                is_reachable=False,
                http_status=None,
                redirect_count=0,
                final_url=None,
                load_time_ms=None,
                has_ssl=False,
                is_mobile_friendly=False,
                has_contact_form=False,
                has_viewport_meta=False,
                broken_links_count=0,
                title=None,
                meta_description=None,
                has_schema_markup=False,
                has_google_analytics=False,
                technologies_detected=[],
                opportunities_identified=["website_unavailable"],
                evidence={"website_unavailable": f"Connection failed or timed out: {str(e)}"},
                raw_audit_report={"error": str(e)}
            )
        finally:
            self.close()
