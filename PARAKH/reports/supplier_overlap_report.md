# PARAKH — Supplier Grouping & Leakage Audit Report

**Audit Date:** September 1, 2026  
**Total Evaluated Records:** 1,991 contracts  
**Total Unique Commercial Suppliers:** 530 vendors  
**Overall Status:** **PASSED — Zero Supplier Overlap under Stratified Group K-Fold**

---

## 1. Stratified Group K-Fold Results (`groups = supplier_id`)

Under `StratifiedGroupKFold`, all contracts awarded to a specific supplier are strictly assigned to either the training fold or validation fold, ensuring zero supplier identity leakage:

| Fold | Training Records | Validation Records | Training Suppliers | Validation Suppliers | Shared Suppliers | Leakage Status |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Fold 1 | 1,592 | 399 | 423 | 107 | **0** | **PASSED (0 Shared)** |
| Fold 2 | 1,592 | 399 | 420 | 110 | **0** | **PASSED (0 Shared)** |
| Fold 3 | 1,594 | 397 | 423 | 107 | **0** | **PASSED (0 Shared)** |
| Fold 4 | 1,594 | 397 | 427 | 103 | **0** | **PASSED (0 Shared)** |
| Fold 5 | 1,592 | 399 | 427 | 103 | **0** | **PASSED (0 Shared)** |

---

## 2. Comparison: Standard Stratified K-Fold vs Stratified Group K-Fold

- **Standard Stratified K-Fold:** Partitions records uniformly by class label; tenders from the same vendor may appear in both train and validation splits (evaluating *within-entity anomaly detection*).
- **Stratified Group K-Fold:** Enforces disjoint vendor partitions across folds (evaluating *cross-vendor inductive generalization*).
