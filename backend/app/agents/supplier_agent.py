"""Supplier comparison agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import SupplierAnalysis
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.pdf_service import PDFService, PDFServiceError

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
        analysis = self.gemini_service.generate_json(PROMPT_NAME, user_content)
        result = self._parse_analysis(analysis)

        record = SupplierAnalysis(
            recommended_supplier=result["recommended_supplier"],
            score=result["top_score"],
            summary=result["executive_summary"],
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        report_payload = {
            "id": record.id,
            "recommended_supplier": result["recommended_supplier"],
            "supplier_scores": result["supplier_scores"],
            "reasoning": result["reasoning"],
            "executive_summary": result["executive_summary"],
            "score": result["top_score"],
            "uploaded_files": saved_files,
            "created_at": record.created_at.isoformat(),
        }
        self._save_report(record.id, report_payload)

        created_at = record.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return SupplierAnalysisResult(
            id=record.id,
            recommended_supplier=result["recommended_supplier"],
            supplier_scores=[
                SupplierScore(**score) for score in result["supplier_scores"]
            ],
            reasoning=result["reasoning"],
            executive_summary=result["executive_summary"],
            score=result["top_score"],
            created_at=created_at,
            uploaded_files=saved_files,
        )

    @staticmethod
    def _parse_analysis(analysis: dict) -> dict:
        recommended = analysis.get("recommended_supplier")
        reasoning = analysis.get("reasoning")
        executive_summary = analysis.get("executive_summary")
        supplier_scores = analysis.get("supplier_scores")

        if not recommended or not reasoning or not executive_summary:
            raise SupplierAgentError("Gemini response is missing required supplier fields.")

        if not isinstance(supplier_scores, list) or not supplier_scores:
            raise SupplierAgentError("Gemini response is missing supplier scores.")

        normalized_scores: list[dict] = []
        top_score = 0.0

        for item in supplier_scores:
            if not isinstance(item, dict):
                continue

            supplier_name = item.get("supplier_name")
            score = item.get("score")
            rank = item.get("rank")
            highlights = item.get("highlights") or []

            if supplier_name is None or score is None or rank is None:
                continue

            score_value = float(score)
            normalized_scores.append(
                {
                    "supplier_name": str(supplier_name),
                    "score": score_value,
                    "rank": int(rank),
                    "highlights": [str(h) for h in highlights],
                }
            )

            if str(supplier_name) == str(recommended):
                top_score = score_value

        if not normalized_scores:
            raise SupplierAgentError("No valid supplier scores were returned.")

        if top_score == 0.0:
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
