# PARAKH — AI-Powered Public Procurement Risk Auditor

> **PARAKH examines public procurement data to identify suspicious patterns that deserve human investigation.**

PARAKH is an AI-assisted procurement **risk-screening and audit-support platform**, not a procurement portal. It analyzes tender/contract data, produces an explainable **Corruption Risk Score (CRS) from 0–100**, and shows the evidence behind each assessment.

**Responsible-use statement:** PARAKH identifies anomalies and suspicious patterns for human investigation. It does **not** determine or prove corruption, bribery, criminal activity, political wrongdoing, or misconduct.

## Architecture

```text
Synthetic / imported procurement data
              |
              v
        PostgreSQL
              |
              v
        FastAPI backend
              |
        +-----+------+
        |            |
   Risk Engine   Analytics
 Rules + IF      Network
        |            |
        +-----+------+
              |
          CRS 0–100
              |
       React / Vite UI
              |
   Dashboard + Investigation
              |
      Optional blockchain
```

This is deliberately a **modular monorepo**, not a microservice system.

## Core features

- 8 explainable procurement red flags
- Deterministic CRS 0–100
- Isolation Forest statistical anomaly signal
- TF-IDF + cosine similarity for specification similarity
- Vendor ↔ department network graph
- Dashboard, filters and investigation views
- Synthetic demo dataset
- Optional Ethereum Sepolia audit anchoring

### Red flags

| ID | Indicator | Severity | Default score |
|---|---|---|---:|
| RF-1 | Single bid | High | 20 |
| RF-2 | Vendor lock-in | High | 20 |
| RF-3 | Threshold-related pattern | High | 15 |
| RF-4 | Compressed tender window | Medium | 10 |
| RF-5 | Bid/estimate deviation | Medium | 10 |
| RF-6 | Repeat winner/network pattern | High | 20 |
| RF-7 | Specification tailoring | Medium | 15 |
| RF-8 | Unusual extensions | Low | 5 |

The rule score is capped at 100. Prototype combined score:

`CRS = round(0.80 × rule_score + 0.20 × anomaly_score)`

Isolation Forest is treated only as **statistical anomaly detection**, not corruption detection.

## Tech stack

**Frontend:** React, Vite, Tailwind CSS, Recharts, Cytoscape.js  
**Backend:** Python, FastAPI, Pydantic, SQLAlchemy  
**ML:** Pandas, NumPy, scikit-learn  
**Database:** PostgreSQL  
**Blockchain:** ethers.js + Ethereum Sepolia, optional

## Setup

Prerequisites: Python 3.11+, Node.js 20+, Docker Desktop.

```bash
git clone <repository-url>
cd PARAKH
copy .env.example .env
docker compose up -d db
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
python -m backend.scripts.seed_demo
uvicorn backend.app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

API docs: `http://localhost:8000/docs`

## Environment

See `.env.example`.

Important defaults:

```env
BLOCKCHAIN_ENABLED=false
APPROVAL_THRESHOLD=5000000
PRICE_DEVIATION_THRESHOLD=0.30
NLP_SIMILARITY_THRESHOLD=0.85
TENDER_DURATION_THRESHOLD_DAYS=7
VENDOR_LOCKIN_THRESHOLD=0.60
RISK_THRESHOLD=70
```

## Demo data

The generator creates **2,500 clearly synthetic contracts**, including deliberate showcase patterns for the demo. Synthetic data must never be represented as real government procurement data.

## Database

Seven core tables:

- `departments`
- `vendors`
- `contracts`
- `bids`
- `risk_assessments`
- `risk_flags`
- `contract_extensions`

Relationships:

```text
Department 1 ──── * Contract * ──── 1 Vendor
Contract   1 ──── * Bid
Contract   1 ──── 1 RiskAssessment
Contract   1 ──── * RiskFlag
Contract   1 ──── * ContractExtension
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/contracts` | Contract list |
| GET | `/api/contracts/{id}` | Contract + evidence |
| GET | `/api/vendors` | Vendor list |
| GET | `/api/vendors/{id}` | Vendor profile |
| GET | `/api/departments` | Department list |
| GET | `/api/departments/{id}` | Department profile |
| GET | `/api/dashboard/stats` | Dashboard KPIs |
| GET | `/api/network` | Graph data |
| GET | `/api/risk/{contract_id}` | Risk assessment |
| POST | `/api/risk/analyze?contract_id={id}` | Re-run analysis |
| POST | `/api/nlp/analyze` | Text similarity |
| POST | `/api/blockchain/record` | Optional audit record |

## Demo flow

1. Open dashboard.
2. Show that data is synthetic.
3. Filter high-risk contracts.
4. Open a suspicious contract.
5. Explain CRS and individual flags.
6. Open vendor profile.
7. Open department/network.
8. Show NLP similarity evidence.
9. Show blockchain only if already stable.

## Limitations

- Rules are screening heuristics, not legal findings.
- Statistical anomaly detection does not establish corruption.
- Text similarity can produce false positives.
- Relationship patterns need contextual human review.
- Live GeM/CPPP scraping is not a demo dependency.
- Thresholds and weights require domain validation before production use.

## Future scope

Validated public datasets, temporal risk models, stronger document analysis, investigator feedback loops, provenance, access control, model monitoring and optional immutable audit anchoring.
