from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

from backend.app.core.config import settings
from backend.ml.risk_engine.rules import evaluate_rules

def _make_mock_contract(bid_count=1, duration_days=5, award=4800000, estimate=3500000, vendor_id=1, ext_count=0):
    contract = MagicMock()
    contract.vendor_id = vendor_id
    contract.estimate_value = Decimal(str(estimate))
    contract.award_value = Decimal(str(award))
    start = datetime(2025, 1, 1)
    contract.tender_start = start
    contract.tender_end = start + timedelta(days=duration_days)
    
    bids = [MagicMock() for _ in range(bid_count)]
    contract.bids = bids
    
    extensions = []
    for _ in range(ext_count):
        ext = MagicMock()
        ext.extension_days = 120
        extensions.append(ext)
    contract.extensions = extensions
    return contract

def test_rf1_single_bid():
    contract = _make_mock_contract(bid_count=1)
    flags = evaluate_rules(contract, [], settings)
    rf1 = next(f for f in flags if f["flag_id"] == "RF-1")
    assert rf1["detected"] is True

def test_rf1_multiple_bids_not_flagged():
    contract = _make_mock_contract(bid_count=3)
    flags = evaluate_rules(contract, [], settings)
    rf1 = next(f for f in flags if f["flag_id"] == "RF-1")
    assert rf1["detected"] is False

def test_rf2_vendor_lockin():
    # Peer contracts where vendor_id=1 has 8 out of 10 wins (80% > 60% threshold)
    contract = _make_mock_contract(vendor_id=1)
    peers = [_make_mock_contract(vendor_id=1) for _ in range(8)] + [_make_mock_contract(vendor_id=2) for _ in range(2)]
    flags = evaluate_rules(contract, peers, settings)
    rf2 = next(f for f in flags if f["flag_id"] == "RF-2")
    assert rf2["detected"] is True

def test_rf3_threshold_pattern():
    # settings.approval_threshold is 5,000,000 -> 90% is 4,500,000
    contract = _make_mock_contract(award=4750000)
    flags = evaluate_rules(contract, [], settings)
    rf3 = next(f for f in flags if f["flag_id"] == "RF-3")
    assert rf3["detected"] is True

def test_rf4_compressed_tender_window():
    # settings.tender_duration_threshold_days is 7
    contract = _make_mock_contract(duration_days=4)
    flags = evaluate_rules(contract, [], settings)
    rf4 = next(f for f in flags if f["flag_id"] == "RF-4")
    assert rf4["detected"] is True

def test_rf5_price_deviation():
    # settings.price_deviation_threshold is 0.30 -> estimate 100k, award 140k is +40%
    contract = _make_mock_contract(estimate=100000, award=140000)
    flags = evaluate_rules(contract, [], settings)
    rf5 = next(f for f in flags if f["flag_id"] == "RF-5")
    assert rf5["detected"] is True

def test_rf6_repeat_winner():
    # Vendor has 4 wins in department (>= 3 threshold)
    contract = _make_mock_contract(vendor_id=1)
    peers = [_make_mock_contract(vendor_id=1) for _ in range(4)]
    flags = evaluate_rules(contract, peers, settings)
    rf6 = next(f for f in flags if f["flag_id"] == "RF-6")
    assert rf6["detected"] is True

def test_rf8_unusual_extensions():
    contract = _make_mock_contract(ext_count=2)
    flags = evaluate_rules(contract, [], settings)
    rf8 = next(f for f in flags if f["flag_id"] == "RF-8")
    assert rf8["detected"] is True
