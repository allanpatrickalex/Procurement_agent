"""Contract renewals and notifications API — Phase 3."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.database.models import ContractKeyDate, Notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/renewals", tags=["Renewals"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


class ContractKeyDateItem(BaseModel):
    id: int
    contract_id: int
    contract_name: str | None
    renewal_date: str | None
    notice_deadline: str | None
    expiry_date: str | None
    auto_renewal: bool
    notice_period_days: int | None
    status: str
    days_until_renewal: int | None
    days_until_notice: int | None
    urgency: str  # overdue | critical | warning | upcoming | ok


class NotificationItem(BaseModel):
    id: int
    type: str
    title: str
    message: str
    entity_type: str | None
    entity_id: str | None
    read: bool
    created_at: str


def _days_until(dt: datetime | None) -> int | None:
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (dt - now).days


def _urgency(days: int | None) -> str:
    if days is None:
        return "ok"
    if days < 0:
        return "overdue"
    if days <= 7:
        return "critical"
    if days <= 30:
        return "warning"
    if days <= 90:
        return "upcoming"
    return "ok"


@router.get("", response_model=list[ContractKeyDateItem])
def get_renewals(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[ContractKeyDateItem]:
    """Return all tracked contract key dates for the current org."""
    rows = db.scalars(
        select(ContractKeyDate)
        .where(ContractKeyDate.org_id == current_user.org_id)
        .where(ContractKeyDate.status == "active")
        .order_by(ContractKeyDate.renewal_date)
    ).all()

    return [
        ContractKeyDateItem(
            id=r.id,
            contract_id=r.contract_id,
            contract_name=r.contract_name,
            renewal_date=r.renewal_date.isoformat() if r.renewal_date else None,
            notice_deadline=r.notice_deadline.isoformat() if r.notice_deadline else None,
            expiry_date=r.expiry_date.isoformat() if r.expiry_date else None,
            auto_renewal=r.auto_renewal,
            notice_period_days=r.notice_period_days,
            status=r.status,
            days_until_renewal=_days_until(r.renewal_date),
            days_until_notice=_days_until(r.notice_deadline),
            urgency=_urgency(_days_until(r.notice_deadline) if r.notice_deadline else _days_until(r.renewal_date)),
        )
        for r in rows
    ]


@router.patch("/{key_date_id}/status")
def update_renewal_status(
    key_date_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Mark a contract key date as renewed or cancelled."""
    if status not in {"active", "renewed", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    kd = db.get(ContractKeyDate, key_date_id)
    if not kd or kd.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Not found")

    kd.status = status
    db.commit()
    return {"id": key_date_id, "status": status}


# ── Notification routes ────────────────────────────────────────────────────────

@notifications_router.get("", response_model=list[NotificationItem])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[NotificationItem]:
    """Return notifications for the current org."""
    query = select(Notification).where(Notification.org_id == current_user.org_id)
    if unread_only:
        query = query.where(Notification.read == False)  # noqa: E712
    rows = db.scalars(query.order_by(Notification.created_at.desc()).limit(50)).all()

    return [
        NotificationItem(
            id=r.id,
            type=r.type,
            title=r.title,
            message=r.message,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            read=r.read,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@notifications_router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    notif = db.get(Notification, notification_id)
    if not notif or notif.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    return {"id": notification_id, "read": True}


@notifications_router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    rows = db.scalars(
        select(Notification)
        .where(Notification.org_id == current_user.org_id)
        .where(Notification.read == False)  # noqa: E712
    ).all()
    for r in rows:
        r.read = True
    db.commit()
    return {"marked_read": len(rows)}


@router.post("/sweep-alerts")
def sweep_renewal_alerts(
    days_ahead: int = 30,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Create renewal alert notifications for contracts due within the specified days."""
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days_ahead)

    rows = db.scalars(
        select(ContractKeyDate)
        .where(ContractKeyDate.org_id == current_user.org_id)
        .where(ContractKeyDate.status == "active")
    ).all()

    created = 0
    for kd in rows:
        check_date = kd.notice_deadline or kd.renewal_date
        if not check_date:
            continue
        if check_date.tzinfo is None:
            check_date = check_date.replace(tzinfo=timezone.utc)
        if now <= check_date <= cutoff:
            days_left = (check_date - now).days
            title = f"Contract renewal approaching: {kd.contract_name or f'Contract #{kd.contract_id}'}"
            message = (
                f"{'Notice deadline' if kd.notice_deadline else 'Renewal date'} is in {days_left} days "
                f"({'auto-renews' if kd.auto_renewal else 'manual renewal required'})."
            )
            notif = Notification(
                org_id=current_user.org_id,
                type="renewal_alert",
                title=title,
                message=message,
                entity_type="contract",
                entity_id=str(kd.contract_id),
            )
            db.add(notif)
            created += 1

    db.commit()
    return {"notifications_created": created}
