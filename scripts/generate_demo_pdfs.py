"""Generate demo PDF files for supplier quotes and contracts using reportlab.

Run:
    python scripts/generate_demo_pdfs.py

This will write files to DEMO_DATA/pdf_samples/.
"""
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "DEMO_DATA" / "pdf_samples"
OUT.mkdir(parents=True, exist_ok=True)

samples = [
    (
        "Dell_Quote.pdf",
        "Dell Technologies\nQuote for IT Hardware\n\nItem: Laptop\nPrice: $18,750\nLead Time: 10 days\nWarranty: 3 years\nPayment Terms: Net 30",
    ),
    (
        "CDW_Quote.pdf",
        "CDW\nQuote for IT Hardware\n\nItem: Laptop\nPrice: $11,000\nLead Time: 14 days\nWarranty: 2 years\nPayment Terms: Net 45",
    ),
    (
        "MSA_Contract.pdf",
        "Master Services Agreement\nParties: Acme Corp and Supplier\nTerm: 36 months\nAuto-renewal: Yes\nPrice Escalation: Annual CPI + 2%",
    ),
    (
        "Supplier_Agreement.pdf",
        "Supplier Agreement\nTerm: 12 months\nAuto-renewal: No\nTermination: 30 days notice\nSLA: 99.9% uptime guaranteed",
    ),
]

for name, text in samples:
    path = OUT / name
    c = canvas.Canvas(str(path), pagesize=letter)
    width, height = letter
    y = height - 40
    c.setFont("Helvetica-Bold", 14)
    for line in text.split("\n"):
        c.drawString(40, y, line)
        y -= 16
    c.save()
    print("Wrote", path)
