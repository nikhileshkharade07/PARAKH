import numpy as np
try:
    from sklearn.ensemble import IsolationForest
except ImportError:
    IsolationForest = None


def _features(contract, peers):
    v_id = getattr(contract, "vendor_id", 1)
    vendor_wins = sum(getattr(c, "vendor_id", None) == v_id for c in peers)
    ratio = vendor_wins / len(peers) if peers else 0
    t_start = getattr(contract, "tender_start", None)
    t_end = getattr(contract, "tender_end", None)
    duration = (t_end - t_start).total_seconds() / 86400 if (t_end and t_start) else 14.0
    est_f = float(getattr(contract, "estimate_value", 0) or 0)
    awd_f = float(getattr(contract, "award_value", 0) or 0)
    deviation = (awd_f - est_f) / est_f if est_f > 0 else 0.0
    bids = getattr(contract, "bids", []) or []
    exts = getattr(contract, "extensions", []) or []
    return [
        awd_f, len(bids), duration,
        est_f, deviation, vendor_wins, ratio,
        len(exts), len(peers)
    ]


def anomaly_scores_for_contracts(contracts):
    """Fit one deterministic Isolation Forest for the dataset in O(N) feature extraction."""
    if len(contracts) < 2:
        return {id(c): 0.0 for c in contracts}

    # Pre-count vendor frequencies and department sizes in O(N)
    vendor_counts = {}
    dept_counts = {}
    for c in contracts:
        v_id = getattr(c, "vendor_id", 1)
        d_id = getattr(c, "department_id", 1)
        vendor_counts[v_id] = vendor_counts.get(v_id, 0) + 1
        dept_counts[d_id] = dept_counts.get(d_id, 0) + 1

    total_contracts = len(contracts)
    features_list = []
    for c in contracts:
        v_id = getattr(c, "vendor_id", 1)
        d_id = getattr(c, "department_id", 1)
        v_wins = vendor_counts.get(v_id, 1)
        ratio = v_wins / total_contracts if total_contracts else 0.0
        t_start = getattr(c, "tender_start", None)
        t_end = getattr(c, "tender_end", None)
        duration = (t_end - t_start).total_seconds() / 86400 if (t_end and t_start) else 14.0
        est_f = float(getattr(c, "estimate_value", 0) or 0)
        awd_f = float(getattr(c, "award_value", 0) or 0)
        dev = (awd_f - est_f) / est_f if est_f > 0 else 0.0
        bids = getattr(c, "bids", []) or []
        exts = getattr(c, "extensions", []) or []
        ext_count = len(exts)
        bids_count = len(bids) if bids else 1
        features_list.append([
            awd_f, bids_count, duration,
            est_f, dev, v_wins, ratio,
            ext_count, dept_counts.get(d_id, 1)
        ])

    X = np.array(features_list, dtype=float)
    if IsolationForest is not None:
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
    else:
        # Fallback: statistical z-score aggregate outlier metric
        means = X.mean(axis=0)
        stds = X.std(axis=0)
        stds[stds == 0] = 1.0
        z_scores = np.abs((X - means) / stds).sum(axis=1)
        z_lo, z_hi = float(z_scores.min()), float(z_scores.max())
        if z_hi <= z_lo:
            scores = np.zeros(len(contracts))
        else:
            scores = np.clip((z_scores - z_lo) / (z_hi - z_lo) * 100, 0, 100)

    return {id(c): float(s) for c, s in zip(contracts, scores)}



def anomaly_for_contract(contract, peers):
    """Convenience fallback for one-off API analysis."""
    scores = anomaly_scores_for_contracts(peers or [contract])
    return scores.get(id(contract), 0.0)
