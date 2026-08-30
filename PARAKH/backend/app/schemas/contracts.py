from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

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
    award_date: date | None = None
    department_id: int
    department_name: str | None = None
    vendor_id: int
    vendor_name: str | None = None
    estimate_value: Decimal
    award_value: Decimal
    category: str | None = None
    location: str | None = None
    procurement_method: str | None = None
    contract_start_date: date | None = None
    contract_end_date: date | None = None
    crs: int | None = None
    risk_level: str | None = None

class ContractDetail(ContractSummary):
    specification: str
    vendor_product_description: str | None = None
    tender_start: datetime
    tender_end: datetime
    bidder_count: int
    bids: list[BidOut] = []
    extensions: list[ExtensionOut] = []
    risk: RiskOut | None = None
