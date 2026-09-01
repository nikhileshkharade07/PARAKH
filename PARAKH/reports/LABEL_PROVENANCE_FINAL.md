# PARAKH — Final Ground-Truth Label Provenance & Independence Audit

**Audit Date:** September 1, 2026  
**Auditors:** Senior Principal Engineer & Lead ML Scientist  
**Evaluated Artifacts:** `data/labels/reviewed_labels.csv`, `data/labels/dual_reviewed_labels.csv`, `data/labels/review_queue.csv`, `scripts/build_review_dataset.py`

---

## 1. Traceability of All Ground-Truth Labels

The table below documents the exact origin, generation methodology, human review role, and independence status for every label category in the PARAKH benchmark:

| Label Category | Source Dataset | Generation Method | Human Involved? | Rule-derived? | Model-derived? | Independent Status |
|---|---|---|:---:|:---:|:---:|---|
| **Tier 0: Normal / Benign** | `canonical_all_india_procurement.csv` | Random sampling of multi-bidder tenders with award values within sanctioned estimates ($\le 0\%$ deviation) | Yes (Annotator verification) | No | No | **INDEPENDENT** |
| **Tier 1: Suspicious Pattern** | `canonical_all_india_procurement.csv` | Stratified selection of tenders with isolated single indicator (e.g. short tender window) without systemic collusion | Yes (Annotator verification) | Partial (triage filter) | No | **PARTIAL (Evaluated in Track A/B)** |
| **Tier 2: Review Required** | `canonical_all_india_procurement.csv` | Stratified selection of tenders exhibiting compound risk triggers (sole bidder + price deviation) | Yes (Dual-annotator review) | Partial (triage filter) | No | **PARTIAL (Evaluated in Track A/B)** |
| **Tier 3: Verified Irregularity** | `canonical_all_india_procurement.csv` | Multi-jurisdiction records with extreme vendor lock-in (>60%), sole bidder monopolies, and repeat wins | Yes (Dual-annotator review) | Partial (triage filter) | No | **PARTIAL (Evaluated in Track A/B)** |
| **Synthetic Anomaly Injections** | Generated via `scripts/inject_synthetic_anomalies.py` | Deterministic parameter perturbations (setting `number_of_bidders=1`, inflating price by +45%) | No (Algorithmic) | Yes | No | **RULE-SENSITIVITY ONLY (Track A)** |

---

## 2. Terminology Clarification: Human-Reviewed vs Expert-Reviewed

- **Audit Finding:** The annotations in `data/labels/reviewed_labels.csv` were produced using structured forensic criteria (`AUDITOR_EXP_01` and `AUDITOR_EXP_02`), achieving a **Cohen's Kappa of $\kappa = 0.7704$** (Substantial Agreement, 90.83% concordance).
- **Remediation:** Because formal government procurement tribunal credentials were not archived, all documentation and code claims are standardized to **`annotated records`** or **`human-reviewed records`**, avoiding ungrounded "expert-reviewed" claims.

---

## 3. The 6 Explicit Evaluation Tracks

To eliminate circularity and prevent heuristic leakage, PARAKH separates all model evaluations into **six distinct tracks**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PARAKH 6-TRACK BENCHMARK ARCHITECTURE                │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK A: Rule-Derived / Heuristic Sensitivity Analysis                 │
│          Evaluates RF-1..RF-8 against composite policy risk triggers   │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK B: Independent Human Annotation Benchmark                        │
│          Evaluates model discrimination on human-reviewed labels       │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK C: Pure Machine Learning Benchmark                               │
│          Features in X: [award_val, est_val, dev, bidders, duration]  │
│          • rule_score and CRS EXCLUDED from X                          │
│          • Evaluated via StratifiedGroupKFold(groups=supplier_id)      │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK D: Unsupervised Statistical Anomaly Detection                   │
│          7-Dimensional Isolation Forest & Mahalanobis Distance         │
│          • 100% label-free unsupervised outlier detection              │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK E: Cross-Jurisdiction Generalization Benchmark                   │
│          Leave-One-State-Out (Trained on HP/MH/KA, Tested on RJ/UP)    │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK F: Temporal Generalization Benchmark                             │
│          Historical (<2020) to Future (2020+) Holdout Evaluation       │
└────────────────────────────────────────────────────────────────────────┘
```
