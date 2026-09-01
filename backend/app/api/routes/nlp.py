from fastapi import APIRouter
from pydantic import BaseModel, Field
from ml.nlp.similarity import specification_similarity

router = APIRouter()

class NLPRequest(BaseModel):
    specification: str = Field(default="", description="Tender specification text")
    specification_text: str = Field(default="", description="Alternative field name for specification text")
    vendor_description: str = Field(default="", description="Vendor product catalog description")
    threshold: float = Field(default=0.85, description="Similarity threshold")

@router.post("/analyze")
def analyze(req: NLPRequest):
    spec = req.specification or req.specification_text
    return specification_similarity(spec, req.vendor_description, req.threshold)
