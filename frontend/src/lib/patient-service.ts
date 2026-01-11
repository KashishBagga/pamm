/**
 * Service for patient data management.
 */
import apiClient from './api';
import { Patient, PatientListResponse, ApiResponse, AuditLog } from './types';

export const patientService = {
    /**
     * Upload an Excel file containing patient data.
     */
    async uploadPatients(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{ success: boolean; processed_count: number; errors: string[] }>(
            '/patients/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    },

    /**
     * Get paginated patient records.
     */
    async getPatients(page: number = 1, limit: number = 20, search?: string) {
        const response = await apiClient.get<PatientListResponse>('/patients', {
            params: { page, limit, search },
        });
        return response.data;
    },

    /**
     * Update a patient record (inline edit).
     */
    async updatePatient(patientId: string, data: Partial<Patient>) {
        const response = await apiClient.patch<Patient>(`/patients/${patientId}`, data);
        return response.data;
    },

    /**
     * Get PHI access audit logs.
     */
    async getAuditLogs(page: number = 1, limit: number = 50) {
        const response = await apiClient.get<{ success: boolean; data: AuditLog[]; total: number }>('/patients/audit', {
            params: { page, limit },
        });
        return response.data;
    }
};
