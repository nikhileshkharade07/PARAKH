# Corruption Risk Score (CRS) Methodology

PARAKH calculates an explainable, deterministic **Corruption Risk Score (CRS)** scaled from **0 to 100**.

$$CRS = \min\left(100, \operatorname{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore})\right)$$

---

## 🚩 Explainable Red Flags (80% Weight)

| Flag ID | Indicator | Severity | Points | Trigger Condition |
|:---|:---|:---:|:---:|:---|
| **RF-1** | Single Bidder Tender | High | +20 pts | Tender was awarded with only 1 participating bidder |
| **RF-2** | Vendor Lock-in | High | +20 pts | Winning vendor captured >60% of all department contracts |
| **RF-3** | Approval Threshold Manipulation | High | +15 pts | Contract value sits within 10% below statutory approval threshold (₹45L–₹50L) |
| **RF-4** | Compressed Tender Window | Medium | +10 pts | Tender duration < 7 days, restricting competitive bidding |
| **RF-5** | Estimate Deviation | Medium | +10 pts | Award value exceeds government cost estimate by >30% |
| **RF-6** | Repeat Winner / Network Pattern | High | +20 pts | Vendor has won ≥3 contracts from the same procuring entity |
| **RF-7** | Specification Tailoring | Medium | +15 pts | Tender technical specification has >85% TF-IDF similarity to vendor product catalog |
| **RF-8** | Unusual Contract Extensions | Low | +5 pts | Contract received ≥2 extensions exceeding 90 days each |

$$\text{RuleScore} = \min\left(100, \sum \text{Detected Flag Points}\right)$$

---

## 🤖 Statistical Anomaly Signal (20% Weight)

- **Algorithm**: Scikit-Learn `IsolationForest(n_estimators=100, random_state=42)`
- **Feature Vector**:
  - Award Value ($\mathbb{R}$)
  - Bidder Count ($\mathbb{N}$)
  - Tender Duration in Days ($\mathbb{R}$)
  - Sanctioned Estimate Value ($\mathbb{R}$)
  - Estimate Deviation Ratio ($\mathbb{R}$)
  - Vendor Department Win Count ($\mathbb{N}$)
  - Extension Count ($\mathbb{N}$)
- **Purpose**: Detects multi-dimensional statistical outliers that may evade static rule thresholds. Isolation Forest is explicitly treated as **statistical anomaly detection**, not direct corruption proof.

---

## 🎯 Risk Tiers & Triage

- **High Risk (CRS 70–100)**: Multiple high-severity red flags or extreme statistical anomaly; requires mandatory manual forensic audit.
- **Medium Risk (CRS 40–69)**: Multiple minor indicators or single high-severity flag; flagged for internal review.
- **Low Risk (CRS 0–39)**: Normal competitive procurement pattern.
