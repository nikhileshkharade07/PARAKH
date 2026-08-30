# Aegis Procurement Engine
## Product Requirements Document (PRD)

| | |
|---|---|
| **Document Version** | 1.0 — Draft for Stakeholder Review |
| **Product Owner** | Principal PM, GovTech / Applied Cryptography |
| **Status** | Draft |
| **Classification** | Public — Open-Source Reference Architecture (target license: Apache 2.0) |
| **Date** | August 27, 2026 |
| **Standards Base** | Open Contracting Data Standard (OCDS) 1.1+, with custom Aegis extensions |

---

## 1. Executive Summary & System Vision

### 1.1 Problem Statement
Public procurement is one of the largest and most corruption-exposed categories of government expenditure. The dominant failure modes are structural, not incidental:

- **Pre-evaluation leakage** — procurement officials or intermediaries learn competitor pricing before bid opening, enabling last-mover advantage and bid rigging.
- **Discretionary scoring** — technical evaluation committees can be pressured, bribed, or simply biased, and paper score sheets are difficult to audit retroactively.
- **Shell company capture** — a small number of real economic actors submit through dozens of shell entities to simulate competition ("cover bidding") or to hide a conflict of interest with the awarding official.
- **Phantom or degraded delivery** — funds are released against milestones that were never physically completed, verified only by self-reported photos or complicit site inspectors.

Existing e-procurement portals digitize the paper process but do not remove the human trust points where corruption actually occurs. Aegis is designed to remove or cryptographically constrain those trust points rather than simply moving them online.

### 1.2 Vision
Aegis Procurement Engine is an **open-source, OCDS-native public procurement platform** that treats corruption resistance as a first-class architectural property, not a policy layer bolted onto existing software. It combines four reinforcing pillars:

1. **Blind ZK-Bidding** — bids are cryptographically committed and cannot be read by anyone, including the platform operator, until the official reveal event.
2. **Automated Technical Evaluation** — scoring rubrics are locked pre-submission and applied by a deterministic rules engine assisted by LLM-based document parsing, minimizing human scoring discretion.
3. **UBO & Shell Company Detection** — a graph database continuously correlates corporate ownership, IPs, wallets, and directorships to surface hidden common control between "competing" bidders and between bidders and officials.
4. **Smart Escrow Payouts** — milestone payments are released only when independent physical-world evidence (IoT telemetry, satellite imagery, drone LIDAR) corroborates contractual progress, reducing reliance on self-attestation.

Aegis does not aim to replace human procurement judgment entirely — it aims to make every discretionary act **cryptographically timestamped, individually attributable, and publicly auditable**, so that corruption requires collusion at a scale and visibility that is operationally very difficult to sustain.

### 1.3 Design Principle: Identity vs. Value Blindness
A critical distinction threaded through this PRD: **Aegis does not anonymize bidders — it blinds bid values.** Vendors must be KYC-verified and linked to a declared UBO record to be eligible to bid at all (this is what makes Pillar 3 possible). What is hidden until the reveal event is *what they bid*, not *who they are*. This resolves the apparent tension between "blind bidding" and "beneficial ownership screening."

### 1.4 OCDS Alignment
Aegis publishes and consumes data at every OCDS lifecycle stage, with custom extensions carrying cryptographic and verification artifacts:

| OCDS Stage | Aegis Contribution |
|---|---|
| Planning | Locked rubric hash, budget ceiling commitment |
| Tender | ZK bid commitments, reveal records, UBO risk annotations |
| Award | Automated score sheet, evaluation audit trail |
| Contract | Escrow terms, milestone definitions |
| Implementation | Milestone verification events, fund release transactions |

### 1.5 What Aegis Is Not
Aegis is not a policy-making body, does not adjudicate corruption (it surfaces evidence to human institutions — regulators, auditors, courts), and does not eliminate the need for legal and institutional reform. It is a trust-minimizing technical substrate for institutions that already have investigative and enforcement authority.

---

## 2. Target Personas

