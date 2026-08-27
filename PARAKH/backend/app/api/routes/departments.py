from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Department

router = APIRouter()

@router.get("")
def list_departments(db: Session = Depends(get_db)):
    return [{"id":d.id,"name":d.name} for d in db.scalars(select(Department)).all()]

@router.get("/{department_id}")
def department(department_id: int, db: Session = Depends(get_db)):
    d = db.get(Department, department_id)
    if not d: raise HTTPException(404, "Department not found")
    counts = {}
    for c in d.contracts:
        counts[c.vendor.name] = counts.get(c.vendor.name, 0) + 1
    scores = [c.risk_assessment.crs for c in d.contracts if c.risk_assessment]
    return {
        "id":d.id, "name":d.name, "total_contracts":len(d.contracts),
        "total_value":sum(float(c.award_value) for c in d.contracts),
        "vendors":list(counts),
        "vendor_concentration":max(counts.values())/len(d.contracts) if d.contracts else 0,
        "average_crs":sum(scores)/len(scores) if scores else 0,
        "high_risk_contracts":sum(s>=70 for s in scores),
    }
