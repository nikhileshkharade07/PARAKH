from pydantic import BaseModel
from typing import List, Optional, Any

class AssistantQueryRequest(BaseModel):
    query: str
    contract_id: Optional[int] = None
    vendor_id: Optional[int] = None
    department_id: Optional[int] = None

class EvidenceCitation(BaseModel):
    title: str
    citation_type: str # CONTRACT, VENDOR, DEPARTMENT, HEURISTIC, ML_ANOMALY
    reference_id: str
    summary: str
    link: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[EvidenceCitation] = []
    confidence: float = 0.95
    data_source: str = "PARAKH Verified Database Records"
