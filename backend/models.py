"""
models.py — SQLAlchemy ORM models for CodeVision.

Each class maps 1:1 to a table in codevision_db.  Column names and types
match the SQL schema exactly so there is no mismatch between the ORM layer
and the actual database.

Tables:
  users               — registered accounts
  saved_codes         — editor snapshots saved by users
  execution_history   — one row per /execute run
  refresh_tokens      — hashed long-lived tokens for silent re-auth
"""

from datetime import datetime
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String,
    Text, TIMESTAMP, func,
)
from sqlalchemy.orm import relationship
from database import Base


# ── User ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, autoincrement=True, index=True)
    full_name     = Column(String(100), nullable=False)
    email         = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    updated_at    = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    # Relationships — back-populates for bidirectional access
    saved_codes       = relationship("SavedCode",       back_populates="owner",  cascade="all, delete-orphan")
    execution_history = relationship("ExecutionHistory", back_populates="owner",  cascade="all, delete-orphan")
    refresh_tokens    = relationship("RefreshToken",     back_populates="owner",  cascade="all, delete-orphan")


# ── SavedCode ─────────────────────────────────────────────────────────────────

class SavedCode(Base):
    __tablename__ = "saved_codes"

    id           = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title        = Column(String(150), default="Untitled")
    code_content = Column(Text(16777215), nullable=False)  # MEDIUMTEXT
    language     = Column(String(20), default="python")
    created_at   = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    updated_at   = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    owner    = relationship("User",            back_populates="saved_codes")
    history  = relationship("ExecutionHistory", back_populates="saved_code")


# ── ExecutionHistory ──────────────────────────────────────────────────────────

class ExecutionHistory(Base):
    __tablename__ = "execution_history"

    id             = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_code_id  = Column(Integer, ForeignKey("saved_codes.id", ondelete="SET NULL"), nullable=True)
    code_snapshot  = Column(Text(16777215), nullable=False)  # MEDIUMTEXT
    total_steps    = Column(Integer, default=0)
    had_error      = Column(Boolean, default=False)
    output_summary = Column(Text, nullable=True)
    executed_at    = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    owner      = relationship("User",      back_populates="execution_history")
    saved_code = relationship("SavedCode", back_populates="history")


# ── RefreshToken ──────────────────────────────────────────────────────────────

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)
    revoked    = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    owner = relationship("User", back_populates="refresh_tokens")
