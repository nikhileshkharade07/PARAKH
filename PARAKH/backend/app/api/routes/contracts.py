from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Contract
from backend.app.schemas.contracts import ContractSummary, ContractDetail, RiskOut, RiskFlagOut

router = APIRouter()

@router.get("", response_model=list[ContractSummary])
def list_contracts(
    db: Session = Depends(get_db),
    department_id: int | None = None,
    vendor_id: int | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Contract)
    if department_id:
        stmt = stmt.where(Contract.department_id == department_id)
    if vendor_id:
        stmt = stmt.where(Contract.vendor_id == vendor_id)
    return db.scalars(stmt.offset(offset).limit(limit)).all()

@router.get("/{contract_id}", response_model=ContractDetail)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(404, "Contract not found")
    risk = None
    if c.risk_assessment:
        risk = RiskOut(
            crs=c.risk_assessment.crs,
            risk_level="high" if c.risk_assessment.crs >= 70 else "medium" if c.risk_assessment.crs >= 40 else "low",
            rule_score=c.risk_assessment.rule_score,
            anomaly_score=c.risk_assessment.anomaly_score,
            flags=[RiskFlagOut(
                flag_id=f.flag_id, detected=f.detected, severity=f.severity,
                score=f.score, explanation=f.explanation
            ) for f in c.risk_flags if f.detected],
        )
    return ContractDetail(
        id=c.id, contract_number=c.contract_number, title=c.title,
        contract_date=c.contract_date, department_id=c.department_id, vendor_id=c.vendor_id,
        estimate_value=c.estimate_value, award_value=c.award_value,
        specification=c.specification, tender_start=c.tender_start, tender_end=c.tender_end,
        bidder_count=len(c.bids), risk=risk
    )
