from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    username: str
    role: str
    action: str
    resource_type: str
    resource_id: str
    details: str
    ip_address: str
    result: str
    model_config = ConfigDict(from_attributes=True)

class AuditLogFilter(BaseModel):
    action: Optional[str] = None
    username: Optional[str] = None
    resource_type: Optional[str] = None
    limit: int = 50
    offset: int = 0
