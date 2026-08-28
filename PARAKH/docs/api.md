# PARAKH REST API Documentation

Base URL: `http://localhost:8000/api`  
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 📡 Endpoints

### 1. Dashboard & Metrics
- **`GET /api/dashboard/stats`**: Retrieve aggregated metrics across contracts, total value, risk category counts, and average CRS.

### 2. Contracts Registry & Investigation
- **`GET /api/contracts`**: List contracts with pagination, full-text search, risk level filter, and entity filters.
  - Query parameters: `search`, `risk_level` (`high`, `medium`, `low`), `department_id`, `vendor_id`, `limit`, `offset`.
- **`GET /api/contracts/{id}`**: Detailed forensic audit dossier for a single contract, including full CRS breakdown, red flag explanations, participating bidders, and extension timeline.
- **`POST /api/risk/analyze?contract_id={id}`**: Re-execute the complete risk engine (Rules + Isolation Forest + NLP) on a contract on-demand.

### 3. Vendor & Department Profiles
- **`GET /api/vendors`**: List all registered suppliers.
- **`GET /api/vendors/{id}`**: Vendor audit profile with total contracts, revenue won, department distribution, and average CRS.
- **`GET /api/departments`**: List procuring government departments.
- **`GET /api/departments/{id}`**: Department profile with spending volume, vendor concentration ratio, and high-risk contract metrics.

### 4. Graph Network Analytics
- **`GET /api/network`**: Returns bipartite graph node and edge objects for Cytoscape.js visualizer.

### 5. NLP & Text Forensics
- **`POST /api/nlp/analyze`**: Compute TF-IDF cosine similarity between tender specification and vendor catalog.
  - Payload: `{ "specification": "...", "vendor_description": "...", "threshold": 0.85 }`

### 6. Blockchain Audit Anchoring
- **`POST /api/blockchain/record`**: Generate canonical SHA-256 audit hash and simulate Ethereum Sepolia testnet anchoring.
  - Payload: `{ "contract_id": "GEM-DEMO-000007", "crs": 90, "flags": ["RF-1", "RF-7"] }`
