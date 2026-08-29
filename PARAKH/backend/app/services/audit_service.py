import json
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models import AuditLog, User

def log_audit(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str = "",
    details: Any = "",
    user: Optional[User] = None,
    ip_address: str = "127.0.0.1",
    result: str = "SUCCESS"
) -> AuditLog:
    """Create an immutable audit log entry."""
    username = user.username if user else "system"
    role = user.role if user else "SYSTEM"
    user_id = user.id if user else None
    
    details_str = json.dumps(details) if isinstance(details, (dict, list)) else str(details)
    
    log_entry = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=user_id,
        username=username,
        role=role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details_str,
        ip_address=ip_address,
        result=result
    )
    try:
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        return log_entry
