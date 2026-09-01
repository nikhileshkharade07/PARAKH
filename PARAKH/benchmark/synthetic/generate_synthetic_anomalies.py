"""
benchmark/synthetic/generate_synthetic_anomalies.py
---------------------------------------------------
Synthetic Anomaly Injection & Benchmark Generator for PARAKH.
Strictly isolated from real-world benchmarks to evaluate model sensitivity
under controlled, ground-truth known anomaly injections with deterministic seeds.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import pandas as pd
import numpy as np

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("synthetic_benchmark")


class SyntheticAnomalyInjector:
    """Deterministic anomaly generator with injection traceability."""

    def __init__(self, seed: int = 42):
        self.seed = seed
        np.random.seed(seed)

    def inject_single_bidder(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        mod["number_of_bidders"] = 1
        meta = {
            "injection_type": "SINGLE_BIDDER_MONOPOLY",
            "rule_target": "RF-1",
            "parameters": {"original_bidders": row.get("number_of_bidders", 3), "injected_bidders": 1}
        }
        return mod, meta

    def inject_compressed_window(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        pub_dt = pd.to_datetime(row.get("published_date", "2020-01-01 10:00:00"))
        new_deadline = pub_dt + timedelta(days=int(np.random.choice([2, 3, 4])))
        mod["submission_deadline"] = new_deadline.strftime("%Y-%m-%d %H:%M:%S")
        mod["contract_duration"] = (new_deadline - pub_dt).total_seconds() / 86400
        meta = {
            "injection_type": "COMPRESSED_TENDER_WINDOW",
            "rule_target": "RF-4",
            "parameters": {"injected_window_days": mod["contract_duration"]}
        }
        return mod, meta

    def inject_threshold_smurfing(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        statutory_threshold = 5000000.0  # ₹50 Lakhs
        smurfed_value = float(np.random.uniform(0.95 * statutory_threshold, 0.995 * statutory_threshold))
        mod["award_value"] = round(smurfed_value, 2)
        mod["estimated_value"] = round(smurfed_value * 1.02, 2)
        meta = {
            "injection_type": "THRESHOLD_SMURFING",
            "rule_target": "RF-3",
            "parameters": {"statutory_limit": statutory_threshold, "injected_award_val": mod["award_value"]}
        }
        return mod, meta

    def inject_price_deviation(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        est = float(row.get("estimated_value", 2000000))
        premium_pct = float(np.random.uniform(0.35, 0.75))  # 35% to 75% above estimate
        mod["award_value"] = round(est * (1.0 + premium_pct), 2)
        meta = {
            "injection_type": "ESTIMATE_DEVIATION_INFLATION",
            "rule_target": "RF-5",
            "parameters": {"premium_percentage": round(premium_pct * 100, 2), "estimated_val": est}
        }
        return mod, meta

    def inject_repeat_winner_monopoly(self, row: pd.Series, collusive_vendor: str = "COLLUSIVE_FAVORITE_ENTERPRISE") -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        mod["winning_supplier"] = collusive_vendor
        mod["supplier_name"] = collusive_vendor
        mod["supplier_id"] = "ENT-SUP-COLLUSIVE-999"
        meta = {
            "injection_type": "REPEAT_WINNER_CONCENTRATION",
            "rule_target": "RF-2/RF-6",
            "parameters": {"favored_supplier": collusive_vendor}
        }
        return mod, meta

    def inject_spec_tailoring(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        mod["technical_specifications"] = "Proprietary Model APEX-X900 patented optical sensor system with custom firmware 4.2.1 exclusive to Apex Systems."
        mod["product_catalog"] = "Apex Systems APEX-X900 patented optical sensor system with custom firmware 4.2.1."
        meta = {
            "injection_type": "SPECIFICATION_TAILORING",
            "rule_target": "RF-7",
            "parameters": {"nlp_catalog_overlap": 0.96}
        }
        return mod, meta

    def inject_unusual_extensions(self, row: pd.Series) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        mod = row.to_dict()
        mod["extension_count"] = 3
        mod["extension_days"] = 180
        meta = {
            "injection_type": "UNUSUAL_EXTENSIONS",
            "rule_target": "RF-8",
            "parameters": {"extension_count": 3, "cumulative_extension_days": 180}
        }
        return mod, meta


def build_synthetic_benchmark_suite(sample_size: int = 500) -> Dict[str, Any]:
    """Generate synthetic test dataset with ground truth anomalies and clean controls."""
    synth_dir = os.path.join(root_dir, "benchmark", "synthetic")
    os.makedirs(synth_dir, exist_ok=True)

    master_csv = os.path.join(root_dir, "data", "processed", "canonical_all_india_procurement.csv")
    if not os.path.exists(master_csv):
        raise FileNotFoundError("Canonical dataset missing.")

    df = pd.read_csv(master_csv)
    injector = SyntheticAnomalyInjector(seed=42)

    # Take a clean random sample
    base_sample = df.sample(n=sample_size, random_state=42).reset_index(drop=True)
    
    injected_records = []
    injection_metadata = []

    injection_funcs = [
        injector.inject_single_bidder,
        injector.inject_compressed_window,
        injector.inject_threshold_smurfing,
        injector.inject_price_deviation,
        injector.inject_repeat_winner_monopoly,
        injector.inject_spec_tailoring,
        injector.inject_unusual_extensions
    ]

    for idx, row in base_sample.iterrows():
        # 50% injected anomalies, 50% clean controls
        if idx % 2 == 1:
            fn = injection_funcs[idx % len(injection_funcs)]
            mod_row, meta = fn(row)
            mod_row["synthetic_ground_truth"] = 1
            mod_row["injection_id"] = f"SYNTH-INJ-{idx:05d}"
            meta["injection_id"] = mod_row["injection_id"]
            meta["original_tender_id"] = row["tender_id"]
            injected_records.append(mod_row)
            injection_metadata.append(meta)
        else:
            clean_row = row.to_dict()
            clean_row["synthetic_ground_truth"] = 0
            clean_row["injection_id"] = f"SYNTH-CTRL-{idx:05d}"
            injected_records.append(clean_row)
            injection_metadata.append({
                "injection_id": clean_row["injection_id"],
                "injection_type": "CLEAN_CONTROL",
                "rule_target": "NONE",
                "parameters": {}
            })

    synth_df = pd.DataFrame(injected_records)
    synth_csv = os.path.join(synth_dir, "synthetic_anomaly_dataset.csv")
    synth_df.to_csv(synth_csv, index=False, encoding="utf-8")

    meta_json = os.path.join(synth_dir, "injection_metadata.json")
    with open(meta_json, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "random_seed": 42,
            "total_synthetic_records": len(synth_df),
            "injected_anomalies_count": int(synth_df["synthetic_ground_truth"].sum()),
            "clean_controls_count": int((synth_df["synthetic_ground_truth"] == 0).sum()),
            "injections": injection_metadata
        }, f, indent=2)

    logger.info(f"Generated synthetic benchmark dataset ({len(synth_df)} records, {synth_df['synthetic_ground_truth'].sum()} anomalies) at {synth_csv}")
    return {"synthetic_file": synth_csv, "records": len(synth_df)}


if __name__ == "__main__":
    build_synthetic_benchmark_suite(sample_size=500)
