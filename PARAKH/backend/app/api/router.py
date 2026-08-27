from fastapi import APIRouter
from backend.app.api.routes import contracts, vendors, departments, dashboard, network, risk, nlp, blockchain

api_router = APIRouter()
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(network.router, prefix="/network", tags=["network"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(nlp.router, prefix="/nlp", tags=["nlp"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["blockchain"])
