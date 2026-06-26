"""Contract review agent."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.models import ContractKeyDate, ContractReview, Notification
from app.services.gemini_service import GeminiService, GeminiServiceError, get_gemini_service
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
    key_dates: dict | None = None
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

    def analyze_contract(self, filename: str, content: bytes, org_id: int | None = None) -> ContractReviewResult:
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
            raise ContractAgentError(f"Invalid contract review structure: {exc}") from exc

        result = parsed.dict()
        key_dates_data = result.get("key_dates", {})

        record = ContractReview(
            org_id=org_id,
            risk_level=result["risk_level"],
            summary=result["executive_summary"],
            contract_name=safe_name,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        # Phase 3: persist extracted key dates for renewal alerts
        if org_id and key_dates_data:
            self._save_key_dates(org_id, record.id, safe_name, key_dates_data)

        report_payload = {
            "id": record.id,
            "executive_summary": result["executive_summary"],
            "risk_level": result["risk_level"],
            "risks": result["risks"],
            "recommendations": result["recommendations"],
            "key_dates": key_dates_data,
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
            key_dates=key_dates_data if key_dates_data else None,
            created_at=created_at,
            uploaded_file=safe_name,
        )

    def _save_key_dates(self, org_id: int, contract_id: int, contract_name: str, key_dates: dict) -> None:
        """Persist ContractKeyDate for renewal monitoring."""
        def _parse_date(val: str | None) -> datetime | None:
            if not val:
                return None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y"):
                try:
                    return datetime.strptime(val, fmt).replace(tzinfo=timezone.utc)
                except (ValueError, TypeError):
                    pass
            return None

        renewal_date = _parse_date(key_dates.get("renewal_date"))
        expiry_date = _parse_date(key_dates.get("expiry_date"))
        notice_period_days = key_dates.get("notice_period_days")
        auto_renewal = bool(key_dates.get("auto_renewal", False))

        notice_deadline = None
        if renewal_date and notice_period_days:
            from datetime import timedelta
            notice_deadline = renewal_date - timedelta(days=int(notice_period_days))

        kd = ContractKeyDate(
            org_id=org_id,
            contract_id=contract_id,
            contract_name=contract_name,
            renewal_date=renewal_date,
            notice_deadline=notice_deadline,
            expiry_date=expiry_date,
            auto_renewal=auto_renewal,
            notice_period_days=int(notice_period_days) if notice_period_days else None,
            status="active",
        )
        self.db.add(kd)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

    @staticmethod
    def _save_report(report_id: int, payload: dict) -> None:
        report_path = REPORTS_DIR / f"contract_review_{report_id}.json"
        report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        logger.info("Saved contract review report to %s", report_path)
