# Aegis Procurement Engine — Enterprise Technical Architecture & Stack Specification

**Author:** Chief Systems Architect & Web3 / Cryptographic Infrastructure Lead  
**Specification Version:** 2.4.0-PROD  
**Data Standard:** Open Contracting Data Standard (OCDS v1.1)  
**Security Standard:** Zero-Human-Discretion Cryptographic Architecture  

---

## 1. Executive Architecture Summary

The **Aegis Procurement Engine** is a zero-trust, privacy-preserving, decentralized public procurement execution environment. It replaces subjective human discretion, discretionary scoring committees, bid-leak vectors, shell company collusion, and manual milestone sign-offs with an un-hackable pipeline composed of:

1. **Zero-Knowledge Blind Bidding** (Poseidon algebraic hash commitments, Groth16 SNARK capability proofs, and Verifiable Delay Function time-lock encryption).
2. **Algorithmic Technical Evaluation** (Immutable smart contract parameter locks, deterministic vector compliance matching, zero-human scoring sheets).
3. **UBO & Shell Company Forensics Graph Engine** (Multi-hop recursive beneficial ownership tracing, circular equity loop detection, nominee director correlation, and pre-bid collusion ring pruning).
4. **Decentralized Multi-Modal Telemetry Escrow** (Copernicus SAR satellite radar backscatter, drone LIDAR volumetric point clouds, IoT RFID weighbridge streams, and multi-sig oracle consensus fund releases).

---

## 2. Complete Enterprise Technology Stack

```
+----------------------------------------------------------------------------------------------------+
|                                      AEGIS PRESENTATION LAYER                                      |
|  - React 19 / Vite SPA           - Cytoscape.js / WebGL 3D Graph    - TailwindCSS Cyber-Defense UI |
|  - Ethers.js v6 / Wagmi v2       - Lucide Security Icon System      - Chart.js / Recharts          |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
|                                      API & APPLICATION GATEWAY                                     |
|  - FastAPI (Python 3.12/3.14)    - Pydantic v2 (OCDS 1.1 Strict)    - Async SQLAlchemy 2.0 Core    |
|  - JSON-Schema OCDS Validators   - WebSockets / SSE Telemetry Stream- OAuth2 / W3C DID Auth        |
+----------------------------------------------------------------------------------------------------+
                         |                                           |
                         v                                           v
+--------------------------------------------------+  +----------------------------------------------+
|             PRIVACY & ZERO-KNOWLEDGE             |  |           GRAPH FORENSICS INTELLIGENCE       |
|  - Circom 2.1 + SnarkJS (Groth16 on BN254)       |  |  - Neo4j Enterprise 5.x + Graph Data Science |
|  - Poseidon SNARK-Friendly Algebraic Hash        |  |  - NetworkX Algorithmic Core (In-Memory)     |
|  - Wesolowski / Sloth Verifiable Delay Function  |  |  - Louvain Community & DFS Cycle Detection   |
|  - Threshold ElGamal Time-Lock Cryptography      |  |  - FATF Tax-Haven & Offshore Risk Multipliers|
+--------------------------------------------------+  +----------------------------------------------+
                         |                                           |
                         v                                           v
+----------------------------------------------------------------------------------------------------+
|                                    BLOCKCHAIN & SMART CONTRACT LAYER                               |
|  - Primary Consensus: Polygon CDK / Arbitrum Orbit Custom L2 Rollup (Validium with Avail/EigenDA)  |
|  - Smart Contracts: Solidity ^0.8.24 (ZkBlindBiddingLedger, AlgorithmicTender, SmartEscrowTelemetry)|
|  - Execution Environment: EVM with Precompiled BN254 Pairing Check (`0x08`) & Blake2f (`0x09`)     |
|  - Immutability: Zero Admin Keys / Formal Verification via Certora Prover & Slither Core           |
+----------------------------------------------------------------------------------------------------+
                         |                                           |
                         v                                           v
+--------------------------------------------------+  +----------------------------------------------+
|            DECENTRALIZED STORAGE & DATA          |  |         TELEMETRY ORACLES & SENSOR IOT       |
|  - IPFS / Filecoin (Pinned via Pinata/Estuary)   |  |  - Chainlink Functions Decentralized Oracles |
|  - Ceramic Network (Mutable OCDS State Streams)  |  |  - Sentinel-1 SAR Radar & Planet SuperDove   |
|  - PostgreSQL 16 (Relational Audit Mirror)       |  |  - MQTT / CoAP Edge Weighbridge (TPM 2.0 TEE)|
|  - Redis 7.2 (Sub-second Sensor Cache)           |  |  - RFID EPC Gen2 Gate Readers                |
+--------------------------------------------------+  +----------------------------------------------+
```

