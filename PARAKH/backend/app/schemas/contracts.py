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

class ContractSummary(BaseModel):
    id: int
    contract_number: str
    title: str
    contract_date: date
    department_id: int
    vendor_id: int
    estimate_value: Decimal
    award_value: Decimal

class ContractDetail(ContractSummary):
    specification: str
    tender_start: datetime
    tender_end: datetime
    bidder_count: int
    risk: RiskOut | None = None
