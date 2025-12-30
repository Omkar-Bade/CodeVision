"""
main.py — FastAPI application entry point for CodeVision.

Routers:
  /auth/*   — authentication (register, login, refresh, logout, me)
  /codes    — saved code CRUD (protected)
  /history  — execution history (protected)
  /execute  — Python execution engine (unchanged, no auth required)

The execution engine (executor.py) is never modified by the auth migration.
"""

from dotenv import load_dotenv

# Load .env before anything else so every module can read env vars at import time
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from executor import execute_code
from routers.auth_routes import router as auth_router
from routers.code_routes import router as code_router

app = FastAPI(
    title="CodeVision API",
    description="Step-by-step Python code execution visualizer backend",
    version="3.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_credentials=True is required for the Authorization header to be sent
# cross-origin.  Restrict origins to the frontend dev server in development;
# update this list (or read from an env var) when deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",     # Vite default port
        "http://127.0.0.1:5173",
        "http://localhost:3000",     # Vite alternative port (your current setup)
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)   # prefix="/auth" is set in the router itself
app.include_router(code_router)   # no prefix — /codes, /history


# ── Execution engine (unchanged) ──────────────────────────────────────────────
# This block is identical to the original main.py.
# executor.py is NOT modified by the auth migration.

class CodeRequest(BaseModel):
    code:   str
    inputs: Optional[List[str]] = None


@app.get("/")
def root():
    return {"message": "CodeVision API is running", "version": "3.0.0"}


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
