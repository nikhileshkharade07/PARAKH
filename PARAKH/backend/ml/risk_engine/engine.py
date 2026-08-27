from backend.app.core.config import settings
from backend.app.models import RiskAssessment, RiskFlag
from backend.ml.risk_engine.rules import evaluate_rules
from backend.ml.anomaly_detection.isolation_forest import anomaly_for_contract
from backend.ml.nlp.similarity import specification_similarity

class RiskEngine:
    def __init__(self):
        self.settings = settings

    def analyze_contract(self, contract, db, anomaly_score=None):
        peers = contract.department.contracts
        flags = evaluate_rules(contract, peers, self.settings)

        nlp = specification_similarity(
            contract.specification,
            contract.vendor.product_description,
            self.settings.nlp_similarity_threshold,
        )
        for flag in flags:
            if flag["flag_id"] == "RF-7":
                flag["detected"] = nlp["flagged"]
                flag["explanation"] = nlp["explanation"]

        rule_score = min(100, sum(f["score"] for f in flags if f["detected"]))
        if anomaly_score is None:
            anomaly_score = anomaly_for_contract(contract, peers)
        crs = round(min(100, 0.80 * rule_score + 0.20 * anomaly_score))

        if contract.risk_assessment:
            ra = contract.risk_assessment
            ra.crs, ra.rule_score, ra.anomaly_score = crs, rule_score, anomaly_score
        else:
            contract.risk_assessment = RiskAssessment(
                crs=crs, rule_score=rule_score, anomaly_score=anomaly_score, model_version="0.1"
            )

        contract.risk_flags.clear()
        for flag in flags:
            contract.risk_flags.append(RiskFlag(**flag))
        db.add(contract)
        db.commit()

        return {
            "crs": crs,
            "rule_score": rule_score,
            "anomaly_score": anomaly_score,
            "risk_level": "high" if crs >= 70 else "medium" if crs >= 40 else "low",
            "flags": [f for f in flags if f["detected"]],
            "nlp": nlp,
        }
