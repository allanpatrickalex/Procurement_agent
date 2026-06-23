"""Gemini 2.5 Pro integration service."""

import json
import logging
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
DEFAULT_MODEL = "gemini-2.5-pro"


class GeminiServiceError(Exception):
    """Raised when Gemini API interaction fails."""


class GeminiService:
    """Reusable service for loading prompts and calling Gemini 2.5 Pro."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        prompts_dir: Path | None = None,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise GeminiServiceError(
                "GEMINI_API_KEY is not set. Add it to your .env file."
            )

        self.model = model or os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
        self.prompts_dir = prompts_dir or PROMPTS_DIR
        self.client = genai.Client(api_key=self.api_key)

    def load_prompt(self, prompt_name: str, **variables: Any) -> str:
        """Load a prompt template from backend/app/prompts/ and format variables."""
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        if not prompt_path.exists():
            raise GeminiServiceError(f"Prompt template not found: {prompt_path.name}")

        template = prompt_path.read_text(encoding="utf-8").strip()
        if not variables:
            return template

        try:
            return template.format(**variables)
        except KeyError as exc:
            raise GeminiServiceError(
                f"Missing variable for prompt '{prompt_name}': {exc}"
            ) from exc

    def generate_text(
        self,
        prompt_name: str,
        user_content: str,
        *,
        prompt_variables: dict[str, Any] | None = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate plain-text content using a stored prompt template."""
        system_prompt = self.load_prompt(prompt_name, **(prompt_variables or {}))
        contents = self._build_contents(system_prompt, user_content)

        # Retry logic for transient Gemini failures
        last_exc = None
        for attempt in range(3):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=types.GenerateContentConfig(temperature=temperature),
                )
                break
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "Gemini text generation attempt %d failed for prompt '%s': %s",
                    attempt + 1,
                    prompt_name,
                    exc,
                )
                time.sleep(1 + attempt * 2)
        else:
            logger.exception("Gemini text generation failed for prompt '%s'", prompt_name)
            raise GeminiServiceError(f"Gemini request failed: {last_exc}") from last_exc

        text = self._extract_text(response)
        if not text:
            raise GeminiServiceError("Gemini returned an empty response.")

        return text

    def generate_json(
        self,
        prompt_name: str,
        user_content: str,
        *,
        prompt_variables: dict[str, Any] | None = None,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        """Generate structured JSON using a stored prompt template."""
        system_prompt = self.load_prompt(prompt_name, **(prompt_variables or {}))
        contents = self._build_contents(system_prompt, user_content)

        last_exc = None
        for attempt in range(3):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        response_mime_type="application/json",
                    ),
                )
                break
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "Gemini JSON generation attempt %d failed for prompt '%s': %s",
                    attempt + 1,
                    prompt_name,
                    exc,
                )
                time.sleep(1 + attempt * 2)
        else:
            logger.exception("Gemini JSON generation failed for prompt '%s'", prompt_name)
            raise GeminiServiceError(f"Gemini request failed: {last_exc}") from last_exc

        text = self._extract_text(response)
        if not text:
            raise GeminiServiceError("Gemini returned an empty JSON response.")

        return self._parse_json(text)

    @staticmethod
    def _build_contents(system_prompt: str, user_content: str) -> list[types.Content]:
        return [
            types.Content(
                role="user",
                parts=[
                    types.Part(text=f"{system_prompt}\n\n---\n\n{user_content}"),
                ],
            )
        ]

    @staticmethod
    def _extract_text(response: Any) -> str:
        text = getattr(response, "text", None)
        if text:
            return text.strip()

        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    return part_text.strip()

        return ""

    @staticmethod
    def _parse_json(text: str) -> dict[str, Any]:
        cleaned = text.strip()

        fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if fence_match:
            cleaned = fence_match.group(1).strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise GeminiServiceError(f"Failed to parse Gemini JSON response: {exc}") from exc

        if not isinstance(parsed, dict):
            raise GeminiServiceError("Gemini JSON response must be an object.")

        return parsed


@lru_cache
def get_gemini_service() -> GeminiService:
    """Return a cached GeminiService instance for dependency injection."""
    return GeminiService()
