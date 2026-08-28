from fastapi import Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.contract_service import ContractService
from backend.app.services.vendor_service import VendorService
from backend.app.services.department_service import DepartmentService


def get_contract_service(db: Session = Depends(get_db)) -> ContractService:
    """Dependency provider for ContractService."""
    return ContractService(db)


def get_vendor_service(db: Session = Depends(get_db)) -> VendorService:
    """Dependency provider for VendorService."""
    return VendorService(db)


def get_department_service(db: Session = Depends(get_db)) -> DepartmentService:
    """Dependency provider for DepartmentService."""
    return DepartmentService(db)