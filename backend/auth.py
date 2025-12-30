"""
auth.py — Password hashing and JWT utilities for CodeVision.

Security guarantees:
  - Passwords are hashed with bcrypt (cost factor 12) via passlib.
    Plain-text passwords are NEVER stored, logged, or returned.
  - Access tokens are short-lived HS256 JWTs.  The secret comes
    exclusively from the JWT_SECRET_KEY environment variable.
  - Refresh tokens are cryptographically random 64-byte hex strings.
    Only their SHA-256 hash is stored in the database — the plaintext
    is only ever held in memory and sent to the client once.
  - JWTs and token hashes are NEVER written to any log.
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User

load_dotenv()

# ── Configuration (from environment — never hardcoded) ───────────────────────

JWT_SECRET_KEY              = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM               = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set. "
        "Set it in your .env file or environment before starting the server."
    )

# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of plain_password. Never call with an already-hashed value."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True iff plain_password matches the stored bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── Access token (JWT) ────────────────────────────────────────────────────────

def create_access_token(user_id: int, email: str, full_name: str) -> str:
    """
    Create a short-lived HS256 JWT containing the user's id, email, and full_name.
    Expiry is set to ACCESS_TOKEN_EXPIRE_MINUTES from now (UTC).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":       str(user_id),
        "email":     email,
        "full_name": full_name,
        "exp":       expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


# ── Refresh token ─────────────────────────────────────────────────────────────

def create_refresh_token() -> str:
    """
    Generate a cryptographically random 64-byte hex string.
    This plaintext value is returned to the client and stored in sessionStorage.
    Only its SHA-256 hash is persisted in the database.
    """
    return secrets.token_hex(64)


def hash_token(token: str) -> str:
    """Return the SHA-256 hex digest of a refresh token for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_token_expires_at() -> datetime:
    """Return the UTC expiry datetime for a new refresh token."""
    return datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)


# ── Current-user dependency ───────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that:
      1. Extracts the Bearer token from the Authorization header.
      2. Decodes and validates the JWT (signature + expiry).
      3. Looks up the user in the database.
      4. Returns the User ORM object, or raises HTTP 401.

    The raw token is NEVER logged.
    """
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise _CREDENTIALS_EXCEPTION
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise _CREDENTIALS_EXCEPTION

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _CREDENTIALS_EXCEPTION

    return user
