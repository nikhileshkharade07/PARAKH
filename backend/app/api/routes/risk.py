from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies import get_contract_service
from app.services.contract_service import ContractService
from app.services.audit_service import log_audit
from app.core.auth import get_current_user
from app.models import User

router = APIRouter()

@router.get("/{contract_id}")
def get_risk(contract_id: int, service: ContractService = Depends(get_contract_service)):
    """Retrieve evaluated risk metrics and flags for a specific contract."""
    contract_data = service.get_contract(contract_id)
    if not contract_data:
        raise HTTPException(status_code=404, detail=f"Contract with ID {contract_id} not found")
    return {
        "crs": contract_data.risk.crs if contract_data.risk else 0,
        "rule_score": contract_data.risk.rule_score if contract_data.risk else 0.0,
        "anomaly_score": contract_data.risk.anomaly_score if contract_data.risk else 0.0,
        "risk_level": contract_data.risk.risk_level if contract_data.risk else "unknown",
        "flags": contract_data.risk.flags if contract_data.risk else []
    }

@router.post("/analyze")
def analyze(
    contract_id: int,
    service: ContractService = Depends(get_contract_service),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger full on-demand risk analysis pipeline for a contract."""
    try:
        result = service.analyze_contract_risk(contract_id)
        log_audit(
            db=db,
            action="RISK_CALCULATE",
            resource_type="CONTRACT",
            resource_id=str(contract_id),
            details={"crs": result["crs"], "flags_count": len(result["flags"])},
            user=current_user
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")
