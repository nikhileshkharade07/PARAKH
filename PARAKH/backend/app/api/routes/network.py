from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Contract, Vendor, Department

router = APIRouter()

@router.get("")
def network(db: Session = Depends(get_db)):
    nodes = []
    for v in db.scalars(select(Vendor)).all():
        cs = v.contracts
        scores = [c.risk_assessment.crs for c in cs if c.risk_assessment]
        nodes.append({"data":{"id":f"vendor-{v.id}","label":v.name,"type":"vendor",
                              "contract_count":len(cs),"total_value":sum(float(c.award_value) for c in cs),
                              "average_crs":sum(scores)/len(scores) if scores else 0}})
    for d in db.scalars(select(Department)).all():
        cs = d.contracts
        scores = [c.risk_assessment.crs for c in cs if c.risk_assessment]
        nodes.append({"data":{"id":f"department-{d.id}","label":d.name,"type":"department",
                              "contract_count":len(cs),"total_value":sum(float(c.award_value) for c in cs),
                              "average_crs":sum(scores)/len(scores) if scores else 0}})
    grouped = {}
    for c in db.scalars(select(Contract)).all():
        k=(c.vendor_id,c.department_id)
        x=grouped.setdefault(k,{"count":0,"value":0,"scores":[]})
        x["count"]+=1; x["value"]+=float(c.award_value)
        if c.risk_assessment: x["scores"].append(c.risk_assessment.crs)
    edges=[{"data":{"id":f"edge-{v}-{d}","source":f"vendor-{v}","target":f"department-{d}",
                    "contract_count":x["count"],"total_value":x["value"],
                    "average_crs":sum(x["scores"])/len(x["scores"]) if x["scores"] else 0}}
           for (v,d),x in grouped.items()]
    return {"nodes":nodes,"edges":edges}
