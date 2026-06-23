"""Spend analysis agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import SpendReport
from app.services.csv_service import CSVService, CSVServiceError
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.gemini_service import GeminiServiceError
from app.schemas import SpendAnalysisModel
from pydantic import ValidationError

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "spend"
REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
PROMPT_NAME = "spend_analysis"


class SavingsOpportunity(BaseModel):
    category: str
    description: str
    estimated_savings: float


class SpendAnalysisResult(BaseModel):
    id: int
    total_spend: float
    savings_estimate: float
    executive_summary: str
    savings_opportunities: list[SavingsOpportunity]
    recommendations: list[str]
    metrics: dict
    created_at: datetime
    uploaded_file: str


class SpendAgentError(Exception):
    """Raised when spend analysis fails."""


class SpendAgent:
    """Analyze procurement spend CSV data and identify savings opportunities."""

    def __init__(
        self,
        db: Session,
        gemini_service: GeminiService | None = None,
        csv_service: CSVService | None = None,
    ) -> None:
        self.db = db
        self.gemini_service = gemini_service or get_gemini_service()
        self.csv_service = csv_service or CSVService()
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def analyze_spend(self, filename: str, content: bytes, mapping: dict | None = None) -> SpendAnalysisResult:
        """Analyze an uploaded spend CSV file."""
        if not filename.lower().endswith(".csv"):
            raise SpendAgentError(f"Only CSV files are supported: {filename}")

        if not content:
            raise SpendAgentError("Spend CSV file is empty.")

        batch_id = uuid.uuid4().hex
        batch_dir = UPLOADS_DIR / batch_id
        batch_dir.mkdir(parents=True, exist_ok=True)

        safe_name = Path(filename).name
        file_path = batch_dir / safe_name
        file_path.write_bytes(content)

        try:
            metrics = self.csv_service.calculate_metrics(content, safe_name, mapping=mapping)
        except CSVServiceError as exc:
            raise SpendAgentError(str(exc)) from exc

        user_content = self.csv_service.format_metrics_summary(metrics)

        logger.info("Sending spend metrics for '%s' to Gemini for analysis", safe_name)
        try:
            analysis = self.gemini_service.generate_json(PROMPT_NAME, user_content)
        except GeminiServiceError as exc:
            raise SpendAgentError(str(exc)) from exc

        try:
            parsed = SpendAnalysisModel.parse_obj(analysis)
        except ValidationError as exc:
            logger.exception("Spend analysis validation failed: %s", exc)
            raise SpendAgentError(f"Invalid spend analysis structure: {exc}") from exc

        analysis_dict = parsed.dict()

        # Normalize and compute fields such as savings_estimate using calculated metrics
        normalized = self._parse_analysis(analysis_dict, metrics.get("total_spend", 0.0))

        record = SpendReport(
            total_spend=normalized.get("total_spend", metrics.get("total_spend", 0.0)),
            savings_estimate=normalized.get("savings_estimate", 0.0),
            summary=normalized.get("executive_summary", analysis_dict.get("executive_summary", "")),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        report_payload = {
            "id": record.id,
            "executive_summary": normalized.get("executive_summary", analysis_dict.get("executive_summary", "")),
            "total_spend": normalized.get("total_spend", metrics.get("total_spend", 0.0)),
            "savings_estimate": normalized.get("savings_estimate", 0.0),
            "savings_opportunities": normalized.get("savings_opportunities", []),
            "recommendations": normalized.get("recommendations", []),
            "metrics": metrics,
            "uploaded_file": safe_name,
            "created_at": record.created_at.isoformat(),
        }
        self._save_report(record.id, report_payload)

        created_at = record.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return SpendAnalysisResult(
            id=record.id,
            total_spend=result["total_spend"],
            savings_estimate=result["savings_estimate"],
            executive_summary=result["executive_summary"],
            savings_opportunities=[
                SavingsOpportunity(**item) for item in result["savings_opportunities"]
            ],
            recommendations=result["recommendations"],
            metrics=metrics,
            created_at=created_at,
            uploaded_file=safe_name,
        )

    @staticmethod
    def _parse_analysis(analysis: dict, calculated_total_spend: float) -> dict:
        # After Pydantic validation upstream, normalize and compute totals
        executive_summary = analysis["executive_summary"]
        savings_opportunities = analysis["savings_opportunities"]
        recommendations = analysis["recommendations"]

        normalized_opportunities: list[dict] = []
        savings_estimate = 0.0
        for item in savings_opportunities:
            savings_value = float(item["estimated_savings"])
            savings_estimate += savings_value
            normalized_opportunities.append(
                {
                    "category": str(item["category"]),
                    "description": str(item["description"]),
                    "estimated_savings": savings_value,
                }
            )

        normalized_recommendations = [str(item) for item in recommendations if str(item).strip()]

        return {
            "executive_summary": str(executive_summary),
            "total_spend": float(calculated_total_spend),
            "savings_estimate": float(round(savings_estimate, 2)),
            "savings_opportunities": normalized_opportunities,
            "recommendations": normalized_recommendations,
        }

    @staticmethod
    def _save_report(report_id: int, payload: dict) -> None:
        report_path = REPORTS_DIR / f"spend_analysis_{report_id}.json"
        report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        logger.info("Saved spend analysis report to %s", report_path)
