"""SQLAlchemy database session and engine configuration."""

import logging
import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _resolve_database_url() -> str:
    """Resolve DATABASE_URL, anchoring relative SQLite paths to the project root."""
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
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables."""
    from app.database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized at %s", DATABASE_URL)
