# PARAKH Public Procurement Audit & Risk Annotation Guidelines

**Version:** 2.0.0  
**Authority:** PARAKH Expert Forensic Audit Framework  
**Scope:** Human-in-the-loop Ground-Truth Labeling for Indian Public Procurement Anomaly Screening

---

## 1. Problem Formulation & Legal Ground-Truth Boundary

> [!IMPORTANT]
> **Procurement Anomaly Screening vs Legal Corruption Determination**  
> Public procurement fraud or corruption is a formal legal offense requiring judicial adjudication, whistleblower testimony, or forensic bank subpoenas. Statistical anomaly detectors and rule-based screening systems **do not declare criminal guilt**.  
>  
> PARAKH's ground-truth objective is defined as:  
> **"Detecting anomalous, non-competitive, or non-compliant procurement patterns that warrant formal investigative audit."**

---

## 2. Four-Tier Ground-Truth Label Taxonomy

Reviewers must assign exactly one label from the standardized 4-tier taxonomy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARAKH 4-TIER LABEL TAXONOMY                         │
├───────┬───────────────────────────────────┬─────────────────────────────┤
│ Code  │ Label Identifier                  │ Operational Definition      │
├───────┼───────────────────────────────────┼─────────────────────────────┤
│   0   │ NORMAL_NO_ANOMALY                 │ Standard compliant tender   │
│   1   │ SUSPICIOUS_PATTERN                │ Minor/statistical anomaly   │
│   2   │ EXPERT_REVIEW_REQUIRED            │ Multi-indicator risk flag   │
│   3   │ VERIFIED_PROCUREMENT_IRREGULARITY │ Severe non-compliance       │
└───────┴───────────────────────────────────┴─────────────────────────────┘
```

### Label 0: `NORMAL_NO_ANOMALY`
- **Definition:** Standard open competition complying with Central Vigilance Commission (CVC) / State Public Works guidelines.
- **Criteria:** Multiple independent bidders ($\ge 3$), reasonable advertising window ($\ge 7$ to 14 days), winning price aligned with engineer estimate ($\pm 10\%$), no abnormal supplier monopolization.
- **Example:** Road resurfacing awarded to Contractor X with 4 bidders, tender open for 21 days, awarded 2% below sanctioned estimate.

### Label 1: `SUSPICIOUS_PATTERN`
- **Definition:** An isolated policy deviation or statistical outlier that may have a benign administrative explanation.
- **Criteria:** Single bidder in non-critical category without repeat pattern, or tender duration slightly below threshold (6 days instead of 7) due to emergency repair.
- **Example:** Minor civil repair with 1 bidder but no vendor concentration history.

### Label 2: `EXPERT_REVIEW_REQUIRED`
- **Definition:** Co-occurrence of 2 or more red-flag indicators suggesting uncompetitive procurement practices or intentional procedural compression.
- **Criteria:** Single-bidder tender awarded right below statutory threshold ($₹49.5\text{L}$ on $₹50\text{L}$ limit) with a compressed tender window ($< 5$ days).
- **Example:** Secondary TSP tender awarded to repeat vendor on sole-bidder basis with high estimate deviation.

### Label 3: `VERIFIED_PROCUREMENT_IRREGULARITY`
- **Definition:** Severe, clear violation of statutory procurement rules, overt bid-rigging signatures, or formal auditor-quarantined transactions.
- **Criteria:** Documented repeat winner collusion, extreme estimate inflation ($> 50\%$) combined with sole-bidder vendor lock-in ($> 60\%$ department capture), or known forensic showcase cases.
- **Example:** Contract `GEM-DEMO-000007` (94% specification tailoring overlap with sole supplier catalog) or `2017_DIT_18899_1` (635% price premium over estimate under sole bid).

---

## 3. Red-Flag Evaluation Criteria (RF-1 to RF-8)

### RF-1: Single-Bidder Monopoly
- **Positive Indicator:** Only 1 bid submitted on an open tender.
- **Audit Consideration:** Check if tender was re-tendered as required by CVC guidelines.

### RF-2: Vendor Departmental Dominance (Lock-in $\ge 60\%$)
- **Positive Indicator:** Single supplier wins $> 60\%$ of all contracts awarded by a specific department/circle over 24 months.
- **Audit Consideration:** Indication of institutional capture or biased qualification criteria.

### RF-3: Statutory Approval Threshold Manipulation (Smurfing)
- **Positive Indicator:** Sanctioned/awarded amount falls between 90% and 99.9% of statutory approval delegation limit (e.g. ₹48.5L–₹49.9L against a ₹50L Superintending Engineer threshold).
- **Audit Consideration:** Splitting large works into smaller chunks to avoid higher authority / Cabinet approval.

### RF-4: Compressed Tender Window ($< 7$ Statutory Days)
- **Positive Indicator:** Bidding window from publication to deadline is $< 7$ calendar days without documented emergency waiver.
- **Audit Consideration:** Prevents outside suppliers from preparing technical bids, favoring predetermined local vendors.

### RF-5: Price Estimate Deviation ($> 30\%$ Above Benchmark)
- **Positive Indicator:** Award price exceeds government benchmark / Schedule of Rates (SoR) by $> 30\%$.
- **Audit Consideration:** Inflated budget allocation or non-competitive price discovery.

### RF-6: Repeat Winner Pattern ($\ge 3$ Consecutive Wins)
- **Positive Indicator:** Same supplier awarded 3 or more consecutive tenders by the same procuring officer.
- **Audit Consideration:** Systemic exclusion of competing vendors.

### RF-7: Specification Tailoring (Cosine Similarity $\ge 0.85$)
- **Positive Indicator:** Tender technical clauses replicate proprietary product catalog text of a specific vendor.
- **Note on Source Data:** Evaluated when rich specification text and vendor catalogs are available; marked `NOT_EVALUABLE_DUE_TO_SOURCE_DATA` when missing.

### RF-8: Unusual Contract Extensions ($\ge 2$ Long Extensions)
- **Positive Indicator:** Contract delivery timeline extended $\ge 2$ times or $> 60$ cumulative days without penalty.
- **Note on Source Data:** Evaluated when amendment/milestone records are present.

---

## 4. Annotation Procedure & Stratified Sampling

1. **Stratified Sample Allocation:** Reviewers evaluate records across Low Risk ($CRS < 40$), Medium Risk ($40 \le CRS < 70$), and High Risk ($CRS \ge 70$).
2. **Dual-Blind Review:** Overlapping subsets (minimum 100 records) are assigned to two independent reviewers to calculate Inter-Rater Reliability (Cohen's Kappa).
3. **Discrepancy Resolution:** Disagreements between Reviewer A and Reviewer B are escalated to a Lead Auditor for consensus adjudication.
