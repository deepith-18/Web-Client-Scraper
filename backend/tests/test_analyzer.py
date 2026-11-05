from unittest.mock import MagicMock, patch
from backend.app.services.website_analyzer import WebsiteAnalyzer
from backend.app.core.database import SessionLocal
from backend.app.models.business import Business
from backend.app.models.audit import WebsiteAudit
from backend.app.models.score import LeadScore

def test_audit_no_website():
    analyzer = WebsiteAnalyzer()
    res = analyzer.audit_url("")
    assert res.has_website is False
    assert res.is_reachable is False
    assert "no_website" in res.opportunities_identified
    assert "no_website" in res.evidence

def test_audit_ssrf_blocked():
    analyzer = WebsiteAnalyzer()
    res = analyzer.audit_url("http://169.254.169.254/latest/meta-data/")
    assert res.has_website is True
    assert res.is_reachable is False
    assert "ssrf_blocked_destination" in res.opportunities_identified

@patch("backend.app.services.website_analyzer.is_safe_url", return_value=True)
def test_audit_html_diagnostics_and_evidence(mock_safe):
    mock_html = """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Outdated Dental Clinic</title>
        <!-- No viewport meta tag intentionally -->
        <script src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
      </head>
      <body>
        <h1>Welcome to Outdated Dental Clinic</h1>
        <p>Providing dental care in Bengaluru.</p>
        <!-- No contact form on page -->
        <footer>
          <p>© 2016 Outdated Dental Clinic. All rights reserved.</p>
        </footer>
      </body>
    </html>
    """
    analyzer = WebsiteAnalyzer()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.url = "http://outdateddental.example.in"  # Plain HTTP (No SSL)
    mock_resp.history = []
    mock_resp.text = mock_html
    analyzer.client.get = MagicMock(return_value=mock_resp)

    res = analyzer.audit_url("http://outdateddental.example.in")

    assert res.is_reachable is True
    assert res.has_ssl is False
    assert "missing_ssl" in res.opportunities_identified
    assert "unresponsive_mobile" in res.opportunities_identified
    assert "missing_contact_form" in res.opportunities_identified
    assert "outdated_copyright" in res.opportunities_identified
    assert "legacy_technology" in res.opportunities_identified
    assert "missing_schema_markup" in res.opportunities_identified

    # Verify evidence trails exist for each opportunity
    assert "missing_ssl" in res.evidence
    assert "unresponsive_mobile" in res.evidence
    assert "outdated_copyright" in res.evidence
    assert "2016" in res.evidence["outdated_copyright"]

