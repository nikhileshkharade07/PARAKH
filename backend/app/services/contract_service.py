from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Contract, Department, Vendor
from app.schemas.contracts import ContractSummary, ContractDetail, RiskOut, RiskFlagOut
from ml.risk_engine.engine import RiskEngine
from app.core.config import settings


class ContractService:
    def __init__(self, db: Session):
        self.db = db
        self.risk_engine = RiskEngine()

    def get_contracts(
        self,
        department_id: Optional[int] = None,
        vendor_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ContractSummary]:
        """Get list of contracts with optional filtering."""
        query = self.db.query(Contract)

        if department_id:
            query = query.filter(Contract.department_id == department_id)
        if vendor_id:
            query = query.filter(Contract.vendor_id == vendor_id)

        contracts = query.offset(offset).limit(limit).all()

        return [
            ContractSummary(
                id=c.id,
                contract_number=c.contract_number,
                title=c.title,
                contract_date=c.contract_date,
                department_id=c.department_id,
                vendor_id=c.vendor_id,
                estimate_value=c.estimate_value,
                award_value=c.award_value,
                risk_level=self._get_risk_level(c)
            )
            for c in contracts
        ]

    def get_contract(self, contract_id: int) -> Optional[ContractDetail]:
        """Get a single contract by ID with detailed information."""
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return None

        risk = None
        if contract.risk_assessment:
            risk = RiskOut(
                crs=contract.risk_assessment.crs,
                risk_level=self._get_risk_level(contract),
                rule_score=contract.risk_assessment.rule_score,
                anomaly_score=contract.risk_assessment.anomaly_score,
                flags=[
                    RiskFlagOut(
                        flag_id=f.flag_id,
                        detected=f.detected,
                        severity=f.severity,
                        score=f.score,
                        explanation=f.explanation
                    ) for f in contract.risk_flags if f.detected
                ]
            )

        return ContractDetail(
            id=contract.id,
            contract_number=contract.contract_number,
            title=contract.title,
            contract_date=contract.contract_date,
            department_id=contract.department_id,
            vendor_id=contract.vendor_id,
            estimate_value=contract.estimate_value,
            award_value=contract.award_value,
            specification=contract.specification,
            tender_start=contract.tender_start,
            tender_end=contract.tender_end,
            bidder_count=len(contract.bids),
            risk=risk
        )

    def analyze_contract_risk(self, contract_id: int) -> dict:
        """Perform risk analysis on a contract and store results."""
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise ValueError(f"Contract with ID {contract_id} not found")

        return self.risk_engine.analyze_contract(contract, self.db)

    def _get_risk_level(self, contract: Contract) -> str:
        """Get risk level based on CRS score."""
        if not contract.risk_assessment:
            return "unknown"

        crs = contract.risk_assessment.crs
        if crs >= settings.risk_threshold:
            return "high"
        elif crs >= 40:
            return "medium"
        else:
            return "low"