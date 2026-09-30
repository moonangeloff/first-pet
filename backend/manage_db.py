import asyncio
import sys
import argparse
from sqlalchemy import select
from database import AsyncSessionLocal
from models import User, Role
from auth import get_password_hash

async def create_user(username, email, password, role_name):
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(select(User).where(User.username == username.lower()))
        if result.scalar_one_or_none():
            print(f"Error: User '{username}' already exists.")
            return

        # Get role
        role_result = await session.execute(select(Role).where(Role.name == role_name))
        role = role_result.scalar_one_or_none()
        if not role:
            print(f"Error: Role '{role_name}' not found.")
            return

        hashed_password = get_password_hash(password)
        new_user = User(
            username=username.lower(),
            email=email,
            password_hash=hashed_password,
            role_id=role.role_id
        )
        session.add(new_user)
        await session.commit()
        print(f"User '{username}' created successfully as '{role_name}'.")

async def update_password(username, new_password):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == username.lower()))
        user = result.scalar_one_or_none()
        if not user:
            print(f"Error: User '{username}' not found.")
            return

        user.password_hash = get_password_hash(new_password)
        await session.commit()
        print(f"Password updated for user '{username}'.")

async def list_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print("\nExisting Users:")
        for u in users:
            role_result = await session.execute(select(Role).where(Role.role_id == u.role_id))
            role = role_result.scalar_one()
            print(f"- {u.username} ({u.email}) [Role: {role.name}]")

def main():
    parser = argparse.ArgumentParser(description="HelpDesk DB Management Tool")
    subparsers = parser.add_subparsers(dest="command")

    # Create User
    create_parser = subparsers.add_parser("create", help="Create a new user")
    create_parser.add_argument("username")
    create_parser.add_argument("email")
    create_parser.add_argument("password")
    create_parser.add_argument("--role", default="admin", choices=["admin", "agent", "client"])

    # Update Password
    pass_parser = subparsers.add_parser("passwd", help="Update user password")
    pass_parser.add_argument("username")
    pass_parser.add_argument("new_password")

    # List Users
    subparsers.add_parser("list", help="List all users")

    args = parser.parse_args()

    if args.command == "create":
        asyncio.run(create_user(args.username, args.email, args.password, args.role))
    elif args.command == "passwd":
        asyncio.run(update_password(args.username, args.new_password))
    elif args.command == "list":
        asyncio.run(list_users())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
