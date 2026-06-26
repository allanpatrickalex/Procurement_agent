"""Spend analysis agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import SavingsEntry, SpendReport
from app.services.csv_service import CSVService, CSVServiceError
from app.services.gemini_service import GeminiService, GeminiServiceError, get_gemini_service
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

    def analyze_spend(
        self,
        filename: str,
        content: bytes,
        mapping: dict | None = None,
        org_id: int | None = None,
    ) -> SpendAnalysisResult:
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
            raise SpendAgentError(f"Invalid spend analysis structure: {exc}") from exc

        analysis_dict = parsed.dict()
        normalized = self._parse_analysis(analysis_dict, metrics.get("total_spend", 0.0))

        record = SpendReport(
            org_id=org_id,
            total_spend=normalized["total_spend"],
            savings_estimate=normalized["savings_estimate"],
            summary=normalized["executive_summary"],
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        # Phase 2: persist savings entries to the ledger
        if org_id:
            self._record_savings(org_id, record.id, normalized["savings_opportunities"])

        report_payload = {
            "id": record.id,
            "executive_summary": normalized["executive_summary"],
            "total_spend": normalized["total_spend"],
            "savings_estimate": normalized["savings_estimate"],
            "savings_opportunities": normalized["savings_opportunities"],
            "recommendations": normalized["recommendations"],
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
            total_spend=normalized["total_spend"],
            savings_estimate=normalized["savings_estimate"],
            executive_summary=normalized["executive_summary"],
            savings_opportunities=[SavingsOpportunity(**item) for item in normalized["savings_opportunities"]],
            recommendations=normalized["recommendations"],
            metrics=metrics,
            created_at=created_at,
            uploaded_file=safe_name,
        )

    def _record_savings(self, org_id: int, source_id: int, opportunities: list[dict]) -> None:
        """Write each savings opportunity to the savings ledger."""
        for opp in opportunities:
            entry = SavingsEntry(
                org_id=org_id,
                source_type="spend",
                source_id=source_id,
                identified_amount=float(opp.get("estimated_savings", 0)),
                category=opp.get("category"),
                description=opp.get("description"),
            )
            self.db.add(entry)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

    @staticmethod
    def _parse_analysis(analysis: dict, calculated_total_spend: float) -> dict:
        savings_opportunities = analysis["savings_opportunities"]
        savings_estimate = 0.0
        normalized_opportunities: list[dict] = []
        for item in savings_opportunities:
            savings_value = float(item["estimated_savings"])
            savings_estimate += savings_value
            normalized_opportunities.append({
                "category": str(item["category"]),
                "description": str(item["description"]),
                "estimated_savings": savings_value,
            })

        normalized_recommendations = [str(r) for r in analysis["recommendations"] if str(r).strip()]

        return {
            "executive_summary": str(analysis["executive_summary"]),
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
