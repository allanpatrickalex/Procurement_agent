"""Contract review API routes."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.agents.contract_agent import ContractAgent, ContractAgentError, ContractReviewResult
from app.api.dependencies import CurrentUser, get_current_user
from app.database.db import get_db
from app.services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.post("/analyze", response_model=ContractReviewResult)
async def analyze_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ContractReviewResult:
    """Upload a contract PDF and receive a risk assessment."""
    content = await file.read()
    filename = file.filename or "contract.pdf"

    agent = ContractAgent(db)

    try:
        return agent.analyze_contract(filename, content, org_id=current_user.org_id)
    except ContractAgentError as exc:
        logger.warning("Contract review failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        logger.error("Gemini service error during contract review: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during contract review")
        raise HTTPException(status_code=500, detail="Contract review failed.") from exc
