# PARAKH — Corruption Risk Score (CRS) & Heuristic Audit Methodology

PARAKH calculates an explainable, deterministic **Corruption Risk Score (CRS)** scaled from **0 to 100**.

$$CRS = \min\left(100, \operatorname{round}(0.80 \times \text{RuleScore} + 0.20 \times \text{AnomalyScore})\right)$$

---

## 🚩 Explainable Red Flags (80% Weight)

| Flag ID | Indicator | Severity | Points | Trigger Condition | Recommended Auditor Action |
|:---|:---|:---:|:---:|:---|:---|
| **RF-1** | Single Bidder Tender | High | +20 pts | Tender was awarded with only 1 participating bidder | Request administrative rationale for single-bidder tender award without retendering. |
| **RF-2** | Vendor Lock-in | High | +20 pts | Winning vendor captured >60% of all department contracts | Review department vendor allocation policies and evaluate competitive barrier complaints. |
| **RF-3** | Approval Threshold Manipulation | High | +15 pts | Contract value sits within 10% below statutory approval threshold (₹45L–₹50L) | Investigate potential artificial contract splitting designed to evade higher-level administrative approval. |
| **RF-4** | Compressed Tender Window | Medium | +10 pts | Tender duration < 7 days, restricting competitive bidding | Audit public portal publication logs to verify whether tender advertisement met statutory notice requirements. |
| **RF-5** | Estimate Deviation | Medium | +10 pts | Award value exceeds government cost estimate by >30% | Examine justification for premium over estimate and review cost engineering assumptions. |
| **RF-6** | Repeat Winner / Network Pattern | High | +20 pts | Vendor has won ≥3 contracts from the same procuring entity | Conduct cross-vendor bid pattern forensic check to rule out rotational bidding or cartel behavior. |
| **RF-7** | Specification Tailoring | Medium | +15 pts | Tender technical specification has >85% TF-IDF similarity to vendor product catalog | Compare technical specifications against proprietary product catalog of the winning supplier. |
| **RF-8** | Unusual Contract Extensions | Low | +5 pts | Contract received ≥2 extensions exceeding 90 days each | Audit contract amendment records and reason for repetitive project delivery delays. |

$$\text{RuleScore} = \min\left(100, \sum \text{Detected Flag Points}\right)$$

---

## 🔬 Structured Evidence Format

Every detected heuristic finding produces a structured, non-vague evidence payload:

```json
{
  "flag_id": "RF-7",
  "flag_name": "Specification Tailoring",
  "severity": "medium",
  "score": 15.0,
  "explanation": "Specification has 94.2% cosine similarity to winning vendor catalog description.",
  "evidence": {
    "similarity_score": 0.942,
    "threshold": 0.85,
    "vendor": "Apex Systems India",
    "recommended_action": "Compare technical specifications against proprietary product catalog of the winning supplier."
  }
}
```

---

## 🤖 7-Dimensional Statistical Anomaly Signal (20% Weight)

- **Algorithm**: Scikit-Learn `IsolationForest(n_estimators=100, contamination=0.08, random_state=42)`
- **7-Dimensional Feature Vector**:
  1. Final Award Value ($\mathbb{R}$)
  2. Total Bidder Count ($\mathbb{N}$)
  3. Tender Duration in Days ($\mathbb{R}$)
  4. Sanctioned Estimate Value ($\mathbb{R}$)
  5. Estimate Deviation Ratio ($\mathbb{R}$)
  6. Historical Vendor Department Win Count ($\mathbb{N}$)
  7. Granted Extension Count ($\mathbb{N}$)
- **Statistical Role**: Identifies non-linear outliers across multiple dimensions without relying solely on rigid threshold cutoffs.

---

## 📊 Model Evaluation Benchmark

Evaluated on 2,500 constructed benchmark procurement records (`evaluate_model.py`):

```
=================================================================
  PARAKH — ML & Risk Heuristics Model Benchmark Evaluation
=================================================================
Total benchmark records analyzed: 2,500

--- Model: PARAKH Composite CRS Engine (0.80*Rule + 0.20*Anomaly >= 70) ---
  - Precision:            100.0% (Zero false accusations)
  - Accuracy:             71.0%

--- Model: Rule-Based Heuristic Screening (RF-1 to RF-8) ---
  - Accuracy:             94.36%
  - Precision:            86.58%
  - Recall (Sensitivity): 95.98%
  - F1-Score:             0.9104
  - False Positive Rate:  6.33%

--- Model: Isolation Forest 7D Statistical Anomaly Detector ---
  - Accuracy:             70.32%
  - Precision:            50.38%
  - Recall:               35.92%
  - F1-Score:             0.4194
  - False Positive Rate:  15.05%
```

---

## 🎯 Risk Tiers & Forensic Triage

- **High Risk (CRS 70–100)**: Multiple high-severity red flags or extreme statistical anomaly; requires mandatory manual forensic case creation.
- **Medium Risk (CRS 40–69)**: Multiple minor indicators or single high-severity flag; flagged for internal review.
- **Low Risk (CRS 0–39)**: Normal competitive procurement pattern.

---

## ⚖️ Responsible AI & Legal Disclaimer

> **Responsible-use statement:** PARAKH is an AI-assisted decision-support and risk-screening platform. It identifies anomalies and suspicious patterns for human investigation. It does **not** determine or prove corruption, criminal activity, or legal misconduct. All findings must be independently reviewed by authorized vigilance and forensic auditors.
