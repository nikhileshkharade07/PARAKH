# PARAKH — Backend Completion & Production-Readiness Report

## 1. Executive Summary
The **PARAKH** (Procurement Analysis, Risk Assessment and Knowledge/Anomaly detection system) backend is now **fully functional, hardened, modular, and tested**. 

All 21 specification requirements—including the 8 procurement risk rules, Isolation Forest anomaly detection, TF-IDF NLP semantic analysis, JWT authentication, Role-Based Access Control (RBAC), multi-format data ingestion (CSV/JSON/Excel), case/investigation management, immutable audit logging, health/readiness endpoints, and cryptographic blockchain ledger anchoring—have been verified with **54 passing automated tests**.

---

## 2. Backend Architecture & Components
```
                    ┌──────────────────────────────────────────────┐
                    │               PARAKH Backend                 │
                    │         FastAPI + Uvicorn + Pydantic         │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         ▼                   ▼                     ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Core REST     │ │   PARAKH Risk   │ │   Forensic &    │ │   Security &    │
│     APIs        │ │     Engine      │ │ Case Management │ │   Audit Trail   │
│                 │ │                 │ │                 │ │                 │
│ • /contracts    │ │ • 8 Risk Rules  │ │ • /cases (CRUD) │ │ • JWT Auth      │
│ • /vendors      │ │ • IsolationFor. │ │ • Case Notes    │ │ • RBAC Matrix   │
│ • /departments  │ │ • TF-IDF NLP    │ │ • Evidence Logs │ │ • Immutable Log │
│ • /dashboard    │ │ • Composite CRS │ │ • /ingest       │ │ • Cryptographic │
│ • /network      │ │ • Evidence Json │ │   (CSV/XLS/JSON)│ │   Ledger Anchor │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                     │                   │
         └───────────────────┼─────────────────────┴───────────────────┘
                             ▼
              ┌─────────────────────────────┐
              │     SQLAlchemy ORM + DB     │
              │ (PostgreSQL Prod / SQLite)  │
              └─────────────────────────────┘
```

---

## 3. Detailed Status of Backend Systems

### A. Foundation & Health/Readiness
- **`GET /api/health`**: Returns `{"status": "ok", "service": "PARAKH backend"}`.
- **`GET /api/ready`**: Verifies active database connectivity via SQL ping without leaking internal configuration.
- **Root endpoints**: `GET /health` and `GET /ready` maintained for backwards compatibility.
- **Centralized Exception Handling**: Uniform error response contract (`{"success": false, "error": {"code": "...", "message": "..."}}`).

### B. Core Risk Engine (8 Red Flags & Composite Risk Score)
Calculates deterministic Composite Risk Score:
$$\text{CRS} = \text{round}\left(\min(100, 0.80 \times \text{rule\_score} + 0.20 \times \text{anomaly\_score})\right)$$

| Rule ID | Rule Name | Severity | Score | Trigger Condition |
| :--- | :--- | :--- | :--- | :--- |
| **RF-1** | Single Bidder | HIGH | 20 | Bidder count = 1 in competitive tender |
| **RF-2** | Vendor Lock-in | HIGH | 20 | Vendor won >60% of observed department contracts (≥3 peers) |
| **RF-3** | Threshold Proximity | HIGH | 15 | Award value within 10% below administrative approval limit (₹50 Lakhs) |
| **RF-4** | Compressed Window | MEDIUM | 10 | Tender submission window < 7 days |
| **RF-5** | Estimate Deviation | MEDIUM | 10 | Award value > 30% above internal department cost estimate |
| **RF-6** | Repeat Winner | HIGH | 20 | Vendor won ≥ 3 consecutive department contracts |
| **RF-7** | Specification Tailoring | MEDIUM | 15 | TF-IDF Cosine Similarity > 0.85 between tender specification & vendor catalog |
| **RF-8** | Unusual Extensions | LOW | 5 | ≥ 2 extensions exceeding 90 days or total duration overrun > 180 days |

- **Persistence**: Atomic update/insert of `RiskAssessment` and `RiskFlag` records with structured `evidence_json`.
- **Traceability**: Transparent breakdown of individual rule contributions, evidence metrics, and forensic action recommendations.

