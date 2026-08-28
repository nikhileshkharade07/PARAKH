from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_vendor_service
from app.services.vendor_service import VendorService

router = APIRouter()

@router.get("")
def list_vendors(service: VendorService = Depends(get_vendor_service)):
    return service.get_vendors()

@router.get("/{vendor_id}")
def vendor(vendor_id: int, service: VendorService = Depends(get_vendor_service)):
    vendor_data = service.get_vendor(vendor_id)
    if not vendor_data:
        raise HTTPException(404, "Vendor not found")
    return vendor_data
