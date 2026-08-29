from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.case_service import CaseService
from app.schemas.cases import (
    CaseSummary, CaseDetail, CaseCreate, CaseUpdate,
    CaseNoteCreate, CaseNoteOut, CaseEvidenceCreate, CaseEvidenceOut
)
from app.core.auth import get_current_user
from app.models import User

router = APIRouter()

@router.get("", response_model=List[CaseSummary])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List investigation cases with status, priority, and metadata."""
    service = CaseService(db)
    return service.get_cases(status, priority, assigned_to_id, limit, offset)

@router.get("/{case_id}", response_model=CaseDetail)
def get_case(case_id: int, db: Session = Depends(get_db)):
    """Get full case details including evidence, notes, and risk flags."""
    service = CaseService(db)
    case = service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return case

@router.post("", response_model=CaseDetail)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new investigation case for a contract."""
    service = CaseService(db)
    try:
        case = service.create_case(
            contract_id=payload.contract_id,
            title=payload.title,
            priority=payload.priority,
            notes_summary=payload.notes_summary,
            assigned_to_id=payload.assigned_to_id,
            user=current_user
        )
        return case
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{case_id}", response_model=CaseDetail)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update case status, priority, notes, or resolution."""
    service = CaseService(db)
    updates = payload.model_dump(exclude_unset=True)
    case = service.update_case(case_id, updates, user=current_user)
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return case

@router.post("/{case_id}/notes", response_model=CaseNoteOut)
def add_note(
    case_id: int,
    payload: CaseNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a forensic note to the investigation case timeline."""
    service = CaseService(db)
    try:
        note = service.add_note(case_id, payload.content, payload.author_name, user=current_user)
        return note
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{case_id}/evidence", response_model=CaseEvidenceOut)
def add_evidence(
    case_id: int,
    payload: CaseEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Attach evidence artifact to the investigation case."""
    service = CaseService(db)
    try:
        evidence = service.add_evidence(
            case_id=case_id,
            title=payload.title,
            evidence_type=payload.evidence_type,
            description=payload.description,
            data_payload=payload.data_payload,
            user=current_user
        )
        return evidence
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
