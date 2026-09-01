from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserOut, UserCreate,
    TokenRefreshRequest, LogoutResponse
)
from app.core.auth import (
    hash_password, verify_password, create_access_token, decode_access_token,
    get_current_user, require_roles
)
from app.services.audit_service import log_audit

router = APIRouter()

DEMO_USERS = [
    {"username": "admin", "email": "admin@parakh.gov.in", "full_name": "Chief Audit Officer (Admin)", "role": "ADMIN", "password": "admin"},
    {"username": "auditor", "email": "auditor@parakh.gov.in", "full_name": "Rajesh Kumar (Lead Auditor)", "role": "AUDITOR", "password": "auditor"},
    {"username": "investigator", "email": "investigator@parakh.gov.in", "full_name": "Priya Sharma (Forensic Investigator)", "role": "INVESTIGATOR", "password": "investigator"},
    {"username": "officer", "email": "officer@pwd.gov.in", "full_name": "Amit Deshmukh (Dept Officer)", "role": "DEPARTMENT_OFFICER", "password": "officer"},
]

@router.post("/seed-users")
def seed_users(db: Session = Depends(get_db)):
    """Seed standard demo users if not existing."""
    created = []
    for u in DEMO_USERS:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            new_u = User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=hash_password(u["password"]),
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_u)
            created.append(u["username"])
    db.commit()
    return {"message": f"Seeded users: {created}"}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserCreate, db: Session = Depends(get_db)):
    """Register a new system user and return access token."""
    existing_user = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    valid_roles = {"ADMIN", "AUDITOR", "INVESTIGATOR", "DEPARTMENT_OFFICER"}
    role = req.role.upper() if req.role else "INVESTIGATOR"
    if role not in valid_roles:
        role = "INVESTIGATOR"

    new_user = User(
        username=req.username.strip(),
        email=req.email.strip().lower(),
        full_name=req.full_name.strip() if req.full_name else req.username,
        role=role,
        department_id=req.department_id,
        hashed_password=hash_password(req.password),
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username, "role": new_user.role, "uid": new_user.id})
    log_audit(db, action="REGISTER", resource_type="AUTH", resource_id=new_user.username, details={"role": new_user.role}, user=new_user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username and password, returning JWT token."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        # Check if demo username matches and auto-seed if needed
        for du in DEMO_USERS:
            if du["username"] == req.username and du["password"] == req.password:
                user = User(
                    username=du["username"],
                    email=du["email"],
                    full_name=du["full_name"],
                    role=du["role"],
                    hashed_password=hash_password(du["password"]),
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                break

    if not user or not verify_password(req.password, user.hashed_password):
        log_audit(db, action="LOGIN", resource_type="AUTH", resource_id=req.username, details="Invalid credentials", result="FAILURE")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Available demo users: admin, auditor, investigator, officer (password same as username)"
        )

    token = create_access_token({"sub": user.username, "role": user.role, "uid": user.id})
    log_audit(db, action="LOGIN", resource_type="AUTH", resource_id=user.username, details={"role": user.role}, user=user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    req: TokenRefreshRequest = None,
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
):
    """Refresh an existing valid access token."""
    token = None
    if req and req.token:
        token = req.token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required for refresh")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.username == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")

    new_token = create_access_token({"sub": user.username, "role": user.role, "uid": user.id})
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout", response_model=LogoutResponse)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log out authenticated user and record audit trail."""
    log_audit(db, action="LOGOUT", resource_type="AUTH", resource_id=current_user.username, user=current_user)
    return LogoutResponse(message="Logged out successfully")

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return current_user

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List system users."""
    users = db.query(User).all()
    if not users:
        seed_users(db)
        users = db.query(User).all()
    return users
