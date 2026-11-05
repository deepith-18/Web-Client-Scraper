"""
Intelligent Lead Scoring Engine
Module E: Configurable Opportunity Scoring (0-100)
Calculates lead opportunity tiers while keeping verification confidence separate.
"""
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.score import LeadScore
from backend.app.schemas.score import ScoringWeightsConfig, PresetProfile, ScoreFactorDetail, ScoreBreakdownDetail

PRESET_PROFILES: Dict[str, PresetProfile] = {
    "balanced": PresetProfile(
        id="balanced",
        name="Balanced Freelancer (Default)",
        description="Standard balanced evaluation across all opportunities and feasibility factors.",
        weights=ScoringWeightsConfig(
            no_website=30,
            website_unavailable=25,
            poor_mobile=15,
            missing_contact=10,
            missing_info=5,
            performance_issues=5,
            identity_corroborated=5,
            email_available=5
        )
    ),
    "new_builds": PresetProfile(
        id="new_builds",
        name="Turnkey Website Specialist",
        description="Heavily prioritizes businesses that currently have no website at all for turnkey builds.",
        weights=ScoringWeightsConfig(
            no_website=45,
            website_unavailable=20,
            poor_mobile=10,
            missing_contact=5,
            missing_info=5,
            performance_issues=0,
            identity_corroborated=10,
            email_available=5
        )
    ),
    "redesign_mobile": PresetProfile(
        id="redesign_mobile",
        name="Mobile & UX Redesign Specialist",
        description="Prioritizes businesses with existing active websites that suffer from poor mobile layout, missing forms, and outdated UX.",
        weights=ScoringWeightsConfig(
            no_website=10,
            website_unavailable=20,
            poor_mobile=30,
            missing_contact=20,
            missing_info=5,
            performance_issues=10,
            identity_corroborated=5,
            email_available=0
        )
    ),
    "speed_modernizer": PresetProfile(
        id="speed_modernizer",
        name="Performance & Tech Modernizer",
        description="Focuses on slow-loading websites, outdated legacy scripts, and technical debt.",
        weights=ScoringWeightsConfig(
            no_website=5,
            website_unavailable=25,
            poor_mobile=20,
            missing_contact=10,
            missing_info=5,
            performance_issues=25,
            identity_corroborated=5,
            email_available=5
        )
    )
}

