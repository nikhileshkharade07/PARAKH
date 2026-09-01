# PARAKH Data Quality & Provenance Validation Report

**Execution Timestamp:** 2026-09-01 18:45:01 UTC  
**Validation Engine:** Automated Schema, Domain Constraint, and Hygiene Validator  
**Overall Data Quality Score:** **100.00%** (5,609 valid of 5,609 total records)

---

## 1. Executive Summary Across Sources

| Metric | Overall Value |
|---|---|
| **Total Sources Audited** | **6** |
| **Total Ingested Procurement Records** | **5,609** |
| **Passed Quality Filters (Valid Rows)** | **5,609** (100.00%) |
| **Rejected Anomalous / Corrupted Rows** | **0** (0.00%) |

---

## 2. Source-Wise Data Quality Breakdown

| Source Identifier | Total Records | Valid Rows | Rejections | Quality Score | Top Constraint Violations |
|---|:---:|:---:|:---:|:---:|---|
| **HIMACHAL_PRADESH** | 4,209 | 4,209 | 0 | **100.0%** | None (100% Clean) |
| **CENTRAL_CPPP** | 350 | 350 | 0 | **100.0%** | None (100% Clean) |
| **MAHARASHTRA** | 300 | 300 | 0 | **100.0%** | None (100% Clean) |
| **KARNATAKA** | 250 | 250 | 0 | **100.0%** | None (100% Clean) |
| **RAJASTHAN** | 250 | 250 | 0 | **100.0%** | None (100% Clean) |
| **UTTAR_PRADESH** | 250 | 250 | 0 | **100.0%** | None (100% Clean) |

---

## 3. Universal Domain Validation Rules Enforced

1. **Deterministic Unique Tender ID:** No duplicate contracts allowed within same partition.
2. **Entity Completeness:** Explicit winning supplier and procuring department required.
3. **Financial Sanity:** Positive award or estimated values ($> ₹0$). Zero/negative values strictly quarantined.
4. **Chronological Validity:** Submission deadline must be strictly after publication date.
5. **Competition Bounds:** Number of participating bidders bounded in $[1, 1000]$.
6. **Geographic Standardization:** Canonical validation against official Indian States/UTs.

---

## 4. Field Completeness Statistics (Primary Real Dataset)
| Canonical Field | Available Count | Completeness Percentage |
|---|:---:|:---:|
| `tender_id` | 4,209 | 100.0% |
| `tender_reference` | 4,209 | 100.0% |
| `department` | 4,209 | 100.0% |
| `organization` | 4,209 | 100.0% |
| `state` | 4,209 | 100.0% |
| `district` | 4,209 | 100.0% |
| `location` | 4,209 | 100.0% |
| `procurement_category` | 4,209 | 100.0% |
| `tender_title` | 4,209 | 100.0% |
| `description` | 4,209 | 100.0% |
| `published_date` | 4,209 | 100.0% |
| `submission_deadline` | 4,209 | 100.0% |
| `opening_date` | 4,209 | 100.0% |
| `contract_date` | 4,209 | 100.0% |
| `estimated_value` | 4,209 | 100.0% |
| `award_value` | 4,209 | 100.0% |
| `currency` | 4,209 | 100.0% |
| `number_of_bidders` | 4,209 | 100.0% |
| `winning_supplier` | 4,209 | 100.0% |
| `supplier_id` | 4,209 | 100.0% |
| `supplier_name` | 4,209 | 100.0% |
| `supplier_address` | 4,209 | 100.0% |
| `tender_status` | 4,209 | 100.0% |
| `contract_duration` | 4,209 | 100.0% |
| `extension_count` | 4,209 | 100.0% |
| `extension_days` | 4,209 | 100.0% |
| `procurement_method` | 4,209 | 100.0% |
| `buyer` | 4,209 | 100.0% |
| `source_dataset` | 4,209 | 100.0% |
| `source_url` | 4,209 | 100.0% |
| `bid_amounts` | 0 | 0.0% |
| `all_bidders` | 0 | 0.0% |
| `technical_specifications` | 0 | 0.0% |
| `product_catalog` | 0 | 0.0% |
| `sanctioned_amount` | 0 | 0.0% |
| `approval_threshold` | 0 | 0.0% |
| `contract_start` | 0 | 0.0% |
| `contract_end` | 0 | 0.0% |
