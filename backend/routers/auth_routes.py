"""
routers/auth_routes.py — Authentication endpoints for CodeVision.

Endpoints:
  POST /auth/register  — create account, return tokens
  POST /auth/login     — verify credentials, return tokens
  POST /auth/refresh   — exchange refresh token for new access token
  POST /auth/logout    — revoke the refresh token
  GET  /auth/me        — return the current user's profile

Security notes:
  - Passwords hashed with bcrypt — never stored or returned in plain text.
  - Refresh tokens stored as SHA-256 hashes — the plaintext is only sent
    to the client once and is never persisted or logged.
  - Timing-safe password comparison via passlib.verify (constant-time).
  - Generic error messages for login failures to prevent user enumeration.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    hash_token,
    refresh_token_expires_at,
    verify_password,
)
from database import get_db
from models import RefreshToken, User
from schemas import (
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _issue_tokens(user: User, db: Session) -> TokenResponse:
    """
    Create a new access + refresh token pair for `user`, persist the
    refresh token hash, and return the plaintext values to the caller.
    """
    access_token  = create_access_token(user.id, user.email, user.full_name)
    refresh_token = create_refresh_token()

    db_token = RefreshToken(
        user_id    = user.id,
        token_hash = hash_token(refresh_token),
        expires_at = refresh_token_expires_at(),
        revoked    = False,
    )
    db.add(db_token)
    db.commit()

    return TokenResponse(
        access_token  = access_token,
        refresh_token = refresh_token,
    )


# ── POST /auth/register ───────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.  Returns access + refresh tokens on success so the
    client can immediately enter the app without a separate login step.
    """
    # Check for duplicate email
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Hash password — the plain-text value is discarded after this line
    new_user = User(
        full_name     = body.full_name,
        email         = body.email,
        password_hash = hash_password(body.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _issue_tokens(new_user, db)


# ── POST /auth/login ──────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.  Uses a generic error message on
    failure to prevent user enumeration (do not reveal whether the email
    exists or only the password is wrong).
    """
    _AUTH_ERROR = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise _AUTH_ERROR

    if not verify_password(body.password, user.password_hash):
        raise _AUTH_ERROR

    return _issue_tokens(user, db)


# ── POST /auth/refresh ────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid (non-expired, non-revoked) refresh token for a new
    access token.  The old refresh token is revoked and a new one is issued
    (token rotation) to limit the blast radius of a leaked refresh token.
    """
    token_hash = hash_token(body.refresh_token)
    now        = datetime.now(timezone.utc)

    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked    == False,       # noqa: E712
            RefreshToken.expires_at >  now,
        )
        .first()
    )

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    # Revoke the used token (rotation)
    db_token.revoked = True
    db.commit()

    return _issue_tokens(user, db)


# ── POST /auth/logout ─────────────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    body: LogoutRequest,
    db:   Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Revoke the provided refresh token.  The access token will expire on its
    own (short-lived); the client should discard it from memory immediately.
    Always returns 204 even if the token was already revoked or not found,
    to avoid leaking information.
    """
    token_hash = hash_token(body.refresh_token)
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id    == _current_user.id,
        )
        .first()
    )
    if db_token:
        db_token.revoked = True
        db.commit()
    # Return 204 regardless — do not reveal whether token existed


# ── GET /auth/me ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """
    Return the authenticated user's profile.  Requires a valid access token
    in the Authorization: Bearer header.
    """
    return current_user
