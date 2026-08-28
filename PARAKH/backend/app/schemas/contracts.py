from datetime import date, datetime
from decimal import Decimal
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

class ContractDetail(ContractSummary):
    specification: str
    vendor_product_description: str | None = None
    tender_start: datetime
    tender_end: datetime
    bidder_count: int
    bids: list[BidOut] = []
    extensions: list[ExtensionOut] = []
    risk: RiskOut | None = None
