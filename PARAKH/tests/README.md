# PARAKH Automated Test Suite

PARAKH includes a comprehensive automated test suite covering all backend APIs, machine learning risk engines, NLP cosine similarity analyzers, cryptographic blockchain verification, RBAC authentication, real data ingestion, case management, and security edge cases.

## Running Tests

Run the full automated test suite with pytest:

```bash
pytest -v
```

Run in quiet mode:
```bash
pytest -q
```

Run model evaluation benchmark:
```bash
python evaluate_model.py
```

---

## Test Suite Structure (38 Tests)

### 1. `tests/test_backend/` (28 Tests)
- **`test_health.py`** (1 test): System heartbeat and health endpoint verification (`/health`).
- **`test_api.py`** (10 tests): Integration smoke tests for `/api/contracts`, `/api/departments`, `/api/vendors`, `/api/dashboard/stats`, `/api/network`, `/api/nlp/analyze`, `/api/blockchain/record`.
- **`test_auth.py`** (4 tests): PBKDF2-HMAC-SHA256 password hashing/verification, JWT token generation & claims decoding, `/api/auth/login` authentication, and `/api/auth/me` profile resolution.
- **`test_ingest.py`** (3 tests): Ingestion schema template download (`/api/ingest/template`), CSV dataset multi-record parsing & validation, and JSON array multi-object parsing & anomaly scoring.
- **`test_cases.py`** (1 test): Investigation case creation, note additions, evidence artifact attachments, and workflow status transitions (`NEW` $\to$ `UNDER_REVIEW` $\to$ `ESCALATED`).
- **`test_blockchain_verify.py`** (1 test): SHA-256 canonical hash recalculation and Ethereum Sepolia testnet cryptographic integrity verification (`/api/blockchain/verify`).
- **`test_assistant.py`** (3 tests): Grounded AI Investigator Assistant natural language SQL querying: tender deep-dive, vendor win-rate analysis, and single-bidder detection with citations.
- **`test_audit.py`** (1 test): Immutable audit log recording and retrieval (`/api/audit-logs`).
- **`test_security.py`** (4 tests): Malformed JWT handling, dangerous file upload format rejection, SQL injection parameter sanitization, and empty payload rejection.

### 2. `tests/test_ml/` (10 Tests)
- **`test_nlp.py`** (2 tests): TF-IDF vectorization and Cosine Similarity threshold testing for tender specification tailoring detection (RF-7).
- **`test_rules.py`** (8 tests): Deterministic evaluation of all 8 explainable red flag heuristics:
  - RF-1: Single Bidder Tender
  - RF-2: Vendor Lock-in Dominance
  - RF-3: Statutory Approval Threshold Proximity (Smurfing)
  - RF-4: Compressed Tender Submission Window
  - RF-5: Estimate Price Deviation
  - RF-6: Repeat Winner / Department Collusion Pattern
  - RF-7: Specification Tailoring
  - RF-8: Unusual Extended Project Delivery Waivers
