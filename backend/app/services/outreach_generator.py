"""
Outreach Generator & Template Studio Service
Module G: Personalized Pitch Generation with Dynamic Sequences and Required Manual Approval.
Produces professional, tailored B2B pitches based on verified audit data.
Free of hype, emojis, or automated transmission.
"""
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.contact import BusinessContact
from backend.app.models.crm import OutreachRecord, OutreachTemplate

DEFAULT_TEMPLATES = [
    {
        "name": "Turnkey Web Build - Initial Touch",
        "channel": "email",
        "stage_step": 1,
        "delay_days": 0,
        "is_default": True,
        "subject_template": "Web presence proposal for {{business_name}} in {{city}}",
        "body_template": """Dear {{business_name}} Team,

I recently came across {{business_name}} while researching top {{category}} businesses in {{city}}.

I noticed that {{business_name}} currently does not have an official website or dedicated domain. Today, prospective clients routinely search Google and local maps before selecting a {{category}}, and businesses without an official web presence frequently lose potential customers to local competitors.

I specialize in designing modern, high-converting websites for {{category}} businesses. I would welcome the opportunity to build a clean, mobile-responsive website for {{business_name}} that highlights your services, showcases customer reviews, and provides direct booking and inquiry capabilities.

Would you be open to a brief 10-minute conversation this week to discuss how an official website could help expand your client base in {{city}}?

Best regards,
{{freelancer_name}}
Portfolio: {{freelancer_portfolio}}

---
Compliance & Opt-out Notice:
This commercial communication was sent to the publicly listed contact address for {{business_name}}. If you do not wish to receive future communications regarding web development services, reply with 'UNSUBSCRIBE' to be added to our global suppression registry."""
    },
    {
        "name": "Website Audit & Redesign - Initial Touch",
        "channel": "email",
        "stage_step": 1,
        "delay_days": 0,
        "is_default": True,
        "subject_template": "Website performance and modernization review for {{business_name}}",
        "body_template": """Dear {{business_name}} Team,

I hope this email finds you well. I am a web developer working with established {{category}} businesses in {{city}}.

While evaluating local online presences, I reviewed your website ({{official_website}}) and identified several concrete technical improvements that could significantly enhance client trust and conversion rates:

{{deficiencies_list}}

Addressing these items will provide a faster, more secure experience for your customers and boost your visibility in search engine rankings.

I would be glad to share a complimentary 5-minute technical audit breakdown or discuss how we can implement these updates with zero downtime.

Are you available for a brief introductory call sometime this week?

Best regards,
{{freelancer_name}}
Portfolio: {{freelancer_portfolio}}

---
Compliance & Opt-out Notice:
This commercial inquiry was directed to the public contact listing for {{business_name}}. To opt out of future communications, simply reply with 'UNSUBSCRIBE'."""
    },
    {
        "name": "Audit Evidence Follow-Up (Day 4)",
        "channel": "email",
        "stage_step": 2,
        "delay_days": 4,
        "is_default": True,
        "subject_template": "Quick follow-up regarding {{business_name}}'s website review",
        "body_template": """Hi {{business_name}} Team,

Following up on my earlier note regarding {{business_name}}'s digital presence in {{city}}.

I put together a quick wireframe demonstration showcasing how a modern redesign of {{official_website}} would look on mobile devices, with streamlined inquiry forms and sub-second load times.

{{pitch_angle}}

I would be happy to share this wireframe preview with you. Would Thursday or Friday afternoon work for a 5-minute review?

Best regards,
{{freelancer_name}}
Portfolio: {{freelancer_portfolio}}

---
Compliance & Opt-out Notice:
To unsubscribe from further communications, reply with 'UNSUBSCRIBE'."""
    },
    {
        "name": "Polite Final Check-in (Day 8)",
        "channel": "email",
        "stage_step": 3,
        "delay_days": 8,
        "is_default": True,
        "subject_template": "Final check-in: Website modernization for {{business_name}}",
        "body_template": """Hi {{business_name}} Team,

I understand you are busy running daily operations at {{business_name}} in {{city}}, so I will keep this note brief.

If redesigning or establishing your official website is not a priority for {{business_name}} this quarter, no problem at all. Should you ever decide to enhance your digital presence or address {{deficiencies_list_short}}, feel free to reach out.

I wish you and {{business_name}} continued success.

Best regards,
{{freelancer_name}}
Portfolio: {{freelancer_portfolio}}

---
Compliance & Opt-out Notice:
You will not receive further outreach regarding this matter. Reply 'UNSUBSCRIBE' to permanently blacklist this email address."""
    },
    {
        "name": "LinkedIn / Direct Messaging Pitch",
        "channel": "linkedin",
        "stage_step": 1,
        "delay_days": 0,
        "is_default": True,
        "subject_template": "{{business_name}} web presence opportunity",
        "body_template": """Hi Team {{business_name}}, noticed your work in {{city}}! I analyzed {{official_website}} and spotted a few quick opportunities to improve mobile responsiveness and client conversions: {{deficiencies_list_short}}. Would love to share a complimentary 1-page breakdown if you are interested! Best, {{freelancer_name}}."""
    }
]

