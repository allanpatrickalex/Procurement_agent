"""Dashboard API routes."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.database.models import ContractReview, SpendReport, SupplierAnalysis, SavingsEntry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardSummary(BaseModel):
    total_supplier_analyses: int
    total_contract_reviews: int
    total_spend_reports: int
    total_spend_analyzed: float
    total_savings_identified: float
    total_savings_realized: float
    high_risk_contracts: int


class SupplierAnalysisItem(BaseModel):
    id: int
    recommended_supplier: str
    score: float
    summary: str
    created_at: str


class ContractReviewItem(BaseModel):
    id: int
    risk_level: str
    summary: str
    contract_name: str | None = None
    created_at: str


class SpendReportItem(BaseModel):
    id: int
    total_spend: float
    savings_estimate: float
    summary: str
    created_at: str


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    supplier_analyses: list[SupplierAnalysisItem] = Field(default_factory=list)
    contract_reviews: list[ContractReviewItem] = Field(default_factory=list)
    spend_reports: list[SpendReportItem] = Field(default_factory=list)


def _org_filter(query, model, org_id: int):
    """Filter by org_id, or return all rows when org_id is not stored (legacy data)."""
    return query.where((model.org_id == org_id) | (model.org_id == None))  # noqa: E711


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> DashboardResponse:
    """Return dashboard metrics and historical reports scoped to the current org."""
    org_id = current_user.org_id

    supplier_rows = db.scalars(
        _org_filter(select(SupplierAnalysis), SupplierAnalysis, org_id)
        .order_by(SupplierAnalysis.created_at.desc())
    ).all()
    contract_rows = db.scalars(
        _org_filter(select(ContractReview), ContractReview, org_id)
        .order_by(ContractReview.created_at.desc())
    ).all()
    spend_rows = db.scalars(
        _org_filter(select(SpendReport), SpendReport, org_id)
        .order_by(SpendReport.created_at.desc())
    ).all()

    total_spend_analyzed = float(
        db.scalar(
            _org_filter(select(func.coalesce(func.sum(SpendReport.total_spend), 0.0)), SpendReport, org_id)
        ) or 0.0
    )
    total_savings_identified = float(
        db.scalar(
            _org_filter(select(func.coalesce(func.sum(SpendReport.savings_estimate), 0.0)), SpendReport, org_id)
        ) or 0.0
    )

    # Phase 2: realized savings from the savings ledger
    realized_savings = float(
        db.scalar(
            select(func.coalesce(func.sum(SavingsEntry.realized_amount), 0.0))
            .where(SavingsEntry.org_id == org_id)
        ) or 0.0
    )

    high_risk_contracts = sum(1 for row in contract_rows if row.risk_level == "High")

    summary = DashboardSummary(
        total_supplier_analyses=len(supplier_rows),
        total_contract_reviews=len(contract_rows),
        total_spend_reports=len(spend_rows),
        total_spend_analyzed=round(total_spend_analyzed, 2),
        total_savings_identified=round(total_savings_identified, 2),
        total_savings_realized=round(realized_savings, 2),
        high_risk_contracts=high_risk_contracts,
    )

    logger.info(
        "Dashboard loaded: suppliers=%d contracts=%d spend=%d org_id=%d",
        summary.total_supplier_analyses,
        summary.total_contract_reviews,
        summary.total_spend_reports,
        org_id,
    )

    return DashboardResponse(
        summary=summary,
        supplier_analyses=[
            SupplierAnalysisItem(
                id=row.id,
                recommended_supplier=row.recommended_supplier,
                score=row.score,
                summary=row.summary,
                created_at=row.created_at.isoformat(),
            )
            for row in supplier_rows
        ],
        contract_reviews=[
            ContractReviewItem(
                id=row.id,
                risk_level=row.risk_level,
                summary=row.summary,
                contract_name=row.contract_name,
                created_at=row.created_at.isoformat(),
            )
            for row in contract_rows
        ],
        spend_reports=[
            SpendReportItem(
                id=row.id,
                total_spend=row.total_spend,
                savings_estimate=row.savings_estimate,
                summary=row.summary,
                created_at=row.created_at.isoformat(),
            )
            for row in spend_rows
        ],
    )
