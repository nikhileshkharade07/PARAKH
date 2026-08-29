from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import AuditLog
from app.schemas.audit import AuditLogOut

router = APIRouter()

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve immutable system audit logs."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type.upper())
        
    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs
