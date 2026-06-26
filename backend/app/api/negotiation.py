"""Negotiation strategy and RFP generation API — Phase 5."""

import io
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agents.negotiation_agent import NegotiationAgent, NegotiationAgentError, NegotiationResult
from app.agents.rfp_agent import RfpAgent, RfpAgentError, RfpResult
from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sourcing", tags=["Sourcing"])


class NegotiationRequest(BaseModel):
    context: str
    report_type: str | None = None
    report_id: int | None = None


class RfpRequest(BaseModel):
    need_description: str


@router.post("/negotiate", response_model=NegotiationResult)
def generate_negotiation(
    req: NegotiationRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> NegotiationResult:
    """Generate a negotiation strategy from a description or linked report."""
    context = req.context

    # Optionally enrich with existing report data
    if req.report_type and req.report_id:
        from pathlib import Path
        REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
        type_map = {
            "supplier": f"supplier_analysis_{req.report_id}.json",
            "contract": f"contract_review_{req.report_id}.json",
            "spend": f"spend_analysis_{req.report_id}.json",
        }
        report_file = type_map.get(req.report_type)
        if report_file:
            report_path = REPORTS_DIR / report_file
            if report_path.exists():
                report_data = json.loads(report_path.read_text(encoding="utf-8"))
                context = f"{context}\n\n=== EXISTING ANALYSIS ===\n{json.dumps(report_data, indent=2)}"

    agent = NegotiationAgent(db)
    try:
        return agent.generate_strategy(context)
    except NegotiationAgentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/rfp", response_model=RfpResult)
def generate_rfp(
    req: RfpRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> RfpResult:
    """Generate a professional RFP from a procurement need description."""
    agent = RfpAgent(db)
    try:
        return agent.generate_rfp(req.need_description)
    except RfpAgentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/rfp/pdf")
def export_rfp_pdf(
    req: RfpRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> StreamingResponse:
    """Generate an RFP and return it as a PDF download."""
    agent = RfpAgent(db)
    try:
        rfp = agent.generate_rfp(req.need_description)
        pdf_bytes = agent.export_pdf(rfp)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{rfp.rfp_title}.pdf"'},
        )
    except (RfpAgentError, GeminiServiceError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
