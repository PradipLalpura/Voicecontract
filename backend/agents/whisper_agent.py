from __future__ import annotations

import asyncio
import io
import logging
import os
import wave
from dataclasses import dataclass
from typing import Final

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI


logger = logging.getLogger("voicecontract.whisper")

GROQ_BASE_URL: Final[str] = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
WHISPER_MODEL: Final[str] = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
WHISPER_TIMEOUT_SECONDS: Final[float] = float(os.getenv("WHISPER_TIMEOUT_SECONDS", "12"))
WHISPER_MAX_RETRIES: Final[int] = int(os.getenv("WHISPER_MAX_RETRIES", "2"))
MAX_PCM_BYTES: Final[int] = int(os.getenv("WHISPER_MAX_PCM_BYTES", str(48000 * 2 * 8)))


class TranscriptionError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class TranscriptionResult:
    text: str
    model: str
    duration_seconds: float
    language: str | None = None


class WhisperAgent:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = WHISPER_MODEL,
        base_url: str = GROQ_BASE_URL,
        timeout_seconds: float = WHISPER_TIMEOUT_SECONDS,
        max_retries: int = WHISPER_MAX_RETRIES,
    ) -> None:
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        resolved_key = api_key or os.getenv("GROQ_API_KEY")
        if not resolved_key:
            raise TranscriptionError("GROQ_API_KEY is required for live transcription.")
        self._client = AsyncOpenAI(api_key=resolved_key, base_url=base_url, timeout=timeout_seconds)

    async def transcribe_pcm16(
        self,
        *,
        pcm: bytes,
        sample_rate: int,
        channels: int = 1,
        language: str = "en",
        prompt: str | None = None,
    ) -> TranscriptionResult:
        if not pcm:
            return TranscriptionResult(text="", model=self.model, duration_seconds=0)
        if len(pcm) > MAX_PCM_BYTES:
            raise TranscriptionError(f"PCM payload too large: {len(pcm)} bytes")
        if sample_rate < 8000 or sample_rate > 192000:
            raise TranscriptionError(f"Unsupported sample rate: {sample_rate}")
        if channels < 1 or channels > 2:
            raise TranscriptionError(f"Unsupported channel count: {channels}")

        wav_bytes = _pcm16_to_wav(pcm=pcm, sample_rate=sample_rate, channels=channels)
        duration_seconds = len(pcm) / float(sample_rate * channels * 2)

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                wav_file = ("capture.wav", wav_bytes, "audio/wav")
                response = await self._client.audio.transcriptions.create(
                    model=self.model,
                    file=wav_file,
                    language=language,
                    prompt=prompt or _default_prompt(),
                    response_format="json",
                    temperature=0,
                )
                text = str(getattr(response, "text", "") or "").strip()
                return TranscriptionResult(
                    text=_normalize_transcript(text),
                    model=self.model,
                    duration_seconds=duration_seconds,
                    language=getattr(response, "language", None),
                )
            except (APITimeoutError, APIConnectionError, APIStatusError) as exc:
                last_error = exc
                if isinstance(exc, APIStatusError) and exc.status_code not in {408, 409, 425, 429, 500, 502, 503, 504}:
                    break
                if attempt < self.max_retries:
                    await asyncio.sleep(0.2 * 2**attempt)
            except Exception as exc:
                last_error = exc
                break

        logger.exception("whisper_transcription_failed model=%s bytes=%s", self.model, len(pcm))
        raise TranscriptionError(f"Whisper transcription failed: {last_error}") from last_error


def _pcm16_to_wav(*, pcm: bytes, sample_rate: int, channels: int) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return buffer.getvalue()


def _normalize_transcript(text: str) -> str:
    return " ".join(text.replace("\x00", " ").split())


def _default_prompt() -> str:
    return (
        "Indian business meeting audio with Hinglish, rupee amounts, timelines, deliverables, GST, retainers, "
        "payment milestones, and commitment phrases such as done, pakka, lock it, final, chalo, ho jayega."
    )
