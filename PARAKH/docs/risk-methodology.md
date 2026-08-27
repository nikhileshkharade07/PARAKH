# Risk Methodology

Rule scores are explicit and individually explained.

Default weights:
- RF-1 20
- RF-2 20
- RF-3 15
- RF-4 10
- RF-5 10
- RF-6 20
- RF-7 15
- RF-8 5

`rule_score = min(100, sum(detected rule scores))`

Isolation Forest produces a normalized statistical anomaly score from 0–100.

`CRS = round(0.80 * rule_score + 0.20 * anomaly_score)`

Risk bands:
- 0–39 Low
- 40–69 Medium
- 70–100 High

Language must remain evidence-oriented: "risk indicator", "suspicious pattern", "anomaly", "warrants further investigation".
