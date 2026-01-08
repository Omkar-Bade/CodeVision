"""
main.py — FastAPI application entry point for CodeVision.

Routers:
  /auth/*   — authentication (register, login, refresh, logout, me)
  /codes    — saved code CRUD (protected)
  /history  — execution history (protected)
  /execute  — Python execution engine (unchanged, no auth required)

Static file serving:
  The compiled React/Vite frontend (frontend/dist/) is mounted at "/"
  AFTER all API routes are registered.  FastAPI evaluates routes in
  registration order, so all /auth/*, /codes, /history, /execute, and
  /health routes are matched first; only unmatched paths fall through to
  the static file handler.  This is what makes the SPA's own routing work.

Startup:
  A lifespan context manager calls Base.metadata.create_all(bind=engine)
  once on startup.  This is idempotent — tables that already exist are
  left untouched (SQLAlchemy emits CREATE TABLE IF NOT EXISTS).  It means
  the first deployment on a fresh database automatically creates all tables
  without a separate migration step.

The execution engine (executor.py) is never modified by the auth migration.
"""

from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load .env before anything else so every module can read env vars at import time
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

from database import Base, engine
import models  # noqa: F401 — importing registers all ORM classes on Base
from executor import execute_code
from routers.auth_routes import router as auth_router
from routers.code_routes import router as code_router
from routers.ws_routes import router as ws_router


# ── Startup / shutdown lifecycle ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when Uvicorn starts the application.

    create_all() is safe to call on every startup:
      - Tables that already exist are NOT modified (idempotent).
      - Tables that are missing ARE created from the ORM model definitions.
    This removes the need for a separate DB-init step on first deploy.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # (shutdown code would go after yield — nothing needed here)

app = FastAPI(
    title="CodeVision API",
    description="Step-by-step Python code execution visualizer backend",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production, frontend and backend share the same origin (single Render
# service), so cross-origin requests do not occur.  CORS is kept here so the
# dev server (localhost:3000) still works, and as a fallback if ALLOWED_ORIGINS
# is set for any external consumers of the API.
#
# Set ALLOWED_ORIGINS env var (comma-separated) in Render dashboard if needed.
# Leave it unset in production (same-origin setup) — localhost fallback is used.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

ALLOWED_ORIGINS = _extra_origins or [
    "http://localhost:5173",      # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",      # Vite alternative port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)   # prefix="/auth" is set in the router itself
app.include_router(code_router)   # no prefix — /codes, /history
app.include_router(ws_router)     # WebSocket /ws/execute — interactive console


# ── Execution engine (unchanged) ──────────────────────────────────────────────
# This block is identical to the original main.py.
# executor.py is NOT modified by the auth migration.

class CodeRequest(BaseModel):
    code:   str
    inputs: Optional[List[str]] = None


@app.get("/health")
def health():
    return {"status": "healthy", "service": "CodeVision Backend"}


@app.post("/execute")
def execute(request: CodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if len(request.code) > 10_000:
        raise HTTPException(status_code=400, detail="Code is too long (max 10,000 characters)")

    try:
        result = execute_code(request.code, request.inputs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Static file serving (React SPA) ───────────────────────────────────────────
# Mounted LAST so API routes registered above are never shadowed.
# html=True enables:
#   - Serving index.html for directory requests (e.g. GET /)
#   - Falling back to index.html for any path not matching a static asset,
#     which is what lets React Router handle /visualizer, /courses, etc.
#
# Path: backend/ and frontend/ are sibling folders, so from backend/main.py
# the dist directory is one level up then into frontend/dist.
# On Render the working directory is the repo root, so use frontend/dist directly.

_dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
_dist_dir = os.path.abspath(_dist_dir)

if os.path.isdir(_dist_dir):
    app.mount("/", StaticFiles(directory=_dist_dir, html=True), name="static")
else:
    # In development (before a frontend build exists), skip mounting
    # so the API is still accessible without needing to build the frontend.
    import warnings
    warnings.warn(
        f"frontend/dist not found at {_dist_dir}. "
        "Run `npm run build` inside frontend/ to enable static file serving.",
        stacklevel=1,
    )
