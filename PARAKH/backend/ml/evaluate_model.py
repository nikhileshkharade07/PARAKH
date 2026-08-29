import os
import sys
from decimal import Decimal

# Ensure backend and root are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.database.session import SessionLocal
from backend.app.models import Contract, RiskAssessment
from backend.ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts

def run_model_evaluation():
    print("=" * 65)
    print("  PARAKH — ML & Risk Heuristics Model Benchmark Evaluation")
    print("  Dataset: Benchmark evaluation on synthetic/constructed dataset")
    print("=" * 65)

    db = SessionLocal()
    contracts = db.query(Contract).all()
    if not contracts:
        print("No contracts found in database to evaluate. Please seed demo data first.")
        db.close()
        return

    print(f"Total benchmark records analyzed: {len(contracts):,}")

    # Ground truth determination for constructed benchmark anomalies:
    # Seeded showcase anomalies (GEM-DEMO-000007, 77, 777, 1777 and specific rule triggers)
    # Ground truth positive if contract is a seeded showcase or exhibits >= 2 high-severity red flags
    y_true = []
    y_pred_rule = []
    y_pred_crs = []
    y_pred_isolation = []

    anomaly_scores = anomaly_scores_for_contracts(contracts)

    for c in contracts:
        # Determine ground truth (constructed benchmark rule)
        is_showcase = c.contract_number in {"GEM-DEMO-000007", "GEM-DEMO-000077", "GEM-DEMO-000777", "GEM-DEMO-001777"}
        high_flags_count = sum(f.severity == "high" for f in c.risk_flags if f.detected)
        
        # Ground truth label: 1 if genuinely anomalous (showcase or >=2 high risk flags or high deviation + single bid)
        actual_anomaly = 1 if (is_showcase or high_flags_count >= 2) else 0
        y_true.append(actual_anomaly)

        # Predictions
        crs = c.risk_assessment.crs if c.risk_assessment else 0
        y_pred_crs.append(1 if crs >= 70 else 0)

        rule_score = c.risk_assessment.rule_score if c.risk_assessment else 0
        y_pred_rule.append(1 if rule_score >= 40 else 0)

        anom_score = anomaly_scores.get(id(c), 0.0)
        y_pred_isolation.append(1 if anom_score >= 60 else 0)

    db.close()

    def calc_metrics(y_actual, y_predicted, model_name):
        tp = sum(a == 1 and p == 1 for a, p in zip(y_actual, y_predicted))
        fp = sum(a == 0 and p == 1 for a, p in zip(y_actual, y_predicted))
        tn = sum(a == 0 and p == 0 for a, p in zip(y_actual, y_predicted))
        fn = sum(a == 1 and p == 0 for a, p in zip(y_actual, y_predicted))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        accuracy = (tp + tn) / len(y_actual) if y_actual else 0.0

        print(f"\n--- Model / Pipeline: {model_name} ---")
        print(f"Confusion Matrix:")
        print(f"  [ True Positives (TP): {tp:4d} | False Positives (FP): {fp:4d} ]")
        print(f"  [ False Negatives(FN): {fn:4d} | True Negatives  (TN): {tn:4d} ]")
        print(f"Metrics:")
        print(f"  - Precision:          {precision:.4f} ({precision*100:.1f}%)")
        print(f"  - Recall (Sensitivity): {recall:.4f} ({recall*100:.1f}%)")
        print(f"  - F1-Score:           {f1:.4f}")
        print(f"  - False Positive Rate:{fpr:.4f} ({fpr*100:.2f}%)")
        print(f"  - Accuracy:           {accuracy:.4f} ({accuracy*100:.1f}%)")
        return {"precision": precision, "recall": recall, "f1": f1, "fpr": fpr, "tp": tp, "fp": fp, "tn": tn, "fn": fn}

    calc_metrics(y_true, y_pred_crs, "PARAKH Composite CRS Engine (0.80*Rule + 0.20*Anomaly >= 70)")
    calc_metrics(y_true, y_pred_rule, "Rule-Based Heuristic Screening (RF-1 to RF-8)")
    calc_metrics(y_true, y_pred_isolation, "Isolation Forest 7D Statistical Anomaly Detector")

    print("\n" + "=" * 65)
    print("  Note: Evaluated against constructed benchmark anomaly profiles.")
    print("  In production, ground truth must be verified by certified forensic auditors.")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    run_model_evaluation()
