"""Supplier comparison agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import SupplierAnalysis
from app.services.gemini_service import GeminiService, get_gemini_service, GeminiServiceError
from app.services.pdf_service import PDFService, PDFServiceError
from app.schemas import SupplierAnalysisModel
from pydantic import ValidationError

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "suppliers"
REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
PROMPT_NAME = "supplier_analysis"


class SupplierScore(BaseModel):
    supplier_name: str
    score: float
    rank: int
    highlights: list[str] = Field(default_factory=list)


class SupplierAnalysisResult(BaseModel):
    id: int
    recommended_supplier: str
    supplier_scores: list[SupplierScore]
    reasoning: str
    executive_summary: str
    score: float
    created_at: datetime
    uploaded_files: list[str]


class SupplierAgentError(Exception):
    """Raised when supplier analysis fails."""


class SupplierAgent:
    """Analyze multiple supplier quote PDFs and recommend the best supplier."""

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

    def analyze_quotes(
        self,
        files: list[tuple[str, bytes]],
    ) -> SupplierAnalysisResult:
        """
        Analyze uploaded supplier quote PDFs.

        Args:
            files: List of (filename, file_bytes) tuples.
        """
        if not files:
            raise SupplierAgentError("At least one supplier quote PDF is required.")

        if len(files) < 2:
            raise SupplierAgentError("Upload at least two supplier quote PDFs to compare.")

        batch_id = uuid.uuid4().hex
        batch_dir = UPLOADS_DIR / batch_id
        batch_dir.mkdir(parents=True, exist_ok=True)

        quote_sections: list[str] = []
        saved_files: list[str] = []

        for filename, content in files:
            if not filename.lower().endswith(".pdf"):
                raise SupplierAgentError(f"Only PDF files are supported: {filename}")

            safe_name = Path(filename).name
            file_path = batch_dir / safe_name
            file_path.write_bytes(content)
            saved_files.append(safe_name)

            try:
                extracted_text = self.pdf_service.extract_text(file_path)
            except PDFServiceError as exc:
                raise SupplierAgentError(str(exc)) from exc

            quote_sections.append(
                f"Quote File: {safe_name}\n{'-' * 40}\n{extracted_text}"
            )

        user_content = (
            f"Compare the following {len(quote_sections)} supplier quotations:\n\n"
            + "\n\n".join(quote_sections)
        )

        logger.info("Sending %d supplier quotes to Gemini for analysis", len(files))
        try:
            analysis = self.gemini_service.generate_json(PROMPT_NAME, user_content)
        except GeminiServiceError as exc:
            raise SupplierAgentError(str(exc)) from exc

        try:
            parsed = SupplierAnalysisModel.parse_obj(analysis)
        except ValidationError as exc:
            logger.exception("Supplier analysis validation failed: %s", exc)
            raise SupplierAgentError(f"Invalid supplier analysis structure: {exc}") from exc

        analysis_dict = parsed.dict()

        # Normalize and compute top score and other derived fields
        normalized = self._parse_analysis(analysis_dict)

        record = SupplierAnalysis(
            recommended_supplier=normalized.get("recommended_supplier", analysis_dict.get("recommended_supplier", "")),
            score=normalized.get("top_score", 0.0),
            summary=normalized.get("executive_summary", analysis_dict.get("executive_summary", "")),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        report_payload = {
            "id": record.id,
            "recommended_supplier": normalized.get("recommended_supplier", analysis_dict.get("recommended_supplier", "")),
            "supplier_scores": normalized.get("supplier_scores", analysis_dict.get("supplier_scores", [])),
            "reasoning": normalized.get("reasoning", analysis_dict.get("reasoning", "")),
            "executive_summary": normalized.get("executive_summary", analysis_dict.get("executive_summary", "")),
            "score": normalized.get("top_score", 0.0),
            "uploaded_files": saved_files,
            "created_at": record.created_at.isoformat(),
        }
        self._save_report(record.id, report_payload)

        created_at = record.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return SupplierAnalysisResult(
            id=record.id,
            recommended_supplier=normalized.get("recommended_supplier", analysis_dict.get("recommended_supplier", "")),
            supplier_scores=[
                SupplierScore(**score) for score in normalized.get("supplier_scores", analysis_dict.get("supplier_scores", []))
            ],
            reasoning=normalized.get("reasoning", analysis_dict.get("reasoning", "")),
            executive_summary=normalized.get("executive_summary", analysis_dict.get("executive_summary", "")),
            score=normalized.get("top_score", 0.0),
            created_at=created_at,
            uploaded_files=saved_files,
        )

    @staticmethod
    def _parse_analysis(analysis: dict) -> dict:
        # After Pydantic validation upstream, ensure numeric types and return
        recommended = analysis["recommended_supplier"]
        reasoning = analysis["reasoning"]
        executive_summary = analysis["executive_summary"]
        supplier_scores = analysis["supplier_scores"]

        top_score = 0.0
        normalized_scores: list[dict] = []
        for item in supplier_scores:
            score_value = float(item["score"])
            normalized_scores.append(
                {
                    "supplier_name": str(item["supplier_name"]),
                    "score": score_value,
                    "rank": int(item["rank"]),
                    "highlights": [str(h) for h in (item.get("highlights") or [])],
                }
            )

            if str(item["supplier_name"]) == str(recommended):
                top_score = score_value

        if top_score == 0.0 and normalized_scores:
            ranked = sorted(normalized_scores, key=lambda s: s["rank"])
            top_score = float(ranked[0]["score"])

        return {
            "recommended_supplier": str(recommended),
            "reasoning": str(reasoning),
            "executive_summary": str(executive_summary),
            "supplier_scores": normalized_scores,
            "top_score": top_score,
        }

    @staticmethod
    def _save_report(report_id: int, payload: dict) -> None:
        report_path = REPORTS_DIR / f"supplier_analysis_{report_id}.json"
        report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        logger.info("Saved supplier analysis report to %s", report_path)
