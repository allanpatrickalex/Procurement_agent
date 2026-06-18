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

    def analyze_spend(self, filename: str, content: bytes) -> SpendAnalysisResult:
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
            metrics = self.csv_service.calculate_metrics(content, safe_name)
        except CSVServiceError as exc:
            raise SpendAgentError(str(exc)) from exc

        user_content = self.csv_service.format_metrics_summary(metrics)

        logger.info("Sending spend metrics for '%s' to Gemini for analysis", safe_name)
        analysis = self.gemini_service.generate_json(PROMPT_NAME, user_content)
        result = self._parse_analysis(analysis, metrics["total_spend"])

        record = SpendReport(
            total_spend=result["total_spend"],
            savings_estimate=result["savings_estimate"],
            summary=result["executive_summary"],
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        report_payload = {
            "id": record.id,
            "executive_summary": result["executive_summary"],
            "total_spend": result["total_spend"],
            "savings_estimate": result["savings_estimate"],
            "savings_opportunities": result["savings_opportunities"],
            "recommendations": result["recommendations"],
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
        executive_summary = analysis.get("executive_summary")
        savings_opportunities = analysis.get("savings_opportunities")
        recommendations = analysis.get("recommendations")
        total_spend = analysis.get("total_spend", calculated_total_spend)

        if not executive_summary:
            raise SpendAgentError("Gemini response is missing executive summary.")

        if not isinstance(savings_opportunities, list) or not savings_opportunities:
            raise SpendAgentError("Gemini response is missing savings opportunities.")

        if not isinstance(recommendations, list) or not recommendations:
            raise SpendAgentError("Gemini response is missing recommendations.")

        normalized_opportunities: list[dict] = []
        savings_estimate = 0.0

        for item in savings_opportunities:
            if not isinstance(item, dict):
                continue

            category = item.get("category")
            description = item.get("description")
            estimated_savings = item.get("estimated_savings")

            if not category or not description or estimated_savings is None:
                continue

            savings_value = float(estimated_savings)
            savings_estimate += savings_value
            normalized_opportunities.append(
                {
                    "category": str(category),
                    "description": str(description),
                    "estimated_savings": savings_value,
                }
            )

        if not normalized_opportunities:
            raise SpendAgentError("No valid savings opportunities were returned.")

        normalized_recommendations = [str(item) for item in recommendations if str(item).strip()]
        if not normalized_recommendations:
            raise SpendAgentError("No valid recommendations were returned.")

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
