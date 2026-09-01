# PARAKH — Feature & Data Leakage Audit Report

**Audit Date:** September 1, 2026  
**Auditors:** Lead ML Scientist & Security Engineer  
**Evaluated Pipeline:** `benchmark/evaluate_benchmark.py`, `scripts/check_data_leakage.py`

---

## 1. Feature Matrix Composition & Safety Audit

The following table documents every candidate feature considered for machine learning models, its source field, derivation logic, availability at prediction time, and leakage safety status:

| Feature Name | Source Column | Derivation Logic | Available at Triage? | Post-Outcome? | Derived from Target? | Leakage Safety |
|---|---|---|:---:|:---:|:---:|:---:|
| `award_value` | `award_value` | Float cast in INR | Yes | No | No | **SAFE** |
| `estimated_value` | `estimated_value` | Government sanctioned benchmark | Yes | No | No | **SAFE** |
| `price_deviation` | `(award - est) / est` | Percentage estimate variance | Yes | No | No | **SAFE** |
| `number_of_bidders` | `number_of_bidders` | Total bidding participants | Yes | No | No | **SAFE** |
| `contract_duration` | `submission_deadline - published_date` | Tender window in calendar days | Yes | No | No | **SAFE** |
| `vendor_wins` | `supplier_id` frequency | Historical contract win count | Yes | No | No | **SAFE** |
| `department_size` | `department` frequency | Total contracts issued by division | Yes | No | No | **SAFE** |
| `extension_count` | `extension_count` | Number of completion extensions | Yes | No | No | **SAFE** |
| `rule_score` | `prelim_risk_score` | Sum of RF-1..RF-8 heuristic points | Yes | No | Partial (Track A/Hybrid Only) | **EXCLUDED from Track B** |
| `crs` | `crs` | Composite Corruption Risk Score | Post-scoring | No | Target-derived | **EXCLUDED from X** |
| `binary_label` | `binary_label` | Target ground-truth class | Target | Yes | Target | **EXCLUDED from X** |

---

## 2. Partition Leakage Verification Results

Audit executed via `scripts/check_data_leakage.py`:

```json
{
  "status": "PASSED",
  "critical_leakage_detected": false,
  "train_samples": 1393,
  "val_samples": 298,
  "test_samples": 300,
  "tender_id_overlap": {
    "train_val": 0,
    "train_test": 0,
    "val_test": 0
  },
  "supplier_overlap_in_grouped_kfold": 0,
  "target_features_in_X": 0
}
```

- **Tender ID Overlap:** 0 records (`PASSED`)
- **Target Feature Leakage:** 0 features (`PASSED`)
- **Temporal Lookahead Leakage:** 0 in temporal holdout partitions (`PASSED`)
