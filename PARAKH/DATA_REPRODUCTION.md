# PARAKH — Real Data Pipeline Reproduction Guide

This document provides exact, reproducible terminal commands to run the complete real Indian procurement data engineering pipeline from scratch.

---

## 1. Prerequisites & Virtual Environment

Ensure Python 3.10+ and Node.js 18+ are available.

```bash
# Activate existing Python virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install backend dependencies (if needed)
pip install -r backend/requirements.txt
```

---

## 2. Automated Pipeline Execution Steps

### Step 1: Download & Verify Authentic Raw Indian Dataset
Downloads the Himachal Pradesh State Public Procurement OCDS dataset and validates SHA-256 cryptographic checksums.

```bash
python scripts/download_real_dataset.py
```
*Expected Output: SHA-256 Checksum Verified (`0744e24693c73eb8...`), saved to `data/raw/himachal_pradesh_procurement_ocds.csv`.*

---

### Step 2: Run Exploratory Data Profiling & Quality Audit
Profiles distributions, field completeness, value ranges, and generates automated Markdown / JSON reports.

```bash
python scripts/profile_procurement_data.py
```
*Output Artifacts:*
- `reports/data_profile/DATA_PROFILE.md`
- `data/metadata/data_profile_report.json`

---

### Step 3: Clean, Standardize & Normalize Ingestion Pipeline
Standardizes Indian currency values, standardizes ISO-8601 UTC dates, canonicalizes 1,856 vendor identities, maps 428 procuring entities, and logs rejected rows.

```bash
python scripts/normalize_procurement_data.py
```
*Output Artifacts:*
- `data/processed/india_procurement_normalized.csv` (4,209 valid records)
- `data/processed/rejected_records.csv` (2 rejected records)

---

### Step 4: Seed Database & Run Dual ML Risk Engine
Populates SQLite relational database (`parakh.db`), trains $O(N)$ Isolation Forest anomaly detection model, evaluates 8 explainable forensic Red Flags (RF-1 to RF-8), calculates Corruption Risk Scores (CRS), opens investigation cases, and anchors blockchain cryptographic hashes.

```bash
python backend/scripts/seed_real_data.py
```
*Expected Output: Seeded 4,209 contracts, 428 departments, 1,856 vendors, 6 showcase investigation cases.*

---

### Step 5: Generate Empirical Risk Benchmark Report
Runs automated statistical analysis across all 4,209 contracts and generates a benchmark report.

```bash
python scripts/benchmark_real_data.py
```
*Output Artifact:*
- `reports/REAL_DATA_BENCHMARK.md`

---

## 3. Automated Verification & Testing

### Run All Backend Unit, Integration & Pipeline Tests

```bash
pytest -v
```
*Expected Result: 48 passed tests across API routes, ML models, heuristic red flags, real data pipeline, and AI assistant.*

### Run All Frontend Component & Integration Tests

```bash
cd frontend
npm test -- --run
```
*Expected Result: 9 passed tests across 4 test suites (Dashboard, Contracts, AI Assistant, API service).*

---

## 4. Launching the Interactive Web Application

```bash
# Terminal 1: Launch FastAPI Backend Server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Launch Vite React Frontend
cd frontend
npm run dev
```

Open browser at: `http://localhost:5173`
- Explore the **Procurement Risk Dashboard** with live data source provenance.
- Inspect **Top Flagged Authentic Contracts** (e.g. `2017_DIT_18899_1`, `2018_FDC_19563_1`).
- Query the **AI Investigator** with questions like:
  - *"Where did this procurement dataset originate?"*
  - *"Why is tender 2017_DIT_18899_1 flagged?"*
  - *"Which departments awarded single-bidder contracts?"*
