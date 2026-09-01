# PARAKH — Complete Data Pipeline & Scientific Benchmark Reproduction Guide

This document provides exact, reproducible terminal commands to run the complete multi-source Indian procurement data engineering, quality validation, and scientific ML benchmark pipeline from scratch.

---

## 1. Prerequisites & Virtual Environment

Ensure Python 3.10+ and Node.js 18+ are available.

```bash
# Activate Python virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install backend dependencies (if needed)
pip install -r backend/requirements.txt
```

---

## 2. End-to-End Automated Benchmark Execution

To execute the entire end-to-end evaluation pipeline in a single command:

```bash
python scripts/run_full_benchmark.py
```

This single command automatically:
1. Builds multi-source data catalog and provenance hashes (`data/catalog.json`)
2. Executes automated data hygiene & domain constraint validation (`reports/data_quality_report.json` and `.md`)
3. Samples stratified review records & evaluates inter-rater reliability (`reports/inter_rater_reliability.json` and `.md`)
4. Generates isolated synthetic anomaly benchmark suite (`benchmark/synthetic/`)
5. Enforces zero data leakage checks across Train/Val/Test partitions
6. Runs 5-Fold Stratified Cross-Validation across 8 model baselines
7. Evaluates independent holdout test set with 95% bootstrap confidence intervals
8. Generates confusion matrices, ROC curves, and Precision-Recall curves in `reports/figures/`
9. Evaluates individual forensic Red Flag rules RF-1 through RF-8 (`reports/per_rule_metrics.csv`)
10. Executes architecture and rule ablation studies (`reports/ablation_results.csv` and `.md`)
11. Performs operational risk threshold sweeps (`reports/threshold_analysis.csv`)
12. Decomposes false positive / false negative errors (`reports/error_analysis.json` and `.md`)
13. Evaluates cross-jurisdiction and temporal drift generalization
14. Generates reproducibility manifest (`reports/reproducibility_manifest.json`) and master results (`reports/benchmark_results.json`)

---

## 3. Individual Step-by-Step Execution Commands

### Step 1: Multi-Source Ingestion & Provenance Catalog Construction
Ingests and standardizes datasets for Himachal Pradesh, Central CPPP/GeM, Maharashtra, Karnataka, Rajasthan, and Uttar Pradesh:
```bash
python scripts/ingest_adapters/multi_source_adapters.py
```
*Output Artifact:* `data/catalog.json`, `data/processed/canonical_all_india_procurement.csv` (5,609 records).

---

### Step 2: Automated Data Quality & Hygiene Validation
Validates unique tender IDs, entity completeness, financial non-negativity, date sanity, and bidder counts:
```bash
python scripts/validate_procurement_data.py
```
*Output Artifacts:* `reports/data_quality_report.json`, `reports/data_quality_report.md`.

---

### Step 3: Generate Ground-Truth Review Queue & Inter-Rater Reliability
Constructs stratified review queue (1,991 contracts) and calculates dual-annotator agreement:
```bash
python scripts/build_review_dataset.py
python scripts/inter_rater_reliability.py
```
*Output Artifacts:* `data/labels/reviewed_labels.csv`, `reports/inter_rater_reliability.md` ($\kappa = 0.7704$).

---

### Step 4: Generate Isolated Synthetic Anomaly Benchmark
Generates controlled anomaly injections with explicit parameter tracking:
```bash
python benchmark/synthetic/generate_synthetic_anomalies.py
```
*Output Artifact:* `benchmark/synthetic/synthetic_anomaly_dataset.csv`.

---

### Step 5: Execute Core ML Benchmark, Cross-Validation & Reports
Evaluates 8 models, generates ROC/PR curves, per-rule metrics, ablation, and threshold studies:
```bash
python benchmark/evaluate_benchmark.py
```
*Output Artifacts:* `reports/model_comparison.csv`, `reports/per_rule_metrics.csv`, `reports/ablation_results.csv`, `reports/threshold_analysis.csv`, `reports/figures/`.

---

## 4. Automated Test Suite Execution

### Backend Pytest Suite
```bash
pytest -v
```
*Tests data quality validation, entity resolution, leakage detection, rule heuristics, API routes, and benchmark evaluation integrity.*

### Frontend Vitest Suite
```bash
cd frontend && npm test -- --run
```

---

## 5. Launching the Interactive Web Application

```bash
# Terminal 1: Launch FastAPI Backend Server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Launch Vite React Frontend
cd frontend
npm run dev
```

Open browser at: `http://localhost:5173`
- Inspect the **Procurement Risk Dashboard** showing multi-source coverage, data quality, and model evaluation metrics.
- Investigate **Priority High-Risk Tenders** with explainable red flag breakdowns.
- Query the **AI Investigator Assistant** with zero-hallucination database grounding.
