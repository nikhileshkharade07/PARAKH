# PARAKH Baseline Benchmark & Methodology Audit Report

**Date:** 2026-09-01  
**Auditor:** Lead Data Scientist & Senior ML/Data Engineer  
**Scope:** Evaluation methodology, target labels, statistical validity, and leakage risks in PARAKH repository.

---

## 1. Executive Summary of Baseline Audit

A thorough diagnostic audit was performed on the existing benchmark evaluation scripts (`backend/ml/evaluate_model.py`, `scripts/benchmark_real_data.py`, and historical documentation claims in `COMPLETION_REPORT.md` and `README.md`).

The audit reveals that while PARAKH's underlying engineering (deterministic rule engine RF-1 to RF-8, database schemas, and FastAPI services) is functional, the historical ML benchmark claims (**94.37% Accuracy, 86.63% Precision, 95.99% Recall**) were derived from a legacy constructed/synthetic dataset and suffer from severe methodological limitations when applied to real-world procurement data.

---

## 2. Baseline Benchmark Execution Results

Executing the baseline `backend/ml/evaluate_model.py` across all 4,221 database records produced the following results:

```
Total benchmark records analyzed: 4,221

--- Model / Pipeline: PARAKH Composite CRS Engine (0.80*Rule + 0.20*Anomaly >= 70) ---
Confusion Matrix:
  [ True Positives (TP):    0 | False Positives (FP):    0 ]
  [ False Negatives(FN):  110 | True Negatives  (TN): 4111 ]
Metrics:
  - Precision:          0.0000 (0.0%)
  - Recall (Sensitivity): 0.0000 (0.0%)
  - F1-Score:           0.0000
  - False Positive Rate:0.0000 (0.00%)
  - Accuracy:           0.9739 (97.4%)

--- Model / Pipeline: Rule-Based Heuristic Screening (RF-1 to RF-8) ---
Confusion Matrix:
  [ True Positives (TP):   98 | False Positives (FP):   54 ]
  [ False Negatives(FN):   12 | True Negatives  (TN): 4057 ]
Metrics:
  - Precision:          0.6447 (64.5%)
  - Recall (Sensitivity): 0.8909 (89.1%)
  - F1-Score:           0.7481
  - False Positive Rate:0.0131 (1.31%)
  - Accuracy:           0.9844 (98.4%)

--- Model / Pipeline: Isolation Forest 7D Statistical Anomaly Detector ---
Confusion Matrix:
  [ True Positives (TP):    2 | False Positives (FP):  117 ]
  [ False Negatives(FN):  108 | True Negatives  (TN): 3994 ]
Metrics:
  - Precision:          0.0168 (1.7%)
  - Recall (Sensitivity): 0.0182 (1.8%)
  - F1-Score:           0.0175
  - False Positive Rate:0.0285 (2.85%)
  - Accuracy:           0.9467 (94.7%)
```

---

## 3. Detailed Methodological Analysis

### Q1: What exactly is the target label?
In `backend/ml/evaluate_model.py` (lines 43–48):
```python
is_showcase = c.contract_number in {"GEM-DEMO-000007", "GEM-DEMO-000077", "GEM-DEMO-000777", "GEM-DEMO-001777"}
high_flags_count = sum(f.severity == "high" for f in c.risk_flags if f.detected)
actual_anomaly = 1 if (is_showcase or high_flags_count >= 2) else 0
```
The target label was not an externally validated forensic ground truth. It was a post-hoc programmatic pseudo-label.

### Q2: Where did the labels come from?
- For 4 demo showcase tenders, they were manually crafted synthetic test records.
- For the 4,209 authentic Himachal Pradesh records, no official ground truth labels were present in the source OCDS dataset. The evaluation code programmatically synthesized labels by querying its own `risk_flags`.

### Q3: Are labels synthetic?
Yes. Either explicitly synthetic (demo showcase records) or rule-synthesized pseudo-labels.

