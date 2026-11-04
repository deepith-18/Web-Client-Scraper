import re
import socket
import ssl
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
import dns.resolver
import phonenumbers
from phonenumbers import PhoneNumberType
from backend.app.core.security import is_safe_url, is_safe_ip

DISPOSABLE_EMAIL_DOMAINS = {
    "mailinator.com", "10minutemail.com", "tempmail.com", "guerrillamail.com",
    "trashmail.com", "sharklasers.com", "yopmail.com", "getairmail.com"
}

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

class EmailVerificationResult:
    def __init__(
        self,
        email: str,
        is_valid_syntax: bool,
        is_disposable: bool,
        domain_exists: bool,
        has_mx_records: bool,
        mx_hosts: List[str],
        verification_status: str,
        details: str
    ):
        self.email = email
        self.is_valid_syntax = is_valid_syntax
        self.is_disposable = is_disposable
        self.domain_exists = domain_exists
        self.has_mx_records = has_mx_records
        self.mx_hosts = mx_hosts
        self.verification_status = verification_status
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "email": self.email,
            "is_valid_syntax": self.is_valid_syntax,
            "is_disposable": self.is_disposable,
            "domain_exists": self.domain_exists,
            "has_mx_records": self.has_mx_records,
            "mx_hosts": self.mx_hosts,
            "verification_status": self.verification_status,
            "details": self.details
        }

class PhoneVerificationResult:
    def __init__(
        self,
        raw_phone: str,
        is_valid_format: bool,
        e164_format: Optional[str],
        country_code: Optional[str],
        national_number: Optional[str],
        carrier_type: str,
        verification_status: str,
        details: str
    ):
        self.raw_phone = raw_phone
        self.is_valid_format = is_valid_format
        self.e164_format = e164_format
        self.country_code = country_code
        self.national_number = national_number
        self.carrier_type = carrier_type
        self.verification_status = verification_status
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_phone": self.raw_phone,
            "is_valid_format": self.is_valid_format,
            "e164_format": self.e164_format,
            "country_code": self.country_code,
            "national_number": self.national_number,
            "carrier_type": self.carrier_type,
            "verification_status": self.verification_status,
            "details": self.details
        }

