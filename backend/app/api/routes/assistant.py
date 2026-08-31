from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.assistant_service import AssistantService
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse

router = APIRouter()

@router.post("/query", response_model=AssistantQueryResponse)
def ask_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    """Query the grounded AI investigator assistant backed by real procurement database records."""
    service = AssistantService(db)
    return service.query(req.query, req.contract_id)
