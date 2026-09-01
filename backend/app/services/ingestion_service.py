import io
import json
import re
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from sqlalchemy.orm import Session


from app.models import Contract, Department, Vendor, Bid, ContractExtension
from ml.risk_engine.engine import RiskEngine
from ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts
from app.services.audit_service import log_audit

FIELD_MAPPINGS = {
    "contract_number": ["tender_id", "tender_reference", "contract_number", "tender_no", "bid_id", "id", "contract_id"],
    "title": ["title", "tender_title", "contract_title", "description", "work_name", "item_description"],
    "department": ["department", "dept", "dept_name", "organization", "procuring_entity", "authority", "ministry"],
    "vendor": ["vendor", "winning_vendor", "supplier", "contractor", "awarded_to", "vendor_name", "bidder_winner"],
    "estimate_value": ["estimate_value", "estimated_value", "sanctioned_amount", "budget", "estimated_cost", "tender_value"],
    "award_value": ["award_value", "contract_value", "awarded_amount", "final_cost", "winning_bid", "total_value"],
    "tender_start": ["tender_start", "tender_date", "publish_date", "start_date", "open_date"],
    "tender_end": ["tender_end", "submission_deadline", "end_date", "closing_date", "award_date"],
    "bidder_count": ["bidder_count", "bidders_count", "num_bidders", "total_bids", "bidders"],
    "specification": ["specification", "specs", "technical_specification", "requirements", "scope_of_work"],
    "vendor_product_description": ["vendor_product_description", "product_description", "vendor_catalog", "vendor_profile"],
    "extensions": ["extensions", "extension_count", "num_extensions", "extension_days"],
    "procurement_category": ["procurement_category", "category", "type", "sector"],
    "location": ["location", "city", "state", "region"],
    "provenance_ocid": ["provenance_ocid", "ocid", "source_record_id"],
    "provenance_source": ["provenance_source", "source_dataset", "source_url", "source"]
}

def clean_currency(val: Any) -> Decimal:
    """Parse numeric currency strings, removing symbols, commas, and formatting."""
    if val is None or pd.isna(val):
        return Decimal(0)
    if isinstance(val, (int, float, Decimal)):
        return Decimal(str(round(float(val), 2)))
    s = str(val).replace("₹", "").replace("$", "").replace(",", "").strip()
    # Check for Lakhs / Crores suffixes
    multiplier = Decimal(1)
    if re.search(r"cr(ore)?s?", s, re.IGNORECASE):
        multiplier = Decimal("10000000")
        s = re.sub(r"[^\d.]", "", s)
    elif re.search(r"l(akh)?s?", s, re.IGNORECASE):
        multiplier = Decimal("100000")
        s = re.sub(r"[^\d.]", "", s)
    else:
        s = re.sub(r"[^\d.]", "", s)
    try:
        return Decimal(s) * multiplier if s else Decimal(0)
    except Exception:
        return Decimal(0)

