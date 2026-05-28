from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from agents.whisper_agent import transcribe_audio

router = APIRouter()

ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "video/mp4"]
MAX_SIZE = 25 * 1024 * 1024 # 25MB

@router.post("/transcribe")
async def transcribe(
    audio_file: UploadFile = File(...),
):
    if audio_file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Accepted formats: MP3, WAV, M4A")
    
    file_bytes = await audio_file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 25MB.")

    try:
        result = await transcribe_audio(file_bytes, audio_file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
