"""
User service for managing users with database
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.db_models import User
import uuid
import bcrypt


# Password hashing utilities
def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    if not password:
        raise ValueError("Password cannot be empty")
    
    # Bcrypt has a 72-byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    if not plain_password or not hashed_password:
        return False
    
    # Bcrypt has a 72-byte limit, truncate if necessary
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Ensure hashed_password is bytes
    if isinstance(hashed_password, str):
        hashed_password_bytes = hashed_password.encode('utf-8')
    else:
        hashed_password_bytes = hashed_password
    
    try:
        return bcrypt.checkpw(password_bytes, hashed_password_bytes)
    except Exception:
        return False


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    **kwargs
) -> User:
    """Create a new user."""
    # Check if user already exists
    existing_user = db.execute(
        select(User).where(User.email == email.lower())
    ).scalar_one_or_none()
    
    if existing_user:
        raise ValueError("Email already registered")
    
    password_hash = get_password_hash(password)
    user = User(
        id=uuid.uuid4(),
        email=email.lower(),
        password_hash=password_hash,
        full_name=full_name,
        phone=kwargs.get("phone"),
        date_of_birth=kwargs.get("date_of_birth"),
        gender=kwargs.get("gender"),
        skin_type=kwargs.get("skin_type", "normal"),
        preferences=kwargs.get("preferences", {})
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.execute(
        select(User).where(User.email == email.lower())
    ).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID."""
    try:
        user_uuid = uuid.UUID(user_id)
        return db.execute(
            select(User).where(User.id == user_uuid)
        ).scalar_one_or_none()
    except ValueError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def update_user(db: Session, user_id: str, **kwargs) -> Optional[User]:
    """Update user information."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    return user
