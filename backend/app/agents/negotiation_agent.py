"""Negotiation strategy agent — Phase 5."""

import json
import logging
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.schemas import NegotiationModel
from app.services.gemini_service import GeminiService, GeminiServiceError, get_gemini_service
from pydantic import ValidationError

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
PROMPT_NAME = "negotiation"


class NegotiationLever(BaseModel):
    lever: str
    description: str
    potential_impact: str
    priority: str


class TargetPrice(BaseModel):
    current_value: float = 0
    target_value: float = 0
    reduction_percent: float = 0
    rationale: str = ""


class SupplierEmail(BaseModel):
    subject: str
    body: str


class NegotiationResult(BaseModel):
    executive_summary: str
    negotiation_levers: list[NegotiationLever] = Field(default_factory=list)
    target_price: TargetPrice | None = None
    batna: str = ""
    opening_position: str = ""
    walk_away_point: str = ""
    supplier_email: SupplierEmail | None = None
    key_talking_points: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)


class NegotiationAgentError(Exception):
    pass


class NegotiationAgent:
    """Generate negotiation strategy from contract or supplier analysis data."""

    def __init__(self, db: Session, gemini_service: GeminiService | None = None) -> None:
        self.db = db
        self.gemini_service = gemini_service or get_gemini_service()
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def generate_strategy(self, context: str) -> NegotiationResult:
        """Generate a negotiation strategy from the given context string."""
        logger.info("Generating negotiation strategy")
        try:
            analysis = self.gemini_service.generate_json(PROMPT_NAME, context)
        except GeminiServiceError as exc:
            raise NegotiationAgentError(str(exc)) from exc

        try:
            parsed = NegotiationModel.parse_obj(analysis)
        except ValidationError as exc:
            raise NegotiationAgentError(f"Invalid negotiation structure: {exc}") from exc

        data = parsed.dict()

        return NegotiationResult(
            executive_summary=data["executive_summary"],
            negotiation_levers=[NegotiationLever(**l) for l in data.get("negotiation_levers", [])],
            target_price=TargetPrice(**data["target_price"]) if data.get("target_price") else None,
            batna=data.get("batna", ""),
            opening_position=data.get("opening_position", ""),
            walk_away_point=data.get("walk_away_point", ""),
            supplier_email=SupplierEmail(**data["supplier_email"]) if data.get("supplier_email") else None,
            key_talking_points=data.get("key_talking_points", []),
            red_flags=data.get("red_flags", []),
        )
