from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database.session import get_db
from app.models import Contract, RiskAssessment
from app.schemas.contracts import (
    ContractSummary, ContractDetail, RiskOut, RiskFlagOut, BidOut, ExtensionOut,
    RuleEvidenceOut, RiskEvidenceOut
)
from ml.risk_engine.rules import evaluate_rules
from ml.risk_engine.engine import RiskEngine

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
    query = (
        db.query(Contract)
        .options(
            joinedload(Contract.department),
            joinedload(Contract.vendor),
            joinedload(Contract.risk_assessment)
        )
    )
    if department_id:
        query = query.filter(Contract.department_id == department_id)
    if vendor_id:
        query = query.filter(Contract.vendor_id == vendor_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Contract.contract_number.ilike(s)) | (Contract.title.ilike(s)))
    if risk_level:
        lvl = risk_level.lower()
        if lvl == "high":
            query = query.join(Contract.risk_assessment).filter(RiskAssessment.crs >= 70)
        elif lvl == "medium":
            query = query.join(Contract.risk_assessment).filter(RiskAssessment.crs >= 40, RiskAssessment.crs < 70)
        elif lvl == "low":
            query = query.join(Contract.risk_assessment).filter(RiskAssessment.crs < 40)

    contracts = query.order_by(Contract.id.desc()).offset(offset).limit(limit).all()
    results = []
    for c in contracts:
        crs = c.risk_assessment.crs if c.risk_assessment else None
        lvl = "high" if crs and crs >= 70 else "medium" if crs and crs >= 40 else "low" if crs is not None else None
        
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
    c = (
        db.query(Contract)
        .options(
            joinedload(Contract.department),
            joinedload(Contract.vendor),
            joinedload(Contract.risk_assessment),
            selectinload(Contract.risk_flags),
            selectinload(Contract.bids),
            selectinload(Contract.extensions)
        )
        .filter(Contract.id == contract_id)
        .first()
    )
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

@router.get("/{contract_id}/risk-evidence", response_model=RiskEvidenceOut)
def get_contract_risk_evidence(contract_id: int, db: Session = Depends(get_db)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(404, "Contract not found")

    risk_engine = RiskEngine()

    if not contract.risk_assessment:
        risk_data = risk_engine.analyze_contract(contract, db)
    else:
        risk_data = {
            "crs": contract.risk_assessment.crs,
            "rule_score": contract.risk_assessment.rule_score,
            "anomaly_score": contract.risk_assessment.anomaly_score,
            "risk_level": "high" if contract.risk_assessment.crs >= 70 else
                         "medium" if contract.risk_assessment.crs >= 40 else "low"
        }

    raw_eval = evaluate_rules(contract, db)
    
    triggered_rules = []
    for r in raw_eval:
        if r.get("detected"):
            evidence_dict = r.get("evidence", {})
            evidence_dict["recommended_action"] = r.get("recommended_action", "Conduct detailed forensic investigation.")
            triggered_rules.append(RuleEvidenceOut(
                rule_id=r.get("flag_id", "UNKNOWN"),
                rule_name=r.get("flag_name", r.get("flag_id", "")),
                triggered=True,
                severity=r.get("severity", "medium"),
                contribution=r.get("score", 0.0),
                explanation=r.get("explanation", ""),
                evidence=evidence_dict
            ))

    return RiskEvidenceOut(
        contract_id=contract.id,
        risk_score=risk_data["crs"],
        risk_level=risk_data["risk_level"],
        rule_score=risk_data["rule_score"],
        anomaly_score=risk_data["anomaly_score"],
        triggered_rules=triggered_rules,
        generated_at=datetime.utcnow()
    )
