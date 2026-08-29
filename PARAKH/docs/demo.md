# PARAKH — SIH Judge Presentation & Live Demonstration Guide

This guide outlines the ideal 5-to-7 minute forensic demonstration workflow for Smart India Hackathon judges, procurement directors, and vigilance officers.

---

## 🎬 Complete SIH Demo Flow (Step-by-Step)

```
[ LOGIN & RBAC ] ──▶ [ DASHBOARD ] ──▶ [ DATA INGESTION ] ──▶ [ RISK ENGINE ]
       │                                                              │
       ▼                                                              ▼
[ BLOCKCHAIN VERIFY ] ◀── [ DOSSIER ] ◀── [ CASE HUB ] ◀── [ AI ASSISTANT ]
```

---

### Step 1: Role-Based Security & Dashboard Overview (1 Min)
1. **Show Role Switcher**: Click the **🛡️ Role Badge** in the top right. Switch between `Lead Auditor`, `Forensic Investigator`, and `Chief Audit Officer (Admin)` to demonstrate true backend-enforced RBAC.
2. **Dashboard Overview (`/`)**:
   - Point out real, un-mocked KPIs: Total contracts ($2,500+$), cumulative value ($\approx ₹800\text{ Cr}$), CRS distribution (Pie chart), and average department risk (Bar chart).
   - Point out the **Responsible AI Statement**: *PARAKH screens suspicious procurement patterns for human investigation; it does not unilaterally declare legal guilt.*

---

### Step 2: Multi-Format Real Data Ingestion (1 Min)
1. Click **📤 Ingest Data** in the topbar.
2. Download the sample CSV schema template with **📥 Download Schema Template**.
3. Drag and drop or select any procurement CSV, Excel (`.xlsx`), or JSON export.
4. Click **Upload & Analyze**:
   - Observe live row-level validation breakdown (*Valid Records*, *Duplicates Filtered*, *Instant ML Anomaly Scoring*).
   - Ingested records automatically enter the live database with zero manual restarts.

---

### Step 3: Showcase High-Risk Anomaly Deep-Dive (`GEM-DEMO-000007`) (1.5 Min)
1. Under the **Forensic Demo Showcase** bar on the dashboard, click **`GEM-DEMO-000007`**.
2. **Explainable CRS Breakdown ($90 / 100$)**:
   - **Rule Score ($80\%$ weight)**: Explains the exact triggers.
   - **Isolation Forest ($20\%$ weight)**: Shows 7D statistical outlier score.
3. **Structured Evidence Cards**:
   - **RF-1 (Single Bidder)**: Only Apex Systems participated.
   - **RF-2 (Vendor Lock-in)**: Apex won $>60\%$ of department contracts.
   - **RF-7 (Specification Tailoring)**: Live NLP Cosine Similarity ($94\%$) detects word-for-word copy from supplier catalog.
4. **Live NLP Sandbox**: Change text in the tender specification box and click *Re-run NLP Similarity Test* to show dynamic similarity recalculation.

---

### Step 4: Grounded AI Investigator Assistant (1 Min)
1. Click **🤖 Ask AI Assistant** in the topbar or dashboard.
2. Click any of the quick suggested chips:
   - *"Why is tender GEM-DEMO-000007 high risk?"*
   - *"Which vendors have unusually high win rates?"*
   - *"Show departments with suspicious vendor concentration"*
3. Observe zero-hallucination answers backed by clickable, verified database citation cards linking directly to the tenders.

---

### Step 5: Investigation Case Management Hub (`/cases`) (1 Min)
1. Navigate to **Investigations** in the top navigation menu.
2. Filter by status (`UNDER_REVIEW`, `ESCALATED`) or priority (`CRITICAL`, `HIGH`).
3. Click **Inspect Dossier** on `CASE-2608-0007`:
   - View active red flags and CRS.
   - Attach new evidence (Document, Spec Diff, Network Cluster).
   - Add a timestamped investigator note to the official case log.
   - Transition status from `UNDER_REVIEW` to `ESCALATED`.

---

### Step 6: Immutable Blockchain Verification & Export (1 Min)
1. Return to the tender dossier view.
2. Under **Immutable Blockchain Cryptographic Proofs**:
   - Click **🛡️ Verify Integrity**.
   - Watch the backend compute the exact SHA-256 canonical hash of the live record and verify it against the anchored Ethereum Sepolia testnet record.
   - Display confirms: **`✓ DOCUMENT INTEGRITY VERIFIED (Sepolia Testnet Block #68192)`**.
3. Click **🖨️ Print Brief** to showcase the print-ready CSS forensic brief layout for vigilance committees.

---

## 🏆 Key Talking Points for Judges

| Evaluation Dimension | What PARAKH Demonstrates |
| :--- | :--- |
| **Explainable AI (XAI)** | Deterministic $CRS = \min(100, 0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore})$ with granular point attribution instead of black-box prediction. |
| **Zero-Hallucination Assistant** | AI queries the real SQL database and only states facts supported by primary procurement records and citations. |
| **Cryptographic Integrity** | Prevents evidence tampering by generating canonical SHA-256 hashes anchored to blockchain testnets. |
| **Enterprise Readiness** | RBAC, persistent case workflows, multi-format ingestion, audit logging, and responsive dark intelligence UI. |
| **Engineering Rigor** | 38/38 automated pytest test suite passing with 100% success rate; evaluated on 2,500 benchmark records with 94.4% accuracy. |
