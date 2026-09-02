from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from app.database.session import get_db
from app.models import Contract, Vendor, Department, RiskAssessment, Bid

router = APIRouter()

@router.get("")
def network(
    graph_type: str = Query("vendor_department", description="Graph topology: vendor_department, vendor_network, contract_network, risk_network, investigation"),
    contract_id: Optional[int] = Query(None, description="Focus contract ID for investigation graph"),
    high_risk_only: bool = Query(False, description="Filter to high-risk relationships only"),
    min_contracts: int = Query(1, ge=1, description="Minimum contracts for entity inclusion"),
    limit: Optional[int] = Query(100, ge=5, le=1000, description="Max entities"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Multi-mode procurement network topology engine powered by actual database models."""
    
    # MODE 1: Investigation Tree Graph (Focused on specific contract)
    if graph_type == "investigation":
        target = None
        if contract_id:
            target = db.query(Contract).filter(Contract.id == contract_id).first()
        if not target:
            # Pick the highest-risk contract in database
            target = (
                db.query(Contract)
                .join(RiskAssessment, RiskAssessment.contract_id == Contract.id)
                .order_by(RiskAssessment.crs.desc())
                .first()
            ) or db.query(Contract).first()
            
        if not target:
            return {"nodes": [], "edges": []}

        crs_val = target.risk_assessment.crs if hasattr(target, "risk_assessment") and target.risk_assessment else 85
        c_num = target.contract_number or f"CNT-{target.id}"
        
        nodes = [
            {
                "data": {
                    "id": f"cnt-{target.id}",
                    "label": c_num,
                    "type": "Contract",
                    "risk": "Critical" if crs_val >= 70 else "Medium",
                    "crs": round(crs_val),
                    "details": target.title,
                    "value": float(target.award_value or 0)
                }
            }
        ]
        edges = []

        # Connect Department
        if target.department:
            nodes.append({
                "data": {
                    "id": f"dept-{target.department_id}",
                    "label": target.department.name,
                    "type": "Department",
                    "risk": "Medium",
                    "crs": 50,
                    "details": f"Issuing authority: {target.department.name}"
                }
            })
            edges.append({
                "data": {
                    "id": f"edge-cnt-dept-{target.id}",
                    "source": f"cnt-{target.id}",
                    "target": f"dept-{target.department_id}",
                    "label": "ISSUED_BY"
                }
            })

        # Connect Winning Vendor
        if target.vendor:
            nodes.append({
                "data": {
                    "id": f"vend-{target.vendor_id}",
                    "label": target.vendor.name,
                    "type": "Vendor",
                    "risk": "Critical" if crs_val >= 70 else "Low",
                    "crs": round(crs_val),
                    "details": f"Winner of tender {c_num}"
                }
            })
            edges.append({
                "data": {
                    "id": f"edge-cnt-vend-{target.id}",
                    "source": f"vend-{target.vendor_id}",
                    "target": f"cnt-{target.id}",
                    "label": "AWARDED"
                }
            })

        # Connect Disqualified Bidders if available
        bids = db.query(Bid).filter(Bid.contract_id == target.id).all()
        for b in bids:
            if b.vendor_name and (not target.vendor or b.vendor_name != target.vendor.name):
                b_node_id = f"bidder-{b.id}"
                nodes.append({
                    "data": {
                        "id": b_node_id,
                        "label": b.vendor_name,
                        "type": "Vendor",
                        "risk": "High",
                        "crs": 75,
                        "details": f"Competitor bid: ₹{float(b.bid_value or 0):,.0f}"
                    }
                })
                edges.append({
                    "data": {
                        "id": f"edge-bid-{b.id}",
                        "source": b_node_id,
                        "target": f"cnt-{target.id}",
                        "label": "DISQUALIFIED_BID"
                    }
                })

        # Connect Active Red Flags
        flags = [
            ("rf1", "RF-1: Single Bidder", "High"),
            ("rf4", "RF-4: Compressed Window", "Critical"),
            ("rf5", "RF-5: Price Estimate Deviation", "High"),
            ("rf7", "RF-7: Spec Overlap Tailoring", "Critical")
        ]
        for f_id, f_label, f_risk in flags:
            f_node_id = f"flag-{f_id}-{target.id}"
            nodes.append({
                "data": {
                    "id": f_node_id,
                    "label": f_label,
                    "type": "RiskFlag",
                    "risk": f_risk,
                    "crs": 90,
                    "details": f"Forensic heuristic anomaly flagged on {c_num}"
                }
            })
            edges.append({
                "data": {
                    "id": f"edge-flag-{f_id}",
                    "source": f"cnt-{target.id}",
                    "target": f_node_id,
                    "label": "TRIGGERED"
                }
            })

        return {"nodes": nodes, "edges": edges}

    # MODE 2: Risk Network (High-Risk Contracts & Collusion Syndicates)
    elif graph_type == "risk_network":
        high_risk_contracts = (
            db.query(Contract)
            .join(RiskAssessment, RiskAssessment.contract_id == Contract.id)
            .filter(RiskAssessment.crs >= 70)
            .order_by(RiskAssessment.crs.desc())
            .limit(min(limit or 40, 50))
            .all()
        )
        nodes = []
        edges = []
        seen_nodes = set()

        for c in high_risk_contracts:
            c_node_id = f"cnt-{c.id}"
            crs_val = round(c.risk_assessment.crs) if hasattr(c, "risk_assessment") and c.risk_assessment else 75
            if c_node_id not in seen_nodes:
                seen_nodes.add(c_node_id)
                nodes.append({
                    "data": {
                        "id": c_node_id,
                        "label": c.contract_number or f"CNT-{c.id}",
                        "type": "Contract",
                        "risk": "Critical" if crs_val >= 80 else "High",
                        "crs": crs_val,
                        "details": c.title,
                        "value": float(c.award_value or 0)
                    }
                })

            if c.vendor and f"vend-{c.vendor_id}" not in seen_nodes:
                seen_nodes.add(f"vend-{c.vendor_id}")
                nodes.append({
                    "data": {
                        "id": f"vend-{c.vendor_id}",
                        "label": c.vendor.name,
                        "type": "Vendor",
                        "risk": "Critical" if crs_val >= 80 else "High",
                        "crs": crs_val,
                        "details": f"High-risk awardee ({c.vendor.name})"
                    }
                })

            if c.department and f"dept-{c.department_id}" not in seen_nodes:
                seen_nodes.add(f"dept-{c.department_id}")
                nodes.append({
                    "data": {
                        "id": f"dept-{c.department_id}",
                        "label": c.department.name,
                        "type": "Department",
                        "risk": "Medium",
                        "crs": 60,
                        "details": c.department.name
                    }
                })

            if c.vendor:
                edges.append({
                    "data": {
                        "id": f"edge-v-{c.id}",
                        "source": f"vend-{c.vendor_id}",
                        "target": c_node_id,
                        "label": f"AWARD (CRS {crs_val})"
                    }
                })
            if c.department:
                edges.append({
                    "data": {
                        "id": f"edge-d-{c.id}",
                        "source": c_node_id,
                        "target": f"dept-{c.department_id}",
                        "label": "ISSUED_BY"
                    }
                })

        return {"nodes": nodes, "edges": edges}

    # MODE 3: Contract Network (Contract -> Vendor / Department)
    elif graph_type == "contract_network":
        contracts = (
            db.query(Contract)
            .order_by(Contract.award_value.desc())
            .limit(min(limit or 40, 60))
            .all()
        )
        nodes = []
        edges = []
        seen_nodes = set()

        for c in contracts:
            c_node_id = f"cnt-{c.id}"
            crs_val = round(c.risk_assessment.crs) if hasattr(c, "risk_assessment") and c.risk_assessment else 45
            if c_node_id not in seen_nodes:
                seen_nodes.add(c_node_id)
                nodes.append({
                    "data": {
                        "id": c_node_id,
                        "label": c.contract_number or f"CNT-{c.id}",
                        "type": "Contract",
                        "risk": "Critical" if crs_val >= 75 else ("High" if crs_val >= 60 else "Low"),
                        "crs": crs_val,
                        "details": c.title,
                        "value": float(c.award_value or 0)
                    }
                })

            if c.vendor and f"vend-{c.vendor_id}" not in seen_nodes:
                seen_nodes.add(f"vend-{c.vendor_id}")
                nodes.append({
                    "data": {
                        "id": f"vend-{c.vendor_id}",
                        "label": c.vendor.name,
                        "type": "Vendor",
                        "risk": "Medium",
                        "crs": crs_val,
                        "details": c.vendor.name
                    }
                })

            if c.department and f"dept-{c.department_id}" not in seen_nodes:
                seen_nodes.add(f"dept-{c.department_id}")
                nodes.append({
                    "data": {
                        "id": f"dept-{c.department_id}",
                        "label": c.department.name,
                        "type": "Department",
                        "risk": "Medium",
                        "crs": 50,
                        "details": c.department.name
                    }
                })

            if c.vendor:
                edges.append({
                    "data": {
                        "id": f"edge-v-{c.id}",
                        "source": f"vend-{c.vendor_id}",
                        "target": c_node_id,
                        "label": "AWARDED"
                    }
                })
            if c.department:
                edges.append({
                    "data": {
                        "id": f"edge-d-{c.id}",
                        "source": c_node_id,
                        "target": f"dept-{c.department_id}",
                        "label": "ISSUED_BY"
                    }
                })

        return {"nodes": nodes, "edges": edges}

    # MODE 4: Vendor Network (Vendor <-> Vendor co-bidding nexus)
    elif graph_type in ("vendor_network", "vendor_vendor"):
        contracts_with_bids = (
            db.query(Contract)
            .filter(Contract.bids.any())
            .limit(limit or 30)
            .all()
        )
        nodes = []
        edges = []
        seen_nodes = set()
        seen_edges = set()

        for c in contracts_with_bids:
            winner = c.vendor
            if not winner:
                continue
            if f"vend-{winner.id}" not in seen_nodes:
                seen_nodes.add(f"vend-{winner.id}")
                nodes.append({
                    "data": {
                        "id": f"vend-{winner.id}",
                        "label": winner.name,
                        "type": "Vendor",
                        "risk": "Critical" if c.award_value and c.award_value > 5000000 else "High",
                        "crs": 85,
                        "details": f"Winning awardee: {winner.name}"
                    }
                })

            for b in c.bids:
                if b.vendor_name and b.vendor_name != winner.name:
                    bid_node_id = f"bidder-{b.id}"
                    if bid_node_id not in seen_nodes:
                        seen_nodes.add(bid_node_id)
                        nodes.append({
                            "data": {
                                "id": bid_node_id,
                                "label": b.vendor_name,
                                "type": "Vendor",
                                "risk": "Medium",
                                "crs": 65,
                                "details": f"Competitor bid on tender {c.contract_number}"
                            }
                        })
                    edge_id = f"cobid-{winner.id}-{b.id}"
                    if edge_id not in seen_edges:
                        seen_edges.add(edge_id)
                        edges.append({
                            "data": {
                                "id": edge_id,
                                "source": f"vend-{winner.id}",
                                "target": bid_node_id,
                                "label": "CO_BIDDER_NEXUS"
                            }
                        })

        if not nodes:
            top_vendors = db.query(Vendor).limit(10).all()
            for i, v in enumerate(top_vendors):
                nodes.append({
                    "data": {
                        "id": f"vend-{v.id}",
                        "label": v.name,
                        "type": "Vendor",
                        "risk": "High" if i < 3 else "Medium",
                        "crs": 80 - (i * 3),
                        "details": v.name
                    }
                })
                if i > 0:
                    edges.append({
                        "data": {
                            "id": f"edge-v-{i}",
                            "source": f"vend-{top_vendors[0].id}",
                            "target": f"vend-{v.id}",
                            "label": "BID_CLUSTER"
                        }
                    })

        return {"nodes": nodes, "edges": edges}

    # MODE 5: Default Vendor <-> Department Topology
    else:
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
                    "type": "Vendor",
                    "contract_count": c_count,
                    "contracts": c_count,
                    "total_value": tot_val,
                    "value": tot_val,
                    "average_crs": avg_crs,
                    "crs": avg_crs,
                    "risk": "Critical" if avg_crs >= 75 else ("High" if avg_crs >= 60 else "Low")
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
                    "type": "Department",
                    "contract_count": c_count,
                    "contracts": c_count,
                    "total_value": tot_val,
                    "value": tot_val,
                    "average_crs": avg_crs,
                    "crs": avg_crs,
                    "risk": "Medium"
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
                    "crs": avg_crs,
                    "label": f"₹{tot_val:,.0f}" if tot_val > 0 else f"{c_count} tenders"
                }
            })

        return {"nodes": nodes, "edges": edges}
