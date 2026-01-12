"""
Seed database with initial data.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models import Role, Location, Team, User
from app.core.security import hash_password


async def seed_database():
    """Seed the database with initial data."""
    async with async_session_maker() as session:
        print("Starting database seeding...")
        
        # Seed Roles
        print("Seeding roles...")
        roles_data = [
            {
                "name": "admin",
                "display_name": "Admin",
                "description": "Full system access with all permissions",
                "hierarchy_level": 1
            },
            {
                "name": "manager",
                "display_name": "Manager",
                "description": "Team management and oversight capabilities",
                "hierarchy_level": 2
            },
            {
                "name": "user",
                "display_name": "User",
                "description": "Basic user access with limited permissions",
                "hierarchy_level": 3
            }
        ]
        
        roles = {}
        for role_data in roles_data:
            # Check if role already exists
            result = await session.execute(
                select(Role).where(Role.name == role_data["name"])
            )
            existing_role = result.scalar_one_or_none()
            
            if existing_role:
                print(f"  Role '{role_data['name']}' already exists, skipping...")
                roles[role_data["name"]] = existing_role
            else:
                role = Role(**role_data)
                session.add(role)
                roles[role_data["name"]] = role
        
        await session.commit()
        for role in roles.values():
            await session.refresh(role)
        
        # Seed Locations
        print("Seeding locations...")
        locations_data = [
            {"code": "US", "name": "United States", "timezone": "America/New_York"},
            {"code": "IN", "name": "India", "timezone": "Asia/Kolkata"},
            {"code": "EU", "name": "European Union", "timezone": "Europe/London"},
            {"code": "AU", "name": "Australia", "timezone": "Australia/Sydney"}
        ]
        
        locations = {}
        for location_data in locations_data:
            # Check if location already exists
            result = await session.execute(
                select(Location).where(Location.code == location_data["code"])
            )
            existing_location = result.scalar_one_or_none()
            
            if existing_location:
                print(f"  Location '{location_data['code']}' already exists, skipping...")
                locations[location_data["code"]] = existing_location
            else:
                location = Location(**location_data)
                session.add(location)
                locations[location_data["code"]] = location
        
        await session.commit()
        for location in locations.values():
            await session.refresh(location)
        
        # Seed Teams
        print("Seeding teams...")
        teams_data = [
            {
                "code": "AR",
                "name": "Accounts Receivable",
                "description": "Handles incoming payments and customer accounts"
            },
            {
                "code": "EPA",
                "name": "Environmental Protection Agency",
                "description": "Environmental compliance and protection"
            },
            {
                "code": "PRI",
                "name": "Priority Team",
                "description": "Handles high-priority tasks and urgent matters"
            }
        ]
        
        teams = {}
        for team_data in teams_data:
            # Check if team already exists
            result = await session.execute(
                select(Team).where(Team.code == team_data["code"])
            )
            existing_team = result.scalar_one_or_none()
            
            if existing_team:
                print(f"  Team '{team_data['code']}' already exists, skipping...")
                teams[team_data["code"]] = existing_team
            else:
                team = Team(**team_data)
                session.add(team)
                teams[team_data["code"]] = team
        
        await session.commit()
        for team in teams.values():
            await session.refresh(team)
        
        # Seed Users
        print("Seeding users...")
        users_data = [
            {
                "email": "admin@example.com",
                "password": "Admin123!",
                "full_name": "System Administrator",
                "role": "admin",
                "location": "US",
                "team": "AR"
            },
            {
                "email": "manager.us.ar@example.com",
                "password": "Manager123!",
                "full_name": "John Manager (US-AR)",
                "role": "manager",
                "location": "US",
                "team": "AR"
            },
            {
                "email": "manager.in.epa@example.com",
                "password": "Manager123!",
                "full_name": "Priya Manager (IN-EPA)",
                "role": "manager",
                "location": "IN",
                "team": "EPA"
            },
            {
                "email": "user.us.ar@example.com",
                "password": "User123!",
                "full_name": "Alice User (US-AR)",
                "role": "user",
                "location": "US",
                "team": "AR"
            },
            {
                "email": "user.in.epa@example.com",
                "password": "User123!",
                "full_name": "Raj User (IN-EPA)",
                "role": "user",
                "location": "IN",
                "team": "EPA"
            },
            {
                "email": "user.eu.pri@example.com",
                "password": "User123!",
                "full_name": "Emma User (EU-PRI)",
                "role": "user",
                "location": "EU",
                "team": "PRI"
            },
            {
                "email": "user.au.ar@example.com",
                "password": "User123!",
                "full_name": "Jack User (AU-AR)",
                "role": "user",
                "location": "AU",
                "team": "AR"
            }
        ]
        
        for user_data in users_data:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"  User '{user_data['email']}' already exists, skipping...")
            else:
                user = User(
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    full_name=user_data["full_name"],
                    role_id=roles[user_data["role"]].id,
                    location_id=locations[user_data["location"]].id,
                    team_id=teams[user_data["team"]].id
                )
                session.add(user)
        
        await session.commit()
        
        print("Database seeding completed successfully!")
        print("\nDemo Users:")
        print("-" * 60)
        for user_data in users_data:
            print(f"Email: {user_data['email']:<30} Password: {user_data['password']}")
        print("-" * 60)


if __name__ == "__main__":
    asyncio.run(seed_database())
