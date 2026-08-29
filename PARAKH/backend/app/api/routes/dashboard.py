from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Contract, RiskAssessment, Department, Vendor, InvestigationCase

router = APIRouter()

@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    """Fast aggregated dashboard statistics computed directly in SQL."""
    total_contracts = db.query(func.count(Contract.id)).scalar() or 0
    total_val = db.query(func.sum(Contract.award_value)).scalar() or 0
    
    high_risk = db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.crs >= 70).scalar() or 0
    medium_risk = db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.crs >= 40, RiskAssessment.crs < 70).scalar() or 0
    low_risk = db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.crs < 40).scalar() or 0
    avg_crs = db.query(func.avg(RiskAssessment.crs)).scalar() or 0

    active_cases = db.query(func.count(InvestigationCase.id)).filter(InvestigationCase.status.notin_(["CLOSED", "CLEARED"])).scalar() or 0
    total_vendors = db.query(func.count(Vendor.id)).scalar() or 0
    total_departments = db.query(func.count(Department.id)).scalar() or 0

    # Department breakdown
    dept_rows = (
        db.query(
            Department.name,
            func.count(Contract.id).label("contract_count"),
            func.sum(Contract.award_value).label("total_value"),
            func.avg(RiskAssessment.crs).label("avg_crs")
        )
        .join(Contract, Contract.department_id == Department.id)
        .outerjoin(RiskAssessment, RiskAssessment.contract_id == Contract.id)
        .group_by(Department.id, Department.name)
        .order_by(func.avg(RiskAssessment.crs).desc())
        .limit(8)
        .all()
    )

    dept_stats = [
        {
            "name": r.name,
            "contract_count": r.contract_count,
            "total_value": float(r.total_value or 0),
            "avg_crs": round(float(r.avg_crs or 0), 1)
        } for r in dept_rows
    ]

    return {
        "total_contracts": total_contracts,
        "total_value": float(total_val),
        "high_risk_contracts": high_risk,
        "medium_risk_contracts": medium_risk,
        "low_risk_contracts": low_risk,
        "average_crs": round(float(avg_crs), 1),
        "active_cases": active_cases,
        "total_vendors": total_vendors,
        "total_departments": total_departments,
        "departments": dept_stats
    }
