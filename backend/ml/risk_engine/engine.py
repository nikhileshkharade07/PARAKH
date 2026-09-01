import json
from app.core.config import settings
from app.models import RiskAssessment, RiskFlag
from ml.risk_engine.rules import evaluate_rules
from ml.anomaly_detection.isolation_forest import anomaly_for_contract
from ml.nlp.similarity import specification_similarity

class RiskEngine:
    def __init__(self):
        self.settings = settings

    def analyze_contract(self, contract, db, anomaly_score=None, peers=None, auto_commit=True):
        if peers is None:
            peers = contract.department.contracts if (contract.department and hasattr(contract.department, 'contracts')) else [contract]
        
        flags = evaluate_rules(contract, peers, self.settings)

        nlp = specification_similarity(
            contract.specification or "",
            contract.vendor.product_description if contract.vendor else "",
            self.settings.nlp_similarity_threshold,
        )
        for flag in flags:
            if flag["flag_id"] == "RF-7":
                flag["detected"] = nlp["flagged"]
                flag["explanation"] = nlp["explanation"]
                flag["evidence"] = {"similarity_score": nlp["similarity_score"], "threshold": nlp.get("threshold", self.settings.nlp_similarity_threshold)}

        rule_score = min(100, sum(f["score"] for f in flags if f["detected"]))
        if anomaly_score is None:
            anomaly_score = anomaly_for_contract(contract, peers)
        crs = round(min(100, 0.80 * rule_score + 0.20 * anomaly_score))

        if contract.risk_assessment:
            ra = contract.risk_assessment
            ra.crs, ra.rule_score, ra.anomaly_score = crs, rule_score, anomaly_score
        else:
            contract.risk_assessment = RiskAssessment(
                crs=crs, rule_score=rule_score, anomaly_score=anomaly_score, model_version="1.0"
            )

        contract.risk_flags.clear()
        for flag in flags:
            evidence_str = json.dumps(flag.get("evidence", {}))
            contract.risk_flags.append(
                RiskFlag(
                    flag_id=flag["flag_id"],
                    detected=flag["detected"],
                    severity=flag["severity"],
                    score=flag["score"],
                    explanation=flag["explanation"],
                    evidence=evidence_str,
                    evidence_json=evidence_str
                )
            )
        db.add(contract)
        if auto_commit:
            db.commit()

        return {
            "crs": crs,
            "rule_score": rule_score,
            "anomaly_score": anomaly_score,
            "risk_level": "high" if crs >= 70 else "medium" if crs >= 40 else "low",
            "flags": [f for f in flags if f["detected"]],
            "nlp": nlp,
        }
