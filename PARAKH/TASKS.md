# PARAKH — 5-Day Execution Plan

## Rules

**WORKING > PERFECT**  
**EXPLAINABLE > BLACK BOX**  
**INTEGRATED > MANY FEATURES**  
**DEMOABLE > COMPLEX**

No direct commits to `main`.

## Day 1 — Foundation

### Person 1 — Backend / Architecture
- [x] PostgreSQL & SQLite connection fallback
- [x] SQLAlchemy models
- [x] FastAPI skeleton
- [x] CORS + configuration
- [x] Pydantic schemas

### Person 2 — Frontend / Dashboard
- [x] Vite + React
- [x] Custom Design System & CSS
- [x] Routing
- [x] App shell
- [x] Dashboard UI
- [x] Contract page UI

### Person 3 — AI/ML
- [x] Risk engine interface
- [x] RF-1 through RF-8
- [x] CRS calculation (0–100)
- [x] Isolation Forest anomaly scoring
- [x] NLP similarity module

### Person 4 — Network / Investigation
- [x] Cytoscape integration
- [x] Network page
- [x] Vendor profile
- [x] Department profile

### Person 5 — Data / QA / Deployment
- [x] Synthetic generator (2,500 demo records)
- [x] Seed script
- [x] Automated test suite (`pytest`)
- [x] Production build validation

### Person 6 — Research / UX / PPT
- [x] Problem research
- [x] Explainable CRS scoring
- [x] Judge demonstration flow
- [x] UX review
- [x] Architecture documentation

## Day 2 — Core product

- [x] Contract/vendor/department APIs
- [x] Dashboard stats API
- [x] Dashboard integration
- [x] All 8 flags
- [x] CRS persistence
- [x] Investigation page
- [x] Evidence cards

**Milestone:** a judge can open one contract and understand why it is risky. (Achieved ✓)

## Day 3 — Intelligence + network

- [x] Network API/UI
- [x] Vendor profile
- [x] Department profile
- [x] Graph interactions & Node inspector drawer
- [x] NLP similarity live tester
- [x] RF-7 integration
- [x] Search/filter/sort/pagination

**Milestone:** complete investigation journey works. (Achieved ✓)

## Day 4 — Integration

- [x] End-to-end test suite
- [x] UI polish & glassmorphic dark styling
- [x] Error/loading states
- [x] Performance check
- [x] Deployment rehearsal & npm build
- [x] Blockchain SHA-256 audit anchoring & Sepolia adapter
- [x] Documentation pass

## Day 5 — Freeze

- [x] Bug fixing & deprecation cleanup
- [x] Demo stabilization
- [x] Final smoke & integration tests (21/21 tests passing)
- [x] Export audit report feature (JSON & CSV dossier downloads)
- [x] Re-run risk engine on demand
- [x] Cytoscape multi-layout switcher, entity search, and zoom controls
- [x] Risk Engine Sensitivity Sandbox & Simulator (`/simulator`)
- [x] Official printable report stylesheet (`@media print`)
