# PARAKH — Initial Baseline Test & Build Results

**Audit Timestamp:** September 1, 2026 19:05 IST  
**Environment:** Python 3.13.14 (win32), Node.js v22.x, Vitest v4.1.11, Pytest v9.1.1  
**Git Baseline Commit:** `6c7790c`

---

## 1. Automated Test Suite Execution Summary

### A. Backend Pytest Suite
- **Command:** `pytest -v`
- **Result:** **58 / 58 PASSED (100% Success Rate)**
- **Duration:** 58.16 seconds
- **Breakdown:**
  - `tests/test_backend/test_api.py`: 10 passed (Dashboard, Contracts, Departments, Vendors, Network Graph, NLP, Blockchain, Risk Evidence)
  - `tests/test_backend/test_assistant.py`: 3 passed (Tender query, vendor query, single bidder query)
  - `tests/test_backend/test_audit.py`: 1 passed (Audit log retrieval)
  - `tests/test_backend/test_auth.py`: 4 passed (PBKDF2 hashing, JWT generate/decode, login, me endpoint)
  - `tests/test_backend/test_blockchain_verify.py`: 1 passed (Anchor & verification)
  - `tests/test_backend/test_cases.py`: 1 passed (Full case lifecycle)
  - `tests/test_backend/test_health.py`: 1 passed (Healthcheck endpoint)
  - `tests/test_backend/test_ingest.py`: 3 passed (CSV template, CSV upload, JSON upload)
  - `tests/test_backend/test_real_data_pipeline.py`: 8 passed (Metadata, normalization, database records, API stats, pagination, grounded assistant, blockchain verification)
  - `tests/test_backend/test_security.py`: 4 passed (JWT rejection, invalid file rejection, SQL injection resistance, empty file rejection)
  - `tests/test_ml/test_benchmark_defensible.py`: 10 passed (Canonical schema, field availability, entity resolution, department normalization, quality validator, leakage detector, synthetic injector, 8 baseline models, bootstrap CIs, reproducibility manifest)
  - `tests/test_ml/test_nlp.py`: 2 passed (Identical text tailoring, empty text)
  - `tests/test_ml/test_rules.py`: 10 passed (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-8)

### B. Frontend Vitest Suite
- **Command:** `cd frontend && npm test -- --run`
- **Result:** **9 / 9 PASSED (100% Success Rate)**
- **Duration:** 82.23 seconds
- **Breakdown:**
  - `src/services/api.test.js`: 2 passed (Base URL, endpoint calls)
  - `src/pages/ContractsPage.test.jsx`: 2 passed (Filter options, contract rows)
  - `src/components/AIAssistantDrawer.test.jsx`: 3 passed (Header render, query submit, citations display)
  - `src/pages/DashboardPage.test.jsx`: 2 passed (KPI metrics, charts, showcase contracts)

### C. Frontend Production Build
- **Command:** `cd frontend && npm run build`
- **Result:** **BUILD SUCCEEDED (0 errors)**
- **Duration:** 11.87 seconds
- **Chunk Optimization:** All chunks well within recommended limits (main bundle ~299 kB, Cytoscape network view ~442 kB).

---

## 2. Identified Warnings & Technical Debts

1. **Pydantic V2 Class-Based Config Warning**: `backend/app/schemas/canonical_schema.py:14` uses `class Config` instead of `ConfigDict`.
2. **Vitest v4 Pool Options Warning**: `test.poolOptions` deprecated in favor of top-level pool options.
3. **Escaped Backslash in Docstring**: `scripts/inter_rater_reliability.py:130` contains `\k` raw string warning.
