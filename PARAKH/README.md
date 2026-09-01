# PARAKH — AI-Powered Public Procurement Risk Screening & Integrity Platform

[![Dataset: Multi-Source Indian Procurement (5,609 Tenders)](https://img.shields.io/badge/Dataset-Multi--Source%20Indian%20Procurement%20(5%2C609%20Tenders)-0284c7.svg)](data/catalog.json)
[![Scope: ₹4,890+ Crores Audited](https://img.shields.io/badge/Scope-%E2%82%B94%2C890%2B%20Crores%20Audited-10b981.svg)](data/catalog.json)
[![Backend Tests: 62/62 Passing](https://img.shields.io/badge/Backend%20Tests-62%2F62%20Passed-success.svg)](tests/)
[![Frontend Tests: 9/9 Passing](https://img.shields.io/badge/Frontend%20Tests-9%2F9%20Passed-success.svg)](frontend/)
[![License: OGD & CC BY 4.0](https://img.shields.io/badge/License-OGD%20%2F%20CC%20BY%204.0-blue.svg)](data/catalog.json)

> **PARAKH examines public procurement records to identify suspicious patterns and anomalies that deserve human forensic investigation.**

PARAKH is an enterprise-grade AI procurement **risk-screening and audit investigation platform**. Operating on **5,609 authentic public procurement contracts totaling ₹4,890+ Crores across 6 Indian jurisdictions** (Himachal Pradesh OCDS, Central CPPP/GeM, Maharashtra MahaTenders, Karnataka KPPP, Rajasthan e-Proc, and Uttar Pradesh UP-NIC), it computes transparent **Corruption Risk Scores (CRS: 0–100)**, identifies single-bidder monopolies, maps cartel collusion networks, manages forensic cases, and anchors immutable evidence to cryptographic ledgers.

- 📖 **[Master Evaluation Report](reports/FINAL_ML_EVALUATION_REPORT.md)**
- 🔁 **[Full Pipeline Reproduction Guide](DATA_REPRODUCTION.md)**
- 📊 **[Senior Engineering Audit Report](reports/FINAL_AUDIT_REPORT.md)**
- 📋 **[SIH Judge Technical Evidence Guide](docs/SIH_ML_EVIDENCE.md)**

**Responsible-use statement:** PARAKH identifies anomalies and suspicious patterns associated with elevated procurement risk for human investigation. It does **not** determine or prove criminal guilt or misconduct without official judicial review.

---

## ⚡ Quick Start (1-Click Launch)

### Windows (Recommended)
Double-click `start_demo.bat` or run:
```cmd
start_demo.bat
```

### Linux / macOS
```bash
chmod +x start_demo.sh
./start_demo.sh
```

### Reproduce Full Benchmark Pipeline from Scratch
```bash
python scripts/run_full_benchmark.py
```

- **Frontend Application**: `http://localhost:5173`
- **Interactive Backend API Docs**: `http://localhost:8000/docs`

---

## 🏛️ System Architecture

```text
[ Multi-Format Ingestion Engine ] (CSV, Excel .xlsx, JSON across 6 Jurisdictions)
                  │
                  ▼
[ Data Normalization & Validation ] (INR cleaner, ISO dates, legal entity resolver)
                  │
                  ▼
       [ Database Layer ] (PostgreSQL / SQLite with foreign keys & indexes)
                  │
                  ▼
       [ Dual AI / ML Risk Assessment ]
      ┌───────────┴───────────┐
      │                       │
 [ 8 Explainable Rules ]  [ 7D Isolation Forest ]
 (RF-1 to RF-8: 80% weight) (Statistical Outliers: 20% weight)
      │                       │
      └───────────┬───────────┘
                  │
                  ▼
      [ Corruption Risk Score (0–100) ]
                  │
                  ▼
[ Forensic Case Hub & AI Assistant ] (Notes, Evidence, Grounded Queries)
                  │
                  ▼
[ Blockchain Integrity Proofs ] (SHA-256 Canonical Recalculation + Web3 Sepolia)
```

---

## 🚀 Core Features

- **Multi-Source Indian Procurement Ingestion**: Standardized adapters for Himachal Pradesh, Central CPPP/GeM, Maharashtra, Karnataka, Rajasthan, and Uttar Pradesh with cryptographic SHA-256 catalog.
- **8 Explainable Red Flag Heuristics (RF-1 to RF-8)** with transparent rationales and recommended auditor actions.
- **Deterministic CRS Formula**: $CRS = \min(100, \text{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore}))$.
- **Isolation Forest Statistical Anomaly Detector**: 7-dimensional unsupervised outlier detection.
- **Live TF-IDF + Cosine Similarity Specification Auditor**: Real-time detection of tender specification tailoring against supplier product catalogs.
- **Interactive Cytoscape.js Network Visualizer**: Bipartite graph mapping supplier-department collusion with 4 switchable layouts (COSE, Concentric, Circular, Grid), search, and zoom controls.
- **Forensic Investigation Case Management (`/cases`)**: End-to-end investigation workflow (`NEW` $\to$ `UNDER_REVIEW` $\to$ `EVIDENCE_COLLECTION` $\to$ `ESCALATED` $\to$ `CLOSED`), investigator notes timeline, evidence file attachments, and priority tagging.
- **Grounded Investigator AI Assistant**: Strictly database-grounded SQL query engine with parameterized execution and citation verification to minimize hallucination risk.
- **Real Blockchain Integrity Verification**: Live SHA-256 canonical hash recalculation comparing database state against anchored Ethereum Sepolia ledger transactions (`INTEGRITY VERIFIED` / `INTEGRITY COMPROMISED`) with transparent `PRODUCTION` vs `DEMO_FALLBACK` execution modes.
- **Role-Based Access Control (RBAC)**: Secure PBKDF2 hashing with CSPRNG salt (`secrets.token_bytes(16)`), JWT tokens, and 4 specialized roles (`ADMIN`, `AUDITOR`, `INVESTIGATOR`, `DEPARTMENT_OFFICER`) with 1-click demo switcher.
- **Risk Engine Sensitivity Sandbox (`/simulator`)**: Live interactive policy threshold adjuster and real-time CRS calculator.
- **Exporting & Print-Ready Dossiers**: Download forensic dossiers as JSON, CSV, or formatted printable briefs.
- **Optimized Route-Based Code Splitting**: Vite bundle optimized via `React.lazy()` / `<Suspense>`, keeping individual chunk sizes well under 450 kB.

---

## 🚩 Explainable Red Flags Summary

| ID | Indicator | Severity | Default Points | Description |
|---|---|---|:---:|---|
| **RF-1** | Single Bidder Tender | High | 20 | Tender awarded with only 1 participating bidder |
| **RF-2** | Vendor Lock-in | High | 20 | Winning vendor won >60% of all department contracts |
| **RF-3** | Approval Threshold Manipulation | High | 15 | Award value is within 10% below statutory threshold (₹45L–₹50L) |
| **RF-4** | Compressed Tender Window | Medium | 10 | Tender window open for < 7 days |
| **RF-5** | Estimate Deviation | Medium | 10 | Award value exceeds sanctioned government estimate by >30% |
| **RF-6** | Repeat Winner / Network Pattern | High | 20 | Supplier has won ≥3 contracts from the same department |
| **RF-7** | Specification Tailoring | Medium | 15 | Specification has >85% TF-IDF similarity to supplier product catalog |
| **RF-8** | Unusual Extensions | Low | 5 | Contract received ≥2 extensions (>90 days each) |

$$\text{RuleScore} = \min\left(100, \sum \text{Detected Flag Points}\right)$$

---

## 🧪 Testing & Model Evaluation

### Current Scientific Benchmark (Multi-Source Procurement)
Run the automated scientific benchmark on multi-source Indian procurement datasets (5,609 contracts across 6 jurisdictions, 1,991 annotated records):
```bash
python scripts/run_full_benchmark.py
```
- **Evaluation Paradigm**: Independent Holdout Test Set ($N = 300$) + 5-Fold Stratified Cross-Validation + Supplier Grouped K-Fold
- **Best Model Architecture**: Hybrid PARAKH (Explainable Rules RF-1..RF-8 + Scaled ML Ensemble)
- **Test F1-Score**: **0.9835** (95% Bootstrap CI: `[0.9724, 0.9937]`)
- **Test Precision**: **0.9876** (95% Bootstrap CI: `[0.9719, 1.0000]`)
- **Test Recall (Sensitivity)**: **0.9795** (95% Bootstrap CI: `[0.9628, 0.9960]`)
- **PR-AUC**: **0.9995** | **ROC-AUC**: **0.9980**
- **5-Fold Cross-Validation F1**: **0.9903 ± 0.0023**
- **Data Leakage & Integrity**: Verified with 0 critical leakage vectors across partitions (`scripts/check_data_leakage.py`)
- **Master Evaluation Dossier**: See [`reports/FINAL_ML_EVALUATION_REPORT.md`](reports/FINAL_ML_EVALUATION_REPORT.md) and [`reports/FINAL_AUDIT_REPORT.md`](reports/FINAL_AUDIT_REPORT.md)

### Historical Benchmark — Deprecated
For historical transparency, PARAKH's initial prototype benchmark evaluated on a 2,500-record legacy synthetic dataset yielded:
- *Historical Accuracy*: 94.37%
- *Historical Precision*: 86.63%
- *Historical Recall*: 95.99%
- *Historical F1-Score*: 0.9107
> *Methodological Note:* The historical benchmark has been deprecated in favor of the multi-source authentic Indian procurement evaluation benchmark above.

### Backend Automated Tests (62 / 62 Passing)
```bash
pytest -v
```

### Frontend Automated Tests (9 / 9 Passing)
```bash
cd frontend && npm run test -- --run
```

---

## 👥 Default Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Forensic Investigator** | `investigator` | `investigator` |
| **Lead Auditor** | `auditor` | `auditor` |
| **Chief Audit Officer (Admin)** | `admin` | `admin` |
| **Department Officer** | `officer` | `officer` |

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL, scikit-learn, Pydantic V2, Web3.py, ReportLab
- **Frontend**: React 18, Vite, Recharts, Cytoscape.js, Axios, Vitest, React Testing Library, Custom Dark Intelligence Design System
- **Security & Integrity**: PBKDF2-HMAC-SHA256 with CSPRNG salt, JWT, SHA-256 Canonical Hashing, Ethereum Sepolia Testnet
