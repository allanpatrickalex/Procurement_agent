"""Supplier quote analysis API routes."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.agents.supplier_agent import SupplierAgent, SupplierAgentError, SupplierAnalysisResult
from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("/analyze", response_model=SupplierAnalysisResult)
async def analyze_suppliers(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SupplierAnalysisResult:
    """Upload supplier quote PDFs and receive a ranked recommendation."""
    if not files:
        raise HTTPException(status_code=400, detail="At least one PDF file is required.")

    upload_data: list[tuple[str, bytes]] = []
    for upload in files:
        content = await upload.read()
        filename = upload.filename or "quote.pdf"
        upload_data.append((filename, content))

    agent = SupplierAgent(db)

    try:
        return agent.analyze_quotes(upload_data, org_id=current_user.org_id)
    except SupplierAgentError as exc:
        logger.warning("Supplier analysis failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        logger.error("Gemini service error during supplier analysis: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during supplier analysis")
        raise HTTPException(status_code=500, detail="Supplier analysis failed.") from exc
