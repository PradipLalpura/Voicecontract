import logging
import os
import sys

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException

# --- ROBUST IMPORT SYSTEM ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from backend.auth.jwt_auth import verify_token
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token

# Lazy imports — WhisperAgent may not be available in all environments
whisper_agent = None
context_agent = None

logger = logging.getLogger("voicecontract.upload")
router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/webm", "audio/ogg",
    "audio/x-m4a", "application/octet-stream"
}

MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB


def _get_whisper():
    """Lazy-load WhisperAgent to avoid startup crashes if OpenAI key missing."""
    global whisper_agent
    if whisper_agent is None:
        try:
            from backend.agents.whisper_agent import WhisperAgent
            whisper_agent = WhisperAgent()
        except Exception:
            try:
                from agents.whisper_agent import WhisperAgent
                whisper_agent = WhisperAgent()
            except Exception as e:
                logger.error(f"Failed to load WhisperAgent: {e}")
                return None
    return whisper_agent


def _get_context():
    """Lazy-load ContextAgent."""
    global context_agent
    if context_agent is None:
        try:
            from backend.agents.context_agent import ContextAgent
            context_agent = ContextAgent()
        except Exception:
            try:
                from agents.context_agent import ContextAgent
                context_agent = ContextAgent()
            except Exception as e:
                logger.error(f"Failed to load ContextAgent: {e}")
                return None
    return context_agent


@router.post("/recording")
async def upload_recording(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    token_data: dict = Depends(verify_token)
):
    """
    Upload an audio recording for offline processing.
    Transcribes the audio and extracts commitments.
    """
    # Validate file type (permissive — browsers send varying MIME types)
    if audio.content_type and audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {audio.content_type}. Accepted: wav, mp3, m4a, webm, ogg"
        )

    # Read audio data
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(audio_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 100 MB limit")

    # Transcribe
    whisper = _get_whisper()
    if whisper is None:
        raise HTTPException(status_code=503, detail="Transcription service unavailable")

    try:
        transcript_result = await whisper.transcribe_pcm16(pcm=audio_bytes, sample_rate=16000)
        transcript = transcript_result.text if transcript_result else ""
    except Exception as e:
        logger.error(f"Transcription failed for session {session_id}: {e}")
        raise HTTPException(status_code=422, detail="Could not transcribe audio")

    if not transcript:
        raise HTTPException(status_code=422, detail="No speech detected in audio")

    # Extract commitments (optional — graceful if unavailable)
    commitments = []
    ctx = _get_context()
    if ctx is not None:
        try:
            analysis = await ctx.analyze_delta(
                recent_transcript=transcript,
                known_commitments=[],
                meeting_context={"session_id": session_id, "locale": "India", "currency": "INR"}
            )
            commitments = [
                {
                    "type": c.type,
                    "value": c.value,
                    "confidence": c.confidence,
                    "speaker": c.speaker,
                    "evidence": c.evidence,
                }
                for c in analysis.commitments
            ]
        except Exception as e:
            logger.warning(f"Context analysis failed for session {session_id}: {e}")

    return {
        "session_id": session_id,
        "transcript_length": len(transcript),
        "commitments_count": len(commitments),
        "status": "transcribed"
    }
