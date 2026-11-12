import pytest
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.schemas.user import LoginJsonRequest, UserCreate, GoogleAuthRequest
from backend.app.api.v1.auth import login_json, register, google_auth
from fastapi import HTTPException

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
    db = SessionLocal()
    try:
        # Login with seeded admin
        req = LoginJsonRequest(email="admin@demanex.io", password="demanex123!")
        res = login_json(req, db=db)
        assert res.access_token is not None
        assert res.token_type == "bearer"
        assert res.user.role == "admin"
        assert res.user.email == "admin@demanex.io"

        # Login with incorrect password
        with pytest.raises(HTTPException) as exc_info:
            bad_req = LoginJsonRequest(email="admin@demanex.io", password="badpassword")
            login_json(bad_req, db=db)
        assert exc_info.value.status_code == 401
    finally:
        db.close()

def test_register_and_separate_caller_role():
    db = SessionLocal()
    try:
        caller_email = "test_sdr_caller_888@demanex.io"
        req = UserCreate(
            email=caller_email,
            password="callerpass123!",
            full_name="Test SDR Operator",
            role="caller",
            daily_call_target=40
        )
        res = register(req, db=db)
        assert res.user.email == caller_email
        assert res.user.role == "caller"
        assert res.user.permissions["can_call"] is True
        assert res.user.permissions["can_manage_team"] is False
        assert res.access_token is not None
    finally:
        db.close()

def test_google_auth_flow():
    db = SessionLocal()
    try:
        google_user_email = "alex.google_caller@company.com"
        req = GoogleAuthRequest(
            email=google_user_email,
            full_name="Alex Google SDR",
            role="caller",
            credential="mock_google_oauth_credential_token"
        )
        res = google_auth(req, db=db)
        assert res.user.email == google_user_email
        assert res.user.role == "caller"
        assert res.access_token is not None

        # Repeated Google login with existing user
        req2 = GoogleAuthRequest(
            email=google_user_email,
            credential="mock_google_oauth_credential_token"
        )
        res2 = google_auth(req2, db=db)
        assert res2.user.email == google_user_email
    finally:
        db.close()
