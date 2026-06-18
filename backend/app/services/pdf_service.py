"""PDF text extraction service."""

import io
import logging
from pathlib import Path

import pdfplumber
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


class PDFServiceError(Exception):
    """Raised when PDF text extraction fails."""


class PDFService:
    """Extract text content from PDF documents."""

    def extract_text(self, file_path: Path) -> str:
        """Extract text from a PDF file on disk."""
        if not file_path.exists():
            raise PDFServiceError(f"PDF file not found: {file_path}")

        if file_path.suffix.lower() != ".pdf":
            raise PDFServiceError(f"Expected a PDF file, got: {file_path.name}")

        content = file_path.read_bytes()
        return self.extract_text_from_bytes(content, file_path.name)

    def extract_text_from_bytes(self, content: bytes, filename: str) -> str:
        """Extract text from PDF bytes."""
        if not content:
            raise PDFServiceError(f"PDF file is empty: {filename}")

        text = self._extract_with_pdfplumber(content, filename)
        if text.strip():
            return text.strip()

        text = self._extract_with_pypdf2(content, filename)
        if text.strip():
            return text.strip()

        raise PDFServiceError(f"No text could be extracted from PDF: {filename}")

    @staticmethod
    def _extract_with_pdfplumber(content: bytes, filename: str) -> str:
        try:
            pages: list[str] = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        pages.append(page_text.strip())
            return "\n\n".join(pages)
        except Exception as exc:
            logger.warning("pdfplumber extraction failed for %s: %s", filename, exc)
            return ""

    @staticmethod
    def _extract_with_pypdf2(content: bytes, filename: str) -> str:
        try:
            reader = PdfReader(io.BytesIO(content))
            pages: list[str] = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(page_text.strip())
            return "\n\n".join(pages)
        except Exception as exc:
            logger.warning("PyPDF2 extraction failed for %s: %s", filename, exc)
            return ""
