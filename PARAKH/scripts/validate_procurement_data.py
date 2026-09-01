"""
scripts/validate_procurement_data.py
------------------------------------
Automated Data Quality Validation Pipeline for PARAKH.
Performs comprehensive hygiene, domain constraint, and integrity validation on
all ingested procurement datasets across sources, generating structured JSON and MD reports.
"""

import os
import sys
import json
import logging
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any, Tuple, Optional
import pandas as pd
import numpy as np

# Add project root to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.schemas.canonical_schema import CanonicalProcurementRecord, compute_field_availability
from scripts.entity_resolution import normalize_supplier_entity, normalize_department_entity

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("validate_procurement_data")

VALID_INDIAN_STATES = {
    "HIMACHAL PRADESH", "MAHARASHTRA", "KARNATAKA", "RAJASTHAN", "UTTAR PRADESH",
    "DELHI", "TAMIL NADU", "GUJARAT", "WEST BENGAL", "KERALA", "TELANGANA",
    "ANDHRA PRADESH", "MADHYA PRADESH", "BIHAR", "ODISHA", "PUNJAB", "HARYANA",
    "ASSAM", "JHARKHAND", "CHHATTISGARH", "UTTARAKHAND", "GOA", "TRIPURA",
    "MANIPUR", "MEGHALAYA", "NAGALAND", "MIZORAM", "SIKKIM", "ARUNACHAL PRADESH",
    "CENTRAL", "INDIA"
}


