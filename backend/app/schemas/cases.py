from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal

class CaseNoteCreate(BaseModel):
    content: str
    author_name: Optional[str] = "Investigator"

class CaseNoteOut(BaseModel):
    id: int
    case_id: int
    author_id: Optional[int] = None
    author_name: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CaseEvidenceCreate(BaseModel):
    title: str
    evidence_type: str = "DOCUMENT" # DOCUMENT, SPECIFICATION_DIFF, NETWORK_CLUSTER, PRICE_ANALYSIS, EXTERNAL_REPORT
    description: str = ""
    data_payload: str = ""

class CaseEvidenceOut(BaseModel):
    id: int
    case_id: int
    title: str
    evidence_type: str
    description: str
    data_payload: str
    created_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CaseCreate(BaseModel):
    contract_id: int
    title: Optional[str] = None
    priority: str = "HIGH" # LOW, MEDIUM, HIGH, CRITICAL
    notes_summary: str = ""
    assigned_to_id: Optional[int] = None

class CaseUpdate(BaseModel):
    status: Optional[str] = None # NEW, UNDER_REVIEW, EVIDENCE_COLLECTION, ESCALATED, CLEARED, CONFIRMED_SUSPICIOUS, CLOSED
    priority: Optional[str] = None
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    notes_summary: Optional[str] = None
    resolution_notes: Optional[str] = None

class CaseSummary(BaseModel):
    id: int
    case_number: str
    contract_id: int
    contract_number: str
    title: str
    status: str
    priority: str
    assigned_to_name: str
    crs: int
    vendor_name: str
    department_name: str
    award_value: Decimal
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CaseDetail(CaseSummary):
    notes_summary: str
    resolution_notes: str
    notes: List[CaseNoteOut] = []
    evidence: List[CaseEvidenceOut] = []
    risk_flags: List[dict] = []
