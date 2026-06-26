"""Shared FastAPI dependencies: auth, org scoping."""

import os
import logging
from typing import NamedTuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User
from app.services.auth_service import decode_token

logger = logging.getLogger(__name__)

REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() in {"1", "true", "yes"}

_bearer = HTTPBearer(auto_error=False)


class CurrentUser(NamedTuple):
    id: int
    org_id: int
    role: str


_DEV_USER = CurrentUser(id=1, org_id=1, role="admin")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """
    Resolve the current user from a JWT Bearer token.

    In local development (REQUIRE_AUTH=false), all requests are treated
    as the default admin user of org 1 when no token is provided.
    """
    if not REQUIRE_AUTH and credentials is None:
        return _DEV_USER

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
        org_id = int(payload["org"])
        role = str(payload.get("role", "analyst"))
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = db.get(User, user_id)
    if user is None or user.org_id != org_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return CurrentUser(id=user_id, org_id=org_id, role=role)


def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user
