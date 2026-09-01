from typing import List, Dict
import numpy as np
from sklearn.ensemble import IsolationForest

def _features(contract, peers):
    peer_list = peers or []
    vendor_wins = sum(1 for c in peer_list if c.vendor_id == contract.vendor_id)
    ratio = (vendor_wins / len(peer_list)) if peer_list else 0.0

    if contract.tender_end and contract.tender_start:
        duration = max(0.0, (contract.tender_end - contract.tender_start).total_seconds() / 86400)
    else:
        duration = 14.0

    award_val = float(contract.award_value or 0)
    est_val = float(contract.estimate_value or 0)
    deviation = ((award_val - est_val) / est_val) if est_val > 0 else 0.0
    bids_count = len(contract.bids) if contract.bids else 1
    exts_count = len(contract.extensions) if contract.extensions else 0

    return [
        award_val,
        bids_count,
        duration,
        est_val,
        deviation,
        vendor_wins,
        ratio,
        exts_count,
        len(peer_list)
    ]

def anomaly_scores_for_contracts(contracts: List) -> Dict[int, float]:
    """Fit one deterministic Isolation Forest for contracts batch."""
    if not contracts or len(contracts) < 2:
        return {id(c): 0.0 for c in (contracts or [])}

    try:
        X = np.array([_features(c, contracts) for c in contracts], dtype=float)
        # Handle NaN or Inf values
        X = np.nan_to_num(X, nan=0.0, posinf=1e9, neginf=-1e9)
        
        model = IsolationForest(
            n_estimators=100,
            contamination="auto",
            random_state=42,
        )
        model.fit(X)

        raw = -model.decision_function(X)
        lo, hi = float(raw.min()), float(raw.max())
        if hi <= lo:
            scores = np.zeros(len(contracts))
        else:
            scores = np.clip((raw - lo) / (hi - lo) * 100, 0, 100)

        return {id(c): round(float(s), 2) for c, s in zip(contracts, scores)}
    except Exception:
        return {id(c): 0.0 for c in contracts}

def anomaly_for_contract(contract, peers: List) -> float:
    """Convenience fallback for one-off API analysis."""
    if not contract:
        return 0.0
    peer_pool = peers if (peers and len(peers) > 1) else [contract, contract]
    scores = anomaly_scores_for_contracts(peer_pool)
    return scores.get(id(contract), 0.0)