class ScoringEngine:
    """Configurable scoring engine for freelance lead acquisition."""

    @staticmethod
    def get_presets() -> List[PresetProfile]:
        return list(PRESET_PROFILES.values())

    @staticmethod
    def determine_priority_tier(score: int) -> str:
        if score >= 80:
            return "high"
        elif score >= 60:
            return "good"
        elif score >= 40:
            return "medium"
        else:
            return "low"

    @classmethod
    def evaluate_business(
        cls,
        business: Business,
        audit: Optional[WebsiteAudit] = None,
        contacts: Optional[List[BusinessContact]] = None,
        weights: Optional[ScoringWeightsConfig] = None
    ) -> Tuple[int, str, Dict[str, int], List[ScoreFactorDetail], str]:
        """
        Evaluates a business and returns:
        (total_score, priority_tier, component_scores, factors_list, recommended_pitch)
        """
        w = weights or PRESET_PROFILES["balanced"].weights
        factors: List[ScoreFactorDetail] = []
        components = {
            "no_website": 0,
            "website_unavailable": 0,
            "mobile": 0,
            "missing_contact": 0,
            "performance": 0,
            "missing_info": 0,
            "authenticity": 0,
            "email_available": 0,
        }

        # 1. No official website check
        has_website = bool(business.official_website and business.official_website.strip())
        if not has_website:
            components["no_website"] = w.no_website
            factors.append(ScoreFactorDetail(
                factor_name="No Official Website",
                points_awarded=w.no_website,
                max_possible=w.no_website,
                reason="Business operates without an official digital home or custom domain.",
                evidence="No URL registered in public directory."
            ))
        else:
            factors.append(ScoreFactorDetail(
                factor_name="No Official Website",
                points_awarded=0,
                max_possible=w.no_website,
                reason="Business has registered an official web address.",
                evidence=business.official_website
            ))

        # 2. Website Reachability / Availability Check
        if has_website:
            if audit:
                if not audit.is_reachable or (audit.http_status and audit.http_status >= 400):
                    components["website_unavailable"] = w.website_unavailable
                    factors.append(ScoreFactorDetail(
                        factor_name="Website Unavailable",
                        points_awarded=w.website_unavailable,
                        max_possible=w.website_unavailable,
                        reason=f"Existing website returned HTTP error or timed out (status {audit.http_status or 'unreachable'}).",
                        evidence=f"HTTP status code: {audit.http_status}"
                    ))
                else:
                    factors.append(ScoreFactorDetail(
                        factor_name="Website Unavailable",
                        points_awarded=0,
                        max_possible=w.website_unavailable,
                        reason="Website is currently live and reachable.",
                        evidence=f"HTTP status: {audit.http_status}"
                    ))
            else:
                # Website registered but not yet audited
                factors.append(ScoreFactorDetail(
                    factor_name="Website Unavailable",
                    points_awarded=0,
                    max_possible=w.website_unavailable,
                    reason="Website registered; full audit pending.",
                    evidence=business.official_website
                ))

        # 3. Mobile Responsiveness Check
        if has_website and audit and audit.is_reachable:
            if not audit.is_mobile_friendly:
                components["mobile"] = w.poor_mobile
                factors.append(ScoreFactorDetail(
                    factor_name="Poor Mobile Experience",
                    points_awarded=w.poor_mobile,
                    max_possible=w.poor_mobile,
                    reason="No responsive viewport meta tag detected; site breaks on smartphones.",
                    evidence="Missing <meta name='viewport'> declaration."
                ))
            else:
                factors.append(ScoreFactorDetail(
                    factor_name="Poor Mobile Experience",
                    points_awarded=0,
                    max_possible=w.poor_mobile,
                    reason="Responsive mobile viewport tag detected.",
                    evidence="Valid viewport meta tag detected."
                ))

        # 4. Missing Contact Functionality Check
        if has_website and audit and audit.is_reachable:
            if not audit.has_contact_form:
                components["missing_contact"] = w.missing_contact
                factors.append(ScoreFactorDetail(
                    factor_name="Missing Contact Functionality",
                    points_awarded=w.missing_contact,
                    max_possible=w.missing_contact,
                    reason="No interactive web form or booking mechanism discovered on site.",
                    evidence="No <form> element with email or phone inputs detected."
                ))
            else:
                factors.append(ScoreFactorDetail(
                    factor_name="Missing Contact Functionality",
                    points_awarded=0,
                    max_possible=w.missing_contact,
                    reason="Interactive contact or lead form detected.",
                    evidence="Web contact form present."
                ))

        # 5. Website Performance Check
        if has_website and audit and audit.is_reachable:
            load_time = audit.load_time_ms or 0
            has_perf_issues = load_time > 3000 or any("performance" in opp.lower() or "slow" in opp.lower() for opp in (audit.opportunities_identified or []))
            if has_perf_issues:
                components["performance"] = w.performance_issues
                factors.append(ScoreFactorDetail(
                    factor_name="Website Performance Issues",
                    points_awarded=w.performance_issues,
                    max_possible=w.performance_issues,
                    reason=f"Page latency ({load_time}ms) exceeds recommended 3-second ceiling.",
                    evidence=f"TTFB / Load Time: {load_time}ms"
                ))
            else:
                factors.append(ScoreFactorDetail(
                    factor_name="Website Performance Issues",
                    points_awarded=0,
                    max_possible=w.performance_issues,
                    reason="Website initial load time within acceptable thresholds.",
                    evidence=f"Load Time: {load_time}ms"
                ))

        # 6. Missing Business Information Check
        missing_fields = []
        if not business.description or len(business.description.strip()) < 20:
            missing_fields.append("detailed description")
        if not business.postal_code:
            missing_fields.append("PIN / postal code")
        if not business.address_line1:
            missing_fields.append("street address")

        if missing_fields:
            components["missing_info"] = w.missing_info
            factors.append(ScoreFactorDetail(
                factor_name="Missing Business Information",
                points_awarded=w.missing_info,
                max_possible=w.missing_info,
                reason=f"Business profile lacks essential details: {', '.join(missing_fields)}.",
                evidence=f"Unspecified: {', '.join(missing_fields)}"
            ))
        else:
            factors.append(ScoreFactorDetail(
                factor_name="Missing Business Information",
                points_awarded=0,
                max_possible=w.missing_info,
                reason="Business profile is comprehensively populated.",
                evidence="Complete address and description present."
            ))

        # 7. Business Identity Corroborated Check
        # Points awarded for legitimate physical existence (making outreach worthwhile)
        is_corroborated = bool(business.latitude and business.longitude) or bool(business.source_id) or bool(business.source_url)
        if is_corroborated:
            components["authenticity"] = w.identity_corroborated
            factors.append(ScoreFactorDetail(
                factor_name="Business Identity Corroborated",
                points_awarded=w.identity_corroborated,
                max_possible=w.identity_corroborated,
                reason="Physical location and directory presence corroborated across authorized sources.",
                evidence=f"Source: {business.source_url or 'OpenStreetMap Directory'}"
            ))
        else:
            factors.append(ScoreFactorDetail(
                factor_name="Business Identity Corroborated",
                points_awarded=0,
                max_possible=w.identity_corroborated,
                reason="Business identity could not be corroborated with verified geo-coordinates.",
                evidence="No verified coordinates found."
            ))

        # 8. Public Business Email Available Check
        # Direct email makes freelancer outreach viable and actionable
        has_email = False
        email_addr = None
        if contacts:
            for c in contacts:
                if c.contact_type == "email":
                    has_email = True
                    email_addr = c.normalized_value or c.raw_value
                    break

        if has_email:
            components["email_available"] = w.email_available
            factors.append(ScoreFactorDetail(
                factor_name="Public Business Email Available",
                points_awarded=w.email_available,
                max_possible=w.email_available,
                reason="Direct public business email available for personalized freelance outreach.",
                evidence=f"Email: {email_addr}"
            ))
        else:
            factors.append(ScoreFactorDetail(
                factor_name="Public Business Email Available",
                points_awarded=0,
                max_possible=w.email_available,
                reason="No verified public email yet discovered for this business.",
                evidence="Scan contacts or website to discover email."
            ))

        # Total Calculation
        total_score = sum(components.values())
        total_score = min(100, max(0, total_score))
        priority_tier = cls.determine_priority_tier(total_score)

        # Recommended Pitch Angle
        if not has_website:
            pitch = f"Pitch a turnkey, professional high-converting landing page with local Google Maps SEO tailored for {business.category} in {business.city}."
        elif components["website_unavailable"] > 0:
            pitch = f"Urgent recovery pitch: Address the offline server / HTTP errors on {business.normalized_domain or 'their website'} and migrate to high-reliability hosting."
        elif components["mobile"] > 0 and components["missing_contact"] > 0:
            pitch = "Mobile modernization pitch: Rebuild their site with a responsive, smartphone-optimized interface and instant appointment/lead capture form."
        elif components["mobile"] > 0:
            pitch = "Mobile responsiveness overhaul: Prevent 50%+ mobile bounce rates with a responsive Tailwind/Next.js layout."
        elif components["performance"] > 0:
            pitch = "Speed & Core Web Vitals optimization: Modernize legacy assets to increase conversion rates and Google search rank."
        else:
            pitch = f"Value-add expansion pitch: Propose SEO enhancement, portfolio showcase, or custom booking workflows for their {business.category} practice."

        return total_score, priority_tier, components, factors, pitch

    @classmethod
    def score_business(
        cls,
        db: Session,
        business_id: str,
        weights: Optional[ScoringWeightsConfig] = None
    ) -> LeadScore:
        """
        Calculates and persists or updates the LeadScore record for a business.
        """
        biz = db.query(Business).filter(Business.id == business_id).first()
        if not biz:
            raise ValueError(f"Business {business_id} not found")

        # Fetch latest audit if available
        audit = db.query(WebsiteAudit).filter(WebsiteAudit.business_id == business_id).order_by(WebsiteAudit.audited_at.desc()).first()
        contacts = db.query(BusinessContact).filter(BusinessContact.business_id == business_id).all()

        total_score, priority_tier, components, factors, pitch = cls.evaluate_business(
            business=biz,
            audit=audit,
            contacts=contacts,
            weights=weights
        )

        # Check for existing lead score
        lead_score = db.query(LeadScore).filter(LeadScore.business_id == business_id).first()
        if not lead_score:
            lead_score = LeadScore(
                business_id=business_id,
                total_opportunity_score=total_score,
                priority_tier=priority_tier,
                no_website_score=components["no_website"],
                website_unavailable_score=components["website_unavailable"],
                mobile_score=components["mobile"],
                missing_contact_score=components["missing_contact"],
                performance_score=components["performance"],
                missing_info_score=components["missing_info"],
                authenticity_score=components["authenticity"],
                email_available_score=components["email_available"],
                score_breakdown={
                    "factors": [f.model_dump() for f in factors],
                    "recommended_pitch": pitch,
                    "weights_applied": (weights or PRESET_PROFILES["balanced"].weights).model_dump()
                },
                calculated_at=datetime.utcnow()
            )
            db.add(lead_score)
        else:
            lead_score.total_opportunity_score = total_score
            lead_score.priority_tier = priority_tier
            lead_score.no_website_score = components["no_website"]
            lead_score.website_unavailable_score = components["website_unavailable"]
            lead_score.mobile_score = components["mobile"]
            lead_score.missing_contact_score = components["missing_contact"]
            lead_score.performance_score = components["performance"]
            lead_score.missing_info_score = components["missing_info"]
            lead_score.authenticity_score = components["authenticity"]
            lead_score.email_available_score = components["email_available"]
            lead_score.score_breakdown = {
                "factors": [f.model_dump() for f in factors],
                "recommended_pitch": pitch,
                "weights_applied": (weights or PRESET_PROFILES["balanced"].weights).model_dump()
            }
            lead_score.calculated_at = datetime.utcnow()

        db.commit()
        db.refresh(lead_score)
        return lead_score

    @classmethod
    def bulk_recalculate(
        cls,
        db: Session,
        category: Optional[str] = None,
        city: Optional[str] = None,
        weights: Optional[ScoringWeightsConfig] = None
    ) -> Dict[str, Any]:
        """
        Recalculates scores across all or filtered businesses.
        """
        query = db.query(Business)
        if category:
            query = query.filter(Business.category == category)
        if city:
            query = query.filter(Business.city.ilike(f"%{city}%"))

        businesses = query.all()
        recalculated_count = 0
        tier_counts = {"high": 0, "good": 0, "medium": 0, "low": 0}

        for biz in businesses:
            score_record = cls.score_business(db, biz.id, weights)
            recalculated_count += 1
            tier = score_record.priority_tier
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        return {
            "total_recalculated": recalculated_count,
            "tier_distribution": tier_counts,
            "weights_applied": (weights or PRESET_PROFILES["balanced"].weights).model_dump(),
            "timestamp": datetime.utcnow().isoformat()
        }
