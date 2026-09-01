# PARAKH — Final Remaining Issues & Action Matrix

**Audit Date:** September 1, 2026  
**Auditor:** Senior Principal Engineer & SIH Technical Lead  
**Scope:** Repository-wide audit against defensible scientific and production criteria.

---

## Issue Classification Matrix

| Issue ID | Severity | Area | Description | Status & Action Plan |
|---|:---:|---|---|---|
| **ISS-P1** | `HIGH` | Documentation | `README.md` contains historical references to 4,209 contracts, 48/48 tests, and lacks explicit separation between historical legacy benchmarks and active multi-track benchmarks. | **P1 Fix:** Update README badges, scope (5,609 contracts / 6 states / 62 tests), create explicit "Historical Benchmark — Deprecated" section, and detail Current Multi-Track Benchmark. |
| **ISS-P2** | `CRITICAL` | Label Provenance | 1,991 annotations were stratified using risk heuristic triggers and dual-annotators were simulated. Without explicit track separation, evaluating heuristic models on heuristic-filtered records risks perceived circularity. | **P2 Fix:** Create `reports/LABEL_PROVENANCE_AUDIT.md` fully detailing label origin, taxonomy, and enforce 5-track benchmark separation (Track A..E). |
| **ISS-P3** | `HIGH` | ML Performance | Random Forest and Gradient Boosting achieve high F1 ($1.00$ on holdout), primarily due to strong correlation between tabular features (`number_of_bidders=1`, price deviations) and audit criteria. | **P3 Fix:** Explicitly document why tree classifiers achieve near-perfect separation on structured criteria and demonstrate performance on pure tabular features with `StratifiedGroupKFold`. |
| **ISS-P4** | `HIGH` | Class Balance | 79.91% positive rate in the review queue (1,591 flagged vs 400 benign) represents an intentionally enriched forensic triage sample, not the population base rate (2.6%). | **P4 Fix:** Explicitly document forensic sample enrichment in `reports/LABEL_PROVENANCE_AUDIT.md` and `FINAL_AUDIT_REPORT.md`. |
| **ISS-P5** | `HIGH` | Model Separation | Need explicit tabular separation between Rule-Only Engine, Pure ML (excluding `rule_score` from $X$), and Hybrid PARAKH Classifier. | **P5 Fix:** Generate separate evaluation tables in benchmark results and audit reports. |
| **ISS-P6** | `HIGH` | Supplier Leakage | Standard K-Fold splits tenders randomly; need explicit verification of `StratifiedGroupKFold(groups=supplier_id)` with zero supplier overlap. | **P6 Fix:** Implement and output `reports/supplier_overlap_report.json` and `supplier_overlap_report.md`. |
| **ISS-P7** | `MEDIUM` | Provenance Audit | Physical presence, SHA-256 hashes, and record counts for all 6 jurisdictions in `data/catalog.json` must be strictly audited. | **P7 Fix:** Verify all 6 source artifacts on disk and record SHA-256 digests. |
| **ISS-P8** | `HIGH` | Metric Recalculation | Recalculate all confusion matrices ($TP+TN+FP+FN = N_{\text{test}}$), per-rule metrics, threshold sweeps, and ablation results from raw predictions. | **P8 Fix:** Run benchmark engine and verify test set confusion matrix identity ($239 + 53 + 3 + 5 = 300$). |
| **ISS-P9** | `MEDIUM` | Language Claims | Replace remaining absolute claims ("zero hallucination", "detects corruption", "expert-reviewed") with responsible, defensible terminology. | **P9 Fix:** Update documentation and frontend strings. |
| **ISS-P10** | `MEDIUM` | Test & Readiness Matrix | Create `reports/FINAL_TEST_MATRIX.md` and `reports/SIH_READINESS_REPORT.md` documenting test commands, judge questions, and live demo flows. | **P10 Fix:** Generate structured readiness matrices and execution guides. |
