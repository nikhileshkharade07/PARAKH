from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_contract_service
from app.services.contract_service import ContractService

router = APIRouter()

@router.get("/{contract_id}")
def get_risk(contract_id: int, service: ContractService = Depends(get_contract_service)):
    contract_data = service.get_contract(contract_id)
    if not contract_data:
        raise HTTPException(404, "Contract not found")
    return {
        "crs": contract_data.risk.crs if contract_data.risk else 0,
        "rule_score": contract_data.risk.rule_score if contract_data.risk else 0,
        "anomaly_score": contract_data.risk.anomaly_score if contract_data.risk else 0,
        "risk_level": contract_data.risk.risk_level if contract_data.risk else "unknown",
        "flags": contract_data.risk.flags if contract_data.risk else []
    }

@router.post("/analyze")
def analyze(contract_id: int, service: ContractService = Depends(get_contract_service)):
    return service.analyze_contract_risk(contract_id)
