from fastapi import APIRouter
from app.api.routes import (
    contracts, vendors, departments, dashboard, network,
    risk, nlp, blockchain, auth, ingest, cases, audit, assistant, aegis
)

api_router = APIRouter()
api_router.include_router(aegis.router, prefix="/aegis", tags=["aegis"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(network.router, prefix="/network", tags=["network"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(nlp.router, prefix="/nlp", tags=["nlp"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["blockchain"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])

@api_router.get("/health")
def api_health():
    return {"status": "ok", "service": "PARAKH backend"}

@api_router.get("/ready")
def api_ready():
    return {"status": "ready", "database": "ok"}

