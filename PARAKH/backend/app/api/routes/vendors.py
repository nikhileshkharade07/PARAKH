from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Vendor

router = APIRouter()

@router.get("")
def list_vendors(db: Session = Depends(get_db)):
    return [{"id":v.id,"name":v.name} for v in db.scalars(select(Vendor)).all()]

@router.get("/{vendor_id}")
def vendor(vendor_id: int, db: Session = Depends(get_db)):
    v = db.get(Vendor, vendor_id)
    if not v: raise HTTPException(404, "Vendor not found")
    scores = [c.risk_assessment.crs for c in v.contracts if c.risk_assessment]
    return {
        "id":v.id, "name":v.name, "total_contracts":len(v.contracts),
        "total_value":sum(float(c.award_value) for c in v.contracts),
        "departments":sorted({c.department.name for c in v.contracts}),
        "average_crs":sum(scores)/len(scores) if scores else 0,
        "high_risk_contracts":sum(s>=70 for s in scores),
    }
