"""
scripts/run_full_benchmark.py
------------------------------
Unified CLI Command to execute PARAKH's complete evaluation benchmark pipeline end-to-end:
1. Validates all multi-source procurement data & generates data quality reports
2. Re-verifies data provenance catalog and SHA-256 hashes
3. Evaluates inter-rater reliability across dual-annotator reviews
4. Executes isolated synthetic anomaly benchmark
5. Verifies zero data leakage across train/validation/test partitions
6. Runs 5-fold cross validation across 8 model baselines
7. Evaluates holdout test sets with 95% bootstrap confidence intervals
8. Generates confusion matrices (JSON & PNG)
9. Generates ROC & Precision-Recall curves (PNG)
10. Evaluates forensic red-flag rules RF-1 through RF-8
11. Executes architecture & rule ablation studies
12. Performs operational risk threshold sweeps (workload vs recall)
13. Generates root-cause false positive/negative error analysis
14. Evaluates cross-jurisdiction and temporal generalization
15. Emits reproducibility manifest and comprehensive final reports
"""

import os
import sys
import time
import json
import logging
from datetime import datetime

# Set up environment path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("run_full_benchmark")

from scripts.ingest_adapters.multi_source_adapters import build_full_catalog
from scripts.validate_procurement_data import validate_procurement_dataset, generate_data_quality_reports
from scripts.build_review_dataset import build_review_dataset
from scripts.inter_rater_reliability import calculate_inter_rater_reliability
from benchmark.synthetic.generate_synthetic_anomalies import build_synthetic_benchmark_suite
from benchmark.evaluate_benchmark import execute_full_benchmark_suite


def run_complete_pipeline():
    start_time = time.time()
    print("=" * 70)
    print("      PARAKH AUTOMATED END-TO-END BENCHMARK & EVALUATION ENGINE      ")
    print("=" * 70)

    # 1. Multi-Source Ingestion & Provenance Catalog
    print("\n[Step 1/7] Building Multi-Source Catalog & Lineage Hashes...")
    catalog = build_full_catalog()
    print(f" -> Integrated {catalog['total_datasets']} datasets with {catalog['total_procurement_records']:,} records.")

    # 2. Data Quality & Hygiene Validation
    print("\n[Step 2/7] Validating Data Hygiene Across All Sources...")
    source_results = []
    for ds in catalog.get("datasets", []):
        norm_file = os.path.join(root_dir, ds["normalized_file"])
        if os.path.exists(norm_file):
            import pandas as pd
            df_src = pd.read_csv(norm_file)
            res = validate_procurement_dataset(df_src, ds["dataset_id"])
            source_results.append(res)
    dq_report = generate_data_quality_reports(source_results, os.path.join(root_dir, "reports"))
    print(f" -> Overall Data Quality Score: {dq_report['overall_quality_percentage']:.2f}% across {dq_report['overall_total_records']:,} rows.")

    # 3. Ground Truth Labels & Inter-Rater Reliability
    print("\n[Step 3/7] Generating Stratified Review Queue & Ground-Truth Dataset...")
    reviewed_df, dual_df = build_review_dataset(target_sample_size=600)
    irr_res = calculate_inter_rater_reliability()
    print(f" -> Reviewed {len(reviewed_df):,} records (Binary Kappa: {irr_res['metrics']['cohens_kappa_binary']:.4f} - {irr_res['metrics']['interpretation']}).")

    # 4. Synthetic Anomaly Benchmark Isolation
    print("\n[Step 4/7] Generating Isolated Synthetic Anomaly Benchmark Suite...")
    synth_res = build_synthetic_benchmark_suite(sample_size=500)
    print(f" -> Synthetic Benchmark generated ({synth_res['records']} records).")

    # 5. Core ML Benchmark, Holdouts & Figures
    print("\n[Step 5/7] Running 8 Model Baselines, Cross-Validation & ROC/PR Curves...")
    bench_res = execute_full_benchmark_suite()
    print(f" -> Cross-validation & holdout evaluation complete.")

    # 6. Summary of Key Metrics
    print("\n[Step 6/7] Key Model Performance on Independent Holdout Test Set:")
    print("-" * 70)
    print(f"{'Model Name':<35} | {'F1':<8} | {'Precision':<10} | {'Recall':<8} | {'ROC-AUC':<8}")
    print("-" * 70)
    for m_name, m_stats in bench_res["holdout_test_results"].items():
        roc_str = f"{m_stats['roc_auc']:.4f}" if m_stats['roc_auc'] >= 0 else "N/A"
        print(f"{m_name:<35} | {m_stats['f1']:<8.4f} | {m_stats['precision']:<10.4f} | {m_stats['recall']:<8.4f} | {roc_str:<8}")
    print("-" * 70)

    # 7. Execution Time
    elapsed = round(time.time() - start_time, 2)
    print(f"\n[Step 7/7] Benchmark execution completed successfully in {elapsed}s.")
    print("All machine-readable and human-readable reports saved to 'reports/'.\n")
    return bench_res


if __name__ == "__main__":
    run_complete_pipeline()
