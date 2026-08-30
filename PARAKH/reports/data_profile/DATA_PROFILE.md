# Real Indian Government Procurement Data Profiling Report

**Generated on:** 2026-08-30T22:27:16.091220  
**Dataset:** Himachal Pradesh Government Public Procurement Dataset (OCDS)  
**Source:** hptenders.gov.in / CivicDataLab  

---

## 1. Dataset Scale & Structure
| Metric | Value |
|---|---|
| **Total Procurement Records (Merged)** | **4,211** |
| **Total Raw Tenders** | **3,791** |
| **Total Raw Awards** | **4,211** |
| **Total Columns** | **68** |
| **Unique Indian Vendors** | **1,858** |
| **Unique Procuring Entities (Departments)** | **434** |
| **Time Horizon** | **2012-05-02 to 2020-07-02** |

---

## 2. Financial Statistics (INR)
| Metric | Value (INR) | Value (Crores ₹) |
|---|---|---|
| **Total Awarded Value** | ₹38,703,860,370.19 | **₹3,870.39 Cr** |
| **Mean Contract Value** | ₹9,191,132.84 | ₹0.9191 Cr |
| **Median Contract Value** | ₹1,744,999.00 | ₹0.1745 Cr |
| **Max Single Award Value** | ₹1,219,245,452.00 | ₹121.92 Cr |
| **Total Sanctioned Estimate** | ₹40,210,558,031.00 | **₹4,021.06 Cr** |

---

## 3. Data Quality & Critical Field Completeness
| Critical Field | Missing Count | Completeness Rate |
|---|---|---|
| `ocid` (Unique Identifier) | 0 | **100.00%** |
| `tender/id` | 0 | **100.00%** |
| `tender/title` | 0 | **100.00%** |
| `awards/0/suppliers/0/name` (Vendor) | 0 | **100.00%** |
| `tender/procuringEntity/name` (Department) | 0 | **100.00%** |
| `awards/0/value/amount` (Award Value) | 0 | **100.00%** |
| `tender/value/amount` (Estimate Value) | 2 | **99.95%** |

---

## 4. Key Procurement & Risk Patterns
- **Single Bidder Tenders:** 132 tenders (3.15% of records with bidder info).
- **Compressed Tender Window (< 7 Days):** 345 tenders (8.19%).
- **Mean Tender Notice Window:** 16.3 days (Median: 16.0 days).
