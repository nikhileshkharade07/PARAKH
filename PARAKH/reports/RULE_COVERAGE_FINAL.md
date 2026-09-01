# PARAKH — Explainable Rule Coverage & Source Data Feasibility Audit

**Audit Date:** September 1, 2026  
**Auditor:** Senior Data Engineer & SIH Technical Auditor  
**Scope:** Evaluation of 8 Explainable Red Flag Heuristics (RF-1 to RF-8) across 5,609 Multi-Source Procurement Contracts.

---

## 1. Rule Coverage & Empirical Availability Matrix

| Rule ID | Indicator Name | Required Source Fields | Available in Standard Portals? | Evaluable on Real Data? | Real Data Matches | Prevalence | Evaluation Paradigm |
|---|---|---|:---:|:---:|:---:|:---:|---|
| **RF-1** | Single Bidder Tender | `number_of_bidders` | Yes | **YES** | 152 | 2.71% | Evaluated on real contracts |
| **RF-2** | Vendor Departmental Lock-in | `winning_supplier`, `department` | Yes | **YES** | 259 | 4.62% | Evaluated on real contracts |
| **RF-3** | Approval Threshold Proximity | `award_value` | Yes | **YES** | 64 | 1.14% | Evaluated on real contracts |
| **RF-4** | Compressed Tender Window | `published_date`, `submission_deadline` | Yes | **YES** | 343 | 6.12% | Evaluated on real contracts |
| **RF-5** | Price Estimate Deviation | `award_value`, `estimated_value` | Yes | **YES** | 1,129 | 20.13% | Evaluated on real contracts |
| **RF-6** | Repeat Winner Pattern | `winning_supplier`, `department` | Yes | **YES** | 1,390 | 24.78% | Evaluated on real contracts |
| **RF-7** | Specification Tailoring | `tender_spec_text`, `supplier_product_text` | No (PDF only) | **NOT EVALUABLE** | `0` | `N/A` | Evaluated in isolated synthetic NLP benchmark |
| **RF-8** | Unusual Extensions | `original_deadline`, `extension_dates_list` | No (Summary tabular only) | **NOT EVALUABLE** | `0` | `N/A` | Evaluated in isolated synthetic extension benchmark |

---

## 2. Technical Justification of Limitations for RF-7 and RF-8

1. **RF-7 (Specification Tailoring):**  
   Standard state summary e-procurement portal dumps provide metadata (title, dates, values, vendor names) but do not publish full-text Bill of Quantities (BOQ) technical specifications in tabular CSV format. The TF-IDF cosine similarity engine is fully implemented and tested via `tests/test_ml/test_nlp.py` and live demo endpoint `/api/nlp/similarity`, but is honestly marked as `NOT_EVALUABLE_DUE_TO_SOURCE_DATA` on bulk state CSVs.

2. **RF-8 (Unusual Extensions):**  
   Summary public procurement feeds record the final award date and original publication date, but do not provide an itemized chronological log of interim time extension addenda. The rule logic is tested via `tests/test_ml/test_rules.py::test_rf8_unusual_extensions`, and marked as `NOT_EVALUABLE_DUE_TO_SOURCE_DATA` on raw portal feeds.
