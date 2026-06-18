"""SQLAlchemy ORM models."""

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


class SupplierAnalysis(Base):
    """Stored supplier quote comparison report."""

    __tablename__ = "supplier_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recommended_supplier: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class ContractReview(Base):
    """Stored contract risk assessment report."""

    __tablename__ = "contract_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class SpendReport(Base):
    """Stored procurement spend analysis report."""

    __tablename__ = "spend_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    total_spend: Mapped[float] = mapped_column(Float, nullable=False)
    savings_estimate: Mapped[float] = mapped_column(Float, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
