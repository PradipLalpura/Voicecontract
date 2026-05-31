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
        language: str | None = None,
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

        _lang = language if language else ""

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                wav_file = ("capture.wav", wav_bytes, "audio/wav")
                response = await self._client.audio.transcriptions.create(
                    model=self.model,
                    file=wav_file,
                    language=_lang,
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

    async def transcribe_file(
        self, *, file_bytes: bytes, filename: str = "audio.wav",
        language: str | None = None, prompt: str | None = None,
    ) -> TranscriptionResult:
        """Transcribe an uploaded audio file directly using Groq's high-speed endpoint."""
        _prompt = prompt or _default_prompt()
        _lang = language if language else ""
        
        if not self._client:
            raise TranscriptionError("Groq client not initialized.")

        for attempt in range(self.max_retries + 1):
            try:
                # Direct async call to the OpenAI/Groq client
                response = await self._client.audio.transcriptions.create(
                    model=self.model,
                    file=(filename, file_bytes),
                    language=_lang,
                    prompt=_prompt,
                    response_format="json",
                    temperature=0,
                )
                text = str(getattr(response, "text", "") or "").strip()
                logger.info(f"✅ Successfully transcribed {filename} ({len(file_bytes)} bytes)")
                
                return TranscriptionResult(
                    text=_normalize_transcript(text),
                    model=self.model,
                    duration_seconds=0,
                    language=getattr(response, "language", None),
                )
            except Exception as exc:
                logger.error(f"Whisper file transcription attempt {attempt+1} failed: {exc}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                raise TranscriptionError(f"Transcribe file failed after {self.max_retries+1} attempts: {exc}")
        
        return TranscriptionResult(text="", model=self.model, duration_seconds=0)


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
        "Indian business meeting with multilingual speakers. "
        "Languages: English, Hindi, Gujarati, Hinglish (code-switching). "
        "Hindi terms: kaam karna hai, kitna lagega, ho jayega, pakka hai, "
        "bhej denge, GST alag se, advance de do, payment karo, karna padega, "
        "invoice bhejo, agreement banana hai, total kitna hua. "
        "Gujarati terms: thase, karvu padse, paisa, rupiya, bhai saheb, "
        "barabar che, final che, mahine, aapne, pan karavano che, aapjo. "
        "Business terms: rupee amounts, lakh, crore, GST, IGST, CGST, SGST, "
        "retainer, milestone, deliverable, timeline, revision, invoice, PO, MSA, "
        "purchase order, master service agreement, scope of work."
    )
