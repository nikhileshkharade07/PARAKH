# FRONTEND RESTORE AUDIT — PARAKH UI/UX RESTORATION

**Audit Timestamp:** 2026-09-03T10:45:00+05:30  
**Investigator / Engineer:** Lead Frontend Preservation & Git Recovery Specialist  
**Project:** PARAKH — AI-Powered Public Procurement Risk Auditor  
**Repository:** `https://github.com/nikhileshkharade07/PARAKH`  
**Target Action:** Comprehensive Forensic Audit & Design Preservation Recovery  

---

## 1. Executive Summary & Identification of the Previous Good Version

Following an exhaustive audit of Git history, reflog, branch trees, and visual media artifacts from prior deployment runs, the exact version containing the **previous good frontend** has been definitively identified:

* **Previous Good Commit:** `67de58ef8ec6e6926e0c83abdde775a95334aaf9` (`67de58e`)
* **Commit Date & Author:** Wed Sep 2 16:44:15 2026 +0530 by `shreyaskhakal <shreyaskhakal@gmail.com>`
* **Commit Subject:** `fix(ui): robust defensive array validation across dashboard, contracts, and network components`
* **Unwanted Redesign Introduction Commit:** `28d25f751ecb1741853d8578a8272e341ba4d58e` (`28d25f7`), which merged and synchronized the external Stitch UI system authored in `c7dedaafee9004253f052f0be0384469aabafa9c` (`c7dedaa`) by `Rahullande08`.

---

## 2. Forensic Answers to Required Questions

### 1. What frontend framework is currently used?
* **Core Framework:** React 18.2 with Vite SPA runtime (`@vitejs/plugin-react`) and React Router v6 (`react-router-dom`).
* **Visual Graph Engine:** Cytoscape.js (`cytoscape`) with Force-Directed (`cose`) layout.
* **Charts Engine:** Recharts (`recharts`).
* **Unwanted Overlays Added in Redesign:** `@tailwindcss/vite` (Tailwind v4), external Geist / JetBrains Mono fonts, and Google Material Symbols injected over the original native styling system.

### 2. What frontend files were recently changed?
* **In Commit `28d25f7` (Unwanted Stitch Redesign Synced to Root):**
  * `src/App.jsx` (Replaced topbar shell with sidebar-based `AppShell`)
  * `src/styles.css` (Overwritten with 749 lines of Stitch CSS classes and tokens)
  * `src/pages/DashboardPage.jsx` (Replaced Forensic Audit Priority Showcase & Multi-State Dataset banners with Bento grid & Donut chart)
  * `src/pages/ContractsPage.jsx` (Overwritten with Stitch table layout)
  * `src/pages/NetworkPage.jsx` (Overwritten with Stitch network interface)
  * `src/pages/SimulatorPage.jsx` (Overwritten with Stitch Risk Sandbox)
  * `src/pages/DepartmentProfilePage.jsx` & `src/pages/VendorProfilePage.jsx` (Overwritten)
  * Added non-standard pages: `src/components/AppShell.jsx`, `src/pages/AIAssistantPage.jsx`, `src/pages/IngestPage.jsx`, `src/pages/InvestigationPage.jsx`, `src/pages/InvestigatorPage.jsx`
  * Modified root `index.html`, `package.json`, `package-lock.json`, and `vite.config.js`.
* **In Subsequent Antigravity Commits (`b632c49`, `f6737b7`, `339736f`, `cd96a5b`, `c539ddc`):**
  * `src/components/AppShell.jsx` (Added omni-search modal and theme toggle buttons)
  * `src/pages/AIAssistantPage.jsx` (Added multi-turn assistant chat view)
  * `src/pages/ContractsPage.jsx` (Added dark-theme class modifiers)
  * `src/pages/InvestigationPage.jsx` (Altered investigation card states)
  * `src/pages/NetworkPage.jsx` (Added 5 topology dropdown modes)
  * `src/services/api.js` (Added auxiliary fallbacks and search routes)
  * `src/styles.css` (Added dark-theme token inversions)

### 3. Which commit introduced the unwanted redesign?
* **Commit:** `28d25f751ecb1741853d8578a8272e341ba4d58e`
* **Message:** `feat(frontend): sync full Stitch UI design system pushed by rahullande08 to root for Vercel deployment`
* **Trigger:** Synchronization of the external `frontend/` Stitch template into the active root Vite application directory (`src/`).

