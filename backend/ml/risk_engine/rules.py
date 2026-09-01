from typing import List, Dict, Any, Optional
from app.core.config import settings as default_settings

def tender_duration_days(contract) -> float:
    if not contract.tender_start or not contract.tender_end:
        return 14.0
    return max(0.0, (contract.tender_end - contract.tender_start).total_seconds() / 86400)

def price_deviation(contract) -> float:
    if not contract.estimate_value or float(contract.estimate_value) <= 0:
        return 0.0
    return (float(contract.award_value) - float(contract.estimate_value)) / float(contract.estimate_value)

def evaluate_rules(contract, department_contracts=None, settings=None) -> List[Dict[str, Any]]:
    if settings is None:
        settings = default_settings

    bids = contract.bids or []
    bidder_count = len(bids)
    duration = tender_duration_days(contract)
    deviation = price_deviation(contract)
    peers = department_contracts or []
    
    vendor_wins = sum(1 for c in peers if c.vendor_id == contract.vendor_id)
    peer_count = len(peers)
    ratio = (vendor_wins / peer_count) if peer_count > 0 else 0.0
    
    extensions = contract.extensions or []
    long_extensions = [e for e in extensions if e.extension_days >= settings.unusual_extension_days]
    total_ext_days = sum(e.extension_days for e in extensions)
    
    award_val = float(contract.award_value or 0)
    est_val = float(contract.estimate_value or 0)
    approval_limit = float(settings.approval_threshold)

    # Rule detections
    rf1_detected = bidder_count == 1
    rf2_detected = ratio > settings.vendor_lockin_threshold and peer_count >= 3
    rf3_detected = (award_val <= approval_limit) and (award_val >= approval_limit * 0.90) and (approval_limit > 0)
    rf4_detected = duration < settings.tender_duration_threshold_days
    rf5_detected = deviation > settings.price_deviation_threshold
    rf6_detected = vendor_wins >= 3
    rf7_detected = False # Updated via NLP similarity in risk engine
    rf8_detected = len(long_extensions) >= 2 or total_ext_days >= (settings.unusual_extension_days * 2)

    return [
        {
            "flag_id": "RF-1",
            "flag_name": "Single Bidder",
            "detected": rf1_detected,
            "severity": "high",
            "score": 20,
            "explanation": "Only one bidder participated in this competitive tender, indicating potential market restriction or suppression.",
            "evidence": {
                "bidder_count": bidder_count,
                "bidders": [b.vendor_name for b in bids],
                "award_value": award_val
            },
            "recommended_action": "Audit tender advertisement reach and verify whether tender requirements discouraged fair competition."
        },
        {
            "flag_id": "RF-2",
            "flag_name": "Vendor Lock-in",
            "detected": rf2_detected,
            "severity": "high",
            "score": 20,
            "explanation": f"Vendor captured {ratio:.1%} of observed contracts ({vendor_wins}/{peer_count}) for this department, surpassing the {settings.vendor_lockin_threshold:.0%} threshold.",
            "evidence": {
                "vendor_wins": vendor_wins,
                "department_total_contracts": peer_count,
                "win_ratio": round(ratio, 3),
                "threshold": settings.vendor_lockin_threshold
            },
            "recommended_action": "Investigate department vendor allocation practices and examine whether technical requirements favor incumbent vendor."
        },
        {
            "flag_id": "RF-3",
            "flag_name": "Threshold Proximity",
            "detected": rf3_detected,
            "severity": "high",
            "score": 15,
            "explanation": f"Contract award value (₹{award_val:,.2f}) is structured within 10% below the approval threshold of ₹{approval_limit:,.2f}, indicating possible threshold-splitting.",
            "evidence": {
                "award_value": award_val,
                "approval_threshold": approval_limit,
                "proximity_percentage": round((award_val / approval_limit) * 100, 2) if approval_limit > 0 else 0
            },
            "recommended_action": "Verify if multiple smaller contracts were awarded concurrently to bypass higher-tier administrative sanction."
        },
        {
            "flag_id": "RF-4",
            "flag_name": "Compressed Tender Window",
            "detected": rf4_detected,
            "severity": "medium",
            "score": 10,
            "explanation": f"Tender was open for only {duration:.1f} days, below the required minimum window of {settings.tender_duration_threshold_days} days.",
            "evidence": {
                "tender_duration_days": round(duration, 1),
                "threshold_days": settings.tender_duration_threshold_days,
                "tender_start": contract.tender_start.isoformat() if contract.tender_start else None,
                "tender_end": contract.tender_end.isoformat() if contract.tender_end else None
            },
            "recommended_action": "Inspect publishing logs to verify why standard public advertisement timeframe was compressed."
        },
        {
            "flag_id": "RF-5",
            "flag_name": "Bid/Estimate Deviation",
            "detected": rf5_detected,
            "severity": "medium",
            "score": 10,
            "explanation": f"Award value exceeds internal department cost estimate by {deviation:.1%}, exceeding allowable variance threshold of {settings.price_deviation_threshold:.0%}.",
            "evidence": {
                "estimate_value": est_val,
                "award_value": award_val,
                "deviation_percentage": round(deviation * 100, 2),
                "deviation_threshold": settings.price_deviation_threshold
            },
            "recommended_action": "Review initial cost estimation methodology and price negotiation committee minutes."
        },
        {
            "flag_id": "RF-6",
            "flag_name": "Repeat Winner Pattern",
            "detected": rf6_detected,
            "severity": "high",
            "score": 20,
            "explanation": f"Vendor has repeatedly won multiple consecutive contracts ({vendor_wins} observed awards) with this procuring entity.",
            "evidence": {
                "observed_wins": vendor_wins,
                "vendor_id": contract.vendor_id,
                "department_id": contract.department_id
            },
            "recommended_action": "Cross-reference bidder rotation patterns and beneficial ownership records for collusion."
        },
        {
            "flag_id": "RF-7",
            "flag_name": "Specification Tailoring",
            "detected": rf7_detected,
            "severity": "medium",
            "score": 15,
            "explanation": "No unusually high specification similarity detected.",
            "evidence": {
                "similarity_score": 0.0,
                "threshold": settings.nlp_similarity_threshold
            },
            "recommended_action": "Perform semantic specification comparison against vendor product catalog."
        },
        {
            "flag_id": "RF-8",
            "flag_name": "Unusual Extensions",
            "detected": rf8_detected,
            "severity": "low",
            "score": 5,
            "explanation": f"Observed {len(long_extensions)} extended milestone delays totalling {total_ext_days} days.",
            "evidence": {
                "total_extension_days": total_ext_days,
                "long_extensions_count": len(long_extensions),
                "threshold_days": settings.unusual_extension_days,
                "reasons": [e.reason for e in extensions if e.reason]
            },
            "recommended_action": "Examine justification for project schedule overruns and contractor performance penalties."
        }
    ]
