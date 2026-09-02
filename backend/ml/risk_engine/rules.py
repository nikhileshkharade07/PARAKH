import json

def tender_duration_days(contract):
    return (contract.tender_end - contract.tender_start).total_seconds() / 86400

def price_deviation(contract):
    if not contract.estimate_value or float(contract.estimate_value) == 0:
        return 0.0
    return (float(contract.award_value) - float(contract.estimate_value)) / float(contract.estimate_value)

def evaluate_rules(contract, department_contracts=None, settings=None):
    if settings is None:
        from app.core.config import settings as default_settings
        settings = default_settings
        
    bidder_count = len(contract.bids) if contract.bids else 1
    duration = tender_duration_days(contract)
    deviation = price_deviation(contract)
    peers = department_contracts or []
    vendor_wins = sum(c.vendor_id == contract.vendor_id for c in peers)
    ratio = vendor_wins / len(peers) if peers else 0
    long_extensions = sum(
        e.extension_days >= settings.unusual_extension_days for e in (contract.extensions or [])
    )
    award_val = float(contract.award_value)
    thresh = float(settings.approval_threshold)

    spec = getattr(contract, "specification", None) or ""
    vendor_desc = ""
    if hasattr(contract, "vendor") and contract.vendor:
        vendor_desc = getattr(contract.vendor, "product_description", None) or ""
    elif hasattr(contract, "vendor_product_description"):
        vendor_desc = getattr(contract, "vendor_product_description", None) or ""

    try:
        from ml.nlp.similarity import specification_similarity
    except ImportError:
        try:
            from backend.ml.nlp.similarity import specification_similarity
        except ImportError:
            specification_similarity = None

    nlp_sim = 0.0
    nlp_flagged = False
    nlp_expl = "No unusually high specification similarity detected."
    if specification_similarity and spec and vendor_desc:
        nlp_res = specification_similarity(spec, vendor_desc, settings.nlp_similarity_threshold)
        nlp_sim = nlp_res.get("similarity_score", 0.0)
        nlp_flagged = nlp_res.get("flagged", False)
        nlp_expl = nlp_res.get("explanation", nlp_expl)

    return [
        {
            "flag_id": "RF-1",
            "flag_name": "Single Bidder Tender",
            "detected": bidder_count == 1,
            "severity": "high",
            "score": 20,
            "explanation": "Only one bidder participated in this tender.",
            "evidence": {
                "bidder_count": bidder_count,
                "tender_number": contract.contract_number
            },
            "recommended_action": "Request administrative rationale for single-bidder tender award without retendering."
        },
        {
            "flag_id": "RF-2",
            "flag_name": "Vendor Lock-in",
            "detected": ratio > settings.vendor_lockin_threshold,
            "severity": "high",
            "score": 20,
            "explanation": f"Vendor won {ratio:.0%} of contracts observed for this department (Threshold: {settings.vendor_lockin_threshold:.0%}).",
            "evidence": {
                "vendor_wins": vendor_wins,
                "total_peer_contracts": len(peers),
                "department_contracts": len(peers),
                "win_ratio": ratio,
                "threshold": settings.vendor_lockin_threshold
            },
            "recommended_action": "Review department vendor allocation policies and evaluate competitive barrier complaints."
        },
        {
            "flag_id": "RF-3",
            "flag_name": "Approval Threshold Manipulation",
            "detected": award_val <= thresh and award_val >= thresh * 0.90,
            "severity": "high",
            "score": 15,
            "explanation": f"Contract value (₹{award_val:,.0f}) is within 10% below statutory threshold (₹{thresh:,.0f}).",
            "evidence": {
                "award_value": award_val,
                "approval_threshold": thresh,
                "ratio_to_threshold": award_val / thresh if thresh else 0,
                "threshold_ratio": round(award_val / thresh, 3) if thresh else 0
            },
            "recommended_action": "Investigate potential artificial contract splitting designed to evade higher-level administrative approval."
        },
        {
            "flag_id": "RF-4",
            "flag_name": "Compressed Tender Window",
            "detected": duration < settings.tender_duration_threshold_days,
            "severity": "medium",
            "score": 10,
            "explanation": f"Tender was open for {duration:.1f} days, below the configured statutory minimum of {settings.tender_duration_threshold_days} days.",
            "evidence": {
                "tender_duration_days": duration,
                "threshold_days": settings.tender_duration_threshold_days,
                "min_required_days": settings.tender_duration_threshold_days
            },
            "recommended_action": "Audit public portal publication logs to verify whether tender advertisement met statutory notice requirements."
        },
        {
            "flag_id": "RF-5",
            "flag_name": "Estimate Deviation",
            "detected": deviation > settings.price_deviation_threshold,
            "severity": "medium",
            "score": 10,
            "explanation": f"Award price was {deviation:.0%} above the sanctioned government estimate (Threshold: {settings.price_deviation_threshold:.0%}).",
            "evidence": {
                "estimated_value": float(contract.estimate_value) if contract.estimate_value else 0.0,
                "estimate_value": float(contract.estimate_value) if contract.estimate_value else 0.0,
                "award_value": award_val,
                "deviation_percent": deviation * 100,
                "deviation_pct": round(deviation, 3)
            },
            "recommended_action": "Examine justification for premium over estimate and review cost engineering assumptions."
        },
        {
            "flag_id": "RF-6",
            "flag_name": "Repeat Winner / Network Pattern",
            "detected": vendor_wins >= 3,
            "severity": "high",
            "score": 20,
            "explanation": f"Vendor has repeatedly won contracts from this department ({vendor_wins} observed wins).",
            "evidence": {
                "vendor_wins": vendor_wins,
                "department_contracts_observed": len(peers),
                "threshold_wins": 3
            },
            "recommended_action": "Conduct cross-vendor bid pattern forensic check to rule out rotational bidding or cartel behavior."
        },
        {
            "flag_id": "RF-7",
            "flag_name": "Specification Tailoring",
            "detected": nlp_flagged,
            "severity": "medium",
            "score": 15,
            "explanation": nlp_expl,
            "evidence": {
                "similarity_score": nlp_sim,
                "threshold": settings.nlp_similarity_threshold
            },
            "recommended_action": "Compare technical specifications against proprietary product catalog of the winning supplier."
        },
        {
            "flag_id": "RF-8",
            "flag_name": "Unusual Extensions",
            "detected": long_extensions >= 2,
            "severity": "low",
            "score": 5,
            "explanation": f"{long_extensions} unusually long contract extensions were observed.",
            "evidence": {
                "long_extensions_count": long_extensions,
                "extension_count": long_extensions,
                "extension_threshold_days": settings.unusual_extension_days,
                "min_days": settings.unusual_extension_days,
                "extensions": [e.extension_days for e in (contract.extensions or [])]
            },
            "recommended_action": "Audit contract amendment records and reason for repetitive project delivery delays."
        },
    ]
