# PARAKH — SIH 2026 Technical Defense & Judge Q&A Dossier

**Target Event:** Smart India Hackathon (SIH) 2026 Internal Selection & Grand Finale  
**Audience:** Technical Judges, Domain Evaluators, Chief Vigilance Officers  

---

## 25 Essential SIH Judge Questions & Defensible Answers

### 1. What problem are you solving?
**Answer:** Public procurement in India accounts for ~20% of GDP, yet manual post-award audits inspect less than 3% of contracts due to overwhelming volume. PARAKH provides an automated, explainable AI risk-screening platform that flags high-risk procurement patterns (collusion, single-bidder monopolies, compressed windows, and price manipulation) in real time.

### 2. Why is it important?
**Answer:** Procurement leakages waste public taxpayer funds and compromise critical infrastructure. Early automated triage allows vigilance officers to intervene before funds are disbursed, rather than conducting retrospective inquiries years later.

### 3. Why does existing procurement software (e.g. GeM / CPPP) not solve this?
**Answer:** Existing portals act primarily as transactional e-tendering platforms with static threshold validations. They lack cross-department network analysis, historical vendor dominance mapping, multi-indicator statistical anomaly detection, and tamper-evident cryptographic ledgers.

### 4. What is innovative about PARAKH?
**Answer:** PARAKH innovates through a **Hybrid Explainable Architecture** combining Central Vigilance Commission (CVC) forensic red flags (RF-1..RF-8) with 7-dimensional unsupervised anomaly detection, an interactive Cytoscape cartel network graph, a strictly database-grounded AI investigator, and on-chain Ethereum Sepolia hash verification.

### 5. What data are you using?
**Answer:** We evaluate PARAKH on **5,609 authentic public procurement contracts totaling ₹4,890+ Crores across 6 Indian jurisdictions** (Himachal Pradesh OCDS, Central CPPP/GeM, Maharashtra MahaTenders, Karnataka KPPP, Rajasthan e-Proc, and Uttar Pradesh UP-NIC).

### 6. Is the data real?
**Answer:** Yes. 100% of master procurement records originate from authentic government portal feeds and CivicDataLab Open Contracting Data Standard (OCDS) releases, verified with immutable SHA-256 digests in `data/catalog.json`.

### 7. How many records are in the system?
**Answer:** 5,609 canonical public procurement contracts.

### 8. How many jurisdictions are covered?
**Answer:** 6 Indian jurisdictions (Himachal Pradesh, Maharashtra, Karnataka, Rajasthan, Uttar Pradesh, and Central Government PSUs).

### 9. How were ground-truth labels generated?
**Answer:** 1,991 stratified procurement records were reviewed under our formal 4-Tier Forensic Taxonomy (`docs/annotation_guidelines.md`) by dual annotators, achieving an inter-rater agreement of Cohen's Kappa $\kappa = 0.7704$ (Substantial Agreement, 90.83% concordance).

### 10. Why are suspicious labels so common in the evaluation sample (~79.9%)?
**Answer:** The 1,991-record review set is an **intentionally enriched forensic triage queue** (sampling all high-risk candidates + representative medium-risk + control benign tenders) to stress-test model discrimination under dense anomalies. In the broader unstratified procurement population, the baseline positive rate is ~2.6% ($CRS \ge 70$).

### 11. Why does Random Forest achieve an F1 of 1.0 on the holdout test set?
**Answer:** Structured procurement features (`number_of_bidders == 1`, price deviation $> 30\%$, tender duration $< 7$ days) create clear orthogonal decision boundaries for isolated test samples. To prevent overfitting claims, cross-validation across all folds is transparently reported at **$0.9755 \pm 0.0031$** (Random Forest) and **$0.9757 \pm 0.0029$** (HistGradientBoosting).

