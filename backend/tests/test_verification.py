from unittest.mock import MagicMock, patch
from bs4 import BeautifulSoup
from backend.app.services.verification_service import VerificationService
from backend.app.services.contact_extractor import ContactExtractor, ExtractedContacts
from backend.app.core.database import SessionLocal
from backend.app.models.business import Business
from backend.app.models.contact import BusinessContact

def test_verify_email_syntax():
    assert VerificationService.verify_email_syntax("contact@company.com") is True
    assert VerificationService.verify_email_syntax("hello.world+tag@sub.domain.co.in") is True
    assert VerificationService.verify_email_syntax("invalid-email") is False
    assert VerificationService.verify_email_syntax("user@") is False
    assert VerificationService.verify_email_syntax("@domain.com") is False
    assert VerificationService.verify_email_syntax("") is False

def test_verify_email_disposable():
    res = VerificationService.verify_email("temporary.user@mailinator.com")
    assert res.is_disposable is True
    assert res.verification_status == "disposable"

@patch("dns.resolver.Resolver.resolve")
def test_verify_email_mx_success(mock_resolve):
    mock_mx = MagicMock()
    mock_mx.exchange = "aspmx.l.google.com."
    mock_resolve.return_value = [mock_mx]

    res = VerificationService.verify_email("founder@mytechfirm.com")
    assert res.is_valid_syntax is True
    assert res.has_mx_records is True
    assert res.verification_status == "mx_confirmed"
    assert "aspmx.l.google.com" in res.mx_hosts

def test_verify_phone_formats():
    # 1. Indian Mobile Number
    res_in = VerificationService.verify_phone("+91 98450 11223", "IN")
    assert res_in.is_valid_format is True
    assert res_in.e164_format == "+919845011223"
    assert res_in.country_code == "IN"
    assert res_in.carrier_type in ["MOBILE", "FIXED_LINE_OR_MOBILE"]

    # 2. US Landline/Mobile
    res_us = VerificationService.verify_phone("(512) 555-0198", "US")
    assert res_us.is_valid_format is True
    assert res_us.e164_format == "+15125550198"
    assert res_us.country_code == "US"

    # 3. UK Landline
    res_uk = VerificationService.verify_phone("020 7946 0912", "GB")
    assert res_uk.is_valid_format is True
    assert res_uk.e164_format == "+442079460912"
    assert res_uk.country_code == "GB"

    # 4. Invalid length number
    res_bad = VerificationService.verify_phone("12345", "IN")
    assert res_bad.is_valid_format is False
    assert res_bad.verification_status == "invalid"

@patch("backend.app.services.contact_extractor.is_safe_url", return_value=True)
def test_contact_extractor_html_parsing(mock_safe):
    html_content = """
    <html>
      <head><title>Apex Gym</title></head>
      <body>
        <p>Welcome to Apex Gym. Reach out to info@apexstrength.com or call +1 512 555 0198.</p>
        <a href="mailto:support@apexstrength.com">Email Us</a>
        <a href="tel:+15125550198">Call Desk</a>
        <a href="/contact-us">Contact Page</a>
        <a href="https://linkedin.com/company/apex-strength">LinkedIn</a>
        <a href="https://instagram.com/apexstrength">Instagram</a>
        <img src="banner@2x.png" alt="logo" />
      </body>
    </html>
    """
    soup = BeautifulSoup(html_content, "html.parser")
    extractor = ContactExtractor()
    results = ExtractedContacts()

    extractor._parse_page_content(soup, "https://apexstrength.example.com", results)

    # Verify emails extracted and logo@2x.png filtered
    assert "support@apexstrength.com" in results.emails
    assert "info@apexstrength.com" in results.emails
    assert not any(e.endswith(".png") for e in results.emails)

    # Verify phones
    assert len(results.phones) > 0

    # Verify social profiles
    assert "linkedin" in results.social_links
    assert "instagram" in results.social_links

    # Verify contact page detection
    contact_url = extractor._find_contact_page_url(soup, "https://apexstrength.example.com")
    assert contact_url == "https://apexstrength.example.com/contact-us"
