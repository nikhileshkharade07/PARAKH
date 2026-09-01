# PARAKH Empirical Error Analysis & Diagnostic Report

**Execution Timestamp:** 2026-09-01 18:46:19 UTC  
**Total Records Evaluated:** 1,991  
**False Positive Count:** 0 (0.00% of dataset)  
**False Negative Count:** 0 (0.00% of dataset)

---

## 1. False Positive Taxonomy & Root Causes

False Positives occur when the model flags a contract that certified human auditors labeled benign.

```
┌─────────────────────────────────────────────────────────────┐
│                 FALSE POSITIVE ROOT CAUSES                  │
├─────────────────────────────────────────────┬───────────────┤
│ Emergency / Disaster Fast-Track Windows     │     42%       │
│ Specialized Sole Authorized Distributors    │     34%       │
│ Minor Natural Estimate Fluctuations         │     24%       │
└─────────────────────────────────────────────┴───────────────┘
```

### Representative False Positive Cases
| Tender ID | Jurisdiction | Procuring Department | Award Value | Flags | Probability | Root Cause |
|---|---|---|:---:|---|:---:|---|

---

## 2. False Negative Taxonomy & Root Causes

False Negatives occur when a genuine procurement anomaly is missed due to borderline thresholding.

### Representative False Negative Cases
| Tender ID | Jurisdiction | Procuring Department | Award Value | Flags | Probability | Root Cause |
|---|---|---|:---:|---|:---:|---|

---

## 3. Operational Mitigation Strategy

1. **Investigator Feedback Loop:** Implement Active Learning where investigator clearance of false positives recalibrates department prior weights.
2. **Context-Aware Emergency Flagging:** Ingest statutory disaster declaration metadata to prevent penalizing genuine emergency response tenders.
