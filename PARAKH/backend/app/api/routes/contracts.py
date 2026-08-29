from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
import json
from datetime import datetime
from typing import Any, Dict, List
from app.database.session import get_db
from app.models import Contract
from app.schemas.contracts import ContractSummary, ContractDetail, RiskOut, RiskFlagOut, BidOut, ExtensionOut, RuleEvidenceOut, RiskEvidenceOut
from ml.risk_engine.rules import evaluate_rules
from ml.risk_engine.engine import RiskEngine
from ml.nlp.similarity import specification_similarity
from app.core.config import settings

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


@router.get("/{contract_id}/risk-evidence", response_model=RiskEvidenceOut)
def get_contract_risk_evidence(contract_id: int, db: Session = Depends(get_db)):
    # Fetch the contract
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(404, "Contract not found")

    # Initialize risk engine
    risk_engine = RiskEngine()

    # Ensure risk assessment exists (compute if needed)
    if not contract.risk_assessment:
        # Use existing risk engine to compute and store
        risk_data = risk_engine.analyze_contract(contract, db)
    else:
        risk_data = {
            "crs": contract.risk_assessment.crs,
            "rule_score": contract.risk_assessment.rule_score,
            "anomaly_score": contract.risk_assessment.anomaly_score,
            "risk_level": "high" if contract.risk_assessment.crs >= 70 else
                         "medium" if contract.risk_assessment.crs >= 40 else "low"
        }

    # Get peers for evidence computation (same department contracts)
    peers = contract.department.contracts

    # Re-evaluate rules to get evidence (we could also retrieve from stored evidence, but we'll compute to ensure consistency)
    flags = evaluate_rules(contract, peers, settings)

    # Update RF-7 evidence with NLP results (since evaluate_rules doesn't have NLP)
    nlp = specification_similarity(
        contract.specification,
        contract.vendor.product_description,
        settings.nlp_similarity_threshold,
    )
    for flag in flags:
        if flag["flag_id"] == "RF-7":
            flag["detected"] = nlp["flagged"]
            flag["explanation"] = nlp["explanation"]
            flag["evidence"] = {
                "similarity_score": nlp["similarity_score"],
                "threshold": settings.nlp_similarity_threshold
            }

    # Build triggered rules list with evidence
    triggered_rules = []
    # Mapping from flag_id to rule name
    rule_names = {
        "RF-1": "Single Bidder",
        "RF-2": "Vendor Lock-in",
        "RF-3": "Approval Threshold Manipulation",
        "RF-4": "Compressed Tender Window",
        "RF-5": "Estimate Deviation",
        "RF-6": "Repeat Winner/Network Pattern",
        "RF-7": "Specification Tailoring",
        "RF-8": "Unusual Extensions"
    }

    for flag in flags:
        # Only include triggered rules (as per the example in the requirements)
        if flag["detected"]:
            # Retrieve stored evidence from the database if available, otherwise use computed evidence
            evidence_data = {}
            # Look for the stored RiskFlag for this contract and flag_id
            stored_flag = None
            for f in contract.risk_flags:
                if f.flag_id == flag["flag_id"]:
                    stored_flag = f
                    break

            if stored_flag and stored_flag.evidence:
                try:
                    evidence_data = json.loads(stored_flag.evidence)
                except (json.JSONDecodeError, TypeError):
                    # If there's an error parsing the stored evidence, fall back to computed evidence
                    evidence_data = flag.get("evidence", {})
            else:
                evidence_data = flag.get("evidence", {})

            triggered_rules.append(RuleEvidenceOut(
                rule_id=flag["flag_id"],
                rule_name=rule_names[flag["flag_id"]],
                triggered=True,
                severity=flag["severity"],
                contribution=flag["score"],
                explanation=flag["explanation"],
                evidence=evidence_data
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