def clean_date(val: Any, default_val: Optional[datetime] = None) -> datetime:
    """Parse multiple date string formats gracefully."""
    if val is None or pd.isna(val):
        return default_val or datetime(2025, 1, 1)
    if isinstance(val, datetime):
        return val
    if isinstance(val, date):
        return datetime.combine(val, datetime.min.time())
    s = str(val).strip()
    formats = [
        "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d-%b-%Y", "%d %b %Y",
        "%Y/%m/%d"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return default_val or datetime(2025, 1, 1)

def map_row_fields(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Map dynamic header columns to standard PARAKH schema keys."""
    normalized_row = {k.lower().strip().replace(" ", "_").replace("-", "_"): v for k, v in row_dict.items()}
    result = {}
    for target_key, candidate_keys in FIELD_MAPPINGS.items():
        found = None
        for cand in candidate_keys:
            if cand in normalized_row and normalized_row[cand] is not None and not pd.isna(normalized_row[cand]):
                found = normalized_row[cand]
                break
        result[target_key] = found
    return result

class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.risk_engine = RiskEngine()

    def process_file_content(self, filename: str, content_bytes: bytes, user=None) -> Dict[str, Any]:
        """Parse, validate, normalize, persist, and analyze procurement dataset."""
        df = None
        lower_name = filename.lower()
        
        try:
            if lower_name.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content_bytes))
            elif lower_name.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(content_bytes))
            elif lower_name.endswith(".json"):
                data = json.loads(content_bytes.decode("utf-8"))
                if isinstance(data, dict):
                    data = data.get("contracts", data.get("records", [data]))
                df = pd.DataFrame(data)
            else:
                return {
                    "success": False,
                    "filename": filename,
                    "total_uploaded": 0,
                    "valid_records": 0,
                    "invalid_records": 0,
                    "duplicates": 0,
                    "analyzed": 0,
                    "message": "Unsupported file format. Please upload CSV, XLSX, or JSON.",
                    "errors": [{"row": 0, "field": "filename", "message": "Unsupported file format"}]
                }
        except Exception as e:
            return {
                "success": False,
                "filename": filename,
                "total_uploaded": 0,
                "valid_records": 0,
                "invalid_records": 0,
                "duplicates": 0,
                "analyzed": 0,
                "message": f"Failed to parse file: {str(e)}",
                "errors": [{"row": 0, "field": "file", "message": str(e)}]
            }

        total_uploaded = len(df)
        valid_records = 0
        invalid_records = 0
        duplicates = 0
        errors = []
        new_contracts: List[Contract] = []

        # Load existing lookup caches for fast performance
        dept_cache = {d.name.lower(): d for d in self.db.query(Department).all()}
        vendor_cache = {v.name.lower(): v for v in self.db.query(Vendor).all()}
        existing_contract_numbers = {c.contract_number for c in self.db.query(Contract.contract_number).all()}

        for idx, row in df.iterrows():
            row_num = idx + 1
            mapped = map_row_fields(row.to_dict())

            # Validation
            contract_num = str(mapped["contract_number"] or f"IMP-{datetime.now().strftime('%y%m')}-{row_num:05d}").strip()
            if contract_num in existing_contract_numbers:
                duplicates += 1
                continue

            dept_name = str(mapped["department"] or "General Procurement Department").strip()
            vendor_name = str(mapped["vendor"] or "Standard Supplier Corp").strip()
            title = str(mapped["title"] or f"Procurement Contract {contract_num}").strip()
            
            est_val = clean_currency(mapped["estimate_value"])
            awd_val = clean_currency(mapped["award_value"])
            if awd_val <= 0 and est_val > 0:
                awd_val = est_val
            elif est_val <= 0 and awd_val > 0:
                est_val = awd_val
            elif est_val <= 0 and awd_val <= 0:
                invalid_records += 1
                errors.append({"row": row_num, "field": "award_value", "message": "Contract must have a positive value", "raw_data": mapped})
                continue

            t_start = clean_date(mapped["tender_start"], datetime(2025, 1, 1))
            t_end = clean_date(mapped["tender_end"], t_start + timedelta(days=14))
            if t_end < t_start:
                t_end = t_start + timedelta(days=7)

            # Ensure Department & Vendor exist
            dept_key = dept_name.lower()
            if dept_key not in dept_cache:
                dept = Department(name=dept_name)
                self.db.add(dept)
                self.db.flush()
                dept_cache[dept_key] = dept
            else:
                dept = dept_cache[dept_key]

            vendor_key = vendor_name.lower()
            if vendor_key not in vendor_cache:
                v_desc = str(mapped["vendor_product_description"] or "").strip()
                vendor = Vendor(name=vendor_name, product_description=v_desc)
                self.db.add(vendor)
                self.db.flush()
                vendor_cache[vendor_key] = vendor
            else:
                vendor = vendor_cache[vendor_key]

            spec_text = str(mapped["specification"] or f"Standard specifications for {title}").strip()

            contract = Contract(
                contract_number=contract_num,
                title=title,
                specification=spec_text,
                contract_date=t_start.date(),
                department_id=dept.id,
                vendor_id=vendor.id,
                estimate_value=est_val,
                award_value=awd_val,
                tender_start=t_start,
                tender_end=t_end,
                procurement_category=str(mapped["procurement_category"] or "Goods & Services"),
                location=str(mapped["location"] or "National"),
                provenance_ocid=str(mapped["provenance_ocid"]) if mapped.get("provenance_ocid") else None,
                provenance_source=str(mapped["provenance_source"]) if mapped.get("provenance_source") else "Uploaded Dataset"
            )
            self.db.add(contract)
            self.db.flush()

            # Bidders
            b_count = 1
            if mapped["bidder_count"] is not None:
                try:
                    b_count = max(1, int(float(str(mapped["bidder_count"]))))
                except Exception:
                    b_count = 1

            self.db.add(Bid(contract_id=contract.id, vendor_name=vendor.name, bid_value=awd_val))
            for b_idx in range(1, b_count):
                self.db.add(Bid(contract_id=contract.id, vendor_name=f"Participating Bidder {b_idx}", bid_value=awd_val * Decimal(1.05)))

            # Extensions
            if mapped["extensions"]:
                try:
                    ext_days = int(float(str(mapped["extensions"])))
                    if ext_days > 0:
                        self.db.add(ContractExtension(contract_id=contract.id, extension_days=ext_days, reason="Project timeline extension"))
                except Exception:
                    pass

            existing_contract_numbers.add(contract_num)
            new_contracts.append(contract)
            valid_records += 1

        self.db.commit()

        # Batch ML Anomaly Scoring & Risk Engine Run
        analyzed_count = 0
        if new_contracts:
            all_contracts = self.db.query(Contract).all()
            anomaly_scores = anomaly_scores_for_contracts(all_contracts)
            for c in new_contracts:
                self.risk_engine.analyze_contract(c, self.db, anomaly_score=anomaly_scores.get(id(c), 15.0))
                analyzed_count += 1
            self.db.commit()

        log_audit(
            db=self.db,
            action="INGEST_DATA",
            resource_type="DATASET",
            resource_id=filename,
            details={
                "filename": filename,
                "total_uploaded": total_uploaded,
                "valid_records": valid_records,
                "invalid_records": invalid_records,
                "duplicates": duplicates,
                "analyzed": analyzed_count
            },
            user=user,
            result="SUCCESS" if valid_records > 0 else "PARTIAL"
        )

        return {
            "success": True,
            "filename": filename,
            "total_uploaded": total_uploaded,
            "valid_records": valid_records,
            "invalid_records": invalid_records,
            "duplicates": duplicates,
            "analyzed": analyzed_count,
            "message": f"Successfully ingested {valid_records} records, skipped {duplicates} duplicates, analyzed {analyzed_count} contracts.",
            "errors": errors[:50] # Top 50 errors
        }
