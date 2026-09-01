from datetime import datetime, timezone
import statistics
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.database.session import get_db
from app.models import Contract, RiskAssessment
from app.schemas.contracts import (
    ContractSummary, ContractDetail, RiskOut, RiskFlagOut, BidOut, ExtensionOut,
    RuleEvidenceOut, RiskEvidenceOut, PeerComparisonOut, SimilarTenderOut
)
from app.core.config import settings
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

    # Compute Peer Group Comparison
    peer_comparison = None
    if c.department_id:
        peer_contracts = db.query(Contract).filter(Contract.department_id == c.department_id).all()
        if len(peer_contracts) > 1:
            peer_values = [float(p.award_value) for p in peer_contracts]
            peer_durations = [(p.tender_end - p.tender_start).total_seconds() / 86400 for p in peer_contracts if p.tender_end and p.tender_start] or [14.0]
            peer_bidders = [len(p.bids) if p.bids else 1 for p in peer_contracts]

            med_val = statistics.median(peer_values) if peer_values else 0.0
            mean_val = statistics.mean(peer_values) if peer_values else 0.0
            c_val = float(c.award_value or 0)
            val_dev_pct = round(((c_val - med_val) / med_val) * 100, 1) if med_val > 0 else 0.0

            med_dur = statistics.median(peer_durations) if peer_durations else 14.0
            c_dur = (c.tender_end - c.tender_start).total_seconds() / 86400 if (c.tender_end and c.tender_start) else 14.0
            dur_dev_pct = round(((c_dur - med_dur) / med_dur) * 100, 1) if med_dur > 0 else 0.0

            avg_bidders = round(statistics.mean(peer_bidders), 1) if peer_bidders else 1.0

            is_val_outlier = c_val > (med_val * 1.5) or (med_val > 0 and c_val < (med_val * 0.5))
            is_dur_outlier = c_dur < 7.0 and med_dur >= 14.0

            explanations = []
            if is_val_outlier:
                explanations.append(f"Award value is {abs(val_dev_pct):.0f}% {'higher' if val_dev_pct > 0 else 'lower'} than department peer median.")
            if is_dur_outlier:
                explanations.append(f"Tender window ({c_dur:.0f} days) is significantly shorter than peer median ({med_dur:.0f} days).")
            if not explanations:
                explanations.append("Procurement parameters align with typical department peer distributions.")

            peer_comparison = PeerComparisonOut(
                department_total_contracts=len(peer_contracts),
                peer_median_award_value=round(med_val, 2),
                peer_mean_award_value=round(mean_val, 2),
                value_deviation_percent=val_dev_pct,
                peer_median_tender_days=round(med_dur, 1),
                duration_deviation_percent=dur_dev_pct,
                peer_average_bidders=avg_bidders,
                is_value_outlier=is_val_outlier,
                is_duration_outlier=is_dur_outlier,
                explanation=" ".join(explanations)
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
        crs=crs, risk_level=lvl, risk=risk,
        peer_comparison=peer_comparison
    )

@router.get("/{contract_id}/similar-tenders", response_model=List[SimilarTenderOut])
def get_similar_tenders(contract_id: int, db: Session = Depends(get_db), limit: int = 5):
    """Find tenders across the registry with similar/recycled specifications using TF-IDF Cosine Similarity."""
    target = db.get(Contract, contract_id)
    if not target or not target.specification:
        return []

    # Get sample contracts with non-empty specs
    pool = db.query(Contract).filter(Contract.id != contract_id, Contract.specification != "").limit(200).all()
    if not pool:
        return []

    corpus = [target.specification] + [p.specification for p in pool]
    try:
        vec = TfidfVectorizer(stop_words="english", max_features=500)
        tfidf_matrix = vec.fit_transform(corpus)
        sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

        results = []
        for idx, score in enumerate(sim_scores):
            if score > 0.35: # Noticeable textual overlap threshold
                p = pool[idx]
                target_tokens = set(target.specification.lower().split())
                p_tokens = set(p.specification.lower().split())
                common = list(target_tokens & p_tokens)[:6]

                results.append(SimilarTenderOut(
                    contract_id=p.id,
                    contract_number=p.contract_number,
                    title=p.title,
                    department_name=p.department.name if p.department else "General",
                    vendor_name=p.vendor.name if p.vendor else "Unknown",
                    award_value=float(p.award_value),
                    similarity_score=round(float(score), 3),
                    matched_terms=common
                ))

        results.sort(key=lambda x: x.similarity_score, reverse=True)
        return results[:limit]
    except Exception:
        return []

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

    peers = db.query(Contract).filter(Contract.department_id == contract.department_id).all() if contract.department_id else []
    raw_eval = evaluate_rules(contract, peers, settings)
    
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
        generated_at=datetime.now(timezone.utc)
    )
