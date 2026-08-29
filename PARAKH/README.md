# PARAKH — AI-Powered Public Procurement Risk & Corruption Detection Platform

> **PARAKH examines public procurement data to identify suspicious patterns that deserve human forensic investigation.**

PARAKH is an AI-assisted procurement **risk-screening, fraud detection, and audit investigation platform**. It analyzes tender and contract datasets, produces a transparent **Corruption Risk Score (CRS: 0–100)**, identifies cartel collusion networks, manages forensic cases, and anchors immutable audit evidence to cryptographic ledgers.

**Responsible-use statement:** PARAKH identifies anomalies and suspicious patterns for human investigation. It does **not** determine or prove criminal guilt or misconduct without official judicial review.

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

### Docker Compose
```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:5173`
- **Interactive Backend API Docs**: `http://localhost:8000/docs`

---

## 🏛️ System Architecture

```text
[ Multi-Format Ingestion Engine ] (CSV, Excel .xlsx, JSON)
                  │
                  ▼
[ Data Normalization & Validation ] (INR cleaner, ISO dates, alias mapper)
                  │
                  ▼
       [ Database Layer ] (PostgreSQL / SQLite with auto-migration)
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

- **Multi-Format Real Data Ingestion**: Drag-and-drop ingestion of CSV, Excel (`.xlsx`, `.xls`), and JSON datasets with column aliasing, currency parsing, deduplication, row-level error reporting, and instant batch AI scoring.
- **8 Explainable Red Flag Heuristics (RF-1 to RF-8)** with transparent rationales and recommended auditor actions.
- **Deterministic CRS Formula**: $CRS = \min(100, \text{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore}))$.
- **Isolation Forest Statistical Anomaly Detector**: 7-dimensional unsupervised outlier detection.
- **Live TF-IDF + Cosine Similarity Specification Auditor**: Real-time detection of tender specification tailoring against supplier product catalogs.
- **Interactive Cytoscape.js Network Visualizer**: Bipartite graph mapping supplier-department collusion with 4 switchable layouts (COSE, Concentric, Circular, Grid), search, and zoom controls.
- **Forensic Investigation Case Management (`/cases`)**: End-to-end investigation workflow (`NEW` $\to$ `UNDER_REVIEW` $\to$ `EVIDENCE_COLLECTION` $\to$ `ESCALATED` $\to$ `CLOSED`), investigator notes timeline, evidence file attachments, and priority tagging.
- **Grounded Investigator AI Assistant**: Natural language SQL query engine with zero hallucination, citing exact tender numbers, contractor win-rates, and department anomalies.
- **Real Blockchain Integrity Verification**: Live SHA-256 canonical hash recalculation comparing database state against anchored Ethereum Sepolia ledger transactions (`INTEGRITY VERIFIED` / `INTEGRITY COMPROMISED`) with transparent `PRODUCTION` vs `DEMO_FALLBACK` execution modes.
- **Role-Based Access Control (RBAC)**: Secure PBKDF2 hashing, JWT tokens, and 4 specialized roles (`ADMIN`, `AUDITOR`, `INVESTIGATOR`, `DEPARTMENT_OFFICER`) with 1-click demo switcher.
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

### Benchmark Model Evaluation
Run the model evaluation benchmark on 2,500 records:
```bash
python evaluate_model.py
```
- **Accuracy**: 94.37%
- **Precision**: 86.63%
- **Recall (Sensitivity)**: 95.99%
- **F1-Score**: 0.9107
- **False Positive Rate**: 6.31%

### Backend Automated Tests (40 / 40 Passing)
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
- **Security & Integrity**: PBKDF2-HMAC-SHA256, JWT, SHA-256 Canonical Hashing, Ethereum Sepolia Testnet
