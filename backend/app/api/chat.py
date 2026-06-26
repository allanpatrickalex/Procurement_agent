"""Procurement Copilot chat API — Phase 4."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.database.models import ContractReview, SavingsEntry, SpendReport, SupplierAnalysis, ContractKeyDate
from app.services.gemini_service import GeminiServiceError, get_gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Copilot"])


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    context_used: bool = True


def _build_data_context(db: Session, org_id: int) -> str:
    """Summarize the org's procurement data for injection into the copilot prompt."""
    lines: list[str] = []

    # Supplier analyses
    supplier_rows = db.scalars(
        select(SupplierAnalysis)
        .where((SupplierAnalysis.org_id == org_id) | (SupplierAnalysis.org_id == None))  # noqa: E711
        .order_by(SupplierAnalysis.created_at.desc())
        .limit(10)
    ).all()
    if supplier_rows:
        lines.append("=== SUPPLIER ANALYSES ===")
        for r in supplier_rows:
            lines.append(f"- #{r.id}: Recommended {r.recommended_supplier} (score {r.score}) on {r.created_at.date()}")

    # Contract reviews
    contract_rows = db.scalars(
        select(ContractReview)
        .where((ContractReview.org_id == org_id) | (ContractReview.org_id == None))  # noqa: E711
        .order_by(ContractReview.created_at.desc())
        .limit(10)
    ).all()
    if contract_rows:
        lines.append("\n=== CONTRACT REVIEWS ===")
        for r in contract_rows:
            lines.append(f"- #{r.id}: {r.contract_name or 'Contract'} | Risk: {r.risk_level} | {r.created_at.date()}")

    # Contract key dates / renewals
    renewal_rows = db.scalars(
        select(ContractKeyDate)
        .where(ContractKeyDate.org_id == org_id)
        .where(ContractKeyDate.status == "active")
        .limit(10)
    ).all()
    if renewal_rows:
        lines.append("\n=== UPCOMING RENEWALS ===")
        for r in renewal_rows:
            renewal = r.renewal_date.date() if r.renewal_date else "unknown"
            lines.append(
                f"- {r.contract_name or f'Contract #{r.contract_id}'}: "
                f"Renewal {renewal} | Auto-renew: {r.auto_renewal} | Notice: {r.notice_period_days or '?'} days"
            )

    # Spend reports
    spend_rows = db.scalars(
        select(SpendReport)
        .where((SpendReport.org_id == org_id) | (SpendReport.org_id == None))  # noqa: E711
        .order_by(SpendReport.created_at.desc())
        .limit(5)
    ).all()
    if spend_rows:
        lines.append("\n=== SPEND REPORTS ===")
        for r in spend_rows:
            lines.append(
                f"- #{r.id}: Total spend ${r.total_spend:,.0f} | "
                f"Savings identified ${r.savings_estimate:,.0f} | {r.created_at.date()}"
            )

    # Savings ledger summary
    total_identified = db.scalar(
        select(func.coalesce(func.sum(SavingsEntry.identified_amount), 0))
        .where(SavingsEntry.org_id == org_id)
    ) or 0
    total_realized = db.scalar(
        select(func.coalesce(func.sum(SavingsEntry.realized_amount), 0))
        .where(SavingsEntry.org_id == org_id)
        .where(SavingsEntry.status == "realized")
    ) or 0
    if total_identified > 0:
        lines.append(
            f"\n=== SAVINGS LEDGER ===\n"
            f"- Total identified: ${total_identified:,.0f}\n"
            f"- Total realized: ${total_realized:,.0f}"
        )

    if not lines:
        return "No procurement data has been analyzed yet for this organization."

    return "\n".join(lines)


@router.post("", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ChatResponse:
    """Send a message to the Procurement Copilot and receive a reply."""
    gemini = get_gemini_service()
    data_context = _build_data_context(db, current_user.org_id)

    # Build conversation history for multi-turn context
    history_text = ""
    if req.history:
        history_lines = []
        for msg in req.history[-6:]:  # last 6 turns to stay within token budget
            role = "User" if msg.role == "user" else "Assistant"
            history_lines.append(f"{role}: {msg.content}")
        history_text = "\n".join(history_lines) + "\n\n"

    user_content = f"{history_text}User: {req.message}"

    try:
        reply = gemini.generate_text(
            "copilot",
            user_content,
            prompt_variables={"data_context": data_context},
            temperature=0.3,
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(reply=reply, context_used=bool(data_context))
