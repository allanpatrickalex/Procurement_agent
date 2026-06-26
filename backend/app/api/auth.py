"""Authentication API: register, login, me."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.database.models import Organization, User
from app.services.auth_service import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    org_name: str = "My Organization"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    org_id: int
    role: str
    email: str
    org_name: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Create a new organization and admin user."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    org = Organization(name=req.org_name, plan_tier="starter")
    db.add(org)
    db.flush()

    user = User(
        org_id=org.id,
        email=req.email,
        hashed_password=hash_password(req.password),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(org)

    token = create_access_token(user.id, org.id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        org_id=org.id,
        role=user.role,
        email=user.email,
        org_name=org.name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate and return a JWT token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    org = db.get(Organization, user.org_id)
    token = create_access_token(user.id, user.org_id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        org_id=user.org_id,
        role=user.role,
        email=user.email,
        org_name=org.name if org else "Unknown",
    )


@router.get("/me", response_model=TokenResponse)
def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Return the current user's profile."""
    user = db.get(User, current_user.id)
    org = db.get(Organization, current_user.org_id)
    if not user or not org:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token(user.id, org.id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        org_id=org.id,
        role=user.role,
        email=user.email,
        org_name=org.name,
    )
