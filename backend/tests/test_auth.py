from backend.app.core.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from backend.app.core.config import settings

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

