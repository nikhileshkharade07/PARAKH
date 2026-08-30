"""
scripts/profile_procurement_data.py
-----------------------------------
Automated profiling engine for authentic Indian Government procurement data.
Computes comprehensive statistical, structural, and data-quality metrics.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime

def profile_dataset(raw_excel_path: str, output_dir: str = "data/metadata"):
    print(f"Loading raw dataset from: {raw_excel_path}")
    if not os.path.exists(raw_excel_path):
        raise FileNotFoundError(f"Raw dataset not found at {raw_excel_path}. Please run scripts/download_real_dataset.py first.")

    xl = pd.ExcelFile(raw_excel_path)
    sheet_names = xl.sheet_names
    print(f"Available sheets: {sheet_names}")

    tenders_df = pd.read_excel(xl, sheet_name="tenders")
    awards_df = pd.read_excel(xl, sheet_name="awards")
    merged_df = pd.merge(tenders_df, awards_df, on="ocid", how="inner", suffixes=("_tender", "_award"))

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("reports/data_profile", exist_ok=True)

    # 1. Structural & Record Metrics
    total_tenders = len(tenders_df)
    total_awards = len(awards_df)
    total_merged = len(merged_df)

    tenders_cols = tenders_df.columns.tolist()
    awards_cols = awards_df.columns.tolist()
    merged_cols = merged_df.columns.tolist()

    # 2. Missingness Analysis
    critical_fields = {
        "ocid": merged_df["ocid"].isna().sum(),
        "tender_id": merged_df["tender/id"].isna().sum(),
        "title": merged_df["tender/title"].isna().sum(),
        "vendor": merged_df["awards/0/suppliers/0/name"].isna().sum(),
        "department": merged_df["tender/procuringEntity/name"].isna().sum(),
        "award_value": merged_df["awards/0/value/amount"].isna().sum(),
        "estimate_value": merged_df["tender/value/amount"].isna().sum(),
        "tender_start": merged_df["tender/tenderPeriod/startDate"].isna().sum(),
        "tender_end": merged_df["tender/tenderPeriod/endDate"].isna().sum(),
        "bidder_count": merged_df["tender/numberOfTenderers"].isna().sum(),
    }

    # 3. Duplicate Detection
    exact_duplicates = int(merged_df.duplicated().sum())
    ocid_duplicates = int(merged_df["ocid"].duplicated().sum())
    tender_id_duplicates = int(merged_df["tender/id"].dropna().duplicated().sum())

    # 4. Entity Statistics
    unique_vendors = int(merged_df["awards/0/suppliers/0/name"].dropna().nunique())
    unique_departments = int(merged_df["tender/procuringEntity/name"].dropna().nunique())
    unique_buyers = int(merged_df["buyer/name"].dropna().nunique()) if "buyer/name" in merged_df else 0
    unique_locations = int(merged_df["parties/0/address/locality"].dropna().nunique()) if "parties/0/address/locality" in merged_df else 0

    # Top Vendors by Win Count
    top_vendors = (
        merged_df["awards/0/suppliers/0/name"]
        .dropna()
        .value_counts()
        .head(10)
        .to_dict()
    )

    # Top Departments by Tender Count
    top_departments = (
        merged_df["tender/procuringEntity/name"]
        .dropna()
        .value_counts()
        .head(10)
        .to_dict()
    )

    # 5. Financial Statistics (INR)
    award_vals = pd.to_numeric(merged_df["awards/0/value/amount"], errors="coerce").dropna()
    estimate_vals = pd.to_numeric(merged_df["tender/value/amount"], errors="coerce").dropna()

    award_stats = {
        "count": int(len(award_vals)),
        "sum_inr": float(award_vals.sum()),
        "sum_crores_inr": float(round(award_vals.sum() / 1e7, 2)),
        "min_inr": float(award_vals.min()) if len(award_vals) else 0,
        "mean_inr": float(round(award_vals.mean(), 2)) if len(award_vals) else 0,
        "median_inr": float(round(award_vals.median(), 2)) if len(award_vals) else 0,
        "max_inr": float(award_vals.max()) if len(award_vals) else 0,
        "std_inr": float(round(award_vals.std(), 2)) if len(award_vals) else 0,
        "p25_inr": float(round(award_vals.quantile(0.25), 2)) if len(award_vals) else 0,
        "p75_inr": float(round(award_vals.quantile(0.75), 2)) if len(award_vals) else 0,
        "p95_inr": float(round(award_vals.quantile(0.95), 2)) if len(award_vals) else 0,
    }

    estimate_stats = {
        "count": int(len(estimate_vals)),
        "sum_inr": float(estimate_vals.sum()),
        "sum_crores_inr": float(round(estimate_vals.sum() / 1e7, 2)),
        "min_inr": float(estimate_vals.min()) if len(estimate_vals) else 0,
        "mean_inr": float(round(estimate_vals.mean(), 2)) if len(estimate_vals) else 0,
        "median_inr": float(round(estimate_vals.median(), 2)) if len(estimate_vals) else 0,
        "max_inr": float(estimate_vals.max()) if len(estimate_vals) else 0,
        "std_inr": float(round(estimate_vals.std(), 2)) if len(estimate_vals) else 0,
    }

    # 6. Temporal Distribution
    start_dates = pd.to_datetime(merged_df["tender/tenderPeriod/startDate"], errors="coerce").dropna()
    end_dates = pd.to_datetime(merged_df["tender/tenderPeriod/endDate"], errors="coerce").dropna()
    
    date_range = {
        "earliest_tender_start": start_dates.min().isoformat() if len(start_dates) else None,
        "latest_tender_start": start_dates.max().isoformat() if len(start_dates) else None,
        "earliest_tender_end": end_dates.min().isoformat() if len(end_dates) else None,
        "latest_tender_end": end_dates.max().isoformat() if len(end_dates) else None,
    }

    # Tender Window Duration
    durations = (end_dates - start_dates).dt.total_seconds() / 86400
    valid_durations = durations[durations >= 0]
    duration_stats = {
        "mean_days": float(round(valid_durations.mean(), 1)) if len(valid_durations) else 0,
        "median_days": float(round(valid_durations.median(), 1)) if len(valid_durations) else 0,
        "min_days": float(round(valid_durations.min(), 1)) if len(valid_durations) else 0,
        "max_days": float(round(valid_durations.max(), 1)) if len(valid_durations) else 0,
        "under_7_days_count": int((valid_durations < 7).sum()),
        "under_7_days_pct": float(round((valid_durations < 7).mean() * 100, 2)) if len(valid_durations) else 0,
    }

    # 7. Competition & Bidding Statistics
    bidder_counts = pd.to_numeric(merged_df["tender/numberOfTenderers"], errors="coerce").dropna()
    single_bidders = int((bidder_counts == 1).sum())
    bidder_stats = {
        "available_records": int(len(bidder_counts)),
        "mean_bidders": float(round(bidder_counts.mean(), 2)) if len(bidder_counts) else 0,
        "median_bidders": float(round(bidder_counts.median(), 2)) if len(bidder_counts) else 0,
        "single_bidder_count": single_bidders,
        "single_bidder_pct": float(round(single_bidders / len(bidder_counts) * 100, 2)) if len(bidder_counts) else 0,
        "max_bidders": int(bidder_counts.max()) if len(bidder_counts) else 0,
    }

    # 8. Categories
    categories = (
        merged_df["tender/mainProcurementCategory"]
        .dropna()
        .value_counts()
        .to_dict()
        if "tender/mainProcurementCategory" in merged_df else {}
    )

    report = {
        "profiling_timestamp": datetime.now().isoformat(),
        "dataset_name": "Himachal Pradesh Government Public Procurement Dataset (OCDS)",
        "source": "hptenders.gov.in / CivicDataLab",
        "records": {
            "tenders_sheet_count": total_tenders,
            "awards_sheet_count": total_awards,
            "merged_procurement_records": total_merged,
            "total_columns": len(merged_cols)
        },
        "critical_missing_values": critical_fields,
        "duplicates": {
            "exact_duplicate_rows": exact_duplicates,
            "duplicate_ocid": ocid_duplicates,
            "duplicate_tender_id": tender_id_duplicates
        },
        "entities": {
            "unique_vendors": unique_vendors,
            "unique_departments": unique_departments,
            "unique_buyers": unique_buyers,
            "unique_locations": unique_locations,
            "top_10_vendors": top_vendors,
            "top_10_departments": top_departments
        },
        "financials_inr": {
            "awards": award_stats,
            "estimates": estimate_stats
        },
        "temporal": {
            "date_range": date_range,
            "tender_duration_days": duration_stats
        },
        "competition": bidder_stats,
        "categories": categories
    }

    class NpEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (np.integer, np.int64, np.int32)):
                return int(obj)
            if isinstance(obj, (np.floating, np.float64, np.float32)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            return super().default(obj)

    # Save JSON profile report
    json_path = os.path.join(output_dir, "data_profile_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, cls=NpEncoder)
    print(f"Data profile report saved to: {json_path}")

    # Save Markdown summary
    md_path = "reports/data_profile/DATA_PROFILE.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"""# Real Indian Government Procurement Data Profiling Report