| Persona | Who They Are | Primary Goals | Core Pain Points Today | Key Aegis Touchpoints |
|---|---|---|---|---|
| **Vendor / Bidder** | SMEs, large contractors, consortia bidding on public tenders | Win contracts on merit; get paid reliably and on time; avoid being undercut by rigged bids | Suspect competitors get advance pricing info; opaque scoring; payment delays/disputes over milestone sign-off | ZK bid submission client, technical proposal upload, UBO self-declaration, milestone evidence submission, escrow dashboard |
| **Government Procurement Lead** | Contracting officers, tender committee chairs, agency CFOs | Award contracts efficiently and defensibly; reduce personal liability exposure; meet budget and timeline targets | Manual score sheet reconciliation; pressure from vendors/superiors; difficulty proving process integrity if challenged | Rubric authoring & locking console, tender publication workflow, evaluation exception queue, escrow milestone approval dashboard |
| **Auditor / Citizen / Civil Society Watchdog** | Supreme audit institutions, anti-corruption commissions, investigative journalists, CSOs, ordinary citizens | Verify public money is spent as declared; detect and evidence corruption patterns; hold officials accountable | Data is siloed, incomplete, or published too late to act on; no visibility into *why* a vendor won | Public OCDS data portal, UBO network graph explorer, anomaly/flag feed, milestone verification imagery archive |

---

## 3. System Architecture Overview (Reference)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PUBLIC OCDS DATA PORTAL                     │
│              (read-only, real-time, exportable, API-first)          │
└───────────────────────────────▲───────────────────────────────────┘
                                 │ publishes
