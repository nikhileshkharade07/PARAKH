import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import RiskAssessment, RiskFlag, Contract
from ml.risk_engine.rules import evaluate_rules
from ml.anomaly_detection.isolation_forest import anomaly_for_contract
from ml.nlp.similarity import specification_similarity

logger = logging.getLogger(__name__)

class RiskEngine:
    def __init__(self):
        self.settings = settings

    def analyze_contract(self, contract: Contract, db: Session, anomaly_score: Optional[float] = None) -> Dict[str, Any]:
        """Execute full PARAKH risk analysis pipeline for a contract."""
        try:
            peers = contract.department.contracts if (contract.department and contract.department.contracts) else []
        except Exception:
            peers = [contract]

        flags = evaluate_rules(contract, peers, self.settings)

        # NLP Specification Similarity
        spec = contract.specification or ""
        vendor_desc = (contract.vendor.product_description or "") if contract.vendor else ""
        nlp = specification_similarity(spec, vendor_desc, self.settings.nlp_similarity_threshold)

        for flag in flags:
            if flag["flag_id"] == "RF-7":
                flag["detected"] = nlp["flagged"]
                flag["explanation"] = nlp["explanation"]
                flag["evidence"] = {
                    "similarity_score": nlp["similarity_score"],
                    "threshold": nlp["threshold"]
                }

        rule_score = float(min(100, sum(f["score"] for f in flags if f["detected"])))
        
        if anomaly_score is None:
            try:
                anomaly_score = float(anomaly_for_contract(contract, peers))
            except Exception as ml_err:
                logger.warning(f"Anomaly score calculation failed, using fallback: {ml_err}")
                anomaly_score = 15.0 # Graceful fallback baseline

        crs = int(min(100, max(0, round(0.80 * rule_score + 0.20 * anomaly_score))))

        # Persist Risk Assessment
        if contract.risk_assessment:
            ra = contract.risk_assessment
            ra.crs = crs
            ra.rule_score = rule_score
            ra.anomaly_score = anomaly_score
            ra.model_version = "1.0"
        else:
            contract.risk_assessment = RiskAssessment(
                crs=crs,
                rule_score=rule_score,
                anomaly_score=anomaly_score,
                model_version="1.0"
            )

        # Persist Risk Flags
        contract.risk_flags.clear()
        for flag in flags:
            evidence_val = flag.get("evidence")
            evidence_json_str = json.dumps(evidence_val) if isinstance(evidence_val, (dict, list)) else str(evidence_val or "{}")
            evidence_text = json.dumps(evidence_val) if isinstance(evidence_val, (dict, list)) else str(evidence_val or "")
            
            rf = RiskFlag(
                flag_id=flag["flag_id"],
                detected=flag["detected"],
                severity=flag["severity"],
                score=float(flag["score"]),
                explanation=flag["explanation"],
                evidence=evidence_text,
                evidence_json=evidence_json_str
            )
            contract.risk_flags.append(rf)

        try:
            db.add(contract)
            db.commit()
            db.refresh(contract)
        except Exception as db_err:
            logger.error(f"Database error during risk persistence: {db_err}")
            db.rollback()

        risk_level = "high" if crs >= self.settings.risk_threshold else "medium" if crs >= 40 else "low"
        detected_flags = [f for f in flags if f["detected"]]

        return {
            "crs": crs,
            "rule_score": rule_score,
            "anomaly_score": anomaly_score,
            "risk_level": risk_level,
            "flags": detected_flags,
            "all_rules": flags,
            "nlp": nlp,
        }
