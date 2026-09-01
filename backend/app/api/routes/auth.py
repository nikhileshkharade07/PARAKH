from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut, UserCreate
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user, require_roles
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
                is_active=True
            )
            db.add(new_u)
            created.append(u["username"])
    db.commit()
    return {"message": f"Seeded users: {created}"}

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
                    is_active=True
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
