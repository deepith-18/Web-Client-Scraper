import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token, get_password_hash
from backend.app.models.user import User, default_permissions
from backend.app.schemas.user import (
    Token,
    UserResponse,
    UserCreate,
    LoginJsonRequest,
    GoogleAuthRequest,
    AuthResponse
)
from jose import jwt, JWTError
from backend.app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Rate limiter for auth endpoints — 10 login attempts per minute per IP
_limiter = Limiter(key_func=get_remote_address)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=Token)
@_limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/login-json", response_model=AuthResponse)
@_limiter.limit("10/minute")
def login_json(request: Request, payload: LoginJsonRequest, db: Session = Depends(get_db)):
    """Authenticate with standard JSON body (email and password)."""
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive or suspended user account")

    # Ensure permissions dict exists
    if not user.permissions:
        user.permissions = default_permissions(user.role)
        db.commit()

    access_token = create_access_token(subject=user.id)
    return AuthResponse(access_token=access_token, token_type="bearer", user=user)

@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register via Google Sign-In.
    Handles verified Google profile email and issues system JWT.
    """
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid Google email address provided")

    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="User account is deactivated")
        if not user.permissions:
            user.permissions = default_permissions(user.role)
            db.commit()
    else:
        # Auto-provision new user account from Google
        assigned_role = payload.role if payload.role in ["admin", "caller", "developer"] else "caller"
        fallback_name = payload.full_name or email.split("@")[0].replace(".", " ").title()
        
        user = User(
            email=email,
            full_name=fallback_name,
            role=assigned_role,
            hashed_password=get_password_hash(str(uuid.uuid4()) + "!GoogleAuth"),
            is_active=True,
            daily_call_target=30,
            permissions=default_permissions(assigned_role)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return AuthResponse(access_token=access_token, token_type="bearer", user=user)

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=AuthResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account and return active session token."""
    email = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email address already exists")
    
    assigned_role = user_in.role if user_in.role in ["admin", "caller", "developer"] else "caller"
    user_permissions = user_in.permissions or default_permissions(assigned_role)

    new_user = User(
        email=email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or email.split("@")[0].title(),
        role=assigned_role,
        phone=user_in.phone,
        daily_call_target=user_in.daily_call_target or 30,
        notes=user_in.notes,
        permissions=user_permissions,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return AuthResponse(access_token=access_token, token_type="bearer", user=new_user)
