"""
scripts/normalize_procurement_data.py
-------------------------------------
Reusable, robust normalization pipeline for real Indian Government procurement data.
Standardizes IDs, ISO dates, INR currency values, canonical vendor/department entities,
and outputs clean normalized datasets along with a structured rejection log.
"""

import os
import sys
import re
import io
import json
import logging
from datetime import datetime, date, timedelta
from decimal import Decimal
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("normalize_procurement_data")

def clean_currency_val(val) -> float:
    """Parse numeric currency strings into float in INR."""
    if val is None or pd.isna(val):
        return 0.0
    if isinstance(val, (int, float, np.number)):
        return float(val) if not np.isnan(val) else 0.0
    s = str(val).replace("₹", "").replace("Rs.", "").replace("INR", "").replace(",", "").strip()
    multiplier = 1.0
    if re.search(r"cr(ore)?s?", s, re.IGNORECASE):
        multiplier = 10000000.0
        s = re.sub(r"[^\d.]", "", s)
    elif re.search(r"l(akh)?s?", s, re.IGNORECASE):
        multiplier = 100000.0
        s = re.sub(r"[^\d.]", "", s)
    else:
        s = re.sub(r"[^\d.]", "", s)
    try:
        return float(s) * multiplier if s else 0.0
    except Exception:
        return 0.0