def parse_dt_safe(val: Any) -> Optional[datetime]:
    """Parse date values safely."""
    if val is None or pd.isna(val) or val == "":
        return None
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.to_pydatetime() if hasattr(val, "to_pydatetime") else val
    s = str(val).strip()
    formats = [
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def validate_procurement_dataset(df: pd.DataFrame, source_name: str = "UNKNOWN") -> Dict[str, Any]:
    """
    Validate a procurement dataframe against universal domain and schema rules.
    Returns structured data quality summary and list of rejected rows with reasons.
    """
    total_rows = len(df)
    valid_rows = 0
    rejected_rows = []
    
    seen_tender_ids = set()
    duplicate_ids = 0
    missing_ids = 0
    invalid_dates = 0
    deadline_before_pub = 0
    negative_amounts = 0
    zero_amounts = 0
    invalid_bidder_counts = 0
    invalid_states = 0
    impossible_durations = 0
    missing_supplier = 0
    missing_dept = 0

    records_list = df.to_dict(orient="records")
    field_availability = compute_field_availability(records_list)

    cleaned_valid_records = []

    for idx, row in enumerate(records_list):
        row_num = idx + 1
        issues = []

        # 1. Identifier Validation
        tender_id = str(row.get("tender_id", "")).strip() if pd.notna(row.get("tender_id")) else ""
        if not tender_id or tender_id.lower() == "nan":
            issues.append("Missing tender_id")
            missing_ids += 1
        elif tender_id in seen_tender_ids:
            issues.append(f"Duplicate tender_id: {tender_id}")
            duplicate_ids += 1
        else:
            seen_tender_ids.add(tender_id)

        # 2. Entity Integrity
        supplier = str(row.get("winning_supplier", "")).strip() if pd.notna(row.get("winning_supplier")) else ""
        if not supplier or supplier.lower() == "nan":
            issues.append("Missing winning_supplier")
            missing_supplier += 1

        dept = str(row.get("department", "")).strip() if pd.notna(row.get("department")) else ""
        if not dept or dept.lower() == "nan":
            issues.append("Missing procuring department")
            missing_dept += 1

        # 3. Financial Sanity
        award_val = row.get("award_value")
        est_val = row.get("estimated_value")
        
        try:
            award_f = float(award_val) if pd.notna(award_val) else None
        except (ValueError, TypeError):
            award_f = None
            issues.append(f"Malformed award_value: {award_val}")

        try:
            est_f = float(est_val) if pd.notna(est_val) else None
        except (ValueError, TypeError):
            est_f = None
            issues.append(f"Malformed estimated_value: {est_val}")

        if award_f is not None and award_f < 0:
            issues.append(f"Negative award value: {award_f}")
            negative_amounts += 1
        if est_f is not None and est_f < 0:
            issues.append(f"Negative estimated value: {est_f}")
            negative_amounts += 1
            
        if (award_f is None or award_f == 0) and (est_f is None or est_f == 0):
            issues.append("Zero or missing procurement financial value")
            zero_amounts += 1

        # 4. Temporal Sanity
        pub_dt = parse_dt_safe(row.get("published_date") or row.get("tender_start"))
        dead_dt = parse_dt_safe(row.get("submission_deadline") or row.get("tender_end"))
        
        if pub_dt and dead_dt:
            if dead_dt < pub_dt:
                issues.append(f"Submission deadline ({dead_dt}) is before publication ({pub_dt})")
                deadline_before_pub += 1
            duration_days = (dead_dt - pub_dt).total_seconds() / 86400
            if duration_days > 730:  # > 2 years for tender window
                issues.append(f"Impossible tender window duration: {duration_days:.1f} days")
                impossible_durations += 1

        # 5. Competition & Bidders
        bidders = row.get("number_of_bidders") or row.get("bidder_count")
        try:
            b_cnt = int(bidders) if pd.notna(bidders) else 1
            if b_cnt < 1 or b_cnt > 1000:
                issues.append(f"Invalid bidder count: {b_cnt}")
                invalid_bidder_counts += 1
        except (ValueError, TypeError):
            issues.append(f"Malformed bidder count: {bidders}")
            invalid_bidder_counts += 1

        # 6. Geographic Sanity
        state = str(row.get("state", "INDIA")).strip().upper()
        if state not in VALID_INDIAN_STATES:
            issues.append(f"Unrecognized or invalid Indian State: {state}")
            invalid_states += 1

        # Decision
        if issues:
            rejected_rows.append({
                "row_number": row_num,
                "tender_id": tender_id or f"ROW_{row_num}",
                "issues": issues,
                "source": source_name
            })
        else:
            valid_rows += 1
            cleaned_valid_records.append(row)

    quality_score = round((valid_rows / max(1, total_rows)) * 100, 2)

    return {
        "source_name": source_name,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "rejected_rows_count": len(rejected_rows),
        "data_quality_score_pct": quality_score,
        "violations": {
            "duplicate_tender_ids": duplicate_ids,
            "missing_ids": missing_ids,
            "negative_amounts": negative_amounts,
            "zero_procurement_amounts": zero_amounts,
            "deadline_before_publication": deadline_before_pub,
            "impossible_durations": impossible_durations,
            "invalid_bidder_counts": invalid_bidder_counts,
            "invalid_state_names": invalid_states,
            "missing_suppliers": missing_supplier,
            "missing_departments": missing_dept
        },
        "field_availability": field_availability,
        "rejected_samples": rejected_rows[:20],
        "valid_records_sample": cleaned_valid_records[:5]
    }


def generate_data_quality_reports(source_results: List[Dict[str, Any]], output_dir: str = "reports"):
    """Write machine-readable JSON and human-readable Markdown data quality reports."""
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "data_quality_report.json")
    md_path = os.path.join(output_dir, "data_quality_report.md")

    total_rows = sum(r["total_rows"] for r in source_results)
    total_valid = sum(r["valid_rows"] for r in source_results)
    total_rejected = sum(r["rejected_rows_count"] for r in source_results)
    overall_quality = round((total_valid / max(1, total_rows)) * 100, 2)

    report_payload = {
        "generated_at": datetime.now().isoformat(),
        "total_sources_audited": len(source_results),
        "overall_total_records": total_rows,
        "overall_valid_records": total_valid,
        "overall_rejected_records": total_rejected,
        "overall_quality_percentage": overall_quality,
        "sources": source_results
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report_payload, f, indent=2)
    logger.info(f"Saved machine-readable data quality report to {json_path}")

    # Generate Markdown Report
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"""# PARAKH Data Quality & Provenance Validation Report

**Execution Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}  
**Validation Engine:** Automated Schema, Domain Constraint, and Hygiene Validator  
**Overall Data Quality Score:** **{overall_quality:.2f}%** ({total_valid:,} valid of {total_rows:,} total records)

---

## 1. Executive Summary Across Sources

| Metric | Overall Value |
|---|---|
| **Total Sources Audited** | **{len(source_results)}** |
| **Total Ingested Procurement Records** | **{total_rows:,}** |
| **Passed Quality Filters (Valid Rows)** | **{total_valid:,}** ({overall_quality:.2f}%) |
| **Rejected Anomalous / Corrupted Rows** | **{total_rejected:,}** ({total_rejected/max(1, total_rows)*100:.2f}%) |

---

## 2. Source-Wise Data Quality Breakdown

| Source Identifier | Total Records | Valid Rows | Rejections | Quality Score | Top Constraint Violations |
|---|:---:|:---:|:---:|:---:|---|
""")
        for s in source_results:
            top_v = [f"{k}: {v}" for k, v in s["violations"].items() if v > 0]
            top_v_str = ", ".join(top_v) if top_v else "None (100% Clean)"
            f.write(f"| **{s['source_name']}** | {s['total_rows']:,} | {s['valid_rows']:,} | {s['rejected_rows_count']:,} | **{s['data_quality_score_pct']}%** | {top_v_str} |\n")

        f.write(f"""
---

## 3. Universal Domain Validation Rules Enforced

1. **Deterministic Unique Tender ID:** No duplicate contracts allowed within same partition.
2. **Entity Completeness:** Explicit winning supplier and procuring department required.
3. **Financial Sanity:** Positive award or estimated values ($> ₹0$). Zero/negative values strictly quarantined.
4. **Chronological Validity:** Submission deadline must be strictly after publication date.
5. **Competition Bounds:** Number of participating bidders bounded in $[1, 1000]$.
6. **Geographic Standardization:** Canonical validation against official Indian States/UTs.

---

## 4. Field Completeness Statistics (Primary Real Dataset)
""")
        if source_results:
            primary_fa = source_results[0].get("field_availability", {}).get("fields", {})
            f.write("| Canonical Field | Available Count | Completeness Percentage |\n|---|:---:|:---:|\n")
            for field_name, stats in primary_fa.items():
                f.write(f"| `{field_name}` | {stats['available_count']:,} | {stats['completeness_pct']}% |\n")

    logger.info(f"Saved human-readable data quality report to {md_path}")
    return report_payload


if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    catalog_path = os.path.join(project_root, "data", "catalog.json")
    
    if os.path.exists(catalog_path):
        with open(catalog_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
            
        source_results = []
        for ds in catalog.get("datasets", []):
            norm_file = os.path.join(project_root, ds["normalized_file"])
            if os.path.exists(norm_file):
                df_src = pd.read_csv(norm_file)
                res = validate_procurement_dataset(df_src, ds["dataset_id"])
                source_results.append(res)
                print(f"Validated {ds['source_name']}: {res['valid_rows']}/{res['total_rows']} valid ({res['data_quality_score_pct']}%)")
                
        generate_data_quality_reports(source_results, os.path.join(project_root, "reports"))
        print("\nAll datasets validated. Reports saved to reports/data_quality_report.json and .md")
    else:
        print(f"Catalog file not found at: {catalog_path}")