### 4. Which commit contains the previous good frontend?
* **Commit:** `67de58ef8ec6e6926e0c83abdde775a95334aaf9`
* **Status:** This commit is immediately prior to `28d25f7`. It contains the complete, authentic, fully styled, and verified PARAKH UI/UX design system that the user loved.

### 5. Are there previous branches or deployment versions?
* `backup-sih2026-baseline-28d25f7`: Branch created at the baseline of the redesign.
* `backup/pre-ai-and-ui-restoration`: Branch created at `cd96a5b`.
* `backup/pre-complete-parakh-fix`: Branch created at `f6737b7`.
* `backup/pre-parakh-full-fix`: Branch created at `b632c49`.
* `remotes/origin/kartiki-lastnight-work`: Early branch by team member Kartiki (`10c8caa`).
* `remotes/origin/main`: Main tracking branch.

### 6. Is there a backup or earlier Vercel deployment?
* **Live Deployment:** Previously deployed to `https://parakh2.vercel.app/` built from commit `67de58e` and `b6c66d1`.
* **Visual Telemetry Artifacts:** High-resolution screenshots captured during the verified session at commit `67de58e` exist in the IDE brain storage:
  * `dashboard_page_1788347785160.png` (Top navigation, Forensic Audit Priority Showcase, Multi-State banner, KPI cards)
  * `contracts_page_1788347852179.png` (Authentic procurement contract registry with filter pills and CRS score badges)
  * `network_graph_page_1788348172744.png` (COSE Force-Directed Cytoscape vendor-department network graph)
  * `simulator_page_1788348255673.png` (Interactive Policy & Threshold Settings Sensitivity Sandbox)
  * `ai_assistant_modal_1788348565477.png` (Sleek slide-out Investigator AI Assistant drawer)

### 7. What exact files need to be restored?
* **Files to restore from Commit `67de58ef8ec6e6926e0c83abdde775a95334aaf9`:**
  * `index.html`
  * `package.json`
  * `package-lock.json`
  * `vite.config.js`
  * `src/App.jsx`
  * `src/styles.css`
  * `src/pages/DashboardPage.jsx`
  * `src/pages/ContractsPage.jsx`
  * `src/pages/ContractDetailContainer.jsx`
  * `src/pages/CasesPage.jsx`
  * `src/pages/NetworkPage.jsx`
  * `src/pages/SimulatorPage.jsx`
  * `src/pages/VendorProfilePage.jsx`
  * `src/pages/DepartmentProfilePage.jsx`
  * `src/components/AIAssistantDrawer.jsx`
  * `src/components/DataIngestionModal.jsx`
  * `src/components/AuthModal.jsx`
  * `src/components/ui/button.jsx`
  * `src/components/ui/card.jsx`
  * `src/components/ui/table.jsx`
  * `src/services/api.js`
  * `src/services/api.test.js`
* **Redesign-only files to DELETE from `src/`:**
  * `src/components/AppShell.jsx`
  * `src/pages/AIAssistantPage.jsx`
  * `src/pages/IngestPage.jsx`
  * `src/pages/InvestigationPage.jsx`
  * `src/pages/InvestigatorPage.jsx`
  * Redundant auxiliary service wrappers (`src/services/aegisService.js`, `src/services/searchService.js`, etc.) that do not belong to the authentic frontend.
* **Secondary Directory Alignment:**
  * Mirror the exact restored files to `frontend/src/` to prevent divergent builds or regressions.

---

## 3. Visual & Functional Comparison

