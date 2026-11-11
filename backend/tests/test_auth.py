from backend.app.core.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from backend.app.core.config import settings
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_password_hashing_and_verification():
    raw_pwd = "my_secure_password_123!"
    hashed = get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_generation():
    token = create_access_token(subject="user_12345")
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert decoded["sub"] == "user_12345"
    assert "exp" in decoded

def test_json_login_flow():
    # Login with seeded admin
    res = client.post("/api/v1/auth/login-json", json={
        "email": "admin@prospectiq.io",
        "password": "prospect123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "admin@prospectiq.io"

    # Login with incorrect password
    res_bad = client.post("/api/v1/auth/login-json", json={
        "email": "admin@prospectiq.io",
        "password": "badpassword"
    })
    assert res_bad.status_code == 401

def test_register_and_separate_caller_role():
    caller_email = "test_sdr_caller_888@prospectiq.io"
    res = client.post("/api/v1/auth/register", json={
        "email": caller_email,
        "password": "callerpass123!",
        "full_name": "Test SDR Operator",
        "role": "caller",
        "daily_call_target": 40
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == caller_email
    assert data["user"]["role"] == "caller"
    assert data["user"]["permissions"]["can_call"] is True
    assert data["user"]["permissions"]["can_manage_team"] is False
    assert "access_token" in data

def test_google_auth_flow():
    google_user_email = "alex.google_caller@company.com"
    res = client.post("/api/v1/auth/google", json={
        "email": google_user_email,
        "full_name": "Alex Google SDR",
        "role": "caller",
        "credential": "mock_google_oauth_credential_token"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == google_user_email
    assert data["user"]["role"] == "caller"
    assert "access_token" in data

    # Repeated Google login with existing user
    res2 = client.post("/api/v1/auth/google", json={
        "email": google_user_email,
        "credential": "mock_google_oauth_credential_token"
    })
    assert res2.status_code == 200
    assert res2.json()["user"]["email"] == google_user_email
