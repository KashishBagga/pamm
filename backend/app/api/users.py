"""
User management and configuration API endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.core.database import get_db
from app.models import User, Role, Location, Team
from app.schemas import (
    RoleResponse,
    LocationResponse,
    TeamResponse,
    UserListItem,
    PaginatedResponse
)
from app.api.dependencies import get_current_admin_user

router = APIRouter(tags=["Users & Configuration"])


@router.get("/users", response_model=dict)
async def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    role: Optional[str] = None,
    location: Optional[str] = None,
    team: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users with pagination and filtering (Admin only).
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    - **role**: Filter by role name
    - **location**: Filter by location code
    - **team**: Filter by team code
    - **search**: Search by name or email
    """
    # Build query
    query = select(User)
    
    # Apply filters
    if role:
        query = query.join(Role).where(Role.name == role)
    if location:
        query = query.join(Location).where(Location.code == location)
    if team:
        query = query.join(Team).where(Team.code == team)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Format response
    user_list = []
    for user in users:
        # Fetch relationships if not loaded
        await db.refresh(user, ["role", "location", "team"])
        user_list.append(UserListItem(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.display_name,
            location=user.location.code,
            team=user.team.code,
            is_active=user.is_active,
            created_at=user.created_at
        ))
    
    return {
        "success": True,
        "data": {
            "users": user_list,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit
            }
        }
    }


@router.get("/config/roles", response_model=dict)
async def get_roles(db: AsyncSession = Depends(get_db)):
    """
    Get all available roles.
    
    Public endpoint - no authentication required.
    """
    result = await db.execute(select(Role).order_by(Role.hierarchy_level))
    roles = result.scalars().all()
    
    return {
        "success": True,
        "data": [RoleResponse.model_validate(role) for role in roles]
    }


@router.get("/config/locations", response_model=dict)
async def get_locations(db: AsyncSession = Depends(get_db)):
    """
    Get all available locations.
    
    Public endpoint - no authentication required.
    """
    result = await db.execute(
        select(Location)
        .where(Location.is_active == True)
        .order_by(Location.name)
    )
    locations = result.scalars().all()
    
    return {
        "success": True,
        "data": [LocationResponse.model_validate(location) for location in locations]
    }


@router.get("/config/teams", response_model=dict)
async def get_teams(db: AsyncSession = Depends(get_db)):
    """
    Get all available teams.
    
    Public endpoint - no authentication required.
    """
    result = await db.execute(
        select(Team)
        .where(Team.is_active == True)
        .order_by(Team.name)
    )
    teams = result.scalars().all()
    
    return {
        "success": True,
        "data": [TeamResponse.model_validate(team) for team in teams]
    }
