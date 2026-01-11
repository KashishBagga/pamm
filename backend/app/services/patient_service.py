"""
Service for handling patient data operations including Excel processing and encryption.
"""
import pandas as pd
import io
import uuid
from typing import List, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models import Patient, PatientAuditLog, User
from app.schemas import PatientCreate, PatientUpdate
from app.utils.encryption import encryption_manager

class PatientService:
    @staticmethod
    async def process_excel_upload(
        session: AsyncSession, 
        file_content: bytes, 
        manager_id: uuid.UUID,
        client_ip: str
    ) -> Tuple[int, List[str]]:
        """
        Processes an uploaded Excel file, validates structure, encrypts data, and saves to DB.
        """
        errors = []
        try:
            # Load Excel file (support .xlsx and .xls)
            df = pd.read_excel(io.BytesIO(file_content))
            
            # Required columns validation
            required_columns = ["Patient ID", "First Name", "Last Name", "Date of Birth", "Gender"]
            missing_cols = [col for col in required_columns if col not in df.columns]
            if missing_cols:
                return 0, [f"Missing required columns: {', '.join(missing_cols)}"]

            # Add patient records (O(N) add, but O(1) commit later)
            for _, row in df.iterrows():
                try:
                    if pd.isna(row["Patient ID"]) or pd.isna(row["First Name"]):
                        continue
                        
                    patient_id = str(row["Patient ID"])
                    
                    patient = Patient(
                        patient_id=patient_id,
                        first_name=encryption_manager.encrypt(str(row["First Name"])),
                        last_name=encryption_manager.encrypt(str(row["Last Name"])),
                        date_of_birth=encryption_manager.encrypt(str(row["Date of Birth"])),
                        gender=encryption_manager.encrypt(str(row["Gender"])),
                        manager_id=manager_id
                    )
                    session.add(patient)
                    processed_count += 1
                except Exception as e:
                    errors.append(f"Error processing row with Patient ID {row.get('Patient ID')}: {str(e)}")

            # Log audit and commit all changes (patients + audit) in a single transaction
            audit = PatientAuditLog(
                action="UPLOAD",
                performed_by_id=manager_id,
                details=f"Uploaded {processed_count} patients from Excel",
                client_ip=client_ip
            )
            session.add(audit)
            await session.commit()
            
            return processed_count, errors

        except Exception as e:
            return 0, [f"Failed to process file: {str(e)}"]

    @staticmethod
    async def get_patients(
        session: AsyncSession,
        manager_id: uuid.UUID,
        page: int = 1,
        limit: int = 20,
        search: str = None
    ) -> Tuple[List[Patient], int]:
        """
        Retrieves paginated and filtered patient records, decrypted for the response.
        """
        query = select(Patient).where(Patient.manager_id == manager_id)
        
        # Search on unencrypted Patient ID
        if search:
            query = query.where(Patient.patient_id.ilike(f"%{search}%"))
        
        # Sorting
        query = query.order_by(desc(Patient.created_at))
        
        # Pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = await session.scalar(count_query)
        
        query = query.offset((page - 1) * limit).limit(limit)
        result = await session.execute(query)
        patients = result.scalars().all()
        
        # Log Audit for Access (add to session, will commit with other potential changes or explicitly if standalone)
        audit = PatientAuditLog(
            action="ACCESS",
            performed_by_id=manager_id,
            details=f"Accessed patient list (page={page}, search='{search or ''}')",
            client_ip="internal"
        )
        session.add(audit)
        await session.commit()

        # Decrypt fields for response
        for p in patients:
            p.first_name = encryption_manager.decrypt(p.first_name)
            p.last_name = encryption_manager.decrypt(p.last_name)
            p.date_of_birth = encryption_manager.decrypt(p.date_of_birth)
            p.gender = encryption_manager.decrypt(p.gender)
            
        return list(patients), total

    @staticmethod
    async def update_patient(
        session: AsyncSession,
        patient_id: uuid.UUID,
        manager_id: uuid.UUID,
        data: PatientUpdate,
        client_ip: str
    ) -> Patient:
        """
        Updates a patient record with re-encryption.
        """
        query = select(Patient).where(Patient.id == patient_id, Patient.manager_id == manager_id)
        result = await session.execute(query)
        patient = result.scalar_one_or_none()
        
        if not patient:
            return None
            
        if data.first_name:
            patient.first_name = encryption_manager.encrypt(data.first_name)
        if data.last_name:
            patient.last_name = encryption_manager.encrypt(data.last_name)
        if data.date_of_birth:
            patient.date_of_birth = encryption_manager.encrypt(data.date_of_birth)
        if data.gender:
            patient.gender = encryption_manager.encrypt(data.gender)
            
        # Log audit and commit update
        audit = PatientAuditLog(
            action="EDIT",
            performed_by_id=manager_id,
            patient_record_id=patient.id,
            client_ip=client_ip
        )
        session.add(audit)
        await session.commit()
        await session.refresh(patient)
        
        # Decrypt for return
        patient.first_name = encryption_manager.decrypt(patient.first_name)
        patient.last_name = encryption_manager.decrypt(patient.last_name)
        patient.date_of_birth = encryption_manager.decrypt(patient.date_of_birth)
        patient.gender = encryption_manager.decrypt(patient.gender)
        
        return patient

    @staticmethod
    async def get_audit_logs(
        session: AsyncSession,
        manager_id: uuid.UUID,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[PatientAuditLog], int]:
        """
        Retrieves paginated audit logs for the manager.
        """
        query = select(PatientAuditLog).where(PatientAuditLog.performed_by_id == manager_id)
        query = query.order_by(desc(PatientAuditLog.timestamp))
        
        count_query = select(func.count()).select_from(query.subquery())
        total = await session.scalar(count_query)
        
        query = query.offset((page - 1) * limit).limit(limit)
        result = await session.execute(query)
        logs = result.scalars().all()
        
        return list(logs), total
