from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from executor import execute_code

app = FastAPI(
    title="CodeVision API",
    description="Step-by-step Python code execution visualizer backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodeRequest(BaseModel):
    code: str


@app.get("/")
def root():
    return {"message": "CodeVision API is running", "version": "1.0.0"}


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
        result = execute_code(request.code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
