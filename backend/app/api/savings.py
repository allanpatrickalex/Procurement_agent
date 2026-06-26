"""Savings tracker API — Phase 2."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.database.models import SavingsEntry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/savings", tags=["Savings"])

VALID_STATUSES = {"identified", "in_progress", "realized"}


class SavingsEntryItem(BaseModel):
    id: int
    source_type: str
    source_id: int
    identified_amount: float
    realized_amount: float
    status: str
    category: str | None
    description: str | None
    created_at: str


class SavingsSummary(BaseModel):
    total_identified: float
    total_realized: float
    total_in_progress: float
    entries: list[SavingsEntryItem] = Field(default_factory=list)


class UpdateStatusRequest(BaseModel):
    status: str
    realized_amount: float | None = None


@router.get("", response_model=SavingsSummary)
def get_savings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SavingsSummary:
    """Return all savings entries and a rolled-up summary for the current org."""
    rows = db.scalars(
        select(SavingsEntry)
        .where(SavingsEntry.org_id == current_user.org_id)
        .order_by(SavingsEntry.created_at.desc())
    ).all()

    total_identified = sum(r.identified_amount for r in rows)
    total_realized = sum(r.realized_amount for r in rows if r.status == "realized")
    total_in_progress = sum(r.identified_amount for r in rows if r.status == "in_progress")

    return SavingsSummary(
        total_identified=round(total_identified, 2),
        total_realized=round(total_realized, 2),
        total_in_progress=round(total_in_progress, 2),
        entries=[
            SavingsEntryItem(
                id=r.id,
                source_type=r.source_type,
                source_id=r.source_id,
                identified_amount=r.identified_amount,
                realized_amount=r.realized_amount,
                status=r.status,
                category=r.category,
                description=r.description,
                created_at=r.created_at.isoformat(),
            )
            for r in rows
        ],
    )


@router.patch("/{entry_id}", response_model=SavingsEntryItem)
def update_savings_status(
    entry_id: int,
    req: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SavingsEntryItem:
    """Update the status and optionally the realized amount of a savings entry."""
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")

    entry = db.get(SavingsEntry, entry_id)
    if not entry or entry.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Savings entry not found")

    entry.status = req.status
    if req.realized_amount is not None:
        entry.realized_amount = req.realized_amount
    elif req.status == "realized" and entry.realized_amount == 0:
        entry.realized_amount = entry.identified_amount

    db.commit()
    db.refresh(entry)

    return SavingsEntryItem(
        id=entry.id,
        source_type=entry.source_type,
        source_id=entry.source_id,
        identified_amount=entry.identified_amount,
        realized_amount=entry.realized_amount,
        status=entry.status,
        category=entry.category,
        description=entry.description,
        created_at=entry.created_at.isoformat(),
    )
