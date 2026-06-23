"""Contract review agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import ContractReview
from app.services.gemini_service import GeminiService, get_gemini_service, GeminiServiceError
from app.services.pdf_service import PDFService, PDFServiceError
from app.schemas import ContractReviewModel
from pydantic import ValidationError

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "contracts"
REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
PROMPT_NAME = "contract_review"
VALID_RISK_LEVELS = {"Low", "Medium", "High"}


class ContractRisk(BaseModel):
    category: str
    description: str
    severity: str


class ContractReviewResult(BaseModel):
    id: int
    executive_summary: str
    risk_level: str
    risks: list[ContractRisk]
    recommendations: list[str]
    created_at: datetime
    uploaded_file: str


class ContractAgentError(Exception):
    """Raised when contract review fails."""


class ContractAgent:
    """Analyze a supplier contract PDF and identify commercial risks."""

    def __init__(
        self,
        db: Session,
        gemini_service: GeminiService | None = None,
        pdf_service: PDFService | None = None,
    ) -> None:
        self.db = db
        self.gemini_service = gemini_service or get_gemini_service()
        self.pdf_service = pdf_service or PDFService()
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def analyze_contract(self, filename: str, content: bytes) -> ContractReviewResult:
        """Analyze a single uploaded contract PDF."""
        if not filename.lower().endswith(".pdf"):
            raise ContractAgentError(f"Only PDF files are supported: {filename}")

        if not content:
            raise ContractAgentError("Contract PDF file is empty.")

        batch_id = uuid.uuid4().hex
        batch_dir = UPLOADS_DIR / batch_id
        batch_dir.mkdir(parents=True, exist_ok=True)

        safe_name = Path(filename).name
        file_path = batch_dir / safe_name
        file_path.write_bytes(content)

        try:
            extracted_text = self.pdf_service.extract_text(file_path)
        except PDFServiceError as exc:
            raise ContractAgentError(str(exc)) from exc

        user_content = f"Contract File: {safe_name}\n{'-' * 40}\n{extracted_text}"

        logger.info("Sending contract '%s' to Gemini for review", safe_name)
        try:
            analysis = self.gemini_service.generate_json(PROMPT_NAME, user_content)
        except GeminiServiceError as exc:
            raise ContractAgentError(str(exc)) from exc

        try:
            parsed = ContractReviewModel.parse_obj(analysis)
        except ValidationError as exc:
            logger.exception("Contract review validation failed: %s", exc)
            raise ContractAgentError(f"Invalid contract review structure: {exc}") from exc

        result = parsed.dict()

        record = ContractReview(
            risk_level=result["risk_level"],
            summary=result["executive_summary"],
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        report_payload = {
            "id": record.id,
            "executive_summary": result["executive_summary"],
            "risk_level": result["risk_level"],
            "risks": result["risks"],
            "recommendations": result["recommendations"],
            "uploaded_file": safe_name,
            "created_at": record.created_at.isoformat(),
        }
        self._save_report(record.id, report_payload)

        created_at = record.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return ContractReviewResult(
            id=record.id,
            executive_summary=result["executive_summary"],
            risk_level=result["risk_level"],
            risks=[ContractRisk(**risk) for risk in result["risks"]],
            recommendations=result["recommendations"],
            created_at=created_at,
            uploaded_file=safe_name,
        )

    @staticmethod
    def _parse_analysis(analysis: dict) -> dict:
        # Pydantic validation upstream ensures structure; normalize values
        executive_summary = analysis["executive_summary"]
        risk_level = str(analysis["risk_level"]).strip().title()
        risks = analysis["risks"]
        recommendations = analysis["recommendations"]

        if risk_level not in VALID_RISK_LEVELS:
            risk_level = "Medium"

        normalized_risks: list[dict] = []
        for item in risks:
            normalized_risks.append(
                {
                    "category": str(item["category"]),
                    "description": str(item["description"]),
                    "severity": str(item["severity"]).strip().title(),
                }
            )

        normalized_recommendations = [str(item) for item in recommendations if str(item).strip()]

        return {
            "executive_summary": str(executive_summary),
            "risk_level": risk_level,
            "risks": normalized_risks,
            "recommendations": normalized_recommendations,
        }

    @staticmethod
    def _save_report(report_id: int, payload: dict) -> None:
        report_path = REPORTS_DIR / f"contract_review_{report_id}.json"
        report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        logger.info("Saved contract review report to %s", report_path)
