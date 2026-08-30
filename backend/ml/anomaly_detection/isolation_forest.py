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
    """Fit one deterministic Isolation Forest for the demo dataset.

    This batch approach is important: fitting a new model for every contract
    would make a 2,500-record demo unnecessarily slow.
    """
    if len(contracts) < 2:
        return {id(c): 0.0 for c in contracts}

    X = np.array([_features(c, contracts) for c in contracts], dtype=float)
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
