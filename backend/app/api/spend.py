"""Spend analysis API routes."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.agents.spend_agent import SpendAgent, SpendAgentError, SpendAnalysisResult
from app.database.db import get_db
from app.services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/spend", tags=["Spend"])


@router.post("/analyze", response_model=SpendAnalysisResult)
async def analyze_spend(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> SpendAnalysisResult:
    """Upload a spend CSV and receive savings recommendations."""
    content = await file.read()
    filename = file.filename or "spend.csv"

    agent = SpendAgent(db)

    try:
        return agent.analyze_spend(filename, content)
    except SpendAgentError as exc:
        logger.warning("Spend analysis failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        logger.error("Gemini service error during spend analysis: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during spend analysis")
        raise HTTPException(status_code=500, detail="Spend analysis failed.") from exc
