"""Ingestion service for parsing and validating procurement data."""
import json
import pandas as pd
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import Department, Vendor, Contract, Bid, ContractExtension
from app.core.config import settings
from ml.risk_engine.engine import RiskEngine


class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.risk_engine = RiskEngine()

        # Statistics
        self.stats = {
            "total": 0,
            "imported": 0,
            "rejected": 0,
            "duplicates": 0,
            "errors": [],
            "warnings": [],
        }

        # Mapping of possible column names to our internal field names
        self.COLUMN_MAPPING = {
            # contract number / id
            "contract_number": ["contract_number", "contract_id", "tender_id", "bid_number", "ref_no"],
            "title": ["title", "description", "contract_title", "project_name"],
            "specification": ["specification", "spec", "scope_of_work", "details"],
            # dates
            "award_date": ["award_date", "date_of_award", "signing_date", "contract_date"],
            "category": ["category", "cat", "type"],
            "location": ["location", "place", "city", "region"],
            "procurement_method": ["procurement_method", "method", "procurement_type"],
            "contract_start_date": ["contract_start_date", "start_date", "effective_date"],
            "contract_end_date": ["contract_end_date", "end_date", "expiry_date"],
            "tender_start": ["tender_start", "tender_open_date", "open_date", "start_date"],
            "tender_end": ["tender_end", "tender_close_date", "close_date", "end_date"],
            # values
            "estimate_value": ["estimate_value", "estimated_value", "govt_estimate", "sanctioned_estimate"],
            "award_value": ["award_value", "awarded_value", "contract_value", "tender_value", "winning_bid"],
            # department and vendor
            "department_name": ["department_name", "department", "dept_name", "ministry"],
            "vendor_name": ["vendor_name", "vendor", "supplier", "supplier_name", "contractor"],
            # bids
            "bidder_count": ["bidder_count", "number_of_bidders", "bids_received", "no_of_bidders"],
            # extensions
            "extension_count": ["extension_count", "no_of_extensions"],
            "extension_days": ["extension_days", "extension_period", "days_extended"],
        }

        # Reverse mapping for quick lookup
        self.REVERSE_MAPPING = {}
        for internal, possibles in self.COLUMN_MAPPING.items():
            for p in possibles:
                self.REVERSE_MAPPING[p.lower()] = internal

    def _reset_stats(self):
        self.stats = {
            "total": 0,
            "imported": 0,
            "rejected": 0,
            "duplicates": 0,
            "errors": [],
            "warnings": [],
        }

    def normalize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to lowercase and strip whitespace."""
        df.columns = [str(col).strip().lower() for col in df.columns]
        return df

    def map_column(self, df_column: str) -> Optional[str]:
        """Map a dataframe column to our internal field name."""
        return self.REVERSE_MAPPING.get(df_column)

    def validate_and_parse_row(self, row: pd.Series) -> Tuple[Dict[str, Any], List[str]]:
        """
        Validate and parse a single row of data.
        Returns a dictionary of parsed data and a list of error messages.
        """
        errors = []
        parsed = {}

        # Map columns
        mapped_data = {}
        for col in row.index:
            internal_field = self.map_column(col)
            if internal_field and pd.notna(row[col]):
                mapped_data[internal_field] = row[col]

        # Required fields
        required_fields = [
            "contract_number", "title", "department_name", "vendor_name",
            "estimate_value", "award_value", "award_date", "tender_start", "tender_end"
        ]

        for field in required_fields:
            if field not in mapped_data or pd.isna(mapped_data[field]):
                errors.append(f"Missing required field: {field}")

        # If there are errors, we return early
        if errors:
            return {}, errors

        # Parse contract_number
        try:
            parsed["contract_number"] = str(mapped_data["contract_number"]).strip()
            if not parsed["contract_number"]:
                errors.append("contract_number cannot be empty")
        except Exception as e:
            errors.append(f"Invalid contract_number: {e}")

        # Parse title
        try:
            parsed["title"] = str(mapped_data["title"]).strip()
            if not parsed["title"]:
                errors.append("title cannot be empty")
        except Exception as e:
            errors.append(f"Invalid title: {e}")

        # Parse specification (optional)
        try:
            spec = mapped_data.get("specification")
            parsed["specification"] = str(spec).strip() if spec is not None and not pd.isna(spec) else ""
        except Exception as e:
            errors.append(f"Invalid specification: {e}")

        # Parse dates
        date_fields = ["award_date", "contract_start_date", "contract_end_date", "tender_start", "tender_end"]
        for field in date_fields:
            try:
                value = mapped_data.get(field)
                if value is None or pd.isna(value):
                    errors.append(f"Missing {field}")
                    parsed[field] = None
                else:
                    # Try to parse as datetime
                    if isinstance(value, str):
                        parsed[field] = pd.to_datetime(value).to_pydatetime()
                    elif isinstance(value, datetime):
                        parsed[field] = value
                    elif isinstance(value, date):
                        # If it's a date, convert to datetime at midnight
                        parsed[field] = datetime.combine(value, datetime.min.time())
                    else:
                        errors.append(f"Invalid type for {field}: {type(value)}")
                        parsed[field] = None
            except Exception as e:
                errors.append(f"Could not parse {field}: {e}")
                parsed[field] = None

        # Parse optional string fields
        string_fields = ["category", "location", "procurement_method"]
        for field in string_fields:
            try:
                value = mapped_data.get(field)
                if value is None or pd.isna(value):
                    parsed[field] = None
                else:
                    parsed[field] = str(value).strip()
            except Exception as e:
                errors.append(f"Could not parse {field}: {e}")
                parsed[field] = None

        # Parse numeric values
        numeric_fields = ["estimate_value", "award_value"]
        for field in numeric_fields:
            try:
                value = mapped_data.get(field)
                if value is None or pd.isna(value):
                    errors.append(f"Missing {field}")
                    parsed[field] = None
                else:
                    # Convert to Decimal
                    if isinstance(value, str):
                        # Remove any commas, currency symbols
                        value = value.replace(",", "").replace("₹", "").replace("$", "").strip()
                    parsed[field] = Decimal(str(value))
                    if parsed[field] < 0:
                        errors.append(f"{field} cannot be negative")
            except Exception as e:
                errors.append(f"Could not parse {field} as number: {e}")
                parsed[field] = None

        # Parse department and vendor names
        try:
            dept_name = str(mapped_data["department_name"]).strip()
            if not dept_name:
                errors.append("department_name cannot be empty")
            parsed["department_name"] = dept_name
        except Exception as e:
            errors.append(f"Invalid department_name: {e}")

        try:
            vendor_name = str(mapped_data["vendor_name"]).strip()
            if not vendor_name:
                errors.append("vendor_name cannot be empty")
            parsed["vendor_name"] = vendor_name
        except Exception as e:
            errors.append(f"Invalid vendor_name: {e}")

        # Parse bidder_count (optional)
        try:
            bidder_count = mapped_data.get("bidder_count")
            if bidder_count is not None and not pd.isna(bidder_count):
                parsed["bidder_count"] = int(bidder_count)
                if parsed["bidder_count"] < 1:
                    errors.append("bidder_count must be at least 1")
            else:
                parsed["bidder_count"] = 1  # Default to at least the winning bidder
        except Exception as e:
            errors.append(f"Could not parse bidder_count: {e}")
            parsed["bidder_count"] = 1

        # Parse extensions (optional)
        try:
            extension_count = mapped_data.get("extension_count")
            extension_days = mapped_data.get("extension_days")
            if extension_count is not None and not pd.isna(extension_count):
                parsed["extension_count"] = int(extension_count)
                if parsed["extension_count"] < 0:
                    errors.append("extension_count cannot be negative")
            else:
                parsed["extension_count"] = 0

            if extension_days is not None and not pd.isna(extension_days):
                # If it's a single number, we'll use it for all extensions (up to extension_count)
                # If it's a list, we'll use the list
                if isinstance(extension_days, str):
                    # Try to parse as JSON list
                    try:
                        extension_days = json.loads(extension_days)
                    except json.JSONDecodeError:
                        # If not JSON, treat as a single number
                        extension_days = [float(extension_days)]
                if not isinstance(extension_days, list):
                    extension_days = [extension_days]

                # Convert each to int
                parsed["extension_days_list"] = [int(float(d)) for d in extension_days]
                # If we have more days than count, truncate; if less, repeat the last?
                # We'll use the list as is and set extension_count to the length of the list
                # But we also have the extension_count field, so we'll use the minimum?
                # We'll decide: use the list of days, and set extension_count to len(list)
                # However, we also have the extension_count field from the data, so we'll use that to control how many to create.
                # For simplicity, we'll create extensions for each day in the list up to extension_count.
                # If extension_count is greater than the list, we'll repeat the last day.
                # If extension_count is less, we'll take the first extension_count days.
            else:
                parsed["extension_days_list"] = []
        except Exception as e:
            errors.append(f"Could not parse extension_days: {e}")
            parsed["extension_days_list"] = []

        return parsed, errors

    def get_or_create_department(self, name: str) -> Department:
        """Get existing department or create a new one."""
        dept = self.db.query(Department).filter(Department.name == name).first()
        if not dept:
            dept = Department(name=name)
            self.db.add(dept)
            self.db.flush()  # To get the ID
        return dept

    def get_or_create_vendor(self, name: str, product_description: str = "") -> Vendor:
        """Get existing vendor or create a new one."""
        vendor = self.db.query(Vendor).filter(Vendor.name == name).first()
        if not vendor:
            vendor = Vendor(name=name, product_description=product_description)
            self.db.add(vendor)
            self.db.flush()
        return vendor

    def create_bids(self, contract: Contract, bidder_count: int, vendor_name: str, award_value: Decimal):
        """Create bid records for the contract."""
        # First bid is the winning vendor
        winning_bid = Bid(
            contract_id=contract.id,
            vendor_name=vendor_name,
            bid_value=award_value  # Assume the winning bid is the award value
        )
        self.db.add(winning_bid)

        # Additional bidders (if any) with unknown bid values
        for i in range(1, bidder_count):
            bid = Bid(
                contract_id=contract.id,
                vendor_name=f"Unknown Bidder {i+1}",
                bid_value=None
            )
            self.db.add(bid)

    def create_extensions(self, contract: Contract, extension_days_list: List[int]):
        """Create contract extension records."""
        for days in extension_days_list:
            if days > 0:  # Only create if there are extension days
                ext = ContractExtension(
                    contract_id=contract.id,
                    extension_days=days,
                    reason="Imported from data"  # Default reason
                )
                self.db.add(ext)

    def process_row(self, row: pd.Series, row_num: int):
        """Process a single row of data using a savepoint to allow rolling back on error."""
        self.stats["total"] += 1

        # Create a savepoint for this row
        savepoint = self.db.begin_nested()
        try:
            parsed_data, errors = self.validate_and_parse_row(row)

            if errors:
                self.stats["rejected"] += 1
                self.stats["errors"].append({
                    "row": row_num,
                    "errors": errors
                })
                # Rollback to the savepoint (which will undo the validation? but we haven't added anything yet)
                savepoint.rollback()
                return

            # Check for duplicate contract_number
            existing = self.db.query(Contract).filter(
                Contract.contract_number == parsed_data["contract_number"]
            ).first()
            if existing:
                self.stats["duplicates"] += 1
                self.stats["warnings"].append({
                    "row": row_num,
                    "message": f"Duplicate contract_number: {parsed_data['contract_number']}"
                })
                savepoint.rollback()
                return

            # Get or create department and vendor
            department = self.get_or_create_department(parsed_data["department_name"])
            vendor = self.get_or_create_vendor(parsed_data["vendor_name"])

            # Create contract
            contract = Contract(
                contract_number=parsed_data["contract_number"],
                title=parsed_data["title"],
                specification=parsed_data["specification"],
                award_date=parsed_data["award_date"].date() if parsed_data["award_date"] else None,
                category=parsed_data.get("category"),
                location=parsed_data.get("location"),
                procurement_method=parsed_data.get("procurement_method"),
                contract_start_date=parsed_data["contract_start_date"].date() if parsed_data["contract_start_date"] else None,
                contract_end_date=parsed_data["contract_end_date"].date() if parsed_data["contract_end_date"] else None,
                department_id=department.id,
                vendor_id=vendor.id,
                estimate_value=parsed_data["estimate_value"],
                award_value=parsed_data["award_value"],
                tender_start=parsed_data["tender_start"],
                tender_end=parsed_data["tender_end"]
            )
            self.db.add(contract)
            self.db.flush()  # Get the contract ID

            # Create bids
            self.create_bids(
                contract,
                parsed_data.get("bidder_count", 1),
                parsed_data["vendor_name"],
                parsed_data["award_value"]
            )

            # Create extensions
            self.create_extensions(
                contract,
                parsed_data.get("extension_days_list", [])
            )

            # Now compute risk assessment for this contract
            # Note: we need to flush the session so that the contract is visible in queries
            self.db.flush()
            self.risk_engine.analyze_contract(contract, self.db)

            self.stats["imported"] += 1

            # If we get here, we release the savepoint by doing nothing?
            # Actually, we don't need to do anything because we are still in the transaction and the changes are pending.
        except Exception as e:
            # Rollback to the savepoint to undo everything we did in this row
            savepoint.rollback()
            self.stats["rejected"] += 1
            self.stats["errors"].append({
                "row": row_num,
                "errors": [f"Unexpected error: {str(e)}"]
            })

    def ingest_file(self, file_path: str, file_type: str = "csv") -> Dict[str, Any]:
        """
        Ingest a file (CSV or JSON) and return a report.
        """
        # Reset stats
        self._reset_stats()

        try:
            if file_type.lower() == "csv":
                df = pd.read_csv(file_path)
            elif file_type.lower() == "json":
                df = pd.read_json(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            # Normalize column names
            df = self.normalize_column_names(df)

            # Process the DataFrame
            return self.ingest_dataframe(df)

        except Exception as e:
            # If there's an error reading the file, we don't want to commit anything
            self.db.rollback()
            raise e

    def ingest_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Ingest a DataFrame and return a report.
        """
        # Reset stats
        self._reset_stats()

        # Process each row
        for idx, row in df.iterrows():
            self.process_row(row, idx + 1)  # Row numbers start at 1 for reporting

        # Note: We do not commit here. The caller is responsible for committing the transaction.
        return self.stats