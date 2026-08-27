from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Contract

router = APIRouter()

@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    contracts = db.scalars(select(Contract)).all()
    scores = [c.risk_assessment.crs for c in contracts if c.risk_assessment]
    return {
        "total_contracts": len(contracts),
        "total_value": sum(float(c.award_value) for c in contracts),
        "high_risk_contracts": sum(s >= 70 for s in scores),
        "medium_risk_contracts": sum(40 <= s < 70 for s in scores),
        "low_risk_contracts": sum(s < 40 for s in scores),
        "average_crs": sum(scores)/len(scores) if scores else 0,
    }
