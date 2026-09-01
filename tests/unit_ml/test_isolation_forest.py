from ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts, anomaly_for_contract
from unittest.mock import MagicMock
from decimal import Decimal
from datetime import datetime

class DummyContract:
    def __init__(self, id, vendor_id, award_val):
        self.id = id
        self.vendor_id = vendor_id
        self.award_value = Decimal(str(award_val))
        self.estimate_value = Decimal(str(award_val * 1.1))
        self.tender_start = datetime(2025, 1, 1)
        self.tender_end = datetime(2025, 1, 20)
        self.bids = [MagicMock(), MagicMock()]
        self.extensions = []

def test_anomaly_scores_batch():
    contracts = [
        DummyContract(1, 1, 500000),
        DummyContract(2, 2, 600000),
        DummyContract(3, 1, 550000),
        DummyContract(4, 3, 50000000), # extreme outlier
    ]
    scores = anomaly_scores_for_contracts(contracts)
    assert len(scores) == 4
    for c in contracts:
        assert id(c) in scores
        assert 0 <= scores[id(c)] <= 100

def test_anomaly_scores_empty_and_single():
    assert anomaly_scores_for_contracts([]) == {}
    single = [DummyContract(1, 1, 500000)]
    scores = anomaly_scores_for_contracts(single)
    assert scores[id(single[0])] == 0.0

def test_anomaly_for_contract_fallback():
    c = DummyContract(1, 1, 500000)
    score = anomaly_for_contract(c, [])
    assert 0 <= score <= 100
