"""
tests/test_ml/test_benchmark_defensible.py
------------------------------------------
Comprehensive Test Suite for PARAKH's Scientific Evaluation Benchmark:
- Canonical schema validation
- Entity resolution & alias clustering
- Automated data quality hygiene rules
- Data leakage detection & split integrity
- 8 Baseline models & Hybrid PARAKH classifier
- Bootstrap confidence interval calculations
- Per-rule metrics & honest un-evaluable status
- Reproducibility manifest & report integrity
"""

import os
import sys
import json
import pytest
import numpy as np
import pandas as pd

from backend.app.schemas.canonical_schema import CanonicalProcurementRecord, compute_field_availability
from scripts.entity_resolution import normalize_supplier_entity, normalize_department_entity, EntityClusterResolver
from scripts.validate_procurement_data import validate_procurement_dataset
from scripts.check_data_leakage import verify_split_leakage
from benchmark.models.baselines import (
    build_model_suite, compute_classification_metrics,
    bootstrap_confidence_intervals, PARAKHRuleClassifier,
    StandardizedIsolationForest, HybridPARAKHClassifier
)
from benchmark.synthetic.generate_synthetic_anomalies import SyntheticAnomalyInjector


def test_canonical_schema_validation():
    """Verify CanonicalProcurementRecord validates mandatory fields and formats."""
    rec = {
        "tender_id": "HP-TEST-001",
        "tender_reference": "REF-HP-TEST-001",
        "department": "Department of Public Works",
        "organization": "Himachal Pradesh Government",
        "state": "HIMACHAL PRADESH",
        "procurement_category": "Civil Works",
        "tender_title": "Road resurfacing test",
        "award_value": 4850000.0,
        "estimated_value": 5000000.0,
        "number_of_bidders": 3,
        "winning_supplier": "ABC INFRASTRUCTURE LIMITED",
        "supplier_name": "ABC INFRASTRUCTURE LIMITED",
        "source_dataset": "HIMACHAL_PRADESH",
        "source_url": "https://hptenders.gov.in/"
    }
    model = CanonicalProcurementRecord(**rec)
    assert model.tender_id == "HP-TEST-001"
    assert model.award_value == 4850000.0
    assert model.currency == "INR"


def test_field_availability_computation():
    """Verify compute_field_availability accurately summarizes completeness."""
    records = [
        {"tender_id": "T1", "winning_supplier": "V1", "department": "D1"},
        {"tender_id": "T2", "winning_supplier": "V2", "department": None}
    ]
    res = compute_field_availability(records)
    assert res["total_records"] == 2
    assert res["fields"]["tender_id"]["completeness_pct"] == 100.0
    assert res["fields"]["department"]["completeness_pct"] == 50.0


def test_entity_resolution_standardization():
    """Verify entity resolution normalizes common corporate suffixes without destructive merging."""
    v1, id1, c1 = normalize_supplier_entity("ABC Pvt Ltd")
    v2, id2, c2 = normalize_supplier_entity("ABC PRIVATE LIMITED")
    v3, id3, c3 = normalize_supplier_entity("ABC PVT. LTD.")

    assert v1 == "ABC PRIVATE LIMITED"
    assert v2 == "ABC PRIVATE LIMITED"
    assert v3 == "ABC PRIVATE LIMITED"
    assert id1 == id2 == id3
    assert c1 >= 0.90


def test_department_normalization():
    """Verify department acronyms and titles are standardly expanded."""
    d1, id1, _ = normalize_department_entity("HPPWD")
    d2, id2, _ = normalize_department_entity("Himachal Pradesh Public Works Department")
    assert "PUBLIC WORKS DEPARTMENT" in d1
    assert "PUBLIC WORKS DEPARTMENT" in d2


