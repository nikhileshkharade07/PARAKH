# PARAKH — Repository-Wide Consistency Audit Report

**Audit Date:** September 1, 2026  
**Auditors:** QA Lead, Data Auditor & Senior ML Engineer  
**Objective:** Eliminate contradictions, verify numbers against physical artifacts, and clearly delineate Current vs Historical contexts.

---

## 1. Global Token & Value Consistency Classification

The table below classifies occurrences of key numerical, historical, and methodological terms across all codebase files and documentation:

| Token / Value | Occurrences & Contexts | Classification | Action Taken & Justification |
|---|---|:---:|---|
| `5,609` | Current Master Multi-Source Procurement Dataset size across 6 Indian jurisdictions. | **`CURRENT`** | Retained as the authoritative production dataset size across `data/catalog.json`, `README.md`, and audit reports. |
| `4,209` | Original Himachal Pradesh state dataset (CivicDataLab OCDS feed). | **`HISTORICAL / CONTEXTUAL`** | Explicitly labeled as the Himachal Pradesh component (4,209 records / ₹3,870.39 Cr) within the 6-state master dataset (5,609 records / ₹4,890.39 Cr). |
| `1,991` | Stratified forensic review queue annotations in `data/labels/reviewed_labels.csv`. | **`CURRENT`** | Verified. Traceability documented in `LABEL_PROVENANCE_FINAL.md`. |
| `2,500` | Legacy synthetic prototype benchmark dataset. | **`HISTORICAL / DEPRECATED`** | Moved to "Historical Benchmark — Deprecated" section in documentation. |
| `94.37%` / `86.63%` / `95.99%` / `0.9107` | Legacy prototype synthetic evaluation metrics. | **`HISTORICAL / DEPRECATED`** | Clarified as deprecated legacy numbers replaced by current 5,609-record multi-track benchmark. |
| `0.9835` / `0.9876` / `0.9795` / `0.9995` / `0.9980` | Current Hybrid PARAKH holdout test set performance (F1, Precision, Recall, PR-AUC, ROC-AUC). | **`CURRENT`** | Verified from raw model predictions on $N=300$ holdout test set with 95% bootstrap confidence intervals. |
| `1.0000` (RF & HistGBDT) | Pure tabular tree model holdout performance on structured risk features (`number_of_bidders`, price deviations). | **`CURRENT / NEEDS CONTEXT`** | Verified and explained in ML Section: holdout test set features allow clean decision tree partitioning; cross-validation reported at $0.9755 \pm 0.0031$. |
| `62 / 62` | Backend Pytest automated test pass count. | **`CURRENT`** | Verified passing via `pytest -v` (upgraded from 48 and 58 baseline). |
| `9 / 9` | Frontend Vitest test pass count. | **`CURRENT`** | Verified passing via `npm test -- --run`. |
| `expert-reviewed` | Previous term used for review queue annotations. | **`OUTDATED`** | Replaced with `human-reviewed` / `annotated records` since external domain expert credentials were not formally archived. |
| `100% accurate` / `zero hallucinations` | Uncalibrated marketing claims. | **`INCORRECT`** | Replaced with calibrated engineering terms: `strictly database-grounded query engine with parameterized execution` and `empirical 0.9835 test F1`. |
| `corruption detected` / `corruption proved` | Unwarranted judicial claims. | **`INCORRECT`** | Corrected across all documentation to `elevated procurement risk indicators` and `tamper-evident data integrity`. |

---

## 2. Reconciled Metrics Across Documentation

| Metric / Attribute | README.md | COMPLETION_REPORT.md | FINAL_AUDIT_REPORT.md | FINAL_ML_EVALUATION_REPORT.md | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **Total Master Records** | 5,609 | 5,609 | 5,609 | 5,609 | **CONSISTENT** |
| **Total Jurisdictions** | 6 | 6 | 6 | 6 | **CONSISTENT** |
| **Annotated Review Set** | 1,991 | 1,991 | 1,991 | 1,991 | **CONSISTENT** |
| **Holdout Test Set F1** | 0.9835 | 0.9835 | 0.9835 | 0.9835 | **CONSISTENT** |
| **5-Fold CV F1** | 0.9903 ± 0.0023 | 0.9903 ± 0.0023 | 0.9903 ± 0.0023 | 0.9903 ± 0.0023 | **CONSISTENT** |
| **Backend Tests** | 62 / 62 | 62 / 62 | 62 / 62 | 62 / 62 | **CONSISTENT** |
| **Frontend Tests** | 9 / 9 | 9 / 9 | 9 / 9 | 9 / 9 | **CONSISTENT** |
| **System Validator** | Exit Code 0 | Exit Code 0 | Exit Code 0 | Exit Code 0 | **CONSISTENT** |
