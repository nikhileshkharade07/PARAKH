# PARAKH — AI-Powered Public Procurement Risk Auditor

> **PARAKH examines public procurement data to identify suspicious patterns that deserve human forensic investigation.**

PARAKH is an AI-assisted procurement **risk-screening and audit-support platform**, not a procurement portal. It analyzes tender/contract data, produces an explainable **Corruption Risk Score (CRS) from 0–100**, and shows transparent forensic evidence behind each assessment.

**Responsible-use statement:** PARAKH identifies anomalies and suspicious patterns for human investigation. It does **not** determine or prove corruption, bribery, criminal activity, political wrongdoing, or misconduct.

---

## ⚡ Quick Start (1-Click Demo)

### Windows
Double-click `start_demo.bat` or run:
```cmd
start_demo.bat
```

### Linux / macOS
```bash
chmod +x start_demo.sh
./start_demo.sh
```

- **Frontend Application**: `http://localhost:5173`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`

---

## 🏛️ System Architecture

```text
Synthetic Procurement Data / Ingestion
                    │
                    ▼
         Database (PostgreSQL / SQLite)
                    │
                    ▼
          FastAPI Backend Service
         ┌──────────┴──────────┐
         │                     │
    Risk Engine            Analytics & Network
  (Rules + IF + NLP)       (Cytoscape Graph Engine)
         │                     │
         └──────────┬──────────┘
                    │
        Explainable CRS (0–100)
                    │
                    ▼
           React / Vite UI Layer
         ┌──────────┴──────────┐
         │                     │
   Audit Dashboard       Investigation Dossier
         │                     │
         └──────────┬──────────┘
                    ▼
       Optional Ethereum Sepolia
        Cryptographic Anchoring
```

This is deliberately a **modular monorepo** designed for maintainability and explainability.

---

## 🚀 Core Features

- **8 Explainable Red Flag Heuristics (RF-1 to RF-8)** with plain-English rationales.
- **Deterministic CRS Formula**: $CRS = \min(100, \text{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore}))$.
- **Isolation Forest Statistical Anomaly Detector**: 7-dimensional unsupervised outlier detection.
- **Live TF-IDF + Cosine Similarity Specification Auditor**: Real-time detection of tender specification tailoring.
- **Interactive Cytoscape.js Network Visualizer**: Bipartite graph mapping supplier-department collusion with 4 switchable layouts (COSE, Concentric, Circular, Grid), search, and zoom controls.
- **Risk Engine Sensitivity Sandbox (`/simulator`)**: Live interactive policy threshold adjuster and real-time CRS calculator.
- **Dossier & Audit Exporting**: Download forensic dossiers as formatted JSON files or CSV tables.
- **Print-Ready Forensic Dossiers**: Built-in `@media print` layout for generating official investigation briefs.
- **Optional Ethereum Sepolia Cryptographic Anchoring**: Tamper-proof canonical SHA-256 hash proofs on testnet.

---

### 🚩 Explainable Red Flags

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

Isolation Forest anomaly score (0–100) is explicitly treated as **statistical anomaly detection**, not direct corruption proof.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Custom Dark Slate Design System, Recharts, Cytoscape.js
- **Backend**: Python 3.11+, FastAPI, Pydantic, SQLAlchemy
- **Machine Learning & NLP**: Scikit-Learn (Isolation Forest, TF-IDF Vectorizer, Cosine Similarity), NumPy, Pandas
- **Database**: PostgreSQL with automatic zero-config fallback to SQLite (`parakh.db`)
- **Blockchain**: Web3/Ethers simulated Ethereum Sepolia testnet cryptographic anchoring
- **Testing**: Pytest automated suite (21/21 passing tests)

---

## 🧪 Testing & Verification

Run the full automated test suite:
```bash
pytest
```
*Output: 21 passed (100% pass rate)*

Build frontend for production:
```bash
cd frontend && npm run build
```
*Output: 661 modules transformed, 0 errors*

---

## 📚 Documentation

- [System Architecture](docs/architecture.md)
- [Risk Scoring Methodology](docs/risk-methodology.md)
- [5-Minute Judge Demo Guide](docs/demo.md)
- [REST API Reference](docs/api.md)
- [Execution Roadmap](TASKS.md)

---

## ⚠️ Limitations & Ethical Use

- Rules are screening heuristics to guide human audits, not legal adjudications.
- Statistical anomaly scores highlight deviations, not intent.
- Text similarity highlights potential tailored specifications that require contextual review.
- Thresholds and weights require domain validation with procurement authorities before production deployment.
