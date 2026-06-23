"""Spend analysis API routes."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session

from app.agents.spend_agent import SpendAgent, SpendAgentError, SpendAnalysisResult
from app.database.db import get_db
from app.services.gemini_service import GeminiServiceError
from app.services.csv_service import CSVService, CSVServiceError

router = APIRouter(prefix="/spend", tags=["Spend"])


@router.post("/map")
async def map_spend_columns(
    file: UploadFile = File(...),
) -> dict:
    """Return suggested canonical column mapping and confidence scores for an uploaded CSV."""
    content = await file.read()
    filename = file.filename or "spend.csv"

    try:
        # read a few rows to show header and sample
        import io
        import pandas as pd

        df = pd.read_csv(io.BytesIO(content), nrows=5)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV headers: {exc}") from exc

    csv_service = CSVService()
    try:
        mapping = csv_service.map_columns(df)
        # include original headers and a sample row for preview
        headers = [c for c in df.columns]
        sample_rows = []
        try:
            sample_rows = df.fillna("").head(3).astype(str).to_dict(orient="records")
        except Exception:
            sample_rows = []

        mapping["headers"] = headers
        mapping["sample_rows"] = sample_rows
        return mapping
    except CSVServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

logger = logging.getLogger(__name__)

# existing /analyze route follows


@router.post("/analyze", response_model=SpendAnalysisResult)
async def analyze_spend(
    file: UploadFile = File(...),
    mapping: str | None = Form(None),
    db: Session = Depends(get_db),
) -> SpendAnalysisResult:
    """Upload a spend CSV and receive savings recommendations. Optional `mapping` JSON can be provided."""
    content = await file.read()
    filename = file.filename or "spend.csv"

    agent = SpendAgent(db)

    mapping_obj = None
    if mapping:
        import json

        try:
            mapping_obj = json.loads(mapping)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid mapping JSON") from exc

    try:
        return agent.analyze_spend(filename, content, mapping=mapping_obj)
    except SpendAgentError as exc:
        logger.warning("Spend analysis failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        logger.error("Gemini service error during spend analysis: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during spend analysis")
        raise HTTPException(status_code=500, detail="Spend analysis failed.") from exc
