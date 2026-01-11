"""
Authentication service for user authentication and session management.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import secrets

from app.models import User, UserSession, AuthAttempt, PasswordReset, Role, Location, Team
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.config import settings
from app.schemas import UserCreate, LoginRequest


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    async def register_user(
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """
        Register a new user.
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created user object
            
        Raises:
            HTTPException: If email already exists or invalid foreign keys
        """
        # Check if email already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Verify role, location, and team exist
        role = await db.get(Role, user_data.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role ID"
            )
        
        location = await db.get(Location, user_data.location_id)
        if not location or not location.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid location ID"
            )
        
        team = await db.get(Team, user_data.team_id)
        if not team or not team.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID"
            )
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            full_name=user_data.full_name,
            role_id=user_data.role_id,
            location_id=user_data.location_id,
            team_id=user_data.team_id
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return new_user
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        credentials: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """
        Authenticate user and create session.
        
        Args:
            db: Database session
            credentials: Login credentials
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Tuple of (user, access_token, refresh_token)
            
        Raises:
            HTTPException: If authentication fails
        """
        # Get user by email
        result = await db.execute(
            select(User)
            .where(User.email == credentials.email)
            .options(
                selectinload(User.role),
                selectinload(User.location),
                selectinload(User.team)
            )
        )
        user = result.scalar_one_or_none()
        
        # Log authentication attempt
        auth_attempt = AuthAttempt(
            user_id=user.id if user else None,
            email=credentials.email,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Check if user exists
        if not user:
            auth_attempt.failure_reason = "User not found"
            db.add(auth_attempt)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is active
        if not user.is_active:
            auth_attempt.failure_reason = "Account disabled"
            db.add(auth_attempt)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            auth_attempt.failure_reason = "Account locked"
            db.add(auth_attempt)
            await db.commit()
            
            lock_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account is locked. Try again in {lock_minutes} minutes"
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account if threshold reached
            if user.failed_login_attempts >= settings.ACCOUNT_LOCKOUT_THRESHOLD:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=settings.ACCOUNT_LOCKOUT_DURATION_MINUTES
                )
                auth_attempt.failure_reason = "Invalid password - account locked"
            else:
                auth_attempt.failure_reason = "Invalid password"
            
            db.add(auth_attempt)
            await db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Reset failed login attempts on successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        
        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.name
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Create session
        session = UserSession(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        # Log successful authentication
        auth_attempt.success = True
        
        db.add(session)
        db.add(auth_attempt)
        await db.commit()
        await db.refresh(user)
        
        return user, access_token, refresh_token
    
    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        refresh_token: str
    ) -> str:
        """
        Refresh access token using refresh token.
        
        Args:
            db: Database session
            refresh_token: Refresh token
            
        Returns:
            New access token
            
        Raises:
            HTTPException: If refresh token is invalid
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if session exists
        result = await db.execute(
            select(UserSession).where(UserSession.refresh_token == refresh_token)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if session expired
        if session.expires_at < datetime.utcnow():
            await db.delete(session)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired"
            )
        
        # Create new access token
        token_data = {
            "sub": payload["sub"],
            "email": payload["email"],
            "role": payload["role"]
        }
        
        new_access_token = create_access_token(token_data)
        
        # Update session
        session.access_token = new_access_token
        await db.commit()
        
        return new_access_token
    
    @staticmethod
    async def logout(
        db: AsyncSession,
        access_token: str
    ) -> None:
        """
        Logout user by deleting session.
        
        Args:
            db: Database session
            access_token: Access token
        """
        result = await db.execute(
            select(UserSession).where(UserSession.access_token == access_token)
        )
        session = result.scalar_one_or_none()
        
        if session:
            await db.delete(session)
            await db.commit()
    
    @staticmethod
    async def create_password_reset_token(
        db: AsyncSession,
        email: str
    ) -> Optional[str]:
        """
        Create password reset token for user.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            Reset token or None if user not found
        """
        # Get user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Generate secure token
        reset_token = secrets.token_urlsafe(32)
        
        # Create password reset record
        password_reset = PasswordReset(
            user_id=user.id,
            reset_token=reset_token,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
        db.add(password_reset)
        await db.commit()
        
        return reset_token
    
    @staticmethod
    async def reset_password(
        db: AsyncSession,
        reset_token: str,
        new_password: str
    ) -> None:
        """
        Reset user password using reset token.
        
        Args:
            db: Database session
            reset_token: Password reset token
            new_password: New password
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        # Get password reset record
        result = await db.execute(
            select(PasswordReset).where(
                and_(
                    PasswordReset.reset_token == reset_token,
                    PasswordReset.is_used == False
                )
            )
        )
        password_reset = result.scalar_one_or_none()
        
        if not password_reset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        # Check if token expired
        if password_reset.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        
        # Get user
        user = await db.get(User, password_reset.user_id)
        
        # Update password
        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        
        # Mark token as used
        password_reset.is_used = True
        password_reset.used_at = datetime.utcnow()
        
        await db.commit()
