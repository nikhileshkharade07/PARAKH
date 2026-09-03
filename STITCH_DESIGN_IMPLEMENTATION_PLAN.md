# STITCH DESIGN IMPLEMENTATION PLAN — PARAKH INTELLIGENCE PLATFORM

**Authorized Stitch Project URL:** [https://stitch.withgoogle.com/projects/15084313135853732777](https://stitch.withgoogle.com/projects/15084313135853732777)  
**Authorized Stitch Project ID:** `15084313135853732777`  
**Target Application:** PARAKH — AI Public Procurement Risk Auditor  
**Audit Timestamp:** 2026-09-03  
**Status:** COMPLETE & GROUNDED IN VERIFIED STITCH ASSETS

---

## 1. Executive Summary & Visual Architecture

Stitch Project `15084313135853732777` ("PARAKH Frontend Feature Parity Audit") establishes a high-density, forensic-grade enterprise intelligence workspace. Built for regulatory bodies, compliance officers, and executive procurement investigators, the interface projects clinical objectivity, authoritative clarity, and surgical visual precision.

The design eliminates decorative clutter and replaces it with:
1. **Clinical High-Density Information Hierarchy**: Razor-sharp hairline borders (`#e2e8f0`), porcelain backdrop (`#f8f9ff`), pure white card surfaces (`#ffffff`), and pitch slate accent containers (`#0f172a` / `#131b2e`).
2. **Standardized Typographic Palette**:
   - Primary: **Plus Jakarta Sans** (weights 400, 500, 600, 700) for authoritative display, headings, and legible body copy.
   - Monospace: **JetBrains Mono** (weights 400, 500, 600) for tender reference codes (`2017_FDC_18741_6`), financial sums (`₹40,531 Cr`), CRS metrics (`81/100`), hash digests, and statistical intervals.
   - Micro-labels: Uppercase tracking (`0.04em`, 11px/12px) for table headers and classification badges.
3. **Calibrated Forensic Risk Tier Semaphores**:
   - **Critical / High Risk (CRS ≥ 70)**: Crimson Red (`#dc2626` / `#ba1a1a`), Rose blush background (`#fef2f2`), border `#fecaca`.
   - **Medium / Suspect Risk (40 ≤ CRS < 70)**: Warm Amber Ochre (`#d97706` / `#b45309`), Honey wash (`#fffbeb`), border `#fde68a`.
   - **Low / Verified Safe (CRS < 40)**: Deep Emerald (`#059669` / `#10b981`), Mint wash (`#ecfdf5`), border `#a7f3d0`.
   - **Unrated / Dormant**: Slate neutral (`#64748b` / `#45464d`), Ice wash (`#eff4ff`).

---

## 2. Comprehensive Stitch Screen Inventory

The Stitch project contains **9 fully realized forensic screens**:

| # | Screen ID | Title in Stitch | Purpose & Core Layout | PARAKH Route Target |
|---|---|---|---|---|
| 1 | `0966bdc8f9f5434ab1f1f2c56b7a697a` | **Procurement Risk Overview Dashboard** | Executive KPI cards, OCDS multi-jurisdiction ribbon, 3-up Forensic Audit Priority Showcase, Risk Distribution, Department Risk Breakdown, Recent Audits | `/` (Dashboard) |
| 2 | `ca6a65b10b104ec79ae5d74322758a86` | **Procurement Contracts Registry** | 4-stat KPI track, full-spectrum filter console (risk level, department, vendor, date, value), dense tabular contract ledger with monospace IDs, CRS badges, status chips, quick actions | `/contracts` |
| 3 | `6199e2fc3bd44b81857c88e5aadab6ee` | **Forensic Audit Dossier - 2017_FDC_18741_6** | Top breadcrumb & action strip, 4-up Bento telemetry (Award Drift, Window Speed, Collusion Index, Repeat Vendor), Tender Specs, Rigging Indicators, Evidence stream tabs, Timeline, Risk Breakdown radar, Blockchain proof, Case notes | `/contracts/:id` |
| 4 | `ef0f61c9d64d48c7a16a761cfa5e5f3a` | **Investigations Hub** | Active docket count, Kanban / Ledger view toggle, 4 telemetry metric cards, 5-stage case pipeline (Initial Triage, Preliminary Inquiry, Formal Audit Review, Vigilance Escalation, Closed), interactive case dossier cards | `/cases` |
| 5 | `476654630772451c935c7fc4317c9424` | **Network Graph Analysis** | Topology workbench, cluster telemetry banner, Layout algorithms (COSE, Concentric, Circular, Bipartite), High Risk filter toggle, Presets (All, Defense, Collusion Rings), interactive SVG/Cytoscape canvas with inspector drawer | `/network` |
| 6 | `27a2e1ed38604e68bd3624903d9de164` | **Risk Sandbox Simulator** | Live sensitivity lab, interactive sliders (Vendor Risk Profile, Price Variance vs Average, Bid Pattern Anomaly, Network Exposure), dynamic CRS gauge, live attribution delta breakdown, model parameters panel | `/simulator` |
| 7 | `a6f902d9f3c440d29fdc57afc596027a` | **PARAKH AI Assistant • Forensic Copilot** | Dedicated AI copilot workspace & drawer, suggested forensic inquiries, multi-turn dialogue with citation cards, RAG evidence grounding, diagnostic brief cards, confidence bars | Full view + Drawer |
| 8 | `d488515f872c4b7ab0501cc9d4a11db5` | **Dataset Ingestion & ETL Pipeline** | 4-col pipeline telemetry (Nodes online, Records parsed, Error rate, Schema standards), drag-and-drop ingestion zone, format selectors (OCDS, GeM, CSV), processing progress, recent ingestion logs | Ingestion modal / `/ingest` |
| 9 | `ab2701d1dd544dbe834be19b067edecd` | **Investigator Management & Forensic Roles** | Statutory authority header, 4-card investigator metrics, auditor directory table, clearance tiers (Lead Auditor, Forensic Investigator, Vigilance Officer), cryptographic signing key status | Auth / Auditor Roles modal |

---

## 3. Design System Foundations & Tokens

### 3.1 Colors
```css
:root {
  /* Surfaces */
  --color-surface: #f8f9ff;
  --color-surface-bright: #f8f9ff;
  --color-surface-dim: #cbdbf5;
  --color-surface-lowest: #ffffff;
  --color-surface-low: #eff4ff;
  --color-surface-container: #e5eeff;
  --color-surface-high: #dce9ff;
  --color-surface-highest: #d3e4fe;
  
  /* Text & On-Surfaces */
  --color-on-surface: #0b1c30;
  --color-on-surface-variant: #45464d;
  --color-outline: #76777d;
  --color-outline-variant: #c6c6cd;
  
  /* Brand & Neutrals */
  --color-primary: #000000;
  --color-primary-container: #131b2e;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #7c839b;
  
  /* Accents */
  --color-secondary: #4b41e1;
  --color-secondary-container: #645efb;
  --color-secondary-fixed: #e2dfff;
  --color-on-secondary-fixed: #0f0069;
  
  /* Risk Tiers */
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  --color-warning: #b45309;
  --color-warning-container: #fef3c7;
  --color-success: #059669;
  --color-success-container: #ecfdf5;
}
```

### 3.2 Typography Tokens
- **Display LG**: Plus Jakarta Sans, 36px / 44px, Bold (`font-bold`), Tracking `-0.03em`.
- **Headline LG**: Plus Jakarta Sans, 24px / 32px, Bold, Tracking `-0.02em`.
- **Headline MD**: Plus Jakarta Sans, 20px / 28px, Semibold (`font-semibold`), Tracking `-0.015em`.
- **Headline SM**: Plus Jakarta Sans, 16px / 24px, Semibold, Tracking `-0.01em`.
- **Body MD**: Plus Jakarta Sans, 14px / 20px, Regular (`font-normal`).
- **Body SM**: Plus Jakarta Sans, 13px / 18px, Regular.
- **Label MD**: Plus Jakarta Sans, 12px / 16px, Semibold, Tracking `0.02em`, Uppercase option.
- **Label SM**: Plus Jakarta Sans, 11px / 14px, Semibold, Tracking `0.04em`, Uppercase.
- **Code LG**: JetBrains Mono, 20px / 26px, Semibold, Tracking `-0.02em`.
- **Code MD**: JetBrains Mono, 13px / 18px, Medium (`font-medium`).
- **Code SM**: JetBrains Mono, 11px / 16px, Medium.

### 3.3 Spacing & Shell Dimensions
- Sidebar width: `16rem` (256px) persistent on desktop (≥1024px).
- Topbar height: `4rem` (64px) sticky top.
- Inspector drawer width: `24rem` (384px).
- Content max-width: `1600px` centered with fluid gutter padding (`px-4 sm:px-6 lg:px-8`).

---

## 4. Reusable Component Strategy

To guarantee modularity, maintainability, and zero regression, we build reusable production components:
1. `AppShell.jsx`: Fixed sidebar, sticky omnisearch topbar with `⌘K`, notification trigger, theme toggle, and current user clearance badge.
2. `Sidebar.jsx`: Brand identity, "+ Start Audit" quick action, "Forensic Workspace" nav links with active indicator pills, "Workflows" (Ingest, AI Assistant, Roles), and bottom utility links.
3. `Header.jsx`: Omnisearch with keyword debouncing, notifications dropdown, theme toggle, investigator status badge.
4. `StatCard.jsx`: Bento-style KPI card supporting standard porcelain, alert-tinted, and tactical inverted slate variants.
5. `RiskBadge.jsx`: Standardized CRS pill badge (Critical, Medium, Low, Safe) with monospaced score and icon.
6. `DataTable.jsx`: High-density forensic table with sticky header, monospaced numerical formatting, hover row elevation, and empty/loading states.
7. `FilterConsole.jsx`: Unified multi-select/dropdown search and filter bar with clear button and active counter.
8. `AIAssistantDrawer.jsx`: Slide-out or dedicated view with multi-turn chat, prompt chips, citations linking directly to contract dossiers, copy, and clear session.
9. `NetworkGraphView.jsx`: Cytoscape-powered multi-layout visual graph with node inspection drawer, layout controls, and high-risk filtering.
10. `RiskSimulatorView.jsx`: Interactive real-time parameter sandbox with sliders and dynamic CRS attribution.
11. `DossierDetailView.jsx`: Comprehensive forensic audit dossier with 4-up Bento telemetry, red flag evidence breakdown, timeline, and blockchain proof.
12. `IngestModal.jsx`: Multi-source dataset ingestion with format validation and live progress feedback.
13. `AuthModal.jsx`: Role-switching modal with cryptographic authority status.

---

## 5. Responsive Behavior & Accessibility

- **Desktop (≥1280px)**: Persistent 256px sidebar, 4-column Bento metric grids, side-by-side graph and inspector drawer.
- **Tablet (768px – 1279px)**: Sidebar folds into an off-canvas drawer toggled by hamburger menu, 2-column stat grids.
- **Mobile (<768px)**: Single column layouts, horizontal scroll for dense tabular registers with sticky leading column, mobile-friendly navigation sheets.
- **Accessibility**: High-contrast ratios meeting WCAG AAA for text, ARIA attributes on interactive tabs and disclosures, keyboard navigation (`⌘K` omnisearch, ESC to close drawers).

---

## 6. Execution Roadmap

1. **Tokens & Shell Integration**: Inject Plus Jakarta Sans, JetBrains Mono, and Material Symbols; establish clean Tailwind v4 utility tokens and base stylesheet.
2. **AppShell & Navigation**: Build the Stitch left rail and sticky topbar with responsive mobile sheet.
3. **Core Dashboard & Showcase**: Implement the Forensic Audit Priority Showcase, Multi-State OCDS ribbon, and real-time backend metric cards.
4. **Contract Registry & Dossier**: Implement the Stitch contract registry with advanced filters, plus the comprehensive Forensic Audit Dossier for individual contracts.
5. **Investigations Hub (Cases)**: Implement the Kanban / Ledger view for multi-stage forensic dockets.
6. **Network Graph & Risk Sandbox**: Modernize the Cytoscape graph with Stitch node badges, edge styles, and inspector drawer; rebuild the Risk Sandbox simulator.
7. **AI Assistant & Ingest Workflows**: Embed the Stitch forensic copilot with RAG citations, and the Ingest & Auditor Management interfaces.
8. **End-to-End Verification**: Run build, unit tests, verify real data pipelines, test responsive viewports, and deploy to Vercel.
