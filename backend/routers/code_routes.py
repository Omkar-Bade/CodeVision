"""
routers/code_routes.py — Saved-code and execution-history endpoints.

All endpoints are protected: they require a valid JWT in the
Authorization: Bearer header (via the get_current_user dependency).

Ownership is enforced on every read/write/delete operation:
  - Every query filters by `user_id == current_user.id`.
  - A user who requests /codes/{id} belonging to another user receives
    a 404 (not a 403) to avoid confirming that the ID exists at all.

No raw SQL — all queries go through SQLAlchemy's ORM/parameterized layer.

Endpoints:
  POST   /codes         — save a code snippet
  GET    /codes         — list current user's saved snippets (summary only)
  GET    /codes/{id}    — get one snippet with full code_content
  DELETE /codes/{id}    — delete a snippet (only if owned by current user)
  POST   /history       — log an execution event
  GET    /history       — list current user's execution history (newest first)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from auth import get_current_user
from database import get_db
from models import ExecutionHistory, SavedCode, User
from schemas import (
    HistoryCreate,
    HistoryResponse,
    SavedCodeCreate,
    SavedCodeResponse,
    SavedCodeSummary,
)

router = APIRouter(tags=["codes"])


# ── POST /codes ───────────────────────────────────────────────────────────────

@router.post("/codes", response_model=SavedCodeResponse, status_code=status.HTTP_201_CREATED)
def save_code(
    body:         SavedCodeCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Save a new code snippet for the authenticated user."""
    new_code = SavedCode(
        user_id      = current_user.id,
        title        = body.title,
        code_content = body.code_content,
        language     = body.language,
    )
    db.add(new_code)
    db.commit()
    db.refresh(new_code)
    return new_code


# ── GET /codes ────────────────────────────────────────────────────────────────

@router.get("/codes", response_model=List[SavedCodeSummary])
def list_codes(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Return a summary list (no code_content) of all saved snippets for the
    current user, ordered by most recently updated first.
    """
    codes = (
        db.query(SavedCode)
        .filter(SavedCode.user_id == current_user.id)
        .order_by(SavedCode.updated_at.desc())
        .all()
    )
    return codes


# ── GET /codes/{id} ───────────────────────────────────────────────────────────

@router.get("/codes/{code_id}", response_model=SavedCodeResponse)
def get_code(
    code_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Return a single saved snippet including its full code_content.
    Returns 404 if the snippet does not exist OR belongs to another user
    (ownership check doubles as existence check to avoid ID enumeration).
    """
    code = (
        db.query(SavedCode)
        .filter(
            SavedCode.id      == code_id,
            SavedCode.user_id == current_user.id,
        )
        .first()
    )
    if not code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code not found.")
    return code


# ── DELETE /codes/{id} ────────────────────────────────────────────────────────

@router.delete("/codes/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_code(
    code_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Delete a saved snippet.  Returns 404 if not found or not owned by the
    current user — the caller cannot determine which case applies.
    """
    code = (
        db.query(SavedCode)
        .filter(
            SavedCode.id      == code_id,
            SavedCode.user_id == current_user.id,
        )
        .first()
    )
    if not code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code not found.")

    db.delete(code)
    db.commit()


# ── POST /history ─────────────────────────────────────────────────────────────

@router.post("/history", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
def log_history(
    body:         HistoryCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Log one execution event.  Called by the frontend after a successful
    /execute response (best-effort — the client does not block on this).

    If saved_code_id is provided, verify it belongs to the current user
    before linking; if not, set it to NULL to avoid cross-user linkage.
    """
    safe_saved_code_id = None
    if body.saved_code_id is not None:
        owned = (
            db.query(SavedCode)
            .filter(
                SavedCode.id      == body.saved_code_id,
                SavedCode.user_id == current_user.id,
            )
            .first()
        )
        if owned:
            safe_saved_code_id = body.saved_code_id

    entry = ExecutionHistory(
        user_id        = current_user.id,
        saved_code_id  = safe_saved_code_id,
        code_snapshot  = body.code_snapshot,
        total_steps    = body.total_steps,
        had_error      = body.had_error,
        output_summary = body.output_summary,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ── GET /history ──────────────────────────────────────────────────────────────

@router.get("/history", response_model=List[HistoryResponse])
def get_history(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
    limit:        int     = 50,
):
    """
    Return the most recent `limit` execution history entries for the current
    user, ordered by executed_at descending (newest first).
    """
    rows = (
        db.query(ExecutionHistory)
        .filter(ExecutionHistory.user_id == current_user.id)
        .order_by(ExecutionHistory.executed_at.desc())
        .limit(limit)
        .all()
    )
    return rows
