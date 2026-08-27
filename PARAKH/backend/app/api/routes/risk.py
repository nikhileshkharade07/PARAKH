from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Contract
from backend.ml.risk_engine.engine import RiskEngine

router = APIRouter()

@router.get("/{contract_id}")
def get_risk(contract_id: int, db: Session = Depends(get_db)):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(404, "Contract not found")
    return RiskEngine().analyze_contract(c, db) if not c.risk_assessment else {
        "crs": c.risk_assessment.crs,
        "rule_score": c.risk_assessment.rule_score,
        "anomaly_score": c.risk_assessment.anomaly_score,
        "flags": [{"flag_id":f.flag_id,"detected":f.detected,"severity":f.severity,
                   "score":f.score,"explanation":f.explanation} for f in c.risk_flags if f.detected]
    }

@router.post("/analyze")
def analyze(contract_id: int, db: Session = Depends(get_db)):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(404, "Contract not found")
    return RiskEngine().analyze_contract(c, db)
