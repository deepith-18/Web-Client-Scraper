import ipaddress
import socket
from urllib.parse import urlparse
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
import bcrypt
from backend.app.core.config import settings

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def is_safe_ip(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_str == "169.254.169.254"
        ):
            return False
        return True
    except ValueError:
        return False

def is_safe_url(url: str) -> bool:
    """
    SSRF Shield: Ensures that target host is not a private IP, loopback,
    link-local, cloud metadata endpoint (169.254.169.254), or multicast address.
    """
    try:
        parsed = urlparse(url)
        if not parsed.scheme or parsed.scheme.lower() not in ("http", "https"):
            return False
            
        hostname = parsed.hostname
        if not hostname:
            return False
            
        # Reject obvious localhost / internal names
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            return False

        # If hostname is a direct IP literal
        try:
            ipaddress.ip_address(hostname)
            return is_safe_ip(hostname)
        except ValueError:
            pass

        # Resolve domain names via DNS
        ip_list = socket.getaddrinfo(hostname, None)
        if not ip_list:
            return False

        for item in ip_list:
            ip_str = item[4][0]
            if not is_safe_ip(ip_str):
                return False
                
        return True
    except Exception:
        return False