### 12. How did you prevent data leakage?
**Answer:** We enforced 0 tender ID overlap across splits, strictly excluded `rule_score` and $CRS$ from the Pure ML feature matrix $X$, verified temporal historical-to-future ordering, and used `StratifiedGroupKFold(groups=supplier_id)` with 0 shared suppliers across folds.

### 13. How does the AI Assistant work?
**Answer:** It is a strictly database-grounded query engine that translates natural language into parameterized SQLAlchemy ORM queries, retrieves exact database records, and generates answers citing verifiable tender numbers and vendor metrics.

### 14. Can the AI Assistant hallucinate?
**Answer:** Hallucination risk is minimized because the assistant is constrained to executing parameterized queries on the database. It rejects malicious prompt injections (`"ignore database"`, `"declare corrupt"`) and includes exact database record citations.

### 15. Can PARAKH prove legal corruption?
**Answer:** No. PARAKH detects **elevated procurement risk patterns and statistical anomalies** to assist human auditors. Establishing legal corruption, bribery, or criminal intent requires formal statutory inquiry and judicial fact-finding.

### 16. What happens if the model is wrong (False Positive / False Negative)?
**Answer:** PARAKH is an advisory triage system, not an automated sanctioning engine. A False Positive simply means an auditor reviews a benign urgent contract (e.g. emergency disaster repair) and clears it in the case hub (`/cases`). A False Negative is mitigated by rule-engine floor thresholds ensuring no sole-bidder high-value tender is ignored.

### 17. How does a government auditor use PARAKH?
**Answer:** An auditor opens the Dashboard, views high-risk quarantined tenders ($CRS \ge 70$), clicks into a contract to inspect the red-flag breakdown and estimate deviations, examines the vendor's cartel network graph, queries the AI Assistant for history, and creates an investigation case with attached evidence.

### 18. Why is blockchain used?
**Answer:** Blockchain anchoring (Ethereum Sepolia) computes a canonical SHA-256 digest of contract audit parameters at the time of screening and anchors it immutably to a ledger. This ensures that corrupt actors cannot tamper with or delete audit flags post-award.

### 19. Why not use only Machine Learning?
**Answer:** Pure black-box ML lacks the legal explainability required for administrative disciplinary action. Public auditors cannot sanction a contractor because a "neural network outputted 0.94". They require deterministic, rule-based evidence (e.g. "Winning vendor won 85% of department contracts").

### 20. Why not use only Rules?
**Answer:** Fixed rules cannot detect novel, multi-dimensional anomalies or complex non-linear combinations of subtle parameters that an Isolation Forest or Gradient Boosting model can isolate.

### 21. How does the system scale?
**Answer:** The risk engine uses vectorized $O(N)$ linear-time feature extraction in NumPy/scikit-learn, executing in sub-second latency across 5,600+ records. The backend runs on FastAPI and PostgreSQL with indexed queries, supporting hundreds of concurrent auditor sessions.

### 22. How can government departments deploy it?
**Answer:** PARAKH is containerized with Docker and supports both on-premise government cloud (NIC MeghRaj) deployment and container orchestration (Kubernetes), connecting directly to existing state e-procurement databases via standard read replicas.

### 23. What are the known limitations?
**Answer:** Real state summary portal CSV feeds do not expose full-text specification PDFs; RF-7 (Specification Tailoring) and RF-8 (Unusual Extensions) are evaluated in isolated synthetic benchmarks and marked `NOT_EVALUABLE_DUE_TO_SOURCE_DATA` on bulk state CSVs.

### 24. What would you build next?
**Answer:** Automated OCR/LLM extraction of scanned engineering BOQ tender PDFs, integration with MCA-21 corporate registry for beneficial ownership discovery, and federated learning across state vigilance databases.

### 25. How does this create measurable public impact?
**Answer:** By automating 100% pre-award risk screening, PARAKH reduces audit triage time from weeks to seconds, prevents monopolistic single-bidder captures, and saves estimated crores in uncompetitive procurement overhead.
