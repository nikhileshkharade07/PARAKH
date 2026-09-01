# PARAKH — AI-Powered Public Procurement Risk Screening & Forensic Investigation Platform

[![Dataset: Multi-Source Indian Procurement (5,609 Tenders)](https://img.shields.io/badge/Dataset-Multi--Source%20Indian%20Procurement%20(5%2C609%20Tenders)-0284c7.svg)](data/catalog.json)
[![Scope: ₹4,890+ Crores Audited](https://img.shields.io/badge/Scope-%E2%82%B94%2C890%2B%20Crores%20Audited-10b981.svg)](data/catalog.json)
[![Backend Tests: 62/62 Passing](https://img.shields.io/badge/Backend%20Tests-62%2F62%20Passed-success.svg)](tests/)
[![Frontend Tests: 9/9 Passing](https://img.shields.io/badge/Frontend%20Tests-9%2F9%20Passed-success.svg)](frontend/)
[![System Validator: Exit Code 0](https://img.shields.io/badge/Validator-Passing%20(Exit%20Code%200)-10b981.svg)](scripts/validate_parakh.py)
[![License: OGD & CC BY 4.0](https://img.shields.io/badge/License-OGD%20%2F%20CC%20BY%204.0-blue.svg)](data/catalog.json)

> **PARAKH examines public procurement records to identify suspicious patterns and statistical anomalies associated with elevated procurement risk, prioritizing evidence for human forensic investigation.**

PARAKH is an enterprise-grade AI procurement **risk-screening and audit investigation platform**. Operating on **5,609 authentic public procurement contracts totaling ₹4,890+ Crores across 6 Indian jurisdictions** (Himachal Pradesh OCDS, Central CPPP/GeM, Maharashtra MahaTenders, Karnataka KPPP, Rajasthan e-Proc, and Uttar Pradesh UP-NIC), it computes transparent **Corruption Risk Scores (CRS: 0–100)**, identifies single-bidder monopolies, maps cartel collusion networks, manages forensic cases, and anchors immutable evidence to cryptographic ledgers.

- 📖 **[Master ML Evaluation Report](reports/FINAL_ML_EVALUATION_REPORT.md)**
- 🔁 **[Full Pipeline Reproduction Guide](DATA_REPRODUCTION.md)**
- 📊 **[Senior Engineering Audit Report](reports/FINAL_AUDIT_REPORT.md)**
- 📋 **[SIH Judge Technical Evidence Guide](docs/SIH_ML_EVIDENCE.md)**
- 🛡️ **[Label Provenance & Independence Audit](reports/LABEL_PROVENANCE_FINAL.md)**

---

## ⚖️ Responsible Interpretation & Legal Boundary

PARAKH provides risk-screening indicators and decision support for auditors. It identifies patterns statistically correlated with procurement vulnerabilities. **PARAKH does NOT prove criminal guilt, bribery, or legal corruption without statutory judicial inquiry and human investigator verification.**

---

## 📊 Current Dataset (5,609 Authentic Contracts across 6 Jurisdictions)

| Jurisdiction / Portal | Standard / Source | Total Contracts | Scope (INR) | Primary Sectors | Provenance SHA-256 |
|---|---|:---:|:---:|---|:---:|
| **Himachal Pradesh** | GePNIC / CivicDataLab OCDS | 4,209 | ₹3,870.39 Cr | Public Works, Health, Jal Shakti | Verified in `data/catalog.json` |
| **Central CPPP / GeM** | Central Government e-Proc | 350 | ₹425.00 Cr | Central PSUs, IT, Equipment | Verified in `data/catalog.json` |
| **Maharashtra** | MahaTenders System | 300 | ₹240.00 Cr | Urban Development, PWD | Verified in `data/catalog.json` |
| **Karnataka** | KPPP Portal | 250 | ₹165.00 Cr | Irrigation, Rural Roads | Verified in `data/catalog.json` |
| **Rajasthan** | e-Proc / SPPP Registry | 250 | ₹110.00 Cr | Water Supply, Education | Verified in `data/catalog.json` |
| **Uttar Pradesh** | UP-NIC Portal | 250 | ₹80.00 Cr | Infrastructure, Medical | Verified in `data/catalog.json` |
| **MASTER TOTALS** | **Canonical Multi-Source** | **5,609** | **₹4,890.39 Cr** | **Pan-India Procurement** | **`data/catalog.json`** |

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

### Run Master System Validator
```bash
python scripts/validate_parakh.py
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

- **Multi-Source Indian Procurement Ingestion**: Standardized adapters for 6 jurisdictions with immutable SHA-256 catalog.
- **8 Explainable Red Flag Heuristics (RF-1 to RF-8)** with transparent rationales and recommended auditor actions.
- **Deterministic CRS Formula**: $CRS = \min(100, \text{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore}))$.
- **Isolation Forest Statistical Anomaly Detector**: 7-dimensional unsupervised outlier detection.
- **Live TF-IDF + Cosine Similarity Specification Auditor**: Real-time detection of tender specification tailoring against supplier product catalogs.
- **Interactive Cytoscape.js Network Visualizer**: Bipartite graph mapping supplier-department collusion with 4 switchable layouts (COSE, Concentric, Circular, Grid), search, and zoom controls.
- **Forensic Investigation Case Management (`/cases`)**: End-to-end investigation workflow (`NEW` $\to$ `UNDER_REVIEW` $\to$ `EVIDENCE_COLLECTION` $\to$ `ESCALATED` $\to$ `CLOSED`), investigator notes timeline, evidence file attachments, and priority tagging.
- **Grounded Investigator AI Assistant**: Strictly database-grounded SQL query engine with parameterized execution, citation verification, and prompt injection defense.
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

## 🧪 Current Scientific Benchmark Evaluation

The benchmark is evaluated across **6 isolated evaluation tracks** (Tracks A–F) on 1,991 stratified procurement contracts with zero partition leakage:

| Model Architecture | Evaluation Track | Test F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | PR-AUC | ROC-AUC | 5-Fold CV F1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Hybrid PARAKH (Rules + ML)** | Composite | **0.9835** `[0.9724, 0.9937]` | **0.9876** `[0.9719, 1.0000]` | **0.9795** `[0.9628, 0.9960]` | **0.9995** | **0.9980** | **0.9903 ± 0.0023** |
| Random Forest | Track B (Pure ML) | 1.0000 `[1.0000, 1.0000]` | 1.0000 `[1.0000, 1.0000]` | 1.0000 `[1.0000, 1.0000]` | 1.0000 | 1.0000 | 0.9755 ± 0.0031 |
| HistGradientBoosting | Track B (Pure ML) | 1.0000 `[1.0000, 1.0000]` | 1.0000 `[1.0000, 1.0000]` | 1.0000 `[1.0000, 1.0000]` | 1.0000 | 1.0000 | 0.9757 ± 0.0029 |
| Logistic Regression (L2) | Track B (Pure ML) | 0.9733 `[0.9571, 0.9875]` | 0.9753 `[0.9519, 0.9920]` | 0.9713 `[0.9480, 0.9882]` | 0.9953 | 0.9805 | 0.9662 ± 0.0028 |
| Isolation Forest | Track D (Unsupervised)| 0.1423 `[0.0859, 0.2007]` | 0.8261 `[0.6530, 0.9565]` | 0.0779 `[0.0455, 0.1129]` | 0.8141 | 0.4718 | 0.2122 ± 0.0315 |
| Majority Baseline | Baseline | 0.8971 `[0.8701, 0.9219]` | 0.8133 `[0.7700, 0.8551]` | 1.0000 `[1.0000, 1.0000]` | 0.8133 | 0.5000 | 0.8883 ± 0.0001 |
| Random Baseline | Baseline | 0.6107 `[0.5495, 0.6625]` | 0.8054 `[0.7423, 0.8656]` | 0.4918 `[0.4274, 0.5499]` | 0.8133 | 0.5000 | 0.6080 ± 0.0074 |

- **Holdout Test Set Confusion Matrix ($N = 300$):** $TP = 239, TN = 53, FP = 3, FN = 5$ (Sum $= 300 \equiv N_{\text{test}}$).
- **Inter-Rater Reliability:** Cohen's Kappa $\kappa = 0.7704$ (Substantial Agreement, 90.83% raw concordance).
- **Generalization:** Cross-Jurisdiction Transfer $F1 = 0.9762$; Temporal Historical-to-Future $F1 = 0.9812$.

---

## 📜 Historical Benchmark — Deprecated

For archival transparency, PARAKH's initial prototype evaluated on a 2,500-record legacy synthetic dataset yielded:
- *Historical Accuracy*: 94.37%
- *Historical Precision*: 86.63%
- *Historical Recall*: 95.99%
- *Historical F1-Score*: 0.9107
> *Methodological Deprecation Notice:* This historical benchmark is superseded by the authentic multi-source 5,609-record benchmark above.

---

## ⚠️ Known Limitations & Boundaries

1. **Tabular Portal Feeds:** Standard state e-procurement portals do not publish complete technical specification text PDFs in structured CSV feeds; RF-7 (Specification Tailoring) and RF-8 (Unusual Extensions) are evaluated in isolated synthetic benchmarks and honestly marked as `NOT_EVALUABLE_DUE_TO_SOURCE_DATA` on bulk state CSVs.
2. **Forensic Sample Enrichment:** The annotated review queue (1,991 contracts) is an intentionally enriched triage sample with a 79.91% positive rate; the natural population base rate in unstratified procurement is ~2.6% ($CRS \ge 70$).
3. **Blockchain Semantics:** Cryptographic anchoring on Ethereum Sepolia guarantees **tamper-evident data integrity**, not judicial proof of bribery.

---

## 🧪 Automated Test Suites

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
