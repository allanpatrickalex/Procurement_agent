"""RFP generation agent — Phase 5."""

import json
import logging
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.schemas import RfpModel
from app.services.gemini_service import GeminiService, GeminiServiceError, get_gemini_service
from app.services.pdf_export import render_report_to_pdf
from pydantic import ValidationError

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
PROMPT_NAME = "rfp_generation"


class RfpSection(BaseModel):
    title: str
    content: str


class EvaluationCriterion(BaseModel):
    criterion: str
    weight_percent: float
    description: str


class RfpTimeline(BaseModel):
    milestone: str
    description: str
    weeks_from_now: int


class ScoringMatrixRow(BaseModel):
    criterion: str
    excellent: str
    good: str
    acceptable: str
    poor: str


class RfpResult(BaseModel):
    rfp_title: str
    executive_summary: str
    sections: list[RfpSection] = Field(default_factory=list)
    evaluation_criteria: list[EvaluationCriterion] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    timeline: list[RfpTimeline] = Field(default_factory=list)
    scoring_matrix: list[ScoringMatrixRow] = Field(default_factory=list)


class RfpAgentError(Exception):
    pass


class RfpAgent:
    """Generate a professional RFP document from a procurement need description."""

    def __init__(self, db: Session, gemini_service: GeminiService | None = None) -> None:
        self.db = db
        self.gemini_service = gemini_service or get_gemini_service()
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def generate_rfp(self, need_description: str) -> RfpResult:
        """Generate an RFP based on the procurement need."""
        logger.info("Generating RFP document")
        try:
            analysis = self.gemini_service.generate_json(PROMPT_NAME, need_description)
        except GeminiServiceError as exc:
            raise RfpAgentError(str(exc)) from exc

        try:
            parsed = RfpModel.parse_obj(analysis)
        except ValidationError as exc:
            raise RfpAgentError(f"Invalid RFP structure: {exc}") from exc

        data = parsed.dict()

        return RfpResult(
            rfp_title=data["rfp_title"],
            executive_summary=data["executive_summary"],
            sections=[RfpSection(**s) for s in data.get("sections", [])],
            evaluation_criteria=[EvaluationCriterion(**c) for c in data.get("evaluation_criteria", [])],
            required_documents=data.get("required_documents", []),
            timeline=[RfpTimeline(**t) for t in data.get("timeline", [])],
            scoring_matrix=[ScoringMatrixRow(**r) for r in data.get("scoring_matrix", [])],
        )

    def export_pdf(self, rfp: RfpResult) -> bytes:
        """Export an RFP result as a PDF."""
        payload = rfp.dict()
        return render_report_to_pdf(payload, title=rfp.rfp_title)
