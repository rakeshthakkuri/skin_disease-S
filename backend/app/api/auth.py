"""
Authentication API endpoints and security utilities
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.services.user_service import create_user, authenticate_user, update_user
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import User

router = APIRouter()

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt




@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        user = create_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth,
            gender=user_data.gender
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=30)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            skin_type=user.skin_type,
            preferences=user.preferences,
            created_at=user.created_at
        )
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token."""
    user = authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=30)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            skin_type=user.skin_type,
            preferences=user.preferences,
            created_at=user.created_at
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        date_of_birth=current_user.date_of_birth,
        gender=current_user.gender,
        skin_type=current_user.skin_type,
        preferences=current_user.preferences,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user information."""
    updated_user = update_user(
        db=db,
        user_id=str(current_user.id),
        full_name=user_update.full_name,
        phone=user_update.phone,
        date_of_birth=user_update.date_of_birth,
        gender=user_update.gender,
        skin_type=user_update.skin_type,
        preferences=user_update.preferences
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        full_name=updated_user.full_name,
        phone=updated_user.phone,
        date_of_birth=updated_user.date_of_birth,
        gender=updated_user.gender,
        skin_type=updated_user.skin_type,
        preferences=updated_user.preferences,
        created_at=updated_user.created_at
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout (client should remove token)."""
    return {"message": "Successfully logged out"}

