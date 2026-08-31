from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class RiskFlagOut(BaseModel):
    flag_id: str
    detected: bool
    severity: str
    score: float
    explanation: str

class RiskOut(BaseModel):
    crs: int
    risk_level: str
    rule_score: float
    anomaly_score: float
    flags: list[RiskFlagOut]

class RuleEvidenceOut(BaseModel):
    rule_id: str
    rule_name: str
    triggered: bool
    severity: str
    contribution: Optional[float] = None
    explanation: str
    evidence: Optional[Dict[str, Any]] = None

class RiskEvidenceOut(BaseModel):
    contract_id: int
    risk_score: int
    risk_level: str
    rule_score: float
    anomaly_score: float
    triggered_rules: List[RuleEvidenceOut]
    generated_at: datetime

class PeerComparisonOut(BaseModel):
    department_total_contracts: int
    peer_median_award_value: float
    peer_mean_award_value: float
    value_deviation_percent: float
    peer_median_tender_days: float
    duration_deviation_percent: float
    peer_average_bidders: float
    is_value_outlier: bool
    is_duration_outlier: bool
    explanation: str

class SimilarTenderOut(BaseModel):
    contract_id: int
    contract_number: str
    title: str
    department_name: str
    vendor_name: str
    award_value: float
    similarity_score: float
    matched_terms: List[str] = []

class BidOut(BaseModel):
    id: int
    vendor_name: str
    bid_value: Decimal | None = None

class ExtensionOut(BaseModel):
    id: int
    extension_days: int
    reason: str

class ContractSummary(BaseModel):
    id: int
    contract_number: str
    title: str
    contract_date: date
    department_id: int
    department_name: str | None = None
    vendor_id: int
    vendor_name: str | None = None
    estimate_value: Decimal
    award_value: Decimal
    crs: int | None = None
    risk_level: str | None = None
    model_config = ConfigDict(from_attributes=True)

class ContractDetail(ContractSummary):
    specification: str
    vendor_product_description: str | None = None
    tender_start: datetime
    tender_end: datetime
    bidder_count: int
    bids: list[BidOut] = []
    extensions: list[ExtensionOut] = []
    risk: RiskOut | None = None
    peer_comparison: Optional[PeerComparisonOut] = None
