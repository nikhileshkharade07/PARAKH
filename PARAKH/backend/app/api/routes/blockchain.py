from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.core.config import settings

router = APIRouter()

class BlockchainRequest(BaseModel):
    contract_id: str
    crs: int
    flags: list[str]
    timestamp: str

@router.post("/record")
def record(req: BlockchainRequest):
    if not settings.blockchain_enabled:
        return {"enabled":False,"recorded":False,
                "message":"Blockchain disabled; local audit data remains available."}
    return {"enabled":True,"recorded":False,
            "message":"Sepolia adapter placeholder — implement only after core demo is stable."}
