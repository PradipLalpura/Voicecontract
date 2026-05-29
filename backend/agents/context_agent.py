from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Final, Literal

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI


logger = logging.getLogger("voicecontract.context")

GROQ_BASE_URL: Final[str] = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
CONTEXT_MODEL: Final[str] = os.getenv("GROQ_CONTEXT_MODEL", "llama-3.3-70b-versatile")
CONTEXT_TIMEOUT_SECONDS: Final[float] = float(os.getenv("CONTEXT_TIMEOUT_SECONDS", "10"))
CONTEXT_MAX_RETRIES: Final[int] = int(os.getenv("CONTEXT_MAX_RETRIES", "2"))

CommitmentType = Literal[
    "price",
    "payment_terms",
    "timeline",
    "scope",
    "deliverable",
    "revision",
    "ownership",
    "confidentiality",
    "termination",
    "liability",
    "jurisdiction",
    "other",
]
VALID_COMMITMENT_TYPES: Final[set[str]] = {
    "price",
    "payment_terms",
    "timeline",
    "scope",
    "deliverable",
    "revision",
    "ownership",
    "confidentiality",
    "termination",
    "liability",
    "jurisdiction",
    "other",
}


@dataclass(frozen=True, slots=True)
class Commitment:
    type: CommitmentType
    value: str
    confidence: float
    speaker: str | None
    evidence: str
    legal_weight: Literal["firm", "probable", "tentative"]
    normalized: dict[str, Any] = field(default_factory=dict)

    @property
    def dedupe_key(self) -> str:
        normalized_value = re.sub(r"\s+", " ", self.value.strip().lower())
        return f"{self.type}:{normalized_value}"


@dataclass(frozen=True, slots=True)
class ContextAnalysis:
    commitments: tuple[Commitment, ...]
    ignored_banter: tuple[str, ...]
    summary: str


class ContextAgentError(RuntimeError):
    pass


class ContextAgent:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = CONTEXT_MODEL,
        base_url: str = GROQ_BASE_URL,
        timeout_seconds: float = CONTEXT_TIMEOUT_SECONDS,
        max_retries: int = CONTEXT_MAX_RETRIES,
    ) -> None:
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        resolved_key = api_key or os.getenv("GROQ_API_KEY")
        if not resolved_key:
            raise ContextAgentError("GROQ_API_KEY is required for live context analysis.")
        self._client = AsyncOpenAI(api_key=resolved_key, base_url=base_url, timeout=timeout_seconds)

    async def analyze_delta(
        self,
        *,
        recent_transcript: str,
        known_commitments: list[dict[str, Any]],
        meeting_context: dict[str, Any] | None = None,
    ) -> ContextAnalysis:
        if not recent_transcript.strip():
            return ContextAnalysis(commitments=(), ignored_banter=(), summary="")

        payload = {
            "recent_transcript": recent_transcript[-6500:],
            "known_commitments": known_commitments[-40:],
            "meeting_context": meeting_context or {},
        }

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                response = await self._client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": _system_prompt()},
                        {"role": "user", "content": json.dumps(payload, ensure_ascii=False, separators=(",", ":"))},
                    ],
                    temperature=0,
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content or "{}"
                return _parse_analysis(content)
            except (APITimeoutError, APIConnectionError, APIStatusError) as exc:
                last_error = exc
                if isinstance(exc, APIStatusError) and exc.status_code not in {408, 409, 425, 429, 500, 502, 503, 504}:
                    break
                if attempt < self.max_retries:
                    await asyncio.sleep(0.2 * 2**attempt)
            except Exception as exc:
                last_error = exc
                break

        logger.exception("context_analysis_failed model=%s", self.model)
        raise ContextAgentError(f"Context analysis failed: {last_error}") from last_error


def _parse_analysis(content: str) -> ContextAnalysis:
    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if not match:
            raise ContextAgentError("Context model returned non-JSON content.") from exc
        raw = json.loads(match.group(0))

    commitments: list[Commitment] = []
    for item in raw.get("commitments", []):
        if not isinstance(item, dict):
            continue
        legal_weight = str(item.get("legal_weight", "tentative")).lower()
        confidence = _clamp_float(item.get("confidence", 0), 0, 1)
        value = str(item.get("value", "")).strip()
        evidence = str(item.get("evidence", "")).strip()
        if legal_weight != "firm" or confidence < 0.74 or not value or not evidence:
            continue

        commitment_type = str(item.get("type", "other")).lower()
        if commitment_type not in VALID_COMMITMENT_TYPES:
            commitment_type = "other"

        commitments.append(
            Commitment(
                type=commitment_type,  # type: ignore[arg-type]
                value=value,
                confidence=confidence,
                speaker=str(item["speaker"]).strip() if item.get("speaker") else None,
                evidence=evidence,
                legal_weight="firm",
                normalized=item.get("normalized") if isinstance(item.get("normalized"), dict) else {},
            )
        )

    ignored = tuple(str(value).strip() for value in raw.get("ignored_banter", []) if str(value).strip())[:10]
    return ContextAnalysis(
        commitments=tuple(commitments[:8]),
        ignored_banter=ignored,
        summary=str(raw.get("summary", "")).strip()[:1000],
    )


def _clamp_float(value: Any, low: float, high: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return low
    return max(low, min(high, parsed))


def _system_prompt() -> str:
    return """
You are VoiceContract Pro's real-time Indian legal intent recognizer.

Your job is to inspect a small rolling transcript delta from a live sales/client meeting and identify only deal terms
that have become firm enough to be shown to a lawyer or contract drafter in real time.

Understand Indian business English and Hinglish:
- "40k done", "pachaas hazaar final", "lock kar dete hain", "pakka", "chalo freeze it", "advance kal bhej denge",
  "GST extra", "Monday EOD tak ho jayega", "scope mein include hai" usually signal commitment.
- "maybe", "try karte hain", "dekhte hain", "around", "roughly", "can we do", "what if", "I think", "suggest",
  negotiation anchors, jokes, and casual banter are not firm commitments.
- Distinguish proposals from acceptance. A price is firm only when accepted, locked, or clearly confirmed by an
  authorized speaker.
- Capture rupee amounts, lakh/crore shorthand, GST, payment milestones, delivery dates, revision limits, ownership,
  termination, confidentiality, liability, and jurisdiction when firm.

Return only a JSON object:
{
  "commitments": [
    {
      "type": "price|payment_terms|timeline|scope|deliverable|revision|ownership|confidentiality|termination|liability|jurisdiction|other",
      "value": "human-readable finalized term",
      "confidence": 0.0-1.0,
      "speaker": "speaker label if available, else null",
      "evidence": "short exact transcript evidence",
      "legal_weight": "firm|probable|tentative",
      "normalized": {"amount_inr": 40000, "currency": "INR", "date": "YYYY-MM-DD"}
    }
  ],
  "ignored_banter": ["short notes on phrases ignored as non-binding"],
  "summary": "one-sentence summary of newly firm terms"
}

Rules:
- Prefer no commitments over false commitments.
- Do not repeat commitments already present in known_commitments unless the transcript materially changes the value.
- Include only firm commitments in the commitments array when legal_weight is "firm".
- Evidence must come from the recent transcript.
- Output valid JSON only.
""".strip()
