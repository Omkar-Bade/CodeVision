"""
database.py — SQLAlchemy engine and session factory for CodeVision.

All connection parameters are read from environment variables so that
switching from a local MySQL instance to a managed cloud host is a
pure env-var change with no source-code edits.

Required env vars (defined in .env.example):
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

Usage in FastAPI routes:
  def my_route(db: Session = Depends(get_db)):
      ...
"""

import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load .env file if present (no-op in production where vars are set externally)
load_dotenv()

# ── Connection string ─────────────────────────────────────────────────────────
# Uses the PyMySQL driver: mysql+pymysql://user:pass@host:port/dbname
# charset=utf8mb4 matches the database's CHARACTER SET so emojis / Unicode work.
# quote_plus() URL-encodes the password so special characters (e.g. @, #, %)
# don't confuse the URL parser — critical when passwords contain @ symbols.

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "3306")
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", ""))   # safely encode special chars
DB_NAME     = os.getenv("DB_NAME", "codevision_db")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: verify connections before use so stale connections
# from the pool don't cause cryptic errors.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,   # recycle connections after 1 hour to avoid MySQL's
                         # 8-hour wait_timeout disconnect
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative base ──────────────────────────────────────────────────────────
# All ORM models inherit from this base.
Base = declarative_base()


# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_db():
    """
    Yield a SQLAlchemy session for the duration of a single request,
    then close it in the finally block regardless of success or failure.

    Use as a FastAPI dependency:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
