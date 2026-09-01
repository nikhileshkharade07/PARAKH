import numpy as np
from sklearn.ensemble import IsolationForest


def _features(contract, peers):
    vendor_wins = sum(c.vendor_id == contract.vendor_id for c in peers)
    ratio = vendor_wins / len(peers) if peers else 0
    duration = (contract.tender_end - contract.tender_start).total_seconds() / 86400
    deviation = (
        (float(contract.award_value) - float(contract.estimate_value))
        / float(contract.estimate_value)
        if contract.estimate_value else 0
    )
    return [
        float(contract.award_value), len(contract.bids), duration,
        float(contract.estimate_value), deviation, vendor_wins, ratio,
        len(contract.extensions), len(peers)
    ]


def anomaly_scores_for_contracts(contracts):
    """Fit one deterministic Isolation Forest for the dataset in O(N) feature extraction."""
    if len(contracts) < 2:
        return {id(c): 0.0 for c in contracts}

    # Pre-count vendor frequencies and department sizes in O(N)
    vendor_counts = {}
    dept_counts = {}
    for c in contracts:
        vendor_counts[c.vendor_id] = vendor_counts.get(c.vendor_id, 0) + 1
        dept_counts[c.department_id] = dept_counts.get(c.department_id, 0) + 1

    total_contracts = len(contracts)
    features_list = []
    for c in contracts:
        v_wins = vendor_counts.get(c.vendor_id, 1)
        ratio = v_wins / total_contracts if total_contracts else 0.0
        duration = (c.tender_end - c.tender_start).total_seconds() / 86400 if (c.tender_end and c.tender_start) else 14.0
        est_f = float(c.estimate_value) if c.estimate_value else 0.0
        awd_f = float(c.award_value) if c.award_value else 0.0
        dev = (awd_f - est_f) / est_f if est_f > 0 else 0.0
        ext_count = len(c.extensions) if hasattr(c, "extensions") and c.extensions else 0
        bids_count = len(c.bids) if hasattr(c, "bids") and c.bids else 1
        features_list.append([
            awd_f, bids_count, duration,
            est_f, dev, v_wins, ratio,
            ext_count, dept_counts.get(c.department_id, 1)
        ])

    X = np.array(features_list, dtype=float)
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

    return {id(c): float(s) for c, s in zip(contracts, scores)}


def anomaly_for_contract(contract, peers):
    """Convenience fallback for one-off API analysis."""
    scores = anomaly_scores_for_contracts(peers or [contract])
    return scores.get(id(contract), 0.0)
