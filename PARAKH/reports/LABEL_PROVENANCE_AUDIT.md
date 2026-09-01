# PARAKH — Ground-Truth Label Provenance & Independence Audit Report

**Audit Date:** September 1, 2026  
**Auditors:** Senior Principal Engineer & Lead ML Scientist  
**Evaluated Artifacts:** `data/labels/reviewed_labels.csv`, `data/labels/dual_reviewed_labels.csv`, `data/labels/review_queue.csv`

---

## 1. Executive Summary & Label Taxonomy

PARAKH utilizes a formal **4-Tier Forensic Procurement Taxonomy** defined in [`docs/annotation_guidelines.md`](file:///c:/Users/user5/OneDrive/Pictures/edits/parakh/PARAKH/docs/annotation_guidelines.md):

| Label Tier | Taxonomy Level | Binary Target | Description | Audit Action |
|:---:|---|:---:|---|---|
| **0** | `NORMAL` | `0` (Benign) | Fully compliant competitive procurement | Normal archival |
| **1** | `SUSPICIOUS_PATTERN` | `0` (Benign) | Isolated single deviation without systemic collusion | Routine monitoring |
| **2** | `EXPERT_REVIEW_REQUIRED` | `1` (Audit Flag) | Compound risk factors requiring manual forensic audit | Priority audit queue |
| **3** | `VERIFIED_IRREGULARITY` | `1` (Audit Flag) | Severe monopolistic capture or extreme cost overrun | Forensic investigation case |

---

## 2. Label Generation & Annotation Provenance

### A. Traceability & Review Methodology
- **Universe:** 5,609 authentic public procurement contracts across 6 jurisdictions.
- **Review Queue Sampling:** Stratified sampling selected **1,991 contracts** into `data/labels/review_queue.csv`.
- **Reviewers:**
  - `AUDITOR_EXP_01`: Primary forensic annotator
  - `AUDITOR_EXP_02`: Secondary dual-blind annotator (evaluating 120 overlapping records for inter-rater agreement)
- **Features Reviewed:** `number_of_bidders`, `award_value`, `estimated_value`, `contract_duration`, `department`, `winning_supplier`, `extension_count`.
- **Inter-Rater Agreement:** **Binary Cohen's Kappa $\kappa = 0.7704$** (*Substantial Agreement*, 90.83% raw concordance).

---

## 3. Explanation of the 79.91% Positive Rate

In the annotated evaluation set ($N = 1,991$), the label distribution is:
- **Benign / Normal (Tiers 0 & 1):** 400 contracts (20.09%)
- **Actionable Audit Flag (Tiers 2 & 3):** 1,591 contracts (79.91%)

> [!IMPORTANT]
> **Forensic Sample Enrichment Notice:**  
> The annotated evaluation set of 1,991 records is an **intentionally enriched forensic triage sample** designed to evaluate model discrimination, threshold calibration, and false alarm rates under dense anomaly scenarios.  
> It does **NOT** represent the natural prevalence of procurement irregularities in the broader unstratified public procurement population (which is approximately **2.6%** at $CRS \ge 70$).

---

## 4. Label Independence & Multi-Track Isolation

To ensure scientific defensibility and eliminate circular evaluation, PARAKH separates model benchmarks into **four distinct tracks**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PARAKH 4-TRACK BENCHMARK ISOLATION                   │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK A — Heuristic Rule & Policy Sensitivity Benchmark                │
│           Evaluates explainable deterministic rules (RF-1..RF-8)       │
│           against composite policy risk triggers.                      │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK B — Pure Tabular Feature Machine Learning Benchmark              │
│           Features in X: [award_val, est_val, dev, bidders, duration]  │
│           • rule_score and CRS are EXCLUDED from X                     │
│           • Evaluated with StratifiedGroupKFold(groups=supplier_id)    │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK C — Unsupervised Statistical Anomaly Detection Benchmark        │
│           7-Dimensional Isolation Forest & Mahalanobis distance        │
│           • 100% label-free unsupervised outlier detection             │
├────────────────────────────────────────────────────────────────────────┤
│ TRACK D — External Jurisdiction & Temporal Generalization Benchmark    │
│           Leave-One-State-Out & Historical-to-Future Holdout Testing   │
└────────────────────────────────────────────────────────────────────────┘
```