**Generated on:** {report['profiling_timestamp']}  
**Dataset:** {report['dataset_name']}  
**Source:** {report['source']}  

---

## 1. Dataset Scale & Structure
| Metric | Value |
|---|---|
| **Total Procurement Records (Merged)** | **{total_merged:,}** |
| **Total Raw Tenders** | **{total_tenders:,}** |
| **Total Raw Awards** | **{total_awards:,}** |
| **Total Columns** | **{len(merged_cols)}** |
| **Unique Indian Vendors** | **{unique_vendors:,}** |
| **Unique Procuring Entities (Departments)** | **{unique_departments:,}** |
| **Time Horizon** | **{date_range['earliest_tender_start'][:10]} to {date_range['latest_tender_start'][:10]}** |

---

## 2. Financial Statistics (INR)
| Metric | Value (INR) | Value (Crores ₹) |
|---|---|---|
| **Total Awarded Value** | ₹{award_stats['sum_inr']:,.2f} | **₹{award_stats['sum_crores_inr']:,.2f} Cr** |
| **Mean Contract Value** | ₹{award_stats['mean_inr']:,.2f} | ₹{award_stats['mean_inr']/1e7:,.4f} Cr |
| **Median Contract Value** | ₹{award_stats['median_inr']:,.2f} | ₹{award_stats['median_inr']/1e7:,.4f} Cr |
| **Max Single Award Value** | ₹{award_stats['max_inr']:,.2f} | ₹{award_stats['max_inr']/1e7:,.2f} Cr |
| **Total Sanctioned Estimate** | ₹{estimate_stats['sum_inr']:,.2f} | **₹{estimate_stats['sum_crores_inr']:,.2f} Cr** |

