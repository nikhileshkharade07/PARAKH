# PARAKH Demonstration & Judge Presentation Guide

This guide details the recommended 5-minute forensic demonstration script for hackathon judges and audit stakeholders.

---

## 🎬 5-Minute Demonstration Journey

### Step 1: Establish Problem & Scale (Dashboard `/`)
1. Open the **Procurement Risk Dashboard**.
2. Point out the scale: **2,500 audited contracts**, ₹800+ Cr cumulative procurement volume, and overall systemic risk distribution (Pie chart).
3. State the **Responsible Use Policy**: *PARAKH flags suspicious patterns for human forensic investigation—it does not legally prove criminal wrongdoing.*

### Step 2: Showcase Forensic Anomaly (`GEM-DEMO-000007`)
1. Click on **GEM-DEMO-000007** under the *Forensic Demo Showcase* bar.
2. Observe the **CRS Score: 90 / 100** (High Risk).
3. Walk through the triggered Red Flags:
   - **RF-1 (Single Bidder)**: Only Apex Systems participated.
   - **RF-7 (Specification Tailoring)**: Tender specification matches Apex Systems' internal product description (>90% similarity).
   - **RF-8 (Unusual Extensions)**: Granted 240 days of extensions.

### Step 3: Interactive Forensic Tools
1. **Live NLP Test Box**: Modify the specification text and click *Re-run NLP Similarity Test* to show how cosine similarity scores dynamically change in real time.
2. **Blockchain Verification**: Click *Anchor Audit Evidence Hash* to show canonical SHA-256 generation and Ethereum Sepolia immutable proof receipt.
3. **Export Dossier**: Click *Export Report (JSON)* to show case package generation.

### Step 4: Network Graph Collusion Analysis (`/network`)
1. Navigate to **Cytoscape Network Graph**.
2. Use the **Search bar** to search for `Apex Systems India`.
3. Highlight the repeat-winner connections and vendor concentration between Apex Systems and the *Digital Services Directorate*.
4. Switch layouts between *Force-Directed (COSE)* and *Concentric Circles* to show structural centrality.

### Step 5: Department & Vendor Profiles (`/vendors/:id` & `/departments/:id`)
1. Click on *Apex Systems India* to view the **Vendor Dossier** and risk distribution breakdown.
2. Click on *Digital Services Directorate* to show the **Vendor Concentration Pie Chart (RF-2 Lock-in)**.
