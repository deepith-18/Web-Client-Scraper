from unittest.mock import patch
from backend.app.core.security import is_safe_url, is_safe_ip

def test_ssrf_rejects_localhost():
    assert is_safe_url("http://localhost:8000") is False
    assert is_safe_url("http://127.0.0.1:8000") is False
    assert is_safe_url("http://[::1]/secret") is False

def test_ssrf_rejects_cloud_metadata():
    assert is_safe_url("http://169.254.169.254/latest/meta-data/") is False

def test_ssrf_rejects_private_ips():
    assert is_safe_ip("192.168.1.1") is False
    assert is_safe_ip("10.0.0.5") is False
    assert is_safe_ip("172.16.0.1") is False

def test_ssrf_allows_public_ips():
    assert is_safe_ip("93.184.216.34") is True
    assert is_safe_url("https://93.184.216.34/contact") is True

def test_ssrf_rejects_invalid_schemes():
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("ftp://ftp.example.com") is False
    assert is_safe_url("javascript:alert(1)") is False

@patch("backend.app.core.security.socket.getaddrinfo")
def test_ssrf_resolves_and_validates_domain(mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 0, "", ("93.184.216.34", 0))]
    assert is_safe_url("https://example.com") is True

    # Test SSRF DNS Rebinding to internal IP
    mock_getaddrinfo.return_value = [(2, 1, 0, "", ("127.0.0.1", 0))]
    assert is_safe_url("https://malicious-rebinding.example.com") is False
