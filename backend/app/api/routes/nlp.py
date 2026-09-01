from fastapi import APIRouter
from pydantic import BaseModel
from ml.nlp.similarity import specification_similarity

router = APIRouter()

class NLPRequest(BaseModel):
    specification: str = ""
    vendor_description: str = ""
    threshold: float = 0.85

@router.post("/analyze")
def analyze(req: NLPRequest):
    return specification_similarity(req.specification, req.vendor_description, req.threshold)
