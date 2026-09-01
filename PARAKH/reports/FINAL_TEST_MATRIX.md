# PARAKH — Master Test & Verification Matrix

**Audit Date:** September 1, 2026  
**Auditor:** QA Engineering Lead & SIH Technical Auditor  
**Total Test Cases:** 62 Backend Tests + 9 Frontend Vitest Suites + Master System Validator (100% Passing)

---

## Comprehensive Test Execution Matrix

| Subsystem | Test Module / Script | Test Description / Target | Command | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|:---:|
| **API** | `tests/test_backend/test_api.py` | Dashboard aggregated statistics endpoint | `pytest tests/test_backend/test_api.py -k test_dashboard_stats` | HTTP 200, JSON schema valid | HTTP 200, stats returned | **PASS** |
| **API** | `tests/test_backend/test_api.py` | Contracts list pagination and filtering | `pytest tests/test_backend/test_api.py -k test_contracts_list` | HTTP 200, paginated records | HTTP 200, 20 items/page | **PASS** |
| **API** | `tests/test_backend/test_api.py` | Contract detail and red flag breakdown | `pytest tests/test_backend/test_api.py -k test_contract_detail` | HTTP 200, CRS & flags breakdown | HTTP 200, full evidence | **PASS** |
| **API** | `tests/test_backend/test_api.py` | TF-IDF Specification tailoring similarity | `pytest tests/test_backend/test_api.py -k test_nlp_endpoint` | HTTP 200, similarity score 0-1 | HTTP 200, computed score | **PASS** |
| **API** | `tests/test_backend/test_api.py` | Bipartite collusion network graph generator | `pytest tests/test_backend/test_api.py -k test_network_graph` | HTTP 200, Cytoscape nodes/edges | HTTP 200, graph payload | **PASS** |
| **AI Assistant** | `tests/test_backend/test_assistant.py` | Grounded tender forensic interrogation | `pytest tests/test_backend/test_assistant.py -k test_assistant_query_specific_tender` | Grounded answer with citations | Exact tender match + citation | **PASS** |
| **AI Assistant** | `tests/test_backend/test_assistant.py` | Vendor monopoly win-rate query | `pytest tests/test_backend/test_assistant.py -k test_assistant_query_suspicious_vendors` | Top vendors with win rates | Ranked vendor list + CRS | **PASS** |
| **AI Assistant** | `tests/test_backend/test_assistant.py` | Single bidder & short window query | `pytest tests/test_backend/test_assistant.py -k test_assistant_query_single_bidders` | Identified single bidder tenders | Matching tenders returned | **PASS** |
| **Security** | `tests/test_backend/test_assistant.py` | Malicious prompt injection rejection | `pytest tests/test_backend/test_assistant.py -k test_assistant_prompt_injection_rejected` | Security policy notice returned | "Security & Policy Guard Notice" | **PASS** |
| **Security** | `tests/test_backend/test_assistant.py` | SQL injection attempt neutralization | `pytest tests/test_backend/test_assistant.py -k test_assistant_sql_injection_attempt` | Safe parameterized query | Zero execution of injection | **PASS** |
| **Security** | `tests/test_backend/test_security.py` | Invalid / forged JWT token rejection | `pytest tests/test_backend/test_security.py -k test_invalid_jwt_token_rejection` | HTTP 401 / Anonymous fallback | Graceful security rejection | **PASS** |
| **Security** | `tests/test_backend/test_security.py` | Dangerous file extension upload security | `pytest tests/test_backend/test_security.py -k test_unsupported_file_upload_security` | HTTP 400 rejection (.exe/.sh) | HTTP 400 Bad Request | **PASS** |
| **Auth & RBAC** | `tests/test_backend/test_auth.py` | PBKDF2-HMAC-SHA256 CSPRNG salt verification | `pytest tests/test_backend/test_auth.py -k test_password_hashing` | 100k rounds, secure salt | Verified PBKDF2 format | **PASS** |
| **Auth & RBAC** | `tests/test_backend/test_auth.py` | JWT creation, expiration & signature check | `pytest tests/test_backend/test_auth.py -k test_jwt_token_generation_and_decoding` | Valid signature & expiry | Verified HS256 decode | **PASS** |
| **Auth & RBAC** | `tests/test_backend/test_auth.py` | User login and access token issuance | `pytest tests/test_backend/test_auth.py -k test_auth_login_endpoint` | HTTP 200, access_token returned | Token issued with role | **PASS** |
| **Blockchain** | `tests/test_backend/test_blockchain_verify.py` | Cryptographic anchoring & tamper detection | `pytest tests/test_backend/test_blockchain_verify.py` | Canonical SHA-256 match | INTEGRITY VERIFIED | **PASS** |
| **Cases** | `tests/test_backend/test_cases.py` | Investigation case lifecycle management | `pytest tests/test_backend/test_cases.py` | NEW -> UNDER_REVIEW -> CLOSED | Full workflow lifecycle | **PASS** |
| **Ingestion** | `tests/test_backend/test_ingest.py` | Multi-format CSV / JSON upload & scoring | `pytest tests/test_backend/test_ingest.py` | Rows ingested & batch scored | Ingested & CRS calculated | **PASS** |
| **Data Hygiene** | `tests/test_ml/test_benchmark_defensible.py` | Canonical schema Pydantic validation | `pytest tests/test_ml/test_benchmark_defensible.py -k test_canonical_schema` | Validated field constraints | Clean Pydantic model | **PASS** |
| **Data Hygiene** | `tests/test_ml/test_benchmark_defensible.py` | Automated structural hygiene validator | `pytest tests/test_ml/test_benchmark_defensible.py -k test_data_quality` | Detection of duplicate/negative | Violations flagged correctly | **PASS** |
| **Leakage** | `tests/test_ml/test_benchmark_defensible.py` | Zero-leakage partition verification | `pytest tests/test_ml/test_benchmark_defensible.py -k test_leakage_detection` | Raises on cross-split overlap | Overlap caught immediately | **PASS** |
| **Leakage** | `tests/test_ml/test_benchmark_defensible.py` | StratifiedGroupKFold supplier separation | `pytest tests/test_ml/test_benchmark_defensible.py -k test_supplier_grouped` | 0 shared suppliers across folds | 0 shared suppliers verified | **PASS** |
| **ML Engine** | `tests/test_ml/test_benchmark_defensible.py` | Pure tabular feature model execution | `pytest tests/test_ml/test_benchmark_defensible.py -k test_pure_tabular` | Fits on raw features without rule | Predictions generated safely | **PASS** |
| **ML Engine** | `tests/test_ml/test_benchmark_defensible.py` | Bootstrap 95% confidence intervals | `pytest tests/test_ml/test_benchmark_defensible.py -k test_bootstrap` | Bounds [low, high] in [0, 1] | Non-empty confidence bounds | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-1 Single Bidder detection | `pytest tests/test_ml/test_rules.py -k test_rf1` | Single bidder flagged (+20 pts) | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-2 Vendor Lock-in (>60% department wins) | `pytest tests/test_ml/test_rules.py -k test_rf2` | Concentrated vendor flagged | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-3 Threshold Smurfing (90-100% of 50L) | `pytest tests/test_ml/test_rules.py -k test_rf3` | Split contract flagged | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-4 Compressed Tender Window (<7 days) | `pytest tests/test_ml/test_rules.py -k test_rf4` | Short window flagged | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-5 Price Deviation (>30% above estimate) | `pytest tests/test_ml/test_rules.py -k test_rf5` | Over-budget tender flagged | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-6 Repeat Winner (>=3 consecutive wins) | `pytest tests/test_ml/test_rules.py -k test_rf6` | Repeat winner flagged | Flag detected | **PASS** |
| **Rules** | `tests/test_ml/test_rules.py` | RF-8 Unusual Extensions (>=2 extensions) | `pytest tests/test_ml/test_rules.py -k test_rf8` | Extension pattern flagged | Flag detected | **PASS** |
| **Frontend** | `frontend/src/services/api.test.js` | API service client configuration & endpoints | `npm test src/services/api.test.js` | Base URL & endpoint calls | 2 tests passed | **PASS** |
| **Frontend** | `frontend/src/pages/ContractsPage.test.jsx` | Contracts table filters and render | `npm test src/pages/ContractsPage.test.jsx` | Filter options & table rows | 2 tests passed | **PASS** |
| **Frontend** | `frontend/src/components/AIAssistantDrawer.test.jsx` | AI Assistant query submission & citations | `npm test src/components/AIAssistantDrawer.test.jsx` | Header, query response & links | 3 tests passed | **PASS** |
| **Frontend** | `frontend/src/pages/DashboardPage.test.jsx` | KPI metric cards & chart visualization | `npm test src/pages/DashboardPage.test.jsx` | KPIs, charts, showcase items | 2 tests passed | **PASS** |
| **System** | `scripts/validate_parakh.py` | Master 8-stage end-to-end system validator | `python scripts/validate_parakh.py` | Exit Code 0 | Exit Code 0 (All Checks Passed) | **PASS** |
| **Build** | `frontend/vite.config.js` | Production client build bundle | `npm run build` | Zero syntax / bundle errors | Built in 11.87s | **PASS** |
