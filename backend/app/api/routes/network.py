from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.session import get_db
from app.models import Contract, Vendor, Department, RiskAssessment

router = APIRouter()

@router.get("")
def network(
    high_risk_only: bool = Query(False, description="Filter to high-risk relationships only"),
    min_contracts: int = Query(1, ge=1, description="Minimum contracts for entity inclusion"),
    limit: Optional[int] = Query(300, ge=10, le=3000, description="Max entities to prevent browser freeze"),
    db: Session = Depends(get_db)
):
    """Generate vendor <-> department network topology using optimized single-pass SQL."""
    # 1. Edge aggregation: Vendor <-> Department pairs
    edge_query = (
        db.query(
            Contract.vendor_id,
            Contract.department_id,
            func.count(Contract.id).label("contract_count"),
            func.sum(Contract.award_value).label("total_value"),
            func.avg(RiskAssessment.crs).label("avg_crs")
        )
        .outerjoin(RiskAssessment, RiskAssessment.contract_id == Contract.id)
        .group_by(Contract.vendor_id, Contract.department_id)
    )

    if high_risk_only:
        edge_query = edge_query.having(func.avg(RiskAssessment.crs) >= 70)
    elif min_contracts > 1:
        edge_query = edge_query.having(func.count(Contract.id) >= min_contracts)

    if limit:
        edge_query = edge_query.order_by(func.sum(Contract.award_value).desc()).limit(limit)

    edge_rows = edge_query.all()
    
    if not edge_rows:
        return {"nodes": [], "edges": []}

    active_vendor_ids = {r[0] for r in edge_rows if r[0]}
    active_dept_ids = {r[1] for r in edge_rows if r[1]}

    # 2. Fetch active Vendors with stats
    vendor_rows = (
        db.query(
            Vendor.id,
            Vendor.name,
            func.count(Contract.id).label("cnt"),
            func.sum(Contract.award_value).label("val"),
            func.avg(RiskAssessment.crs).label("crs")
        )
        .filter(Vendor.id.in_(active_vendor_ids))
        .outerjoin(Contract, Contract.vendor_id == Vendor.id)
        .outerjoin(RiskAssessment, RiskAssessment.contract_id == Contract.id)
        .group_by(Vendor.id, Vendor.name)
        .all()
    )

    # 3. Fetch active Departments with stats
    dept_rows = (
        db.query(
            Department.id,
            Department.name,
            func.count(Contract.id).label("cnt"),
            func.sum(Contract.award_value).label("val"),
            func.avg(RiskAssessment.crs).label("crs")
        )
        .filter(Department.id.in_(active_dept_ids))
        .outerjoin(Contract, Contract.department_id == Department.id)
        .outerjoin(RiskAssessment, RiskAssessment.contract_id == Contract.id)
        .group_by(Department.id, Department.name)
        .all()
    )

    nodes = []
    for v_id, v_name, cnt, val, crs in vendor_rows:
        avg_crs = round(float(crs or 0), 1)
        tot_val = float(val or 0)
        c_count = int(cnt or 0)
        nodes.append({
            "data": {
                "id": f"vendor-{v_id}",
                "raw_id": v_id,
                "label": v_name or f"Vendor #{v_id}",
                "type": "vendor",
                "contract_count": c_count,
                "contracts": c_count,
                "total_value": tot_val,
                "value": tot_val,
                "average_crs": avg_crs,
                "crs": avg_crs
            }
        })

    for d_id, d_name, cnt, val, crs in dept_rows:
        avg_crs = round(float(crs or 0), 1)
        tot_val = float(val or 0)
        c_count = int(cnt or 0)
        nodes.append({
            "data": {
                "id": f"department-{d_id}",
                "raw_id": d_id,
                "label": d_name or f"Dept #{d_id}",
                "type": "department",
                "contract_count": c_count,
                "contracts": c_count,
                "total_value": tot_val,
                "value": tot_val,
                "average_crs": avg_crs,
                "crs": avg_crs
            }
        })

    edges = []
    for v_id, d_id, cnt, val, crs in edge_rows:
        avg_crs = round(float(crs or 0), 1)
        tot_val = float(val or 0)
        c_count = int(cnt or 0)
        edges.append({
            "data": {
                "id": f"edge-{v_id}-{d_id}",
                "source": f"vendor-{v_id}",
                "target": f"department-{d_id}",
                "contract_count": c_count,
                "contracts": c_count,
                "total_value": tot_val,
                "value": tot_val,
                "average_crs": avg_crs,
                "crs": avg_crs
            }
        })

    return {"nodes": nodes, "edges": edges}