---

## 3. Deep-Dive: Pillar-by-Pillar Architectural Breakdown

### 3.1 Privacy Layer: zk-SNARK Circuit & Time-Lock Architecture

#### 1. Circuit Design (`AegisBidComplianceVerifier.circom`)
Vendors submit bids without leaking commercial prices to procurement officials or rival bidders. The Circom circuit enforces two zero-knowledge claims:
* **Constraint 1 (Budget Ceiling Range Proof):** $\text{BidAmount} \le \text{BudgetCeiling}$. Enforced via a $64$-bit comparator gadget without exposing the plaintext value.
* **Constraint 2 (Financial Solvency Assertion):** $\text{SolvencyRatio} = \frac{\text{VerifiedLiquidAssets}}{\text{RequiredBondAmount}} \ge 1.5\text{x}$. Enforced against a signed W3C Verifiable Credential hash from an accredited banking institution.
* **Algebraic Commitment:** $C = \text{Poseidon}(b, s, \text{VendorPubKey}, \text{TenderOCID})$.

#### 2. Key Generation & Setup
* **Universal SRS**: Utilizes the battle-tested **Hermez / Perpetual Powers of Tau** (Ceremony 28, BN254 elliptic curve).
* **Circuit-Specific Keypair**: Generated using `snarkjs groth16 setup` with multi-party phase 2 contribution to guarantee zero toxic waste.
* **On-Chain Verifier**: Auto-generated Solidity contract (`Groth16Verifier.sol`) compiled to evaluate pairing equation:
  $$e(A, B) = e(\alpha, \beta) \cdot e(x \cdot \gamma, \delta) \cdot e(C, \gamma)$$

#### 3. Time-Lock Delay Cipher (Zero Early Leaks)
* Commercial payloads are encrypted with a **Verifiable Delay Function (VDF)** puzzle based on sequential modular squaring in an RSA group ($y = x^{2^T} \pmod N$).
* Parameter $T$ is calibrated to the tender closing block:
  $$T = (T_{\text{deadline}} - T_{\text{current}}) \times \text{SquaringsPerSecond}$$
* Neither procurement officials, system administrators, nor miners can decrypt the proposal prior to $T_{\text{deadline}}$.

---

### 3.2 Blockchain & Ledger Selection Evaluation

| Ledger Platform | Architecture Type | Throughput (TPS) | Finality Time | Privacy & ZK Compatibility | Enterprise Suitability Score | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Polygon CDK / Arbitrum Orbit Custom L2** | Validium L2 Rollup (Avail / EigenDA) | 2,500+ | < 1 sec | Native EVM BN254 Precompiles (`0x08`), Zero gas friction for public | **9.6 / 10** | **RECOMMENDED (PRIMARY)** |
| **Avalanche Subnet (Evergreen)** | Permissioned EVM Subnet | 1,200 | 1-2 sec | Full EVM support, Custom gas token, Geo-fenced validators | **9.1 / 10** | **STRONG RUNNER-UP** |
| **Hyperledger Fabric v3.0** | Execute-Order-Validate Permissioned | 3,000 | 2-3 sec | Private Data Collections, No native EVM ZK precompiles | **7.4 / 10** | Rejected (Heavy, complex client interop) |
| **ConsenSys Quorum / Hyperledger Besu** | IBFT 2.0 / QBFT Consortium | 450 | 1 sec | Tessera private transactions, Full EVM compatibility | **8.2 / 10** | Suitable for internal government-only intranets |

**Architectural Recommendation:** Deploy as an **EVM-compatible Validium Layer-2 Rollup (Polygon CDK or Arbitrum Orbit)** anchored to Ethereum Sepolia / Mainnet with **Avail / EigenDA** data availability. This guarantees sub-second confirmation, zero gas fees for vendors, native zk-SNARK pairing precompiles, and immutable public auditability.

---

### 3.3 Graph Database & Intelligence Architecture

#### 1. Graph Storage Engine
* **Production**: **Neo4j Enterprise 5.x** with the **Graph Data Science (GDS)** library.
* **Edge Engine**: In-memory **NetworkX / Graphology** running in the FastAPI microservice for real-time sub-second pre-bid validation.

