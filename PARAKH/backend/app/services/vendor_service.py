from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Vendor, Contract
from app.core.config import settings


class VendorService:
    def __init__(self, db: Session):
        self.db = db

    def get_vendors(self) -> List[dict]:
        """Get list of all vendors with basic info."""
        vendors = self.db.query(Vendor).all()
        return [{"id": v.id, "name": v.name} for v in vendors]

    def get_vendor(self, vendor_id: int) -> Optional[dict]:
        """Get vendor details by ID."""
        vendor = self.db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            return None

        contracts = vendor.contracts
        scores = [c.risk_assessment.crs for c in contracts if c.risk_assessment]

        return {
            "id": vendor.id,
            "name": vendor.name,
            "total_contracts": len(contracts),
            "total_value": sum(float(c.award_value) for c in contracts),
            "departments": sorted({c.department.name for c in contracts}),
            "average_crs": sum(scores) / len(scores) if scores else 0,
            "high_risk_contracts": sum(s >= 70 for s in scores),
        }