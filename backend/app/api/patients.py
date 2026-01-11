"""
API endpoints for patient data management.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models import User
from app.schemas import PatientResponse, PatientListResponse, PatientUpdate, AuditLogResponse
from app.services.patient_service import PatientService

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_patients(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Excel file upload endpoint for Managers.
    """
    if current_user.role.name not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only Managers can upload patient data")
        
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .xlsx and .xls are supported.")
        
    content = await file.read()
    client_ip = request.client.host
    
    count, errors = await PatientService.process_excel_upload(
        db, content, current_user.id, client_ip
    )
    
    return {
        "success": True,
        "processed_count": count,
        "errors": errors
    }

@router.get("", response_model=PatientListResponse)
async def get_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves paginated patient data for the authenticated Manager.
    """
    if current_user.role.name not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    patients, total = await PatientService.get_patients(
        db, current_user.id, page, limit, search
    )
    
    return {
        "success": True,
        "data": patients,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    request: Request,
    data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Inline edit endpoint for patient records.
    """
    try:
        uuid_obj = uuid.UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid patient UUID")
        
    client_ip = request.client.host
    updated_patient = await PatientService.update_patient(
        db, uuid_obj, current_user.id, data, client_ip
    )
    
    if not updated_patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    return updated_patient

@router.get("/audit", response_model=dict)
async def get_audit_trail(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the audit trail for patient data access.
    """
    if current_user.role.name not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    logs, total = await PatientService.get_audit_logs(
        db, current_user.id, page, limit
    )
    
    return {
        "success": True,
        "data": [AuditLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": page,
        "limit": limit
    }
