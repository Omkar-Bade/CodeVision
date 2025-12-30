"""
schemas.py — Pydantic request/response models for CodeVision.

Pydantic v2 is used (FastAPI 0.109 ships with Pydantic v2 support).
All response models inherit from a base Config that enables ORM mode
(from_attributes=True) so SQLAlchemy row objects can be serialised
directly without manually converting to dicts.

password_hash is NEVER included in any response model.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Shared config ─────────────────────────────────────────────────────────────

class ORMBase(BaseModel):
    """Base class for all response models: enables SQLAlchemy ORM mode."""
    model_config = {"from_attributes": True}


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email:     str = Field(..., min_length=3, max_length=150)
    password:  str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email:    str
    password: str


class UserResponse(ORMBase):
    id:         int
    full_name:  str
    email:      str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


# ── Saved Codes ───────────────────────────────────────────────────────────────

class SavedCodeCreate(BaseModel):
    title:        str = Field(default="Untitled", max_length=150)
    code_content: str = Field(..., min_length=1)
    language:     str = Field(default="python", max_length=20)


class SavedCodeResponse(ORMBase):
    id:           int
    user_id:      int
    title:        str
    code_content: str
    language:     str
    created_at:   datetime
    updated_at:   datetime


class SavedCodeSummary(ORMBase):
    """Lightweight listing row — omits code_content to keep list responses small."""
    id:         int
    title:      str
    language:   str
    created_at: datetime
    updated_at: datetime


# ── Execution History ─────────────────────────────────────────────────────────

class HistoryCreate(BaseModel):
    code_snapshot:  str
    total_steps:    int  = 0
    had_error:      bool = False
    output_summary: Optional[str] = None
    saved_code_id:  Optional[int] = None


class HistoryResponse(ORMBase):
    id:             int
    user_id:        int
    saved_code_id:  Optional[int]
    total_steps:    int
    had_error:      bool
    output_summary: Optional[str]
    executed_at:    datetime