#### 2. Forensic Algorithms & Query Schemas
* **Multi-Hop UBO Traversal (Cypher Specification)**:
  ```cypher
  MATCH path = (v:Company {id: $vendorId})-[:SUBSIDIARY_OF|OWNED_BY*1..6]->(u:UBOEntity)
  WHERE u.type IN ['ubo_person', 'nominee_director']
  RETURN u.name AS uboName, 
         reduce(pct = 1.0, r IN relationships(path) | pct * r.weight) AS effectiveOwnership,
         u.jurisdiction AS jurisdiction
  ```
* **Collusion Ring Interceptor (Cycle & Clique Detection)**:
  - Identifies bidding vendors sharing $>10\%$ common ultimate beneficial ownership through offshore conduits.
  - Matches shared IP CIDR blocks ($/24$) and co-located browser canvas fingerprints.
  - Identifies hierarchical deterministic (HD) wallet clusters derived from identical root seeds (BIP-44 paths).
* **Tax Haven & Jurisdiction Scoring Matrix**:
  - Incorporates FATF grey/blacklists. Automatically applies risk penalties to nodes registered in Cayman ($1.45\times$), BVI ($1.50\times$), Mauritius ($1.35\times$), and Panama ($1.40\times$).

---

### 3.4 Verification & Escrow: Multi-Modal Telemetry Ingestion Layer

```
+---------------------------------------------------------------------------------------------------+
|                                 TELEMETRY INGESTION ARCHITECTURE                                  |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ SATELLITE RADAR & OPTICAL ]           [ DRONE LIDAR POINT-CLOUD ]      [ IOT WEIGHBRIDGE & RFID ]|
|  - Copernicus Sentinel-1 SAR            - UAV Point Cloud (.LAS/.LAZ)     - Industrial Weighbridge  |
|  - Sentinel-2 Multi-Spectral             - Volumetric Density Mesh         - Tamper-proof TPM 2.0   |
|  - Planet Labs SuperDove (3m)            - Open3D Surface Height Map       - EPC Gen2 RFID Portal   |
|               |                                       |                              |            |
|               +-------------------+-------------------+------------------------------+            |
|                                   |                                                               |
|                                   v                                                               |
|                 [ CHAINLINK FUNCTIONS ORACLE NODES (DON) ]                                        |
|                 - Multi-Node Independent API Ingestion & Verification                             |
|                 - Cryptographic Threshold BLS Signature Aggregation (3/3 Consensus)              |
|                                   |                                                               |
|                                   v                                                               |
|                 [ SMARTESTCROWTELEMETRY.SOL ON-CHAIN CONTRACT ]                                   |
|                 - Evaluates: TelemetryCoherent == TRUE & MassBalanceDelta <= 0.5%                 |
|                 - Releases treasury payout directly to Contractor Wallet                          |
|                 - ZERO HUMAN DISCRETION / ZERO BUREAUCRAT SIGN-OFF ALLOWED                        |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

1. **Synthetic Aperture Radar (SAR) Telemetry**:
   - Compares baseline radar backscatter $\sigma^0_{\text{base}}$ with current scene $\sigma^0_{\text{curr}}$.
   - Calculates radar coherence and volumetric displacement to verify asphalt layers, concrete foundations, and earthwork without weather or cloud obstruction.
2. **IoT Weighbridge & RFID Manifest Gating**:
   - Hardware Weighbridge terminals running on secure TPM 2.0 cryptoprocessors sign gross and tare weights with internal private keys.
   - Automatically cross-verifies payload mass against shipping manifest ($\text{AllowedDeviation} \le 0.5\%$).
   - RFID portal reads tamper-evident batch seals to eliminate phantom deliveries.

---

### 3.5 Native Open Contracting Data Standard (OCDS v1.1) Compliance

All data objects are natively stored and emitted as **OCDS v1.1 JSON schemas**:
* `tender`: Locked benchmark parameters, criteria arrays, and deadline timestamps.
* `bids`: Commitments array containing Poseidon hashes, Groth16 proofs, and time-lock ciphers.
* `awards`: Deterministic algorithmic award receipts with composite score breakdowns.
* `contracts`: Multi-milestone escrow records linked to on-chain release transaction hashes.
* `aegisZeroHumanDiscretionExtensions`: Custom OCDS extension defining smart contract addresses, UBO collusion audit proofs, and oracle signatures.

---

## 4. End-to-End System Data Flow

```
[ Vendor ]
   │
   ├─ 1. Generate Private Salt & Groth16 zk-SNARK Solvency Proof
   ├─ 2. Encrypt Proposal with VDF Time-Lock Puzzle
   ├─ 3. Submit Poseidon Commitment to Immutable L2 Ledger
   ▼
