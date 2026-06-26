"""Serve stored analysis reports (JSON) and provide PDF export endpoints."""

import json
from fastapi import APIRouter, HTTPException, Response
from pathlib import Path
from fastapi.responses import StreamingResponse
from app.services.pdf_export import render_report_to_pdf
import io

router = APIRouter(prefix="/reports", tags=["Reports"])

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"


def _report_path(report_type: str, report_id: int) -> Path:
    mapping = {
        "supplier": f"supplier_analysis_{report_id}.json",
        "contract": f"contract_review_{report_id}.json",
        "spend": f"spend_analysis_{report_id}.json",
    }
    name = mapping.get(report_type)
    if not name:
        raise HTTPException(status_code=404, detail="Unknown report type")
    return REPORTS_DIR / name


@router.get("/{report_type}/{report_id}")
def get_report(report_type: str, report_id: int):
    path = _report_path(report_type, report_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        text = path.read_text(encoding="utf-8")
        return Response(content=text, media_type="application/json")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{report_type}/{report_id}/pdf")
def get_report_pdf(report_type: str, report_id: int):
    path = _report_path(report_type, report_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        report = json.loads(path.read_text(encoding="utf-8"))
        title = f"{report_type.title()} Report {report_id}"
        pdf_bytes = render_report_to_pdf(report, title=title)
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
