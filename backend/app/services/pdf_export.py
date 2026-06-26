"""Simple PDF export for saved reports using reportlab."""
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from typing import Dict, Any


def render_report_to_pdf(report: Dict[str, Any], title: str = "Report") -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 40
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, y, title)
    y -= 30

    c.setFont("Helvetica", 10)
    def draw_kv(key, value):
        nonlocal y
        c.drawString(40, y, f"{key}: {value}")
        y -= 14

    # Flatten some common fields
    for k in ("executive_summary", "risk_level", "total_spend", "savings_estimate", "recommended_supplier"):
        if k in report:
            draw_kv(k.replace('_', ' ').title(), str(report[k]))

    y -= 8
    if "savings_opportunities" in report:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Savings Opportunities:")
        y -= 16
        c.setFont("Helvetica", 10)
        for item in report.get("savings_opportunities", []):
            if y < 80:
                c.showPage()
                y = height - 40
            c.drawString(48, y, f"- {item.get('category')}: {item.get('estimated_savings')}")
            y -= 12

    if "supplier_scores" in report:
        y -= 8
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Supplier Scores:")
        y -= 16
        c.setFont("Helvetica", 10)
        for s in report.get("supplier_scores", []):
            if y < 80:
                c.showPage()
                y = height - 40
            c.drawString(48, y, f"{s.get('rank')}. {s.get('supplier_name')} — {s.get('score')}")
            y -= 12

    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
