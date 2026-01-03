"""
database.py — SQLAlchemy engine and session factory for CodeVision.

All connection parameters are read from environment variables so that
switching from a local MySQL instance to a managed cloud host is a
pure env-var change with no source-code edits.

Required env vars (defined in .env.example):
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

Optional env vars:
  DB_SSL_CA_CONTENT — full PEM text of the CA certificate (required for
                      Aiven-hosted MySQL which enforces SSL). When set,
                      the certificate is written to /tmp/ca.pem at startup
                      and used for the SSL connection. Leave unset for
                      local development (SSL is skipped).

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

# ── SSL / CA certificate (Aiven & other managed MySQL hosts) ──────────────────
# Aiven enforces SSL and requires a CA certificate to verify the server.
# Render's build filesystem is read-only, but /tmp is always writable at runtime.
# We write the PEM text from the env var to /tmp/ca.pem once at startup.
#
# To configure:
#   1. Copy the CA certificate text from your Aiven console (or provider).
#   2. Paste the full PEM into the DB_SSL_CA_CONTENT env var in Render dashboard.
#   3. Keep DB_SSL_CA_CONTENT unset locally — SSL is skipped automatically.

_ssl_ca_content = os.getenv("DB_SSL_CA_CONTENT", "").strip()
_ssl_connect_args = {}

if _ssl_ca_content:
    _ca_path = "/tmp/ca.pem"
    with open(_ca_path, "w") as _f:
        _f.write(_ssl_ca_content)
    # PyMySQL passes ssl kwargs directly to the underlying ssl module
    _ssl_connect_args = {"ssl": {"ca": _ca_path}}

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: verify connections before use so stale connections
# from the pool don't cause cryptic errors.
engine = create_engine(
    DATABASE_URL,
    connect_args=_ssl_connect_args,
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