class VerificationService:
    @staticmethod
    def verify_email_syntax(email: str) -> bool:
        if not email or len(email) > 254:
            return False
        return bool(EMAIL_REGEX.match(email.strip()))

    @classmethod
    def verify_email(cls, email: str) -> EmailVerificationResult:
        """
        Multi-tier email verification:
        1. Syntax validation (RFC 5322)
        2. Disposable domain check
        3. DNS domain lookup
        4. MX record lookup
        """
        clean_email = (email or "").strip().lower()
        if not cls.verify_email_syntax(clean_email):
            return EmailVerificationResult(
                email=clean_email,
                is_valid_syntax=False,
                is_disposable=False,
                domain_exists=False,
                has_mx_records=False,
                mx_hosts=[],
                verification_status="invalid",
                details="Failed RFC 5322 syntax regex validation."
            )

        domain = clean_email.split("@")[1]
        
        # Check disposable list
        if domain in DISPOSABLE_EMAIL_DOMAINS:
            return EmailVerificationResult(
                email=clean_email,
                is_valid_syntax=True,
                is_disposable=True,
                domain_exists=True,
                has_mx_records=False,
                mx_hosts=[],
                verification_status="disposable",
                details="Disposable / temporary email domain detected."
            )

        # Check DNS & MX records via dnspython
        mx_hosts = []
        has_mx = False
        domain_exists = False

        try:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 4.0
            resolver.lifetime = 4.0

            # 1. MX check
            try:
                answers = resolver.resolve(domain, "MX")
                for rdata in answers:
                    mx_hosts.append(str(rdata.exchange).rstrip("."))
                if mx_hosts:
                    has_mx = True
                    domain_exists = True
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                # Fallback to A record
                try:
                    a_answers = resolver.resolve(domain, "A")
                    if a_answers:
                        domain_exists = True
                except Exception:
                    domain_exists = False
            except Exception:
                pass

        except Exception as e:
            # In restricted/offline environments, fallback gracefully
            pass

        if has_mx:
            status = "mx_confirmed"
            details = f"Verified active mail exchange servers: {', '.join(mx_hosts[:3])}"
        elif domain_exists:
            status = "valid_syntax"
            details = "Domain exists but no dedicated MX record returned. Domain A-record active."
        else:
            status = "valid_syntax"
            details = "Syntax valid. DNS lookup timed out or unverified in current sandbox."

        return EmailVerificationResult(
            email=clean_email,
            is_valid_syntax=True,
            is_disposable=False,
            domain_exists=domain_exists,
            has_mx_records=has_mx,
            mx_hosts=mx_hosts,
            verification_status=status,
            details=details
        )

    @staticmethod
    def verify_phone(phone_str: str, default_country: str = "IN") -> PhoneVerificationResult:
        """
        Validates telephone numbers using Google's libphonenumber:
        - International E.164 formatting
        - Country code and national number parsing
        - Carrier line type detection (Mobile, Fixed Line, Toll Free)
        """
        raw = (phone_str or "").strip()
        if not raw:
            return PhoneVerificationResult(
                raw_phone=raw,
                is_valid_format=False,
                e164_format=None,
                country_code=None,
                national_number=None,
                carrier_type="UNKNOWN",
                verification_status="invalid",
                details="Empty telephone number provided."
            )

        try:
            # Map country name or ISO to 2-letter code if needed
            country_iso = "IN"
            if default_country.upper() in ["UNITED STATES", "USA", "US"]:
                country_iso = "US"
            elif default_country.upper() in ["UNITED KINGDOM", "UK", "GB"]:
                country_iso = "GB"
            elif default_country.upper() in ["AUSTRALIA", "AU"]:
                country_iso = "AU"
            elif len(default_country) == 2:
                country_iso = default_country.upper()

            parsed = phonenumbers.parse(raw, country_iso)
            is_valid = phonenumbers.is_valid_number(parsed)
            e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            national = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
            region = phonenumbers.region_code_for_number(parsed)

            type_code = phonenumbers.number_type(parsed)
            type_map = {
                PhoneNumberType.FIXED_LINE: "FIXED_LINE",
                PhoneNumberType.MOBILE: "MOBILE",
                PhoneNumberType.FIXED_LINE_OR_MOBILE: "FIXED_LINE_OR_MOBILE",
                PhoneNumberType.TOLL_FREE: "TOLL_FREE",
                PhoneNumberType.VOIP: "VOIP",
            }
            carrier_type = type_map.get(type_code, "UNKNOWN")

            if is_valid:
                status = "valid_syntax"
                details = f"E.164 verified format ({region}, {carrier_type})."
            else:
                status = "invalid"
                details = "Could be parsed but does not strictly match national numbering plan."

            return PhoneVerificationResult(
                raw_phone=raw,
                is_valid_format=is_valid,
                e164_format=e164,
                country_code=region,
                national_number=national,
                carrier_type=carrier_type,
                verification_status=status,
                details=details
            )

        except phonenumbers.NumberParseException as e:
            return PhoneVerificationResult(
                raw_phone=raw,
                is_valid_format=False,
                e164_format=None,
                country_code=None,
                national_number=None,
                carrier_type="UNKNOWN",
                verification_status="invalid",
                details=f"Number parse failure: {str(e)}"
            )

    @staticmethod
    def verify_ssl_certificate(hostname: str, port: int = 443) -> Dict[str, Any]:
        """
        Inspects SSL/TLS certificate validity, expiry, and issuer.
        """
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=5.0) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    not_after_str = cert.get("notAfter")
                    not_after = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z")
                    days_remaining = (not_after - datetime.utcnow()).days

                    issuer_dict = dict(x[0] for x in cert.get("issuer", []))
                    issuer_org = issuer_dict.get("organizationName") or issuer_dict.get("commonName") or "Unknown"

                    return {
                        "is_valid": days_remaining > 0,
                        "days_remaining": days_remaining,
                        "issuer": issuer_org,
                        "expires_at": not_after.isoformat()
                    }
        except Exception as e:
            return {
                "is_valid": False,
                "days_remaining": None,
                "issuer": None,
                "error": str(e)
            }
