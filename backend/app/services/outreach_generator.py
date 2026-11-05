"""
Outreach Generator Service
Module G: Personalized Pitch Generation with Required Manual Approval.
Produces professional, tailored B2B pitches based on verified audit data.
Free of hype, emojis, or automated transmission.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.crm import OutreachRecord

class OutreachGenerator:
    """Generates specific, value-oriented freelance web proposals."""

    @staticmethod
    def generate_pitch(business: Business, audit: Optional[WebsiteAudit] = None, recipient_email: Optional[str] = None) -> Dict[str, str]:
        """
        Creates a structured, personalized pitch tailored to the technical findings.
        """
        has_website = bool(business.official_website and business.official_website.strip())
        biz_name = business.name
        city = business.city
        category = business.category

        # Identify concrete deficiencies
        deficiencies = []
        if not has_website:
            subject = f"Website development proposal for {biz_name} in {city}"
            pitch_body = f"""Dear {biz_name} Team,

I recently came across {biz_name} while researching top {category.lower()} businesses in {city}.

I noticed that {biz_name} currently does not have an official website or dedicated domain. Today, the majority of prospective clients search Google and local directories before choosing a {category.lower()}, and businesses without a direct web presence frequently lose potential customers to local competitors.

I specialize in designing modern, high-converting websites for {category.lower()} businesses. I would welcome the opportunity to build a clean, mobile-responsive website for {biz_name} that highlights your services, showcases customer reviews, and provides direct booking and inquiry capabilities.

Would you be open to a brief 10-minute conversation this week to discuss how an official website could help expand your client base in {city}?

Best regards,
Freelance Web Developer
ProspectIQ Outreach Platform

---
Compliance & Opt-out Notice:
This commercial communication was sent to the publicly listed contact address for {biz_name}. If you do not wish to receive future communications regarding web development services, reply with 'UNSUBSCRIBE' or request inclusion on our suppression list.
"""
            return {"subject": subject, "body": pitch_body}

        # Website exists: tailor to concrete audit findings
        audit_points = []
        if audit:
            if not audit.has_ssl:
                audit_points.append("Security Warning: Your website is currently served over insecure HTTP without active SSL encryption, triggering 'Not Secure' browser warnings to prospective visitors.")
            if not audit.is_mobile_friendly:
                audit_points.append("Mobile Usability: Your website lacks a responsive mobile viewport, causing layout disruption and difficult navigation on smartphones.")
            if not audit.has_contact_form:
                audit_points.append("Inquiry Capture: There is no direct contact or inquiry form on your site, adding friction for visitors seeking immediate quotes.")
            if (audit.load_time_ms or 0) > 3000:
                audit_points.append(f"Load Latency: The initial page response time is approximately {audit.load_time_ms}ms, which exceeds Google's Core Web Vitals recommendation and increases bounce rates.")

        if not audit_points:
            audit_points.append("Modernization & SEO: Potential to expand your digital portfolio, enhance local search rankings, and increase conversion rates.")

        points_text = "\n".join(f"- {pt}" for pt in audit_points)
        subject = f"Website modernization and performance improvements for {biz_name}"

        pitch_body = f"""Dear {biz_name} Team,

I hope this email finds you well. I am a freelance web developer working with {category.lower()} businesses in {city}.

While reviewing your website ({business.official_website}), I identified several technical opportunities that could significantly improve your user experience and conversion rate:

{points_text}

Addressing these items will provide a faster, more secure experience for your clients and improve your visibility on search engines.

I would be happy to share a brief, complimentary technical breakdown or discuss how we can implement these updates with zero disruption to your current operations.

Are you available for a brief conversation sometime this week?

Best regards,
Freelance Web Developer
ProspectIQ Outreach Platform

---
Compliance & Opt-out Notice:
This commercial inquiry was directed to the public contact listing for {biz_name} ({business.normalized_domain or business.official_website}). To opt out of further communications, reply with 'UNSUBSCRIBE'.
"""
        return {"subject": subject, "body": pitch_body}

