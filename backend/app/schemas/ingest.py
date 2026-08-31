from pydantic import BaseModel
from typing import List, Optional, Any

class IngestionError(BaseModel):
    row: int
    field: str
    message: str
    raw_data: Optional[dict] = None

class IngestionResponse(BaseModel):
    success: bool
    filename: str
    total_uploaded: int
    valid_records: int
    invalid_records: int
    duplicates: int
    analyzed: int
    message: str
    errors: List[IngestionError] = []
