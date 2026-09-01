import hashlib
import hmac
import base64
import json
import time
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import get_db
from app.models import User

security_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with cryptographically secure salt."""
    if not salt:
        salt = base64.b64encode(secrets.token_bytes(16)).decode('utf-8')
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    return f"pbkdf2_sha256${iterations}${salt}${base64.b64encode(derived).decode('utf-8')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored PBKDF2-HMAC-SHA256 hash or demo fallback."""
    if not hashed_password:
        return False
    parts = hashed_password.split('$')
    if len(parts) == 4 and parts[0] == 'pbkdf2_sha256':
        iterations = int(parts[1])
        salt = parts[2]
        expected = parts[3]
        derived = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return hmac.compare_digest(base64.b64encode(derived).decode('utf-8'), expected)
    # Plain fallback for quick demo seeds if needed
    return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create lightweight standard JWT token."""
    to_encode = data.copy()
    now = int(time.time())
    expire = now + (int(expires_delta.total_seconds()) if expires_delta else settings.access_token_expire_minutes * 60)
    to_encode.update({"iat": now, "exp": expire})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    signature_input = f"{header_b64}.{payload_b64}".encode()
    
    sig = hmac.new(settings.jwt_secret.encode(), signature_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(settings.jwt_secret.encode(), signature_input, hashlib.sha256).digest()
        
        # Add padding back for base64 decode
        rem = len(sig_b64) % 4
        padded_sig_b64 = sig_b64 + ("=" * (4 - rem) if rem else "")
        actual_sig = base64.urlsafe_b64decode(padded_sig_b64.encode())
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        rem = len(payload_b64) % 4
        padded_payload = payload_b64 + ("=" * (4 - rem) if rem else "")
        payload = json.loads(base64.urlsafe_b64decode(padded_payload.encode()).decode())
        
        if "exp" in payload and payload["exp"] < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from Bearer token or return default demo user if not authenticated."""
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.username == payload["sub"]).first()
            if user and user.is_active:
                return user
    
    # Return or create default demo investigator for seamless demo flow
    demo_user = db.query(User).filter(User.username == "investigator").first()
    if not demo_user:
        demo_user = User(
            username="investigator",
            email="investigator@parakh.gov.in",
            full_name="Priya Sharma (Senior Investigator)",
            hashed_password=hash_password("parakh123"),
            role="INVESTIGATOR",
            is_active=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    return demo_user

def require_roles(allowed_roles: List[str]):
    """Role-based access control dependency."""
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        if user.role not in allowed_roles and "ADMIN" not in allowed_roles and user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: required role in {allowed_roles}, your role is {user.role}"
            )
        return user
    return role_checker
