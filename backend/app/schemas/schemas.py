"""
Pydantic schemas for request/response validation.
"""
import re
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, validator

# ============================================================================
# Role Schemas
# ============================================================================

class RoleBase(BaseModel):
    """Base role schema."""
    name: str
    display_name: str
    description: Optional[str] = None
    hierarchy_level: int


class RoleResponse(RoleBase):
    """Role response schema."""
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Location Schemas
# ============================================================================

class LocationBase(BaseModel):
    """Base location schema."""
    code: str
    name: str
    timezone: str


class LocationResponse(LocationBase):
    """Location response schema."""
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Team Schemas
# ============================================================================

class TeamBase(BaseModel):
    """Base team schema."""
    code: str
    name: str
    description: Optional[str] = None


class TeamResponse(TeamBase):
    """Team response schema."""
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# User Schemas
# ============================================================================

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)
    role_id: uuid.UUID
    location_id: uuid.UUID
    team_id: uuid.UUID
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserResponse(UserBase):
    """User response schema."""
    id: uuid.UUID
    role: RoleResponse
    location: LocationResponse
    team: TeamResponse
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """User list item schema (simplified for listings)."""
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    location: str
    team: str
    is_active: bool
    created_at: datetime


# ============================================================================
# Authentication Schemas
# ============================================================================

class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request schema."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request schema."""
    reset_token: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


# ============================================================================
# Patient Schemas
# ============================================================================

class PatientBase(BaseModel):
    patient_id: str = Field(..., min_length=1, description="Unique alphanumeric patient ID")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: str = Field(..., description="Date of birth (encrypted/decrypted)")
    gender: str = Field(..., min_length=1)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None


class PatientResponse(PatientBase):
    id: uuid.UUID
    manager_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    success: bool
    data: List[PatientResponse]
    total: int
    page: int
    limit: int


# ============================================================================
# Audit Log Schemas
# ============================================================================

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    action: str
    performed_by_id: uuid.UUID
    patient_record_id: Optional[uuid.UUID]
    details: Optional[str]
    client_ip: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Response Wrappers & Pagination
# ============================================================================

class SuccessResponse(BaseModel):
    """Generic success response wrapper."""
    success: bool = True
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Generic error response wrapper."""
    success: bool = False
    error: dict


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Paginated user list response."""
    users: List[UserListItem]
    pagination: dict