class OutreachGenerator:
    """Generates specific, value-oriented freelance web proposals."""

    @staticmethod
    def get_template_variables(
        business: Business,
        audit: Optional[WebsiteAudit] = None,
        freelancer_name: str = "Deepith",
        freelancer_portfolio: str = "https://portfolio.dev"
    ) -> Dict[str, str]:
        """Builds dictionary of replacement tags for outreach templates."""
        has_website = bool(business.official_website and business.official_website.strip())
        biz_name = business.name or "Business"
        city = business.city or "your area"
        category = (business.category or "business").lower()
        website_url = business.official_website or "No official website listed"

        audit_points = []
        short_points = []
        if not has_website:
            audit_points.append("- Missing Online Presence: No official website or domain found, causing loss of local search traffic.")
            short_points.append("missing official website")
            pitch_angle = "A dedicated turnkey website will immediately capture local search traffic in your category."
        else:
            if audit:
                if not audit.has_ssl:
                    audit_points.append("- Insecure Connection: Plain HTTP without active SSL certificate triggers browser security warnings.")
                    short_points.append("insecure SSL certificate")
                if not audit.is_mobile_friendly:
                    audit_points.append("- Mobile Viewport: Lacks responsive mobile scaling, causing awkward layout disruption on mobile devices.")
                    short_points.append("unresponsive mobile layout")
                if not audit.has_contact_form:
                    audit_points.append("- Lead Capture: No dedicated inquiry or contact form on landing pages.")
                    short_points.append("missing contact form")
                if (audit.load_time_ms or 0) > 3000:
                    audit_points.append(f"- High Latency: Page load latency is {audit.load_time_ms}ms, leading to visitor drop-off.")
                    short_points.append("slow load latency")

            if not audit_points:
                audit_points.append("- Modernization: Opportunity to refresh brand styling, optimize assets, and boost conversions.")
                short_points.append("modernization & performance optimization")
                pitch_angle = "Modernizing site typography, performance, and SEO will elevate conversion rates."
            else:
                pitch_angle = f"Resolving {', '.join(short_points[:2])} will provide an instant lift in client trust and inquiries."

        deficiencies_list = "\n".join(audit_points)
        deficiencies_list_short = ", ".join(short_points) if short_points else "site performance and UX"

        return {
            "business_name": biz_name,
            "city": city,
            "category": category,
            "official_website": website_url,
            "deficiencies_list": deficiencies_list,
            "deficiencies_list_short": deficiencies_list_short,
            "pitch_angle": pitch_angle,
            "freelancer_name": freelancer_name,
            "freelancer_portfolio": freelancer_portfolio,
        }

    @staticmethod
    def render_template(
        template_subject: str,
        template_body: str,
        variables: Dict[str, str]
    ) -> Tuple[str, str, List[str]]:
        """Substitutes dynamic {{tokens}} in subject and body templates."""
        rendered_subject = template_subject
        rendered_body = template_body
        substituted = []

        for key, val in variables.items():
            token = f"{{{{{key}}}}}"
            if token in rendered_subject:
                rendered_subject = rendered_subject.replace(token, str(val))
                if key not in substituted:
                    substituted.append(key)
            if token in rendered_body:
                rendered_body = rendered_body.replace(token, str(val))
                if key not in substituted:
                    substituted.append(key)

        return rendered_subject, rendered_body, substituted

    @classmethod
    def generate_pitch(
        cls,
        business: Business,
        audit: Optional[WebsiteAudit] = None,
        recipient_email: Optional[str] = None,
        template: Optional[OutreachTemplate] = None,
        freelancer_name: str = "Deepith",
        freelancer_portfolio: str = "https://portfolio.dev"
    ) -> Dict[str, Any]:
        """Creates structured pitch either from template or smart default."""
        variables = cls.get_template_variables(
            business=business,
            audit=audit,
            freelancer_name=freelancer_name,
            freelancer_portfolio=freelancer_portfolio
        )

        has_website = bool(business.official_website and business.official_website.strip())

        if template:
            sub, body, tokens = cls.render_template(
                template.subject_template,
                template.body_template,
                variables
            )
            return {
                "subject": sub,
                "body": body,
                "channel": template.channel,
                "stage_step": template.stage_step,
                "tokens_substituted": tokens
            }

        # Fallback to default Turnkey or Redesign templates
        chosen_template = DEFAULT_TEMPLATES[0] if not has_website else DEFAULT_TEMPLATES[1]
        sub, body, tokens = cls.render_template(
            chosen_template["subject_template"],
            chosen_template["body_template"],
            variables
        )
        return {
            "subject": sub,
            "body": body,
            "channel": chosen_template["channel"],
            "stage_step": chosen_template["stage_step"],
            "tokens_substituted": tokens
        }

    @staticmethod
    def ensure_default_templates(db: Session) -> List[OutreachTemplate]:
        """Seeds default outreach templates into database if not present."""
        existing = db.query(OutreachTemplate).all()
        if existing:
            return existing

        created_templates = []
        for t_data in DEFAULT_TEMPLATES:
            tpl = OutreachTemplate(
                name=t_data["name"],
                channel=t_data["channel"],
                stage_step=t_data["stage_step"],
                delay_days=t_data["delay_days"],
                is_default=t_data["is_default"],
                subject_template=t_data["subject_template"],
                body_template=t_data["body_template"]
            )
            db.add(tpl)
            created_templates.append(tpl)
        db.commit()
        for tpl in created_templates:
            db.refresh(tpl)
        return created_templates