[ ZkBlindBiddingLedger.sol ] ─── (Tender Window Open: Zero Early Leaks)
   │
   ├─ 4. Deadline Expires (T_deadline + 1s)
   ├─ 5. Verifiable Reveal / Decryption Triggered
   ▼
[ UBO Forensics Engine ]
   │
   ├─ 6. Traverse Entity Graph & Trace Multi-Hop UBOs
   ├─ 7. Detect Shared Directors, IPs, and Wallet Clusters
   ├─ 8. Prune Collusive Bidding Rings (Disqualification Receipts Emitted to OCDS)
   ▼
[ Algorithmic Evaluation Engine ]
   │
   ├─ 9. Match Technical Specs vs Locked Smart Contract Benchmarks
   ├─ 10. Compute Deterministic Composite Score (Tech 50% + Price 40% + Track 10%)
   ├─ 11. Smart Contract Deterministically Selects Winner
   ▼
[ SmartEscrowTelemetry.sol ]
   │
   ├─ 12. Treasury Funds Locked into Milestone Escrow
   ├─ 13. Contractor Executes Work
   ├─ 14. Sentinel-1 SAR Satellite & IoT Weighbridge Stream Ingested by Chainlink DON
   ├─ 15. Multi-Sig Oracle Consensus Verifies Telemetry Criteria Met
   ├─ 16. Automated Smart Escrow Fund Release to Vendor Wallet (0 Human Sign-Offs)
   ▼
[ Public OCDS Explorer & Auditor ]
```

---

## 5. Security Threat Model & Cryptographic Mitigations

| Threat Vector | Attack Mechanism | Threat Level | Aegis Cryptographic Mitigation |
| :--- | :--- | :--- | :--- |
| **1. Sybil & Nominee Bidding Rings** | Corrupt official registers 5 shell companies to submit cover bids and simulate competitive tender. | **CRITICAL** | **UBO Graph Forensics Engine**: Detects shared beneficial owners, nominee directorships, and co-located bidding subnets. Automatically disqualifies ring members before evaluation. |
| **2. Early Bid Leaks & Official Front-Running** | Procurement insider accesses confidential bid pricing early to tip off favored crony contractor. | **CRITICAL** | **VDF Time-Lock & Poseidon Commitments**: Private decryption keys do not exist in plaintext before $T_{\text{deadline}}$. Mathematically impossible to decrypt prior to expiration. |
| **3. Fake Milestone Sign-Offs & Phantom Deliveries** | Corrupt inspector signs fraudulent paper completion certificates for incomplete highway or phantom medicine shipment. | **CRITICAL** | **Telemetry Smart Escrow**: Manual human sign-offs are completely deprecated. Funds release strictly on multi-temporal SAR radar coherence ($\Delta \text{dB}$) and TPM-signed IoT weighbridge sensors. |
| **4. Sensor Spoofing & Adversarial Telemetry** | Vendor tampers with IoT scale or attempts replay attacks with recorded satellite images. | **HIGH** | **TPM 2.0 Cryptographic Hardware Signatures & Multi-Source Satellite Cross-Check**: Sensor payloads are signed inside tamper-proof hardware enclaves. Satellite imagery cross-referenced against public Sentinel-1 orbital ephemeris. |
| **5. MEV & Transaction Censorship** | Malicious validator attempts to censor a competing bidder's commitment transaction before the deadline. | **MEDIUM** | **Encrypted Mempools & Threshold Decryption Sequencers**: Transactions are submitted encrypted and ordered before payload disclosure, eliminating front-running and censorship. |
| **6. Parameter Tampering Post-Announcement** | Procurement official attempts to alter technical tolerances post-bidding to favor a specific vendor. | **CRITICAL** | **Immutable Smart Contract Parameter Locking**: Specifications and tolerances are committed into EVM bytecode at tender creation with zero update/admin functions. |

---

## 6. Verification & Production Deployment Roadmap

1. **Smart Contract Audit**: Formal verification using **Certora Prover** to mathematically prove that escrow release functions can *never* be called without valid oracle consensus.
2. **Circuit Audit**: Static analysis with **Circomspect** and automated witness generation fuzzing.
3. **Data Availability Layer**: Integration with **Avail DA** for verifiable long-term storage of high-resolution LIDAR meshes and OCDS release packages.
4. **Hardware Deployment**: Edge gateway rollouts of TPM 2.0 weigh-station controllers at major national ports and depots.