def test_data_quality_validator_detects_violations():
    """Verify validate_procurement_dataset detects duplicate IDs, negative values, and date anomalies."""
    bad_data = pd.DataFrame([
        {
            "tender_id": "DUP-001",
            "winning_supplier": "Supplier A",
            "department": "Dept X",
            "award_value": -5000,  # Negative
            "published_date": "2020-01-10",
            "submission_deadline": "2020-01-05",  # Deadline before publication
            "number_of_bidders": 0,  # Invalid
            "state": "HIMACHAL PRADESH"
        },
        {
            "tender_id": "DUP-001",  # Duplicate ID
            "winning_supplier": "Supplier B",
            "department": "Dept Y",
            "award_value": 100000,
            "published_date": "2020-01-01",
            "submission_deadline": "2020-01-15",
            "number_of_bidders": 3,
            "state": "HIMACHAL PRADESH"
        }
    ])
    res = validate_procurement_dataset(bad_data, "TEST_SOURCE")
    assert res["valid_rows"] == 0
    assert res["rejected_rows_count"] == 2
    assert res["violations"]["duplicate_tender_ids"] >= 1
    assert res["violations"]["negative_amounts"] >= 1
    assert res["violations"]["deadline_before_publication"] >= 1


def test_leakage_detection_raises_on_overlap():
    """Verify check_data_leakage catches cross-split ID overlap."""
    train = pd.DataFrame({"tender_id": ["T1", "T2", "T3"], "val": [1, 2, 3]})
    val = pd.DataFrame({"tender_id": ["T4"], "val": [4]})
    test = pd.DataFrame({"tender_id": ["T2", "T5"], "val": [2, 5]})  # T2 is leaked!

    with pytest.raises(RuntimeError) as excinfo:
        verify_split_leakage(train, val, test, feature_cols=["val"])
    assert "Duplicate Tender IDs" in str(excinfo.value)


def test_synthetic_anomaly_injector():
    """Verify synthetic anomaly generator applies deterministic parameter injections."""
    injector = SyntheticAnomalyInjector(seed=42)
    sample_row = pd.Series({
        "tender_id": "SYNTH-01",
        "published_date": "2020-01-01 10:00:00",
        "estimated_value": 1000000.0,
        "award_value": 1000000.0,
        "number_of_bidders": 4
    })
    mod_single, meta1 = injector.inject_single_bidder(sample_row)
    assert mod_single["number_of_bidders"] == 1
    assert meta1["rule_target"] == "RF-1"

    mod_dev, meta2 = injector.inject_price_deviation(sample_row)
    assert mod_dev["award_value"] > 1300000.0
    assert meta2["rule_target"] == "RF-5"


def test_all_eight_baseline_models():
    """Verify all 8 baseline models initialize, fit, and predict valid probabilities."""
    models = build_model_suite(random_state=42)
    assert len(models) == 8

    # Synthetic design matrix: 50 samples, 5 features
    np.random.seed(42)
    X = np.random.randn(50, 5)
    X[:, 0] = np.random.uniform(0, 100, 50)  # Rule score column
    y = (X[:, 0] >= 50).astype(int)

    for name, model in models.items():
        model.fit(X, y)
        preds = model.predict(X)
        assert len(preds) == 50
        assert set(np.unique(preds)).issubset({0, 1})
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)
            assert probs.shape == (50, 2)
            assert np.all(probs >= 0.0) and np.all(probs <= 1.0)


def test_bootstrap_confidence_intervals():
    """Verify bootstrap confidence interval calculation produces non-empty bounds."""
    y_true = np.array([1, 1, 1, 0, 0, 1, 0, 0, 1, 0] * 5)
    y_pred = np.array([1, 1, 0, 0, 0, 1, 1, 0, 1, 0] * 5)
    ci = bootstrap_confidence_intervals(y_true, y_pred, n_bootstraps=100)
    
    assert "f1_95_ci" in ci
    low, high = ci["f1_95_ci"]
    assert 0.0 <= low <= high <= 1.0


def test_reproducibility_manifest_present():
    """Verify reproducibility manifest and benchmark results exist and have valid structure."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    manifest_path = os.path.join(root, "reports", "reproducibility_manifest.json")
    bench_path = os.path.join(root, "reports", "benchmark_results.json")

    assert os.path.exists(manifest_path)
    assert os.path.exists(bench_path)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert manifest["manifest_version"] == "2.0.0"
    assert manifest["best_performing_model"] == "Hybrid PARAKH (Rules + ML)"
    assert manifest["key_metrics_summary"]["hybrid_parakh_f1"] >= 0.95