### Q4: Are labels manually reviewed?
No. There was no prior human-in-the-loop review workflow, inter-rater reliability analysis, or structured annotation queue.

### Q5: Is there leakage between train and test?
**Severe circular leakage:**
1. **Target-to-Predictor Leakage:** The pseudo-ground-truth label $y_{true}$ is defined using `high_flags_count >= 2`. The model `Rule-Based Heuristic Screening` then predicts $y_{pred}$ based on `rule_score >= 40`. Since `rule_score` is a weighted sum of those exact same flags, the model was essentially evaluating itself against its own internal features.
2. **No Holdout Partition:** 100% of the dataset was evaluated in-sample. There was no train/validation/test split or cross-validation.

### Q6: Is the benchmark classification or anomaly detection?
It conflated unsupervised anomaly detection (Isolation Forest) with supervised classification by imposing hard binary thresholds without threshold calibration, PR curves, or separate evaluation paradigms.

### Q7: How is "accuracy" calculated, and why is it misleading?
Accuracy is computed as $(TP + TN) / N$.
In this dataset, only 110 of 4,221 records (2.6%) were positive under the pseudo-label.
For the Composite CRS Engine ($CRS \ge 70$), $TP = 0, FP = 0, TN = 4111, FN = 110$.
Despite failing to flag a single positive case at the $\ge 70$ cutoff ($Recall = 0\%$), the accuracy was reported as **97.39%**. This is a textbook manifestation of the **Accuracy Paradox** in imbalanced classification.

### Q8: Is Isolation Forest being evaluated correctly?
No:
1. Feature scaling was not applied; raw INR contract amounts (up to ₹36 Crores) dominated features with smaller scales (e.g. bidder counts or tender durations).
2. It was evaluated against a heuristic rule-derived label rather than on statistical outlier detection or against an independent holdout.

### Q9: Are synthetic anomalies mixed with real data?
Yes, demo showcase anomalies (`GEM-DEMO-...`) were mixed directly with 4,209 real-world contracts in the same SQLite table.

### Q10: Is the test set independent?
No. There was no independent holdout set, no cross-validation, and no group-aware splitting to prevent supplier/department leakage.

---

## 4. Remediation Plan

To make PARAKH's evaluation scientifically defensible for SIH judges and data science audits, we establish:

1. **Strict Data Provenance**: Formalize `data/catalog.json` with source URLs, SHA-256 hashes, and raw-to-processed pipelines.
2. **Data Expansion & Canonical Schema**: Ingest and adapt multi-state and central procurement datasets into a universal schema.
3. **Data Quality Validation**: Implement automated data hygiene checks logging all schema and domain violations.
4. **Formal Ground-Truth Taxonomy & Expert Review Queue**: Define a 4-tier label taxonomy (`NORMAL`, `SUSPICIOUS_PATTERN`, `EXPERT_REVIEW_REQUIRED`, `VERIFIED_IRREGULARITY`), create annotation guidelines, sample 500+ stratified records for review, and evaluate inter-rater reliability.
5. **Separation of Synthetic vs Real-World Benchmarks**: Strict directory separation (`benchmark/synthetic/` vs `benchmark/`).
6. **Zero-Leakage Splitting**: Grouped and temporal train/val/test splits with automated leakage verification.
7. **8 Model Baselines & 5-Fold Cross-Validation**: Supervised baselines (Logistic Regression, Random Forest, Gradient Boosting), Unsupervised (Isolation Forest), Rule-Based, and Hybrid PARAKH reporting Precision, Recall, F1, PR-AUC, ROC-AUC, and 95% bootstrap confidence intervals.
8. **Ablation, Threshold, and Error Analyses**: Transparent analysis of per-rule contributions, operational risk thresholds, and failure modes.
9. **Claim Audit**: Replace ungrounded 94.37% claims with verified, reproducible benchmark results.
