# PARAKH System Architecture

PARAKH is structured as a **modular monorepo** designed for high throughput, maintainability, and audit traceability.

```text
Synthetic Procurement Data / GeM Ingestion
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

---

## 🏛️ Component Breakdown

### 1. Presentation Layer (`frontend/`)
- **React + Vite**: High-performance single page application.
- **Styling**: Tailored slate dark-mode design system with responsive glassmorphism UI cards.
- **Cytoscape.js**: Interactive bipartite graph visualizer connecting vendors and procuring departments.
- **Recharts**: Metric dashboards, risk distributions, and vendor concentration pie charts.

### 2. Service & API Layer (`backend/app/`)
- **FastAPI**: RESTful API with automated OpenAPI / Swagger documentation at `/docs`.
- **Database Engine**: SQLAlchemy ORM with resilient connection management supporting both PostgreSQL and local SQLite (`parakh.db`).
- **Pydantic Models**: Type-safe request/response schemas with full data validation.

### 3. Intelligence & Forensic Risk Layer (`backend/ml/`)
- **Deterministic Rule Engine (`risk_engine/rules.py`)**: 8 domain-specific procurement red flags (RF-1 to RF-8) producing an explainable rule score (0–100).
- **Statistical Anomaly Detector (`anomaly_detection/isolation_forest.py`)**: Unsupervised Isolation Forest model trained over contract value, duration, extensions, and bidding competition.
- **NLP Text Analyzer (`nlp/similarity.py`)**: Scikit-Learn TF-IDF vectorizer + Cosine Similarity engine measuring specification tailoring against vendor product catalogs.

### 4. Cryptographic Audit Anchoring (`backend/app/api/routes/blockchain.py`)
- Generates canonical SHA-256 hashes of contract risk assessments and provides tamper-proof verification against Ethereum Sepolia testnet.
