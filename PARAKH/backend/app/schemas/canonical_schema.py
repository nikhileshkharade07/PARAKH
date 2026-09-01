"""
backend/app/schemas/canonical_schema.py
---------------------------------------
Universal Canonical Procurement Schema for PARAKH.
Standardizes multi-state and central Indian public procurement records.
Supports field availability profiling and strict data typing.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator


class CanonicalProcurementRecord(BaseModel):
    """Canonical procurement contract data model."""
    
    # Identification
    tender_id: str = Field(..., description="Unique government tender identification number")
    tender_reference: str = Field(..., description="Official reference or tender notification code")
    
    # Entity & Geography
    department: str = Field(..., description="Procuring government department or agency")
    organization: str = Field(..., description="Parent ministry or statutory corporation")
    state: str = Field(..., description="Indian State or Union Territory")
    district: Optional[str] = Field(None, description="Administrative district")
    location: Optional[str] = Field(None, description="Locality / work site")
    
    # Tender Details
    procurement_category: str = Field(..., description="Goods, Works, or Services")
    tender_title: str = Field(..., description="Title of the tender notice")
    description: Optional[str] = Field(None, description="Detailed scope or specification text")
    
    # Timeline
    published_date: Optional[datetime] = Field(None, description="Tender notice publication timestamp")
    submission_deadline: Optional[datetime] = Field(None, description="Bid submission deadline timestamp")
    opening_date: Optional[datetime] = Field(None, description="Technical / financial bid opening date")
    contract_date: Optional[datetime] = Field(None, description="Contract award or agreement date")
    
    # Financials
    estimated_value: Optional[float] = Field(None, description="Government benchmark / sanctioned estimated amount in INR")
    award_value: Optional[float] = Field(None, description="Final awarded contract value in INR")
    currency: str = Field("INR", description="Currency code (Standard: INR)")
    
    # Bidding & Competition
    number_of_bidders: int = Field(1, description="Count of distinct commercial bidders participating")
    winning_supplier: str = Field(..., description="Legal name of awarded vendor / contractor")
    supplier_id: Optional[str] = Field(None, description="Unique vendor ID / PAN / GSTIN / OCDS entity ID")
    supplier_name: str = Field(..., description="Normalized supplier entity name")
    supplier_address: Optional[str] = Field(None, description="Registered business address of supplier")
    
    # Contract Execution & Governance
    tender_status: str = Field("AWARDED", description="Tender lifecycle status: OPEN, CLOSED, AWARDED, CANCELLED")
    contract_duration: Optional[float] = Field(None, description="Tender / contract window in calendar days")
    extension_count: int = Field(0, description="Number of delivery timeline extensions granted")
    extension_days: int = Field(0, description="Total cumulative extension duration in days")
    procurement_method: str = Field("OPEN_TENDER", description="OPEN_TENDER, LIMITED_TENDER, SINGLE_SOURCE, GeM_DIRECT")
    buyer: Optional[str] = Field(None, description="Designated procuring officer or buyer unit")
    
    # Provenance Lineage
    source_dataset: str = Field(..., description="Source identifier e.g. HIMACHAL_PRADESH, CENTRAL_CPPP, MAHARASHTRA")
    source_url: str = Field(..., description="Authoritative public URL / portal endpoint")
    
    # Optional Rich Fields
    bid_amounts: Optional[List[float]] = Field(None, description="Itemized bid values submitted by competitors")
    all_bidders: Optional[List[str]] = Field(None, description="List of all participating bidder names")
    technical_specifications: Optional[str] = Field(None, description="Itemized technical specs or clauses")
    product_catalog: Optional[str] = Field(None, description="Supplier standard product catalog description")
    sanctioned_amount: Optional[float] = Field(None, description="Statutory administrative sanctioned ceiling")
    approval_threshold: Optional[float] = Field(5000000.0, description="Statutory financial delegation threshold in INR")
    contract_start: Optional[datetime] = Field(None, description="Execution start date")
    contract_end: Optional[datetime] = Field(None, description="Execution scheduled completion date")

    @field_validator("award_value", "estimated_value", mode="before")
    @classmethod
    def validate_positive_values(cls, v):
        if v is None:
            return None
        val = float(v)
        return round(val, 2)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }


def compute_field_availability(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute presence and completeness statistics for every schema field."""
    if not records:
        return {}
    
    total = len(records)
    canonical_fields = list(CanonicalProcurementRecord.model_fields.keys())
    
    field_counts = {k: 0 for k in canonical_fields}
    for r in records:
        for k in canonical_fields:
            val = r.get(k)
            if val is not None and val != "" and val != [] and str(val).lower() != "nan":
                field_counts[k] += 1
                
    availability = {
        "total_records": total,
        "fields": {
            k: {
                "available_count": field_counts[k],
                "completeness_pct": round((field_counts[k] / total) * 100, 2)
            }
            for k in canonical_fields
        }
    }
    return availability
