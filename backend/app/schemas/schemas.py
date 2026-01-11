"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re


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
    id: UUID
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
    id: UUID
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
    id: UUID
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
    role_id: UUID
    location_id: UUID
    team_id: UUID
    
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
    id: UUID
    role: RoleResponse
    location: LocationResponse
    team: TeamResponse
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """User list item schema (simplified for listings)."""
    id: UUID
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
# Response Wrappers
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


# ============================================================================
# Pagination
# ============================================================================

class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Paginated response schema."""
    users: list[UserListItem]
    pagination: dict