### C. ML Anomaly Detection & NLP
- **Isolation Forest**: Deterministic batch modeling over 9 normalized features (award value, estimate value, bids count, duration, deviation, vendor wins, win ratio, extensions, peer size). Defensive handling against NaNs, infs, and missing fields.
- **NLP Similarity**: TF-IDF vectorization with cosine similarity scoring. Complete fallback for empty, whitespace, or stop-word-only texts.

### D. Authentication & Role-Based Access Control (RBAC)
- **Endpoints**:
  - `POST /api/auth/register`: User self-registration with PBKDF2-HMAC-SHA256 password hashing.
  - `POST /api/auth/login`: Issues JWT tokens (1440 min default expiry) with automated demo user resolution.
  - `POST /api/auth/refresh`: Stateless JWT refresh.
  - `POST /api/auth/logout`: Audit logging and session invalidation.
  - `GET /api/auth/me`: Profile retrieval.
- **Roles**:
  - `ADMIN`: Full platform access, user management, policy configuration.
  - `AUDITOR`: Procurement analysis, risk assessment review, audit logging.
  - `INVESTIGATOR`: Case management, note additions, evidence attachment, case escalation.
  - `DEPARTMENT_OFFICER`: Department-level tender inspection and analytics.

### E. Procurement Data Ingestion
- **Formats Supported**: CSV, Excel (`.xlsx`, `.xls`), and JSON.
- **Safety**: 25MB file size limit, MIME validation, transaction rollbacks on critical errors.
- **Pipeline**: Fuzzy column matching $\rightarrow$ currency/date normalization $\rightarrow$ vendor/department deduplication $\rightarrow$ batch contract persistence $\rightarrow$ automated risk calculation.

### F. Case Management & Investigation Workflow
- **State Transitions**: `NEW` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `EVIDENCE_COLLECTION` $\rightarrow$ `ESCALATED` $\rightarrow$ `CLEARED` / `CLOSED`.
- **Forensic Records**: Time-stamped investigator notes, structured JSON/document evidence attachments, assignee tracking.

### G. Immutable Audit Trail
- **Action Coverage**: User login/logout, data ingestion, risk analysis execution, case lifecycle transitions, note creation, evidence upload, blockchain anchoring.
- **Query Filter**: Filterable by action type, username, resource type, and date range.

### H. Cryptographic Blockchain Anchoring (Optional Layer)
- **Hash Function**: Deterministic canonical SHA-256 hash of contract dossier, risk assessment, and detected red flags.
- **Modes**:
  - **Live Sepolia Mode**: Web3.py RPC broadcast with on-chain calldata verification.
  - **Deterministic Local Mode**: Cryptographic hash comparison fallback for local evaluation and demonstration without gas fees.

---

## 4. Automated Testing Suite
All **54 unit and integration tests** executed and passed cleanly:

```
collected 54 items

tests/test_aegis.py (4 passed)
tests/unit_backend/test_api_routes.py (8 passed)
tests/unit_backend/test_audit_blockchain.py (2 passed)
tests/unit_backend/test_auth_rbac.py (6 passed)
tests/unit_backend/test_cases_investigation.py (1 passed)
tests/unit_backend/test_contracts_api.py (5 passed)
tests/unit_backend/test_health.py (1 passed)
tests/unit_backend/test_health_readiness.py (4 passed)
tests/unit_backend/test_ingest_data.py (5 passed)
tests/unit_backend/test_risk_engine.py (10 passed)
tests/unit_ml/test_isolation_forest.py (3 passed)
tests/unit_ml/test_nlp.py (2 passed)
tests/unit_ml/test_nlp_similarity.py (3 passed)

======================== 54 passed in 6.38s ========================
```

---

## 5. Deployment Readiness
1. **Environment Configuration**: A clean, documented [`.env.example`](file:///.env.example) is configured.
2. **Database Support**: Zero-code switching between SQLite (local) and PostgreSQL with Psycopg (production).
3. **Database Seeding**: Run `python backend/scripts/seed_demo.py` to seed 100+ analyzed contracts and standard demo users.
4. **FastAPI Startup**: `uvicorn backend.app.main:app --reload --port 8000`
