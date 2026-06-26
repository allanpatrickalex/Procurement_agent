"""SQLAlchemy database session and engine configuration."""

import logging
import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _resolve_database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///procurement.db")
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
        db_path = url.removeprefix("sqlite:///")
        path = Path(db_path)
        if not path.is_absolute():
            url = f"sqlite:///{PROJECT_ROOT / db_path}"
    return url


DATABASE_URL = _resolve_database_url()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=os.getenv("SQL_ECHO", "").lower() in {"1", "true", "yes"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for ORM models."""


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _add_column_if_missing(conn, table: str, column: str, col_type: str) -> None:
    """Add a column to an existing table if it doesn't exist (SQLite-compatible)."""
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        conn.commit()
        logger.info("Added column %s.%s", table, column)
    except Exception:
        pass  # Column already exists


def init_db() -> None:
    """Create all database tables and seed the default dev organization."""
    from app.database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Add new columns to existing tables for users upgrading from an older schema
    with engine.connect() as conn:
        _add_column_if_missing(conn, "supplier_analysis", "org_id", "INTEGER")
        _add_column_if_missing(conn, "contract_reviews", "org_id", "INTEGER")
        _add_column_if_missing(conn, "contract_reviews", "contract_name", "VARCHAR(255)")
        _add_column_if_missing(conn, "spend_reports", "org_id", "INTEGER")

    # Seed the default local development org and admin user
    _seed_dev_org()

    logger.info("Database initialized at %s", DATABASE_URL)


def _seed_dev_org() -> None:
    """Create org #1 and the default admin user if they don't exist."""
    from app.database.models import Organization, User
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        org = db.get(Organization, 1)
        if not org:
            org = Organization(id=1, name="Local Development", plan_tier="enterprise")
            db.add(org)
            db.flush()

        existing_admin = db.query(User).filter(User.email == "admin@local.dev").first()
        if not existing_admin:
            admin = User(
                org_id=1,
                email="admin@local.dev",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db.add(admin)

        db.commit()
        logger.info("Dev org seeded — login: admin@local.dev / admin123")
    except Exception as exc:
        db.rollback()
        logger.warning("Could not seed dev org: %s", exc)
    finally:
        db.close()
