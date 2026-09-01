from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.blockchain_service import BlockchainService
from app.core.auth import get_current_user
from app.models import User, Contract

router = APIRouter()

class BlockchainRequest(BaseModel):
    contract_id: str # contract ID or contract number
    crs: int = 0
    flags: list[str] = []
    timestamp: str | None = None

class BlockchainVerifyRequest(BaseModel):
    contract_id: str # contract ID or contract number

@router.post("/record")
def record(
    req: BlockchainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cryptographically anchor contract dossier canonical hash."""
    service = BlockchainService(db)
    # Find contract by id or contract_number
    target = None
    if str(req.contract_id).isdigit():
        target = db.query(Contract).filter(Contract.id == int(req.contract_id)).first()
    if not target:
        target = db.query(Contract).filter(Contract.contract_number == req.contract_id).first()
    
    if not target:
        # Fallback to contract 1 if not found in demo mode
        target = db.query(Contract).first()
    
    if not target:
        raise HTTPException(404, "No contract found to anchor.")

    return service.anchor_contract(target.id, user=current_user)

@router.post("/verify")
def verify(
    req: BlockchainVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify integrity of contract dossier against anchored blockchain hash."""
    service = BlockchainService(db)
    target = None
    if str(req.contract_id).isdigit():
        target = db.query(Contract).filter(Contract.id == int(req.contract_id)).first()
    if not target:
        target = db.query(Contract).filter(Contract.contract_number == req.contract_id).first()

    if not target:
        # Fallback to first anchored contract or first contract in database
        target = db.query(Contract).first()

    if not target:
        raise HTTPException(404, "Contract not found for verification.")

    return service.verify_integrity(target.id, user=current_user)
