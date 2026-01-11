/**
 * TypeScript type definitions for the application.
 */

export interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string;
    hierarchy_level: number;
    created_at: string;
}

export interface Location {
    id: string;
    code: string;
    name: string;
    timezone: string;
    is_active: boolean;
    created_at: string;
}

export interface Team {
    id: string;
    code: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    location: Location;
    team: Team;
    is_active: boolean;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    role_id: string;
    location_id: string;
    team_id: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export interface UserListItem {
    id: string;
    email: string;
    full_name: string;
    role: string;
    location: string;
    team: string;
    is_active: boolean;
    created_at: string;
}

export interface PaginatedUsers {
    users: UserListItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Patient Management Types (Assignment 2)
export interface Patient {
    id: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    manager_id: string;
    created_at: string;
    updated_at?: string;
}

export interface PatientListResponse {
    success: boolean;
    data: Patient[];
    total: number;
    page: number;
    limit: number;
}

export interface AuditLog {
    id: string;
    action: string;
    performed_by_id: string;
    patient_record_id?: string;
    details?: string;
    client_ip?: string;
    timestamp: string;
}