---

## 3. Data Quality & Critical Field Completeness
| Critical Field | Missing Count | Completeness Rate |
|---|---|---|
| `ocid` (Unique Identifier) | {critical_fields['ocid']} | **{100 - (critical_fields['ocid']/total_merged*100):.2f}%** |
| `tender/id` | {critical_fields['tender_id']} | **{100 - (critical_fields['tender_id']/total_merged*100):.2f}%** |
| `tender/title` | {critical_fields['title']} | **{100 - (critical_fields['title']/total_merged*100):.2f}%** |
| `awards/0/suppliers/0/name` (Vendor) | {critical_fields['vendor']} | **{100 - (critical_fields['vendor']/total_merged*100):.2f}%** |
| `tender/procuringEntity/name` (Department) | {critical_fields['department']} | **{100 - (critical_fields['department']/total_merged*100):.2f}%** |
| `awards/0/value/amount` (Award Value) | {critical_fields['award_value']} | **{100 - (critical_fields['award_value']/total_merged*100):.2f}%** |
| `tender/value/amount` (Estimate Value) | {critical_fields['estimate_value']} | **{100 - (critical_fields['estimate_value']/total_merged*100):.2f}%** |

---

## 4. Key Procurement & Risk Patterns
- **Single Bidder Tenders:** {bidder_stats['single_bidder_count']:,} tenders ({bidder_stats['single_bidder_pct']}% of records with bidder info).
- **Compressed Tender Window (< 7 Days):** {duration_stats['under_7_days_count']:,} tenders ({duration_stats['under_7_days_pct']}%).
- **Mean Tender Notice Window:** {duration_stats['mean_days']} days (Median: {duration_stats['median_days']} days).
""")
    print(f"Data profile markdown saved to: {md_path}")
    return report

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_path = os.path.join(project_root, "data", "raw", "hp_procurement_raw.xlsx")
    profile_dataset(raw_path, os.path.join(project_root, "data", "metadata"))
