# PARAKH — README Forensic Consistency Audit Report

**Audit Date:** September 1, 2026  
**Auditor:** Final Release Engineer & Technical Lead  
**Evaluated Target:** `README.md` against physical codebase, test suites, and benchmark artifacts.

---

## 1. Term & Value Forensic Classification in README.md

| Token / Value | Presence in Current README | Classification | Evidence & Context |
|---|---|:---:|---|
| `5,609` | Line 3, 11, 28, 48, 119 | **`CURRENT`** | Verified total contracts across 6 jurisdictions in `data/catalog.json`. |
| `4,209` | Line 30 | **`CURRENT / CONTEXTUAL`** | Clarified as the Himachal Pradesh component (4,209 contracts / ₹3,870.39 Cr) within the 5,609 master dataset. |
| `1,991` | Line 119 | **`CURRENT`** | Verified count of stratified annotated records in `data/labels/reviewed_labels.csv`. |
| `2,500` | Line 134 | **`HISTORICAL / DEPRECATED`** | Confined strictly to "Historical Benchmark — Deprecated" section. |
| `94.37` / `86.63` / `95.99` / `0.9107` | Lines 135–138 | **`HISTORICAL / DEPRECATED`** | Confined strictly to "Historical Benchmark — Deprecated" section with explicit deprecation note. |
| `0.9835` / `0.9876` / `0.9795` | Line 123 | **`CURRENT`** | Verified Hybrid PARAKH holdout test set performance with 95% Bootstrap CIs. |
| `1.0000` | Lines 124–125 | **`CURRENT / CONTEXTUAL`** | Random Forest / HistGBDT holdout performance on pure tabular features; 5-fold CV reported at $0.9755 \pm 0.0031$. |
| `62 / 62` | Line 5, 149 | **`CURRENT`** | Verified automated backend pytest test pass count (100% passing). |
| `9 / 9` | Line 6, 154 | **`CURRENT`** | Verified automated frontend Vitest test pass count (100% passing). |
| `48 / 48` | **None** (Removed) | **`RESOLVED`** | Stale 48/48 test count completely eliminated. |
| `expert-reviewed` | **None** (Removed) | **`RESOLVED`** | Replaced with `annotated` / `human-reviewed`. |
| `zero hallucination` | **None** (Removed) | **`RESOLVED`** | Replaced with `strictly database-grounded query engine with parameterized execution`. |
| `corruption detection` / `corruption proved` | **None** (Removed) | **`RESOLVED`** | Replaced with `elevated procurement risk screening` and `tamper-evident data integrity`. |
| `100% accurate` | **None** (Removed) | **`RESOLVED`** | Replaced with empirical measured metrics. |

---

## 2. README Structure & Policy Compliance

- **Dataset Clarity:** Unambiguously presents the 5,609-record multi-source dataset and details the Himachal Pradesh 4,209-record contribution.
- **Benchmark Separation:** The current 6-track benchmark table is presented as primary; legacy 2,500-record synthetic metrics are segregated under `## 📜 Historical Benchmark — Deprecated`.
- **Responsible Language:** Strictly uses risk-screening terminology and emphasizes decision support for human investigators.
- **Authoritative Commands:** `python scripts/run_full_benchmark.py` and `python scripts/validate_parakh.py` are documented as the single source of truth for benchmark and validation runs.
