from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.contracts import ContractSummary, ContractDetail, RiskOut, RiskFlagOut
from app.dependencies import get_contract_service
from app.services.contract_service import ContractService

router = APIRouter()

@router.get("", response_model=list[ContractSummary])
def list_contracts(
    service: ContractService = Depends(get_contract_service),
    department_id: int | None = None,
    vendor_id: int | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return service.get_contracts(department_id=department_id, vendor_id=vendor_id, limit=limit, offset=offset)

@router.get("/{contract_id}", response_model=ContractDetail)
def get_contract(contract_id: int, service: ContractService = Depends(get_contract_service)):
    contract = service.get_contract(contract_id)
    if not contract:
        raise HTTPException(404, "Contract not found")
    return contract
