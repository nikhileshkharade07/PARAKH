"""
scripts/check_data_leakage.py
------------------------------
Automated Data Leakage Detection Engine for PARAKH.
Verifies split integrity across Train, Validation, and Test partitions:
- Identical Tender ID Overlap
- Entity / Supplier Overlap across independent entity partitions
- Temporal Lookahead Leakage (Training on future, testing on past)
- Identical Feature Row Duplication
- Post-outcome Target Variable Leakage
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Set, Tuple, Any
import pandas as pd
import numpy as np

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("check_data_leakage")


def verify_split_leakage(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame, feature_cols: List[str], check_supplier_grouping: bool = False) -> Dict[str, Any]:
    """
    Perform comprehensive data leakage audit across train, validation, and test splits.
    Returns audit summary and raises RuntimeError if critical leakage is found.
    """
    logger.info(f"Running Data Leakage Verification on Train({len(train_df)}), Val({len(val_df)}), Test({len(test_df)})...")
    
    issues = []
    critical_leakage = False

    # 1. Tender ID Overlap Check
    train_ids = set(train_df["tender_id"].dropna().astype(str))
    val_ids = set(val_df["tender_id"].dropna().astype(str))
    test_ids = set(test_df["tender_id"].dropna().astype(str))

    train_val_id_leak = train_ids.intersection(val_ids)
    train_test_id_leak = train_ids.intersection(test_ids)
    val_test_id_leak = val_ids.intersection(test_ids)

    if train_val_id_leak or train_test_id_leak or val_test_id_leak:
        critical_leakage = True
        issues.append(f"CRITICAL: Duplicate Tender IDs across splits: Train-Val={len(train_val_id_leak)}, Train-Test={len(train_test_id_leak)}, Val-Test={len(val_test_id_leak)}")

    # 2. Duplicate Feature Vectors Check
    valid_cols = [c for c in (feature_cols or []) if c in train_df.columns and c in test_df.columns]
    if valid_cols:
        train_feat_tuples = set(tuple(x) for x in train_df[valid_cols].values)
        test_feat_tuples = set(tuple(x) for x in test_df[valid_cols].values)
        feat_overlap = train_feat_tuples.intersection(test_feat_tuples)
        if len(feat_overlap) > 0:
            issues.append(f"NOTICE: {len(feat_overlap)} identical feature rows present between train and test partitions.")

    # 3. Temporal Lookahead Leakage Check
    if "published_date" in train_df.columns and "published_date" in test_df.columns:
        train_dates = pd.to_datetime(train_df["published_date"], errors="coerce").dropna()
        test_dates = pd.to_datetime(test_df["published_date"], errors="coerce").dropna()
        if not train_dates.empty and not test_dates.empty:
            max_train_date = train_dates.max()
            min_test_date = test_dates.min()
            # If strictly temporal split
            if max_train_date > min_test_date and check_supplier_grouping is False:
                issues.append(f"NOTICE: Temporal overlap exists between Train max ({max_train_date.strftime('%Y-%m-%d')}) and Test min ({min_test_date.strftime('%Y-%m-%d')}) in standard stratified split.")

    # 4. Target Variable Leakage Check
    target_related_names = ["risk_flags", "flags", "crs", "rule_score", "anomaly_score", "label", "binary_label"]
    for col in feature_cols:
        if col.lower() in target_related_names:
            critical_leakage = True
            issues.append(f"CRITICAL: Target-derived feature '{col}' included in model predictor matrix X!")

    # 5. Supplier / Entity Grouping Verification (if group split requested)
    supplier_overlap_count = 0
    if check_supplier_grouping and "supplier_id" in train_df.columns and "supplier_id" in test_df.columns:
        train_sups = set(train_df["supplier_id"].dropna())
        test_sups = set(test_df["supplier_id"].dropna())
        sup_overlap = train_sups.intersection(test_sups)
        supplier_overlap_count = len(sup_overlap)
        if sup_overlap:
            issues.append(f"Grouped Split Leakage: {len(sup_overlap)} suppliers shared between train and test.")

    status = "PASSED" if not critical_leakage else "FAILED"
    result = {
        "status": status,
        "critical_leakage_detected": critical_leakage,
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "tender_id_overlap": {
            "train_val": len(train_val_id_leak),
            "train_test": len(train_test_id_leak),
            "val_test": len(val_test_id_leak)
        },
        "supplier_overlap_count": supplier_overlap_count,
        "issues": issues
    }

    if critical_leakage:
        logger.error(f"Leakage check FAILED: {issues}")
        raise RuntimeError(f"Data Leakage Verification Failed: {issues}")
    else:
        logger.info("Data Leakage Verification PASSED with 0 critical leakage vectors.")

    return result


if __name__ == "__main__":
    labels_csv = os.path.join(root_dir, "data", "labels", "reviewed_labels.csv")
    if os.path.exists(labels_csv):
        df = pd.read_csv(labels_csv)
        # Create test split
        n_total = len(df)
        n_train = int(n_total * 0.70)
        n_val = int(n_total * 0.15)
        
        train = df.iloc[:n_train]
        val = df.iloc[n_train:n_train+n_val]
        test = df.iloc[n_train+n_val:]
        
        res = verify_split_leakage(train, val, test, feature_cols=["risk_score_at_review"])
        print("\nLeakage Audit Summary:")
        print(json.dumps(res, indent=2))
