from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from collections import defaultdict
from app.models import Vendor, Contract, Bid

class VendorService:
    def __init__(self, db: Session):
        self.db = db

    def get_vendors(self) -> List[dict]:
        """Get list of all vendors with basic info."""
        vendors = self.db.query(Vendor).all()
        return [{"id": v.id, "name": v.name} for v in vendors]

    def get_vendor(self, vendor_id: int) -> Optional[dict]:
        """Get vendor detailed forensic profile with temporal and department analytics."""
        vendor = self.db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            return None

        contracts = vendor.contracts
        scores = [c.risk_assessment.crs for c in contracts if c.risk_assessment]

        # Temporal breakdown by year
        yearly_map = defaultdict(lambda: {"year": 0, "contracts": 0, "value": 0.0, "total_crs": 0, "high_risk": 0})
        dept_map = defaultdict(lambda: {"department_id": 0, "department_name": "", "count": 0, "value": 0.0})
        total_extensions = 0

        for c in contracts:
            yr = c.contract_date.year if c.contract_date else 2025
            yearly_map[yr]["year"] = yr
            yearly_map[yr]["contracts"] += 1
            yearly_map[yr]["value"] += float(c.award_value)
            
            crs = c.risk_assessment.crs if c.risk_assessment else 0
            yearly_map[yr]["total_crs"] += crs
            if crs >= 70:
                yearly_map[yr]["high_risk"] += 1

            d_id = c.department_id
            d_name = c.department.name if c.department else "General Department"
            dept_map[d_id]["department_id"] = d_id
            dept_map[d_id]["department_name"] = d_name
            dept_map[d_id]["count"] += 1
            dept_map[d_id]["value"] += float(c.award_value)

            if c.extensions:
                total_extensions += len(c.extensions)

        yearly_trends = []
        for yr in sorted(yearly_map.keys()):
            item = yearly_map[yr]
            avg_crs = round(item["total_crs"] / item["contracts"], 1) if item["contracts"] > 0 else 0
            yearly_trends.append({
                "year": yr,
                "contracts": item["contracts"],
                "value": item["value"],
                "avg_crs": avg_crs,
                "high_risk_contracts": item["high_risk"]
            })

        dept_breakdown = []
        total_cnt = len(contracts)
        for d_id, d_data in dept_map.items():
            pct = round((d_data["count"] / total_cnt) * 100, 1) if total_cnt > 0 else 0
            dept_breakdown.append({
                "department_id": d_id,
                "department_name": d_data["department_name"],
                "contract_count": d_data["count"],
                "total_value": d_data["value"],
                "concentration_pct": pct
            })
        dept_breakdown.sort(key=lambda x: x["contract_count"], reverse=True)

        # Calculate participation vs winning
        participated_bids = self.db.query(Bid).filter(Bid.vendor_name == vendor.name).count()
        total_won = len(contracts)
        win_rate = round((total_won / participated_bids) * 100, 1) if participated_bids > 0 else 100.0

        return {
            "id": vendor.id,
            "name": vendor.name,
            "product_description": vendor.product_description,
            "total_contracts": len(contracts),
            "total_bids_participated": max(participated_bids, total_won),
            "win_rate": win_rate,
            "total_value": sum(float(c.award_value) for c in contracts),
            "average_contract_value": (sum(float(c.award_value) for c in contracts) / len(contracts)) if contracts else 0,
            "departments": sorted({c.department.name for c in contracts if c.department}),
            "department_breakdown": dept_breakdown,
            "yearly_trends": yearly_trends,
            "total_extensions": total_extensions,
            "average_crs": round(sum(scores) / len(scores), 1) if scores else 0,
            "high_risk_contracts": sum(s >= 70 for s in scores),
            "medium_risk_contracts": sum(40 <= s < 70 for s in scores),
            "low_risk_contracts": sum(s < 40 for s in scores),
        }