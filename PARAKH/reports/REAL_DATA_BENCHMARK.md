# PARAKH Real Indian Procurement Data Benchmark Report

**Benchmark Execution Date:** 2026-08-30 22:35:11 UTC  
**Target Environment:** Real-world Indian Government Procurement (Himachal Pradesh State / OCDS)  
**Evaluation Scope:** 4,209 contracts, 1,856 suppliers, 428 procuring entities  

---

## 1. Executive Summary & Scale

| Metric | Benchmark Result |
|---|---|
| **Total Real Procurement Records** | **4,209** |
| **Total Unique Indian Vendors** | **1,856** |
| **Total Procuring Entities (Departments)** | **428** |
| **Total Procurement Value Analyzed** | **₹3,870.39 Crores** |
| **Active Forensic Cases Opened** | **6** |
| **Cryptographic Blockchain Anchors** | **6** |
| **Benchmark Query Execution Time** | **0.556s** |

---

## 2. Corruption Risk Score (CRS) Distribution

The Corruption Risk Score ($CRS \in [0, 100]$) combines Explainable Red Flag Heuristics (80%) and 7D Isolation Forest Statistical Outlier Detection (20%).

| Risk Level | CRS Range | Contract Count | Percentage |
|---|:---:|:---:|:---:|
| **High Risk (Forensic Priority)** | $CRS \ge 70$ | **0** | **0.00%** |
| **Medium Risk (Auditor Review)** | $40 \le CRS < 70$ | **46** | **1.09%** |
| **Low Risk (Normal Baseline)** | $CRS < 40$ | **4,163** | **98.91%** |

### Score Summary Statistics
- **Mean CRS:** 13.02 / 100
- **Median CRS:** 12.00 / 100
- **Max CRS Observed:** 55 / 100
- **Mean Rule Score:** 12.28 / 100
- **Mean Isolation Forest Anomaly Score:** 15.96 / 100

---

## 3. Explainable Red Flag Heuristics Evaluation (RF-1 to RF-8)

| Flag ID | Indicator Name | Trigger Count | Trigger Rate | Description |
|---|---|:---:|:---:|---|
| **RF-1** | Single Bidder Tender | **152** | 3.61% | Only 1 participating bidder in tender |
| **RF-2** | Vendor Lock-in | **259** | 6.15% | Vendor won >60% of department contracts |
| **RF-3** | Threshold Manipulation | **64** | 1.52% | Contract value within 10% below ₹50L statutory threshold |
| **RF-4** | Compressed Tender Window | **343** | 8.15% | Tender open for < 7 days |
| **RF-5** | Estimate Deviation | **1,129** | 26.82% | Award price >30% above government estimate |
| **RF-6** | Repeat Winner Pattern | **1,390** | 33.02% | Supplier won ≥3 contracts from same entity |
| **RF-7** | Specification Tailoring | **0** | 0.00% | >85% TF-IDF match with supplier catalog |
| **RF-8** | Unusual Extensions | **0** | 0.00% | ≥2 long extensions observed |

---

## 4. Top 10 High-Risk Real Procurements

| Tender ID | Procuring Entity | Winning Vendor | Award Value (INR) | CRS | Anomaly Score | Triggered Red Flags |
|---|---|---|:---:|:---:|:---:|---|
| `2017_DIT_18899_1` | Director IT | Bharti Airtel Ltd | ₹367,431,669 | **55** | 76.0 | `RF-1, RF-2, RF-5` |
| `2018_FDC_19522_7` | DM FWD HAMIRPUR | DevDutt | ₹117,480 | **52** | 17.6 | `RF-1, RF-2, RF-4, RF-5` |
| `2018_FDC_19563_1` | Divisional Manager | KARTAR SINGH | ₹603,225 | **52** | 18.3 | `RF-1, RF-4, RF-5, RF-6` |
| `2018_MC_20282_10` | EE RB MC Shimla | naresh vij govt contracto | ₹1,524,496 | **52** | 61.1 | `RF-1, RF-5, RF-6` |
| `2017_FDC_18741_6` | DM Mandi | HARI CHAND | ₹503,177 | **51** | 17.1 | `RF-1, RF-2, RF-4, RF-5` |
| `2017_PWD_14798_13` | Executive Engineer | VIRENDER PRASHAD SHARMA | ₹4,987,269 | **51** | 34.2 | `RF-1, RF-3, RF-6` |
| `2017_PWD_15456_1` | Executive Engineer | Anil Kumar | ₹26,245,724 | **48** | 39.3 | `RF-1, RF-5, RF-6` |
| `2017_PWD_14798_10` | Executive Engineer | rajat thakur | ₹2,580,553 | **48** | 79.5 | `RF-1, RF-6` |
| `2018_HPIPH_19950_1` | Executive Engineer | Dinesh Kumar | ₹4,503,924 | **47** | 16.9 | `RF-1, RF-3, RF-6` |
| `2019_DFHW_28789_1` | Mission Director ional Health  | Ashok Chauhan and Co | ₹168,488,424 | **46** | 72.3 | `RF-2, RF-4, RF-5` |

---

## 5. Methodology & Responsible Audit Disclaimer
- **Unsupervised Anomaly vs Confirmed Misconduct:** All flagged records represent statistical anomalies or policy heuristic triggers indicating elevated audit risk. They do **not** constitute legal proof of corruption without formal forensic investigation.
- **Reproducibility:** This benchmark was executed directly against the live database seeded with `india_procurement_normalized.csv`.
