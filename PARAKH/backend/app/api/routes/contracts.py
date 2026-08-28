from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Contract
from backend.app.schemas.contracts import ContractSummary, ContractDetail, RiskOut, RiskFlagOut, BidOut, ExtensionOut

router = APIRouter()

@router.get("", response_model=list[ContractSummary])
def list_contracts(
    db: Session = Depends(get_db),
    department_id: int | None = None,
    vendor_id: int | None = None,
    risk_level: str | None = None,
    search: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = select(Contract)
    if department_id:
        stmt = stmt.where(Contract.department_id == department_id)
    if vendor_id:
        stmt = stmt.where(Contract.vendor_id == vendor_id)
    if search:
        s = f"%{search}%"
        stmt = stmt.where((Contract.contract_number.ilike(s)) | (Contract.title.ilike(s)))
    
    contracts = db.scalars(stmt.offset(offset).limit(limit)).all()
    results = []
    for c in contracts:
        crs = c.risk_assessment.crs if c.risk_assessment else None
        lvl = "high" if crs and crs >= 70 else "medium" if crs and crs >= 40 else "low" if crs is not None else None
        
        if risk_level and lvl != risk_level.lower():
            continue
            
        results.append(ContractSummary(
            id=c.id,
            contract_number=c.contract_number,
            title=c.title,
            contract_date=c.contract_date,
            department_id=c.department_id,
            department_name=c.department.name if c.department else None,
            vendor_id=c.vendor_id,
            vendor_name=c.vendor.name if c.vendor else None,
            estimate_value=c.estimate_value,
            award_value=c.award_value,
            crs=crs,
            risk_level=lvl,
        ))
    return results

@router.get("/{contract_id}", response_model=ContractDetail)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(404, "Contract not found")
    risk = None
    crs = c.risk_assessment.crs if c.risk_assessment else None
    lvl = "high" if crs and crs >= 70 else "medium" if crs and crs >= 40 else "low" if crs is not None else None
    
    if c.risk_assessment:
        risk = RiskOut(
            crs=c.risk_assessment.crs,
            risk_level=lvl or "low",
            rule_score=c.risk_assessment.rule_score,
            anomaly_score=c.risk_assessment.anomaly_score,
            flags=[RiskFlagOut(
                flag_id=f.flag_id, detected=f.detected, severity=f.severity,
                score=f.score, explanation=f.explanation
            ) for f in c.risk_flags if f.detected],
        )
    return ContractDetail(
        id=c.id, contract_number=c.contract_number, title=c.title,
        contract_date=c.contract_date, department_id=c.department_id,
        department_name=c.department.name if c.department else None,
        vendor_id=c.vendor_id,
        vendor_name=c.vendor.name if c.vendor else None,
        estimate_value=c.estimate_value, award_value=c.award_value,
        specification=c.specification,
        vendor_product_description=c.vendor.product_description if c.vendor else None,
        tender_start=c.tender_start, tender_end=c.tender_end,
        bidder_count=len(c.bids),
        bids=[BidOut(id=b.id, vendor_name=b.vendor_name, bid_value=b.bid_value) for b in c.bids],
        extensions=[ExtensionOut(id=e.id, extension_days=e.extension_days, reason=e.reason) for e in c.extensions],
        crs=crs, risk_level=lvl, risk=risk
    )
