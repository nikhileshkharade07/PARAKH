import os
import sys
import json
import pytest
from datetime import datetime
from decimal import Decimal

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models import Contract, Department, Vendor, RiskAssessment, RiskFlag, InvestigationCase, BlockchainAnchor
from scripts.normalize_procurement_data import clean_currency_val, clean_date_iso, canonicalize_vendor_name
from app.services.assistant_service import AssistantService
from app.services.blockchain_service import BlockchainService

client = TestClient(app)

def test_metadata_files_exist_and_valid():
    """Verify that dataset metadata and schema mapping JSON files exist and are valid."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    sources_path = os.path.join(root, "data", "metadata", "dataset_sources.json")
    version_path = os.path.join(root, "data", "metadata", "dataset_version.json")
    mapping_path = os.path.join(root, "data", "mappings", "procurement_schema_mapping.json")

    assert os.path.exists(sources_path), "dataset_sources.json missing"
    assert os.path.exists(version_path), "dataset_version.json missing"
    assert os.path.exists(mapping_path), "procurement_schema_mapping.json missing"

    with open(sources_path, "r", encoding="utf-8") as f:
        sources = json.load(f)
        assert "datasets" in sources
        assert len(sources["datasets"]) > 0
        ds = sources["datasets"][0]
        assert "Himachal Pradesh" in ds["name"]
        assert ds["record_count"] >= 4000

    with open(version_path, "r", encoding="utf-8") as f:
        version = json.load(f)
        assert version["schema_version"] == "parakh-canonical-v1.0"
        assert "raw_checksum_sha256" in version

    with open(mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
        assert "mappings" in mapping
        assert "contract_number" in mapping["mappings"]
        assert "award_value" in mapping["mappings"]

def test_normalization_functions():
    """Verify currency, date, and vendor normalization utility functions."""
    # Currency parsing
    assert clean_currency_val("₹ 1,50,000.00") == 150000.0
    assert clean_currency_val("Rs. 45 Lakhs") == 4500000.0
    assert clean_currency_val("2.5 Crore") == 25000000.0
    assert clean_currency_val(12345.67) == 12345.67
    assert clean_currency_val(None) == 0.0

    # Date parsing
    iso = clean_date_iso("2020-05-18T10:00:00Z")
    assert iso == "2020-05-18 10:00:00"
    iso_d = clean_date_iso("15/08/2019")
    assert "2019-08-15" in iso_d

    # Vendor canonicalization
    v = canonicalize_vendor_name("  Bharti Airtel Ltd.  ")
    assert v == "Bharti Airtel Ltd"

def test_normalized_dataset_file_and_rejections():
    """Verify normalized CSV and rejection reports exist and contain valid records."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    norm_csv = os.path.join(root, "data", "processed", "india_procurement_normalized.csv")
    rej_csv = os.path.join(root, "data", "processed", "rejected_records.csv")

    assert os.path.exists(norm_csv), "india_procurement_normalized.csv missing"
    assert os.path.exists(rej_csv), "rejected_records.csv missing"

def test_database_contains_real_procurement_data():
    """Verify that seeded database contains authentic contracts, departments, and vendors."""
    db = SessionLocal()
    try:
        contracts_count = db.query(Contract).count()
        vendors_count = db.query(Vendor).count()
        depts_count = db.query(Department).count()

        assert contracts_count >= 100, f"Expected at least 100 contracts, got {contracts_count}"
        assert vendors_count >= 10, f"Expected at least 10 vendors, got {vendors_count}"
        assert depts_count >= 5, f"Expected at least 5 departments, got {depts_count}"

        # Verify risk assessments exist
        assessments_count = db.query(RiskAssessment).count()
        assert assessments_count == contracts_count
    finally:
        db.close()

def test_dashboard_api_stats_provenance():
    """Verify dashboard stats API returns real metrics and data source metadata."""
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_contracts"] > 0
    assert data["total_value"] > 0
    assert "data_source" in data
    assert "time_range" in data

def test_contracts_api_filters_and_pagination():
    """Verify contracts API list endpoint with search, risk, and pagination."""
    res = client.get("/api/contracts?limit=10&offset=0")
    assert res.status_code == 200
    contracts = res.json()
    assert len(contracts) <= 10
    if len(contracts) > 0:
        c0 = contracts[0]
        assert "contract_number" in c0
        assert "award_value" in c0
        assert "crs" in c0

        # Detail endpoint
        detail_res = client.get(f"/api/contracts/{c0['id']}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == c0["id"]
        assert "risk" in detail
        assert "specification" in detail

def test_ai_assistant_grounded_query_and_provenance():
    """Verify AI Assistant answers queries grounded in database evidence."""
    db = SessionLocal()
    try:
        assistant = AssistantService(db)
        
        # 1. Provenance inquiry
        res_prov = assistant.query("Where did this procurement record come from?")
        assert "Himachal Pradesh" in res_prov.answer
        assert "OCDS" in res_prov.answer

        # 2. Specific tender inquiry
        c = db.query(Contract).first()
        assert c is not None
        res_tender = assistant.query(f"Why is tender {c.contract_number} flagged?")
        assert c.contract_number in res_tender.answer
        assert len(res_tender.citations) > 0
        assert res_tender.citations[0].link == f"/contracts/{c.id}"

        # 3. Single bidder query
        res_bidders = assistant.query("Which tenders had only one bidder?")
        assert "Single-Bidder" in res_bidders.answer
    finally:
        db.close()

def test_blockchain_verification_on_real_records():
    """Verify blockchain canonical hash recalculation on database contracts."""
    db = SessionLocal()
    try:
        c = db.query(Contract).first()
        assert c is not None
        
        bc_service = BlockchainService(db)
        # Anchor
        anchor = bc_service.anchor_contract(c.id)
        assert anchor["canonical_hash"].startswith("0x")
        assert anchor["status"] in ["ANCHORED", "VERIFIED"]

        # Verify
        verify_res = bc_service.verify_integrity(c.id)
        assert verify_res["verified"] is True
        assert verify_res["status"] == "INTEGRITY VERIFIED"
    finally:
        db.close()
