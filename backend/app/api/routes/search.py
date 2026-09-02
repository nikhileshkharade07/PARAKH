from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, Any, List
from app.database.session import get_db
from app.models import Contract, Vendor, Department, InvestigationCase, RiskAssessment

router = APIRouter()

@router.get("")
def search(
    q: str = Query("", min_length=1, description="Search query term"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Omni-search endpoint across contracts, vendors, departments, and cases."""
    term = f"%{q.strip()}%"
    
    # 1. Search Contracts
    contract_matches = (
        db.query(Contract)
        .filter(
            or_(
                Contract.contract_number.ilike(term),
                Contract.title.ilike(term),
                Contract.specification.ilike(term)
            )
        )
        .limit(limit)
        .all()
    )
    
    contracts_data = []
    for c in contract_matches:
        crs_val = 45
        if hasattr(c, "risk_assessment") and c.risk_assessment and c.risk_assessment.crs is not None:
            crs_val = c.risk_assessment.crs
        elif hasattr(c, "risk_score") and c.risk_score:
            crs_val = c.risk_score * 100

        contracts_data.append({
            "id": c.id,
            "contract_number": c.contract_number,
            "title": c.title,
            "award_value": float(c.award_value or 0),
            "crs": round(crs_val),
            "vendor_name": c.vendor.name if c.vendor else "Unknown Vendor",
            "department_name": c.department.name if c.department else "Unknown Department",
            "url": f"/investigation?contractId={c.id}"
        })
        
    # 2. Search Vendors
    vendor_matches = (
        db.query(Vendor)
        .filter(
            or_(
                Vendor.name.ilike(term),
                Vendor.product_description.ilike(term)
            )
        )
        .limit(limit)
        .all()
    )
    
    vendors_data = []
    for v in vendor_matches:
        vendors_data.append({
            "id": v.id,
            "name": v.name,
            "contract_count": len(v.contracts) if hasattr(v, "contracts") and v.contracts else 0,
            "url": f"/vendors/{v.id}"
        })

    # 3. Search Departments
    dept_matches = (
        db.query(Department)
        .filter(Department.name.ilike(term))
        .limit(limit)
        .all()
    )
    
    departments_data = []
    for d in dept_matches:
        departments_data.append({
            "id": d.id,
            "name": d.name,
            "contract_count": len(d.contracts) if hasattr(d, "contracts") and d.contracts else 0,
            "url": f"/departments/{d.id}"
        })

    # 4. Search Cases
    case_matches = (
        db.query(InvestigationCase)
        .filter(
            or_(
                InvestigationCase.case_number.ilike(term),
                InvestigationCase.title.ilike(term),
                InvestigationCase.notes_summary.ilike(term)
            )
        )
        .limit(limit)
        .all()
    )
    
    cases_data = []
    for cs in case_matches:
        cases_data.append({
            "id": cs.id,
            "case_number": cs.case_number,
            "title": cs.title,
            "priority": cs.priority,
            "status": cs.status,
            "contract_id": cs.contract_id,
            "url": f"/investigation?contractId={cs.contract_id}"
        })

    total_count = len(contracts_data) + len(vendors_data) + len(departments_data) + len(cases_data)

    return {
        "query": q,
        "total": total_count,
        "results": {
            "contracts": contracts_data,
            "vendors": vendors_data,
            "departments": departments_data,
            "cases": cases_data
        }
    }
