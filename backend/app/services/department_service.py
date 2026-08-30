from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from app.models import Department, Contract
from app.core.config import settings


class DepartmentService:
    def __init__(self, db: Session):
        self.db = db

    def get_departments(self) -> List[dict]:
        """Get list of all departments with basic info."""
        departments = self.db.query(Department).all()
        return [{"id": d.id, "name": d.name} for d in departments]

    def get_department(self, department_id: int) -> Optional[dict]:
        """Get department details by ID."""
        department = self.db.query(Department).filter(Department.id == department_id).first()
        if not department:
            return None

        contracts = department.contracts
        counts: dict[str, int] = {}
        for c in contracts:
            counts[c.vendor.name] = counts.get(c.vendor.name, 0) + 1
        scores = [c.risk_assessment.crs for c in contracts if c.risk_assessment]

        return {
            "id": department.id,
            "name": department.name,
            "total_contracts": len(contracts),
            "total_value": sum(float(c.award_value) for c in contracts),
            "vendors": list(counts.keys()),
            "vendor_concentration": max(counts.values()) / len(contracts) if contracts else 0,
            "average_crs": sum(scores) / len(scores) if scores else 0,
            "high_risk_contracts": sum(s >= 70 for s in scores),
        }