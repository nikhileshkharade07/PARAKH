"""
Aegis Algorithmic Technical Evaluation Engine
Pillar 2: Algorithmic Technical Evaluation
- Evaluates proposals against immutable smart contract criteria
- Zero human scoring sheets or subjective procurement committee interference
- Deterministic compliance matching, vector benchmark verification, and multi-factor ranking
"""
from typing import List, Dict, Any, Optional
import math
import hashlib
from datetime import datetime

class AlgorithmicEvaluationEngine:
    """
    Executes zero-human-discretion evaluation of bids against locked OCDS tender specifications.
    """

    @staticmethod
    def evaluate_technical_compliance(
        proposal_spec: Dict[str, Any],
        benchmark_requirements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Deterministically evaluates proposal specifications against locked requirements.
        """
        results = []
        total_weighted_score = 0.0
        total_weight = 0.0
        hard_gate_failed = False
        disqualification_reasons = []

        for req in benchmark_requirements:
            req_name = req["parameter_name"]
            target_val = req["target_value"]
            tolerance = req.get("tolerance", 0.0)
            weight = req.get("weight", 1.0)
            is_hard_gate = req.get("is_hard_gate", False)
            total_weight += weight

            actual_val = proposal_spec.get(req_name)
            
            if actual_val is None:
                if is_hard_gate:
                    hard_gate_failed = True
                    disqualification_reasons.append(f"Missing mandatory specification: {req_name}")
                results.append({
                    "parameter": req_name,
                    "target": target_val,
                    "actual": "NOT_PROVIDED",
                    "score": 0.0,
                    "weight": weight,
                    "passed": False,
                    "is_hard_gate": is_hard_gate
                })
                continue

            # Numeric or Boolean or Text evaluation
            param_score = 0.0
            passed = False
            
            if isinstance(target_val, (int, float)) and isinstance(actual_val, (int, float)):
                diff = abs(actual_val - target_val)
                allowed_delta = target_val * tolerance if tolerance > 0 else 0
                if diff <= allowed_delta or actual_val >= target_val:
                    param_score = 100.0
                    passed = True
                else:
                    ratio = max(0.0, 1.0 - (diff / max(1, target_val)))
                    param_score = round(ratio * 100.0, 2)
                    passed = False
            elif isinstance(target_val, bool):
                passed = (actual_val == target_val)
                param_score = 100.0 if passed else 0.0
            else: # Text / Semantic match
                s_target = str(target_val).lower().strip()
                s_actual = str(actual_val).lower().strip()
                passed = (s_target == s_actual or s_target in s_actual)
                param_score = 100.0 if passed else 40.0

            if is_hard_gate and not passed:
                hard_gate_failed = True
                disqualification_reasons.append(f"Failed hard requirement: {req_name} (Expected {target_val}, Got {actual_val})")

            weighted_contrib = (param_score * weight)
            total_weighted_score += weighted_contrib
            
            results.append({
                "parameter": req_name,
                "target": target_val,
                "actual": actual_val,
                "score": param_score,
                "weight": weight,
                "passed": passed,
                "is_hard_gate": is_hard_gate
            })

        overall_tech_score = round(total_weighted_score / max(1.0, total_weight), 2)
        
        return {
            "overall_tech_score": 0.0 if hard_gate_failed else overall_tech_score,
            "hard_gate_passed": not hard_gate_failed,
            "disqualified": hard_gate_failed,
            "disqualification_reasons": disqualification_reasons,
            "parameter_breakdown": results
        }

    @staticmethod
    def calculate_composite_score(
        bids: List[Dict[str, Any]], 
        budget_ceiling: float,
        collusion_disqualified_vendors: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Deterministic composite ranking across all validated bids:
        Formula: CompositeScore = 0.50 * TechScore + 0.40 * PriceCompetitiveness + 0.10 * TrackRecord
        """
        disqualified_set = set(collusion_disqualified_vendors or [])
        valid_bids = []
        
        for bid in bids:
            vid = bid.get("vendor_id")
            if vid in disqualified_set:
                bid_res = dict(bid)
                bid_res["status"] = "DISQUALIFIED_COLLUSION"
                bid_res["composite_score"] = 0.0
                bid_res["disqualification_reason"] = "UBO & Shell Company Forensics Flag: Collusive Bidding Ring Detected."
                valid_bids.append(bid_res)
                continue
                
            tech_eval = bid.get("tech_eval", {})
            if tech_eval.get("disqualified"):
                bid_res = dict(bid)
                bid_res["status"] = "DISQUALIFIED_TECHNICAL"
                bid_res["composite_score"] = 0.0
                bid_res["disqualification_reason"] = "; ".join(tech_eval.get("disqualification_reasons", []))
                valid_bids.append(bid_res)
                continue

            amount = bid.get("amount", budget_ceiling)
            if amount > budget_ceiling:
                bid_res = dict(bid)
                bid_res["status"] = "DISQUALIFIED_BUDGET_EXCEEDED"
                bid_res["composite_score"] = 0.0
                bid_res["disqualification_reason"] = f"Bid amount ${amount:,.2f} exceeds locked budget ceiling ${budget_ceiling:,.2f}."
                valid_bids.append(bid_res)
                continue

            # Price Score: lower is better within budget
            price_score = max(0.0, (1.0 - (amount / max(1.0, budget_ceiling))) * 100.0 + 50.0)
            price_score = min(100.0, price_score)
            
            tech_score = tech_eval.get("overall_tech_score", 70.0)
            track_score = bid.get("track_record_score", 85.0)
            
            composite = round((0.50 * tech_score) + (0.40 * price_score) + (0.10 * track_score), 2)
            
            bid_res = dict(bid)
            bid_res["status"] = "QUALIFIED"
            bid_res["price_score"] = round(price_score, 2)
            bid_res["tech_score"] = tech_score
            bid_res["track_record_score"] = track_score
            bid_res["composite_score"] = composite
            valid_bids.append(bid_res)

        # Sort descending by composite_score
        valid_bids.sort(key=lambda x: x.get("composite_score", 0.0), reverse=True)
        
        # Mark deterministic winner
        winner_found = False
        for b in valid_bids:
            if b["status"] == "QUALIFIED" and not winner_found:
                b["is_winner"] = True
                b["status"] = "DETERMINISTIC_WINNER"
                winner_found = True
            else:
                b["is_winner"] = False

        return valid_bids
