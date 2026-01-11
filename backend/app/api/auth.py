"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SuccessResponse
)
from app.services import AuthService
from app.api.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["Authentication"])


def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and user agent from request."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


@router.post("/register", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    
    - **email**: Valid email address (must be unique)
    - **password**: Minimum 8 characters with uppercase, lowercase, number, and special character
    - **full_name**: User's full name
    - **role_id**: UUID of the role
    - **location_id**: UUID of the location
    - **team_id**: UUID of the team
    """
    user = await AuthService.register_user(db, user_data)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return access and refresh tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT access token (15 min expiry) and refresh token (7 days expiry).
    """
    ip_address, user_agent = get_client_info(request)
    
    user, access_token, refresh_token = await AuthService.authenticate_user(
        db, credentials, ip_address, user_agent
    )
    
    # Build response with user details using pre-loaded relationships
    user_response = UserResponse.model_validate(user)
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )


@router.post("/refresh", response_model=dict)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns a new access token.
    """
    new_access_token = await AuthService.refresh_access_token(db, token_data.refresh_token)
    
    return {
        "success": True,
        "data": {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    }


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user by invalidating the session.
    
    Requires valid access token in Authorization header.
    """
    # Extract token from header
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ")[1]
        await AuthService.logout(db, access_token)
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    
    Requires valid access token in Authorization header.
    """
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset token.
    
    - **email**: User's email address
    
    In production, this would send an email with reset link.
    For demo purposes, the token is returned in the response (development only).
    """
    reset_token = await AuthService.create_password_reset_token(db, request_data.email)
    
    # In production, send email instead of returning token
    if settings.ENVIRONMENT == "development" and reset_token:
        return {
            "success": True,
            "message": "Password reset instructions sent to email",
            "data": {"reset_token": reset_token}  # Only for development
        }
    
    return {
        "success": True,
        "message": "If the email exists, password reset instructions have been sent"
    }


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    request_data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using reset token.
    
    - **reset_token**: Valid password reset token
    - **new_password**: New password (must meet security requirements)
    """
    await AuthService.reset_password(db, request_data.reset_token, request_data.new_password)
    
    return {
        "success": True,
        "message": "Password reset successfully"
    }