| Dimension | Previous Good Version (`67de58e`) | Unwanted Redesign (`28d25f7` .. `HEAD`) |
| :--- | :--- | :--- |
| **Header / Navigation** | **Horizontal Topbar Shell**: Sleek logo `P`, "PARAKH / AI Public Procurement Risk Auditor", pill navigation (`Dashboard`, `Contracts Registry`, `Investigations`, `Network Graph`, `Risk Sandbox`), action buttons (`Ingest Data`, `AI Assistant`), and user status chip (`investigator INVESTIGATOR`). | **Left Sidebar (`AppShell`)**: 8 vertical menu items, generic search header, day/night toggle buttons, and avatar dropdown. |
| **Color Palette** | **Deep Cyber Dark Navy**: Consistent `#0b0f19` background with deep slate surfaces (`#111827`, `#1e293b`), glowing cyan/blue highlights (`#38bdf8`, `#2563eb`), and high-contrast risk badges. | **Dual Light/Dark Overrides**: Added Tailwind v4 variables, light gray surfaces (`#f8fafc`), and custom token inversion layers. |
| **Dashboard Structure** | 1. Header with direct Ingest/AI triggers.<br>2. **Multi-State Dataset banner** (431 Depts, 1859 Suppliers, OCDS/OGD).<br>3. **Scientific ML Benchmark banner** (F1: 0.9903, Zero Leakage).<br>4. **Forensic Audit Priority Showcase** (3 instant investigation cards).<br>5. 4 KPI cards (4,254 tenders, ₹40.5k Cr, 3 high risk, 11 cases).<br>6. Risk distribution breakdown & High-risk contracts table. | Bento grid layout with Donut Chart (`12.4k total`), generic anomaly bar charts, and removed ML/Dataset verification banners. |
| **AI Assistant** | **Slide-out Drawer (`AIAssistantDrawer.jsx`)**: Floats over any active screen without leaving context; includes suggested queries, grounding citation chips, and real-time query interface. | Separate standalone full-page view (`/ai-assistant`) that pulled investigator away from their active case analysis. |
| **Data Ingestion** | **Modal Overlay (`DataIngestionModal.jsx`)**: Ingest modal accessible directly from the topbar with drag-and-drop CSV/JSON upload. | Separate full-page route (`/ingest`). |
| **Investigation Dossier** | Dedicated `/contracts/:id` and `/cases` with detailed heuristic audit scores, red flag breakdown, and blockchain verification. | Shifted to `/investigation?contractId=...` and `/investigator`. |
| **Network Graph** | Focused Cytoscape vendor ↔ department bipartite graph with Force-Directed (COSE) layout, risk filter (`CRS ≥ 70`), zoom/fit controls. | Multi-dropdown topology switcher with extraneous modes. |
| **Risk Sandbox** | Dedicated Forensic Simulation Lab with real-time statutory threshold sliders and live composite risk score calculation. | Generic slider layout. |

---

## 4. Backend Work Preservation Guarantee (Rule 4)

In strict accordance with **Rule 4**, all backend improvements made during recent sessions will be **100% preserved**:
* ✅ `backend/app/api/routes/network.py` (Fast SQL queries and graph generation)
* ✅ `backend/app/services/assistant_service.py` (Full NLP and conversational reasoning engine)
* ✅ `backend/ml/risk_engine/` (RF1–RF8 heuristics and ML collusion synergy)
* ✅ `backend/ml/anomaly_detection/isolation_forest.py` (Outlier scoring)
* ✅ `backend/ml/nlp/similarity.py` (Specification overlap similarity)
* ✅ `parakh.db` (The complete 4,251 procurement database)
* ✅ `api/index.py` & `api/requirements.txt` (Vercel serverless cold-start replication)
* ✅ `tests/` (Full 55-test Pytest backend suite)

---

## 5. Step-by-Step Restoration Plan

1. **Targeted Git Checkout of Frontend Files:**
   * Extract all frontend files from `67de58ef8ec6e6926e0c83abdde775a95334aaf9` into `src/`, `index.html`, `package.json`, `package-lock.json`, and `vite.config.js`.
2. **Purge Redesign Artifacts:**
   * Delete `src/components/AppShell.jsx`, `src/pages/AIAssistantPage.jsx`, `src/pages/IngestPage.jsx`, `src/pages/InvestigationPage.jsx`, `src/pages/InvestigatorPage.jsx`, and unused redesign services.
3. **Synchronize `frontend/` Subdirectory:**
   * Align `frontend/` with the exact restored code so that both root Vite and `frontend/` are identical.
4. **Local Verification:**
   * Run `npm install` (if package dependencies changed).
   * Run `npm run build` to verify clean compilation with zero warnings or errors.
   * Run `npx vitest run` to verify all frontend tests pass.
   * Run Pytest to ensure backend compatibility remains 100%.
5. **Functional Quality Check:**
   * Validate API connectivity between `api.js` and live endpoints (`/contracts`, `/departments`, `/vendors`, `/network/graph`, `/assistant/query`, `/cases`).
   * Confirm no blank pages, broken links, or console errors across all 5 core routes (`/`, `/contracts`, `/contracts/:id`, `/network`, `/simulator`, `/cases`).
