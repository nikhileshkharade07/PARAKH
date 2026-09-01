from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.models import Contract, Bid, ContractExtension, Department, Vendor
from ml.risk_engine.rules import evaluate_rules
from ml.risk_engine.engine import RiskEngine

client = TestClient(app)

class MockContract:
    def __init__(
        self,
        id=1,
        vendor_id=1,
        department_id=1,
        estimate_value=5000000,
        award_value=5000000,
        tender_start=datetime(2025, 1, 1),
        tender_end=datetime(2025, 1, 20),
        bids_count=3,
        extensions_days=None,
        specification="Standard supply of computers",
        vendor_desc="Standard office supplies"
    ):
        self.id = id
        self.contract_number = f"TND-{id:04d}"
        self.title = f"Test Contract {id}"
        self.vendor_id = vendor_id
        self.department_id = department_id
        self.estimate_value = Decimal(str(estimate_value))
        self.award_value = Decimal(str(award_value))
        self.tender_start = tender_start
        self.tender_end = tender_end
        self.specification = specification
        
        self.department = MagicMock()
        self.department.id = department_id
        self.department.contracts = []
        
        self.vendor = MagicMock()
        self.vendor.id = vendor_id
        self.vendor.name = f"Vendor {vendor_id}"
        self.vendor.product_description = vendor_desc
        
        self.bids = [MagicMock(vendor_name=f"Bidder {i}") for i in range(bids_count)]
        self.extensions = [MagicMock(extension_days=d, reason="Delay") for d in (extensions_days or [])]
        self.risk_assessment = None
        self.risk_flags = []

def test_rf1_single_bid():
    contract = MockContract(bids_count=1)
    flags = evaluate_rules(contract, [contract], settings)
    rf1 = next(f for f in flags if f["flag_id"] == "RF-1")
    assert rf1["detected"] is True
    assert rf1["severity"] == "high"
    assert rf1["score"] == 20

def test_rf2_vendor_lockin():
    peers = [MockContract(id=i, vendor_id=1, department_id=1) for i in range(1, 6)]
    target = peers[0]
    flags = evaluate_rules(target, peers, settings)
    rf2 = next(f for f in flags if f["flag_id"] == "RF-2")
    assert rf2["detected"] is True

def test_rf3_threshold_proximity():
    limit = settings.approval_threshold
    contract = MockContract(award_value=limit * 0.95, estimate_value=limit * 0.95)
    flags = evaluate_rules(contract, [contract], settings)
    rf3 = next(f for f in flags if f["flag_id"] == "RF-3")
    assert rf3["detected"] is True

def test_rf4_compressed_tender_window():
    start = datetime(2025, 1, 1)
    end = start + timedelta(days=3) # 3 days < 7 days threshold
    contract = MockContract(tender_start=start, tender_end=end)
    flags = evaluate_rules(contract, [contract], settings)
    rf4 = next(f for f in flags if f["flag_id"] == "RF-4")
    assert rf4["detected"] is True

def test_rf5_bid_estimate_deviation():
    contract = MockContract(estimate_value=1000000, award_value=1500000) # 50% > 30% threshold
    flags = evaluate_rules(contract, [contract], settings)
    rf5 = next(f for f in flags if f["flag_id"] == "RF-5")
    assert rf5["detected"] is True

def test_rf6_repeat_winner():
    peers = [MockContract(id=i, vendor_id=1) for i in range(1, 5)]
    target = peers[0]
    flags = evaluate_rules(target, peers, settings)
    rf6 = next(f for f in flags if f["flag_id"] == "RF-6")
    assert rf6["detected"] is True

def test_rf8_unusual_extensions():
    contract = MockContract(extensions_days=[100, 120])
    flags = evaluate_rules(contract, [contract], settings)
    rf8 = next(f for f in flags if f["flag_id"] == "RF-8")
    assert rf8["detected"] is True

def test_clean_contract_no_flags():
    clean_contract = MockContract(
        bids_count=4,
        tender_start=datetime(2025, 1, 1),
        tender_end=datetime(2025, 1, 25),
        estimate_value=1000000,
        award_value=980000,
        extensions_days=[]
    )
    peers = [
        clean_contract,
        MockContract(id=2, vendor_id=2),
        MockContract(id=3, vendor_id=3),
        MockContract(id=4, vendor_id=4),
    ]
    flags = evaluate_rules(clean_contract, peers, settings)
    detected = [f for f in flags if f["detected"]]
    assert len(detected) == 0

def test_risk_analyze_endpoint():
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    analyze_res = client.post(f"/api/risk/analyze?contract_id={contract_id}")
    assert analyze_res.status_code == 200
    res_data = analyze_res.json()
    assert "crs" in res_data
    assert "rule_score" in res_data
    assert "anomaly_score" in res_data
    assert 0 <= res_data["crs"] <= 100

    # 404 on nonexistent contract
    err_res = client.post("/api/risk/analyze?contract_id=999999")
    assert err_res.status_code == 404