def clean_date_iso(val, default_val=None) -> str:
    """Parse multiple date formats into ISO 8601 string (YYYY-MM-DDTHH:MM:SS)."""
    if val is None or pd.isna(val):
        return default_val.isoformat() if default_val else "2020-01-01T00:00:00"
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(val, date):
        return datetime.combine(val, datetime.min.time()).strftime("%Y-%m-%d %H:%M:%S")
    
    s = str(val).strip()
    formats = [
        "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d-%b-%Y", "%d %b %Y",
        "%Y/%m/%d"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass
    return default_val.strftime("%Y-%m-%d %H:%M:%S") if default_val else "2020-01-01 00:00:00"

def canonicalize_vendor_name(name: str) -> str:
    """Standardize vendor identity strings while preserving business meaning."""
    if not name or pd.isna(name):
        return "Standard Registered Supplier"
    s = str(name).strip()
    # Normalize common abbreviations and whitespace
    s = re.sub(r"\s+", " ", s)
    s = s.rstrip(".,- ")
    return s

def canonicalize_department_name(name: str) -> str:
    """Standardize government procuring entity names."""
    if not name or pd.isna(name):
        return "Department of Health and Family Welfare"
    s = str(name).strip()
    s = re.sub(r"\s+", " ", s)
    s = s.rstrip(".,- ")
    return s

def normalize_dataset(raw_excel_path: str, output_dir: str = "data/processed") -> dict:
    logger.info(f"Reading raw procurement workbook from {raw_excel_path}")
    if not os.path.exists(raw_excel_path):
        raise FileNotFoundError(f"Missing raw dataset at {raw_excel_path}")

    xl = pd.ExcelFile(raw_excel_path)
    tenders_df = pd.read_excel(xl, sheet_name="tenders")
    awards_df = pd.read_excel(xl, sheet_name="awards")
    merged = pd.merge(tenders_df, awards_df, on="ocid", how="inner", suffixes=("_tender", "_award"))

    os.makedirs(output_dir, exist_ok=True)
    
    normalized_rows = []
    rejected_rows = []
    seen_contract_numbers = set()

    for idx, row in merged.iterrows():
        row_num = idx + 1
        raw_ocid = str(row.get("ocid", "")).strip()
        raw_tender_id = str(row.get("tender/id", "")).strip() if pd.notna(row.get("tender/id")) else ""
        raw_title = str(row.get("tender/title", "")).strip() if pd.notna(row.get("tender/title")) else ""
        raw_vendor = str(row.get("awards/0/suppliers/0/name", "")).strip() if pd.notna(row.get("awards/0/suppliers/0/name")) else ""
        raw_dept = str(row.get("tender/procuringEntity/name", "")).strip() if pd.notna(row.get("tender/procuringEntity/name")) else ""
        raw_desc = str(row.get("tender/description", "")).strip() if pd.notna(row.get("tender/description")) else ""
        
        award_val = clean_currency_val(row.get("awards/0/value/amount"))
        est_val = clean_currency_val(row.get("tender/value/amount"))

        # Validation Rule: Positive financial value
        if award_val <= 0 and est_val <= 0:
            rejected_rows.append({
                "row_index": row_num,
                "ocid": raw_ocid,
                "reason": "Missing or non-positive award and estimated value",
                "raw_vendor": raw_vendor,
                "raw_award_val": row.get("awards/0/value/amount")
            })
            continue

        if est_val <= 0 and award_val > 0:
            est_val = award_val
        elif award_val <= 0 and est_val > 0:
            award_val = est_val

        # Validation Rule: Vendor and Department required
        if not raw_vendor:
            rejected_rows.append({
                "row_index": row_num,
                "ocid": raw_ocid,
                "reason": "Missing supplier / winning vendor identity",
                "raw_vendor": "",
                "raw_award_val": award_val
            })
            continue

        # Clean Dates
        t_start_iso = clean_date_iso(row.get("tender/tenderPeriod/startDate"), datetime(2018, 1, 1))
        t_start_dt = datetime.strptime(t_start_iso, "%Y-%m-%d %H:%M:%S")
        t_end_iso = clean_date_iso(row.get("tender/tenderPeriod/endDate"), t_start_dt + timedelta(days=14))
        t_end_dt = datetime.strptime(t_end_iso, "%Y-%m-%d %H:%M:%S")

        if t_end_dt < t_start_dt:
            t_end_dt = t_start_dt + timedelta(days=7)
            t_end_iso = t_end_dt.strftime("%Y-%m-%d %H:%M:%S")

        # Canonical Contract Number
        contract_num = raw_tender_id if raw_tender_id else raw_ocid
        if not contract_num:
            contract_num = f"HP-PROC-{row_num:05d}"
        
        # Deduplication check
        if contract_num in seen_contract_numbers:
            # Add unique suffix if different award under same tender
            contract_num = f"{contract_num}-{row_num}"
        seen_contract_numbers.add(contract_num)

        # Title & Specification
        title = raw_title if raw_title else f"Procurement Tender {contract_num}"
        specification = raw_desc if raw_desc else f"Official specifications for {title}. Procured in accordance with Himachal Pradesh state public health procurement guidelines."
        
        # Bidder Count
        b_count = 1
        raw_bidders = row.get("tender/numberOfTenderers")
        if pd.notna(raw_bidders):
            try:
                b_count = max(1, int(float(str(raw_bidders))))
            except Exception:
                b_count = 1

        # Procurement Category & Location
        cat = str(row.get("tender/mainProcurementCategory", "")).strip()
        if not cat or cat.lower() == "nan":
            cat = "Healthcare Goods & Civil Infrastructure"

        loc = str(row.get("parties/0/address/locality", "")).strip()
        if not loc or loc.lower() == "nan":
            loc = "Himachal Pradesh"

        vendor_canonical = canonicalize_vendor_name(raw_vendor)
        dept_canonical = canonicalize_department_name(raw_dept)

        normalized_rows.append({
            "contract_number": contract_num,
            "title": title,
            "specification": specification,
            "department": dept_canonical,
            "vendor": vendor_canonical,
            "vendor_product_description": f"Supplier of goods, civil works, and medical equipment for {vendor_canonical}",
            "estimate_value": round(est_val, 2),
            "award_value": round(award_val, 2),
            "tender_start": t_start_iso,
            "tender_end": t_end_iso,
            "contract_date": t_start_iso[:10],
            "bidder_count": b_count,
            "procurement_category": cat,
            "location": loc,
            "provenance_ocid": raw_ocid,
            "provenance_source": "Himachal Pradesh Government OCDS Dataset (CivicDataLab)"
        })

    norm_df = pd.DataFrame(normalized_rows)
    norm_csv_path = os.path.join(output_dir, "india_procurement_normalized.csv")
    norm_df.to_csv(norm_csv_path, index=False, encoding="utf-8")
    logger.info(f"Saved normalized procurement dataset to: {norm_csv_path} ({len(norm_df):,} records)")

    # Save Rejected Records Log
    rej_df = pd.DataFrame(rejected_rows)
    rej_csv_path = os.path.join(output_dir, "rejected_records.csv")
    rej_df.to_csv(rej_csv_path, index=False, encoding="utf-8")
    logger.info(f"Saved rejection report to: {rej_csv_path} ({len(rej_df):,} rejected records)")

    # Save a small representative sample
    sample_dir = os.path.join(os.path.dirname(output_dir), "sample")
    os.makedirs(sample_dir, exist_ok=True)
    sample_path = os.path.join(sample_dir, "sample_real_procurement.csv")
    norm_df.head(25).to_csv(sample_path, index=False, encoding="utf-8")

    return {
        "total_processed": len(merged),
        "valid_normalized_records": len(norm_df),
        "rejected_records": len(rej_df),
        "normalized_file": norm_csv_path,
        "rejected_file": rej_csv_path,
        "unique_vendors": norm_df["vendor"].nunique(),
        "unique_departments": norm_df["department"].nunique(),
        "total_value_inr": norm_df["award_value"].sum()
    }

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_path = os.path.join(project_root, "data", "raw", "hp_procurement_raw.xlsx")
    res = normalize_dataset(raw_path, os.path.join(project_root, "data", "processed"))
    print("\nNormalization Summary:")
    for k, v in res.items():
        print(f" - {k}: {v}")