┌────────────────────────────────────────────────────────────────────┐
│                     PERMISSIONED LEDGER (multi-stakeholder)         │
│  Validators: Procurement Regulator | Supreme Audit Institution |    │
│  Anti-Corruption Commission | Civil Society Consortium | (optional  │
│  international observer node)                                       │
│  Consensus: BFT (e.g., IBFT2.0/QBFT) — no single validator quorum    │
├──────────────┬───────────────┬───────────────┬─────────────────────┤
│ ZK-Bidding    │ Evaluation     │ UBO Graph     │ Escrow & Oracle     │
│ Module        │ Contract       │ Service       │ Module              │
│ (commit-      │ (locked        │ (off-chain    │ (multi-source       │
│ reveal,       │ rubric, LLM    │ graph DB,     │ oracle consensus,   │
│ SNARK verify) │ parsing engine)│ hash-anchored)│ milestone contracts)│
└──────────────┴───────────────┴───────────────┴─────────────────────┘
```

Large binary evidence (proposal documents, satellite imagery, LIDAR point clouds) is stored off-chain in content-addressed storage (e.g., IPFS/Arweave-style), with only cryptographic hashes and metadata anchored on-ledger — keeping the chain lightweight while preserving tamper-evidence.

---

## 4. Detailed Functional Requirements

## 4.1 Pillar 1 — Blind ZK-Bidding

**User Stories**
- As a Vendor, I want my bid price to be mathematically unreadable by anyone (including platform admins) until the official reveal, so that no one can front-run or leak my price.
- As a Procurement Lead, I want cryptographic proof that a bid was submitted before the deadline and meets format rules, without seeing its content.
- As an Auditor, I want an immutable, timestamped record of every commitment and reveal so I can detect any bid submitted or altered outside the official window.

**Inputs**
| Input | Source | Notes |
|---|---|---|
| Vendor identity credential | Government business registry / national e-ID (PKI-based) | Required for eligibility; separate from bid value |
| Tender ID & parameters | Tender publication record | Binds proof to a specific tender (replay protection) |
| Bid value(s) (price, key technical parameters) | Vendor client application | Never transmitted in plaintext |
| Random salt/blinding factor | Generated client-side | Used in the commitment; must never be logged server-side |
| Eligibility attestations (licenses, bonding capacity) | Vendor-held credentials | Proven via ZK predicate (e.g., "bond ≥ X") without revealing exact figures |

**Processing**
1. Client-side wallet/app generates a **Pedersen or hash commitment**: `commitment = H(bid_value ‖ salt)`.
2. Client generates a **zk-SNARK proof** (circuit built on a no-trusted-setup-per-circuit scheme, e.g., PLONK/Halo2) attesting: (a) the committed value falls within the tender's declared valid bid range, (b) the vendor holds a valid, non-expired eligibility credential, (c) the proof is bound to this specific tender ID (nonce), all **without revealing the bid value or the credential details themselves**.
3. Commitment + proof + vendor identity credential are submitted to the permissioned ledger before the submission deadline; validators verify the SNARK proof (not the bid) and timestamp it.
4. At the official reveal event (post-deadline), vendors submit `(bid_value, salt)`. The ledger recomputes the commitment and rejects any reveal that doesn't match the original submission.
5. A **distributed key generation (DKG) / threshold scheme** across validator nodes governs any encrypted-channel component, so no single validator (or the platform operator) can decrypt or infer bid values pre-reveal.
6. Non-revealing vendors (no-show at reveal) are automatically flagged and, per policy, may forfeit bid bonds — this is logged, not silently dropped.

**Outputs**
- On-ledger commitment hash + timestamp (public, immediately).
- Cryptographic proof artifact (public, verifiable by anyone with the verification key).
- Post-deadline reveal log (public once reveal window closes).
- OCDS `tender.bids` extension entries carrying commitment/reveal hashes.

**Acceptance Criteria**
- No party, including system administrators, can reconstruct a bid value from ledger data prior to reveal (verified via red-team exercise).
- Proof verification completes in production within an agreed latency budget (see NFRs).
- A late commitment (post-deadline timestamp) is provably rejected by consensus, not merely by application logic.

---

## 4.2 Pillar 2 — Automated Technical Evaluation

**User Stories**
- As a Procurement Lead, I want to lock the scoring rubric and weights before the bid window closes, so no one can retroactively tailor criteria to favor a bidder.
- As a Vendor, I want to see exactly how my proposal was scored against each published criterion.
- As an Auditor, I want to know when and why a human touched a score, since the goal is human-discretion-free scoring.

**Inputs**
| Input | Source | Notes |
|---|---|---|
| Evaluation rubric & weights | Procurement Lead, authored pre-tender | Hash-committed and locked on-chain before bid submission opens |
| Structured tender requirements schema | Tender publication | Machine-readable pass/fail and scored criteria |
| Vendor technical proposal documents | Vendor upload (PDF/DOCX) | Certifications, staff CVs, methodology, compliance statements |
| External registries | ISO/certification bodies, licensing boards (API where available) | Used to cross-check claimed certifications |

**Processing**
1. **Rubric Immutability Protocol**: the rubric (criteria, weights, pass/fail thresholds) is hashed and committed to the ledger; the smart contract enforces that this hash cannot change after the tender's bid window opens without a multi-signature governance action that is itself publicly logged with justification.
2. LLM-driven document parsing extracts structured claims from each proposal (e.g., "ISO 9001 certified," "12 years' relevant experience," "3 similar completed contracts") into a schema aligned to the rubric.
3. Extracted claims are cross-referenced against external registries and internal historical contract data where available.
4. A deterministic **rules engine** (not the LLM) applies the locked weights to computed/verified values to produce the score — the LLM's role is extraction and evidence-mapping, not scoring judgment.
5. Each score line carries an **explainability trace**: which document passage or registry lookup produced which sub-score.
6. Proposals containing ambiguous, contradictory, or unparseable content beyond a confidence threshold are routed to a **flagged exception queue** for human secondary review — this human touch is itself logged (who, when, what was changed, why) and visible in the audit trail, preserving the "no silent discretion" property even though full automation isn't always achievable.
7. Final score sheet hash is committed on-chain alongside the award decision.

**Outputs**
- Structured, per-criterion score sheet with confidence scores and explainability trace.
- Exception queue log (proposals requiring human review, and outcome).
- On-chain score sheet hash tied to the award record (OCDS `award` extension).
- Vendor-facing scoring breakdown (post-award, redacted for other vendors' confidential info).

**Acceptance Criteria**
- Rubric cannot be altered after lock without a publicly visible governance transaction.
- ≥ target % (see KPIs) of proposals score without any human touch.
- Every human override is individually attributable and immutably logged.

---

## 4.3 Pillar 3 — UBO & Shell Company Detection

**User Stories**
- As an Auditor, I want to see when multiple "competing" bidders share a director, registered address, IP address, or wallet, so I can investigate cover bidding.
- As a Procurement Lead, I want an automatic flag before award if a winning bidder shares beneficial ownership with a procurement official.
- As a Vendor, I want a clear appeals path if I'm flagged incorrectly due to a coincidental shared attribute (e.g., a shared registered-agent address used by thousands of unrelated small businesses).

**Inputs**
| Input | Source | Notes |
|---|---|---|
| Corporate registration & UBO declarations | National business/UBO registries, mandatory vendor self-declaration at onboarding | Legal basis: beneficial-ownership transparency law / AML framework |
| Director & officer records | Corporate registries | |
| Submission metadata (IP, device fingerprint) | Bid portal, collected with documented purpose limitation | Used only for collusion-pattern detection, not general surveillance |
| Wallet addresses | Escrow/payment module | For vendors paid via the escrow rails |
| Politically exposed persons (PEP) & official asset declarations | Government integrity/asset-declaration registries | For official-vendor conflict detection |
| Historical bid/pricing data | Internal (from Pillar 1/2 outputs post-reveal) | For statistical collusion pattern analysis |

**Processing**
1. All entities (companies, individuals, IPs, wallets, addresses) and relationships (`director_of`, `shares_registered_address`, `shares_IP_infrastructure`, `shares_wallet`, `declared_family_of`) are ingested into a graph database (e.g., Neo4j-class engine).
2. **Graph analytics** run continuously and at each bid event:
   - Community detection (e.g., Louvain/Leiden) to surface clusters of nominally independent bidders with dense hidden connections.
   - Shortest-path queries between any bidder and the specific procurement official(s) assigned to that tender.
   - Anomaly scoring that weights *combinations* of weak signals (e.g., shared IP subnet **and** near-identical pricing pattern **and** incorporation within days of each other) more heavily than any single shared attribute alone, to reduce false positives from benign shared infrastructure (e.g., a common registered-agent service).
3. Statistical **bid-pattern collusion detection** cross-checks Pillar 1 reveal data for known cover-bidding signatures (e.g., suspiciously close-but-distinct pricing, rotation patterns across tenders).
4. Real-time risk score is attached to each bid at submission and recalculated as new data arrives; scores above threshold trigger an automatic hold pending human review — the award is not auto-blocked, but cannot proceed silently.
5. Every flag carries a structured **evidence package** (which shared attributes, confidence weighting, supporting data provenance) and a documented **appeal/rebuttal workflow** for vendors to contest false positives.

**Outputs**
- Per-vendor/per-bid risk score with supporting evidence graph, exportable for auditors.
- Auditor-facing interactive network visualization.
- Automatic alerts to the designated integrity body when a flag exceeds threshold.
- Appeal case log (public metadata; sensitive underlying personal data access-controlled per NFR/Compliance section).

**Acceptance Criteria**
- Detection logic is explainable — every flag can be traced to specific, named evidence, not a black-box score alone.
- False-positive appeal process resolves within a defined SLA and is itself logged.
- Data collection for this pillar is scoped and retained per documented purpose limitation (no open-ended surveillance use).

---

## 4.4 Pillar 4 — Smart Escrow Payouts

**User Stories**
- As a Vendor, I want milestone payments released promptly once I've genuinely completed the work, without waiting on a single inspector's discretion.
- As a Procurement Lead, I want confidence that a payment release corresponds to real, verified physical progress.
- As an Auditor, I want an immutable, independently verifiable record of what evidence justified each fund release.

**Inputs**
| Input | Source | Notes |
|---|---|---|
| Milestone definitions & completion criteria | Contract (from Award stage) | e.g., "60% of roadbed compacted to specification" |
| IoT telemetry | Equipment usage sensors, concrete-cure sensors, geofenced machinery logs | Cryptographically signed at the sensor/gateway level |
| Receipts & invoices | Vendor submission, OCR-processed | Hash-anchored on submission for tamper evidence |
| SAR satellite imagery | Independent commercial/government satellite data provider(s) | Useful for large-scale, cloud-cover-resilient change detection |
| Drone LIDAR scans | Independent surveying party (not the vendor performing the work) | Volumetric/earthwork measurement against engineering baseline |

**Processing**
1. Each milestone maps to a **verification specification**: which evidence types are required and the threshold for "met" (e.g., LIDAR volumetric measurement within X% of engineering baseline model).
2. A **decentralized oracle layer** — multiple independent evidence providers, not a single inspector or vendor-controlled source — submits signed evidence to the escrow smart contract.
3. Computer-vision/measurement models compare current SAR imagery and LIDAR point clouds against the baseline (design) model and against the prior milestone's evidence, to compute an estimated completion percentage.
4. The smart contract requires **threshold agreement** across independent oracle sources (e.g., 2-of-3: IoT telemetry + LIDAR + SAR, or IoT + independent site-visit attestation) before autonomously releasing escrowed funds — no single source can trigger payment alone.
5. Conflicting evidence (e.g., LIDAR shows completion, IoT shows idle equipment for the claimed period) halts automatic release and routes to a **dispute queue** with all evidence surfaced for human adjudication.
6. All raw evidence (imagery, point clouds, sensor logs) is stored off-chain with on-chain hash anchoring, timestamped, and made available to auditors.
7. Receipts/invoices are cross-matched against verified milestone completion percentages to catch invoice inflation (billing for more than physically verified).

**Outputs**
- Milestone verification report (evidence summary + oracle consensus outcome).
- Automated fund-release transaction (or dispute-queue entry with reasons).
- Public, hash-anchored evidence archive (imagery/LIDAR/IoT logs) per milestone.
- OCDS `implementation.milestones` extension entries with verification status and evidence references.

**Acceptance Criteria**
- No milestone payment releases on a single evidence source alone.
- Every automatic release is reconstructable after the fact from the anchored evidence trail.
- Disputed milestones are held (not auto-paid, not auto-denied) pending adjudication, with full evidence visibility to the adjudicator.

---

## 5. Non-Functional Requirements

### 5.1 Security
- **Cryptographic foundations**: use SNARK constructions with a universal or transparent setup (e.g., PLONK/Halo2-family) to avoid per-circuit trusted-setup "toxic waste" risk; where a trusted setup is unavoidable, run a well-documented, diverse multi-party ceremony and publish all artifacts.
- Circuit correctness verified via formal methods and independent third-party audit before mainnet use; all audit reports published.
- Sensor/oracle inputs must be cryptographically signed at the point of capture (attested hardware where feasible) to raise the cost of spoofing.
- Key management via HSM-backed signing for validator nodes; vendor-side key custody options include hardware tokens for high-value bids.
- Full encryption in transit and at rest; regular third-party penetration testing and public disclosure of a responsible-disclosure program.
- Software supply chain integrity: signed builds, SBOM published, reproducible builds for the open-source release.

### 5.2 Performance
- ZK proof generation on standard vendor hardware: target under an agreed ceiling (e.g., low tens of seconds) for typical bid circuits.
- On-chain proof verification: sub-second to low-seconds per bid, sized to support national-scale tender volumes without bottlenecking the reveal event.
- Graph analytics (Pillar 3) run both in near-real-time (at bid submission) and as deeper batch analysis (nightly/weekly) for computationally heavier community-detection passes.
- Oracle evidence processing (Pillar 4) has a defined SLA from evidence submission to consensus determination, distinct from real-time bidding latency needs.

### 5.3 Scalability
- Ledger and application layers designed for horizontal scaling of validator/processing nodes as agency count grows.
- Off-chain storage (content-addressed) for large binaries (proposals, imagery, LIDAR) with on-chain anchoring only, to keep ledger growth manageable at national scale.
- Multi-region/multi-agency deployment model: a shared core protocol with agency-specific instances or shards, federated at the OCDS data-publication layer.
- Graph database sharding/partitioning strategy as entity/relationship volume grows across years of procurement history.

### 5.4 Compliance
- **OCDS conformance**: full compliance with core OCDS schema plus documented custom extensions for cryptographic and verification fields, submitted for Open Contracting Partnership extension review.
- **Procurement law harmonization**: architecture accommodates UNCITRAL Model Law principles and, where applicable, WTO Government Procurement Agreement (GPA) obligations; jurisdiction-specific legal review required before deployment (e-signature/e-ID recognition, admissibility of cryptographic evidence).
- **Data protection**: UBO and personal-data processing (Pillar 3) scoped under documented legal basis (beneficial-ownership/AML transparency law), purpose limitation, retention schedules, and data-subject appeal rights; architecture supports jurisdiction-specific data-residency requirements.
- **Open-source governance**: reference implementation released under a permissive license (e.g., Apache 2.0), with a public governance model for accepting contributions and security disclosures.
- **Accessibility**: public-facing portals meet WCAG 2.1 AA at minimum.

---

## 6. Edge Cases, Failure Modes & Anti-Bypass Protocols

| Scenario | Risk | Mitigation / Protocol |
|---|---|---|
| ZK trusted-setup compromise | A backdoored setup could allow forged proofs (fake "valid" bids) | Prefer transparent/universal setup schemes; if MPC ceremony used, diverse multi-party participants, published transcripts, independent audit |
| Validator collusion on the permissioned ledger | If all validators are captured by the same interests, BFT guarantees fail | Multi-stakeholder validator set spanning regulator, audit institution, judiciary/anti-corruption body, and civil society; no single institution holds quorum |
| Sophisticated collusion avoiding shared attributes (e.g., using entirely unrelated shell entities) | Pillar 3 graph signals alone may miss "clean" cartels | Combine graph analytics with statistical bid-pattern detection (pricing clusters, rotation patterns) from Pillar 1 reveal data; treat convergent weak signals as stronger than any single strong signal |
| False positives in UBO graph (e.g., legitimate shared registered-agent address) | Vendor wrongly flagged/delayed | Weighted, multi-signal scoring rather than single-attribute triggers; documented, time-bound appeal process; flags hold rather than auto-reject |
| LLM misparsing or hallucinating proposal content (Pillar 2) | Incorrect automated score | Confidence thresholds route low-confidence extractions to a logged human exception queue; rules engine (not the LLM) computes final scores from verified structured fields |
| Post-hoc rubric tampering | Officials rewrite criteria after seeing bidders | Rubric Immutability Protocol: hash-locked pre-submission; any change requires multi-signature, publicly logged governance action |
| Oracle/sensor manipulation (bribed inspector, spoofed GPS, doctored imagery) | False milestone verification, fraudulent fund release | Threshold consensus across independent oracle types (IoT + LIDAR + SAR); cryptographically signed sensor attestation; conflicting evidence halts auto-release |
| Single-bidder / uncompetitive tenders | No real competitive signal to evaluate against | Flagged automatically as a distinct risk category; may trigger mandatory extended publication period or re-tender policy per jurisdiction rules |
| Emergency/sole-source procurement exceptions | Common vector for bypassing controls entirely | Dedicated, clearly logged emergency workflow with heightened post-hoc audit requirements and mandatory public justification, rather than silent opt-out of the platform |
| Vendor-side connectivity/digital divide | Small/rural vendors unable to submit ZK proofs | Assisted-digital submission kiosks at regional offices; offline proof-generation tooling with courier/USB-based commitment submission before deadline |
| Ledger/system downtime near a deadline | Legitimate bidders unable to submit | Published deadline-extension governance protocol triggered by verified outage, applied transparently to all bidders equally |
| Insider tampering by system administrators | Direct manipulation of smart contract state or data | Immutable audit logs for all admin actions; multi-signature requirements and timelocks on any contract upgrade; no unilateral admin override of committed data |
| Legal/evidentiary gaps (jurisdiction doesn't yet recognize cryptographic proof or e-signature) | System outputs unusable in disputes/courts | Legal-readiness assessment as a mandatory pre-deployment gate per jurisdiction; hybrid paper-backup procedures during transition period |

---

## 7. Key Metrics & Success KPIs

| KPI | Definition | Why It Matters |
|---|---|---|
| Competitive tender rate | % of tenders receiving ≥ 2 non-flagged, non-related bidders | Core anti-cover-bidding signal |
| UBO flag rate & resolution | % of bids flagged by Pillar 3; % resolved within SLA; appeal success rate | Tracks detection activity and false-positive discipline |
| Automated scoring coverage | % of technical evaluations completed with zero human touch | Measures actual discretion removed from scoring |
| Score sheet appeal rate | % of awards formally appealed; % of appeals upheld | Indicates scoring defensibility and vendor trust |
| Bid-to-reveal integrity rate | % of commitments that match their reveal (no invalid/mismatched reveals) | Cryptographic hygiene / process integrity |
| Milestone auto-verification rate | % of milestones released via oracle consensus without manual override | Measures reliance-reduction on self-attested progress |
| Milestone dispute rate | % of milestones routed to dispute queue due to conflicting evidence | Early warning of fraud attempts or genuine ambiguity |
| Cost variance vs. ceiling budget | Average awarded price vs. published budget ceiling, over time | Downstream indicator of healthier competition |
| Time-to-award | Median days from tender publication to award | Efficiency metric; should not regress vs. legacy systems |
| Proof verification latency | Median/95th-percentile time to verify a ZK bid proof | Technical performance gate |
| Public data engagement | Unique users/queries against the open OCDS portal and UBO graph explorer | Civil-society oversight uptake |
| Corruption-adjacent referrals | Number of platform-flagged cases referred to and accepted by an integrity/enforcement body | Ultimate real-world impact signal (used cautiously — quality over volume) |
| Platform availability | Uptime during active bidding/reveal windows | Operational reliability, directly tied to legitimacy of deadlines |

---

## 8. Phased Rollout (Illustrative)

1. **Phase 0 — Legal & Institutional Readiness**: jurisdiction-specific legal review of cryptographic evidence admissibility, e-signature recognition, and UBO data-processing legal basis; identification of multi-stakeholder validator institutions.
2. **Phase 1 — Single-Agency Pilot**: one agency, limited tender value ceiling, all four pillars active but with parallel manual process as backup; heavy instrumentation for KPI baselining.
3. **Phase 2 — Multi-Agency Expansion**: cross-agency UBO graph gains network effects; rubric/evaluation templates standardized across agencies; oracle provider panel expanded.
4. **Phase 3 — National Scale & Interoperability**: full retirement of parallel manual process where legally supported; OCDS data federation with regional/international anti-corruption data-sharing initiatives.

---

## 9. Assumptions & Dependencies

- A legal framework exists or can be adapted to recognize cryptographic commitments and multi-party-verified evidence as valid procurement records.
- At least one independent institution (audit body, judiciary, or civil society consortium) is willing and empowered to hold a validator seat — Aegis's anti-collusion model depends on genuine multi-stakeholder governance, not just multi-node deployment by a single ministry.
- National business/UBO registries exist in machine-readable form, or a phased manual-declaration bridge is acceptable during rollout.
- Reliable satellite imagery and drone survey services are procurable for relevant high-value infrastructure contracts (Pillar 4 is most valuable, and most justified in cost, for large physical-works contracts — not intended for small service contracts).

## 10. Out of Scope (v1)

- Automated legal adjudication or criminal referral decisions (Aegis surfaces evidence; humans/institutions decide).
- Procurement planning/needs-assessment tooling upstream of tender publication.
- Cross-border payment rail settlement beyond the escrow smart contract's native ledger.

## 11. Glossary

- **OCDS** — Open Contracting Data Standard, a schema for publishing structured procurement data across the contracting lifecycle.
- **zk-SNARK** — Zero-Knowledge Succinct Non-Interactive Argument of Knowledge; allows proving a statement is true without revealing the underlying data.
- **UBO** — Ultimate Beneficial Owner; the real natural person(s) who ultimately own or control a legal entity.
- **DKG** — Distributed Key Generation; a protocol allowing multiple parties to jointly generate a key such that no single party knows the whole key.
- **SAR** — Synthetic Aperture Radar; satellite imaging capable of penetrating cloud cover, useful for consistent site-progress monitoring.
- **LIDAR** — Light Detection and Ranging; laser-based 3D surveying used here for volumetric earthwork/construction measurement.
- **BFT** — Byzantine Fault Tolerance; consensus property allowing a distributed system to function correctly even if some nodes act maliciously.

---

*This document defines product requirements only. Cryptographic circuit design, smart contract code, and specific vendor/technology selection are addressed in subsequent technical design documents.*
