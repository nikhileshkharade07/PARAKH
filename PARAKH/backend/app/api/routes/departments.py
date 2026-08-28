from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_department_service
from app.services.department_service import DepartmentService

router = APIRouter()

@router.get("")
def list_departments(service: DepartmentService = Depends(get_department_service)):
    return service.get_departments()

@router.get("/{department_id}")
def department(department_id: int, service: DepartmentService = Depends(get_department_service)):
    department_data = service.get_department(department_id)
    if not department_data:
        raise HTTPException(404, "Department not found")
    return department_data
