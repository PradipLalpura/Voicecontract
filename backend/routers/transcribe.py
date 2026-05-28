from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from agents.whisper_agent import transcribe_audio

router = APIRouter()

ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "video/mp4", "audio/mp3", "audio/wave", "audio/ogg", "audio/webm"]
MAX_SIZE = 50 * 1024 * 1024 # Increased to 50MB for production robustness

@router.post("/transcribe")
async def transcribe(
    audio_file: UploadFile = File(...),
):
    print(f"📥 Received file: {audio_file.filename} ({audio_file.content_type})")

    # Loosen check: as long as it starts with audio/ or is a known video format
    if not audio_file.content_type.startswith("audio/") and audio_file.content_type != "video/mp4":
         print(f"❌ Rejected: Invalid MIME type {audio_file.content_type}")
         raise HTTPException(status_code=400, detail=f"Invalid file type: {audio_file.content_type}")

    file_bytes = await audio_file.read()
    if len(file_bytes) > MAX_SIZE:
        print(f"❌ Rejected: File too large ({len(file_bytes)} bytes)")
        raise HTTPException(status_code=413, detail="File too large. Max 50MB.")

    try:
        result = await transcribe_audio(file_bytes, audio_file.filename)
        print("✅ Transcription successful")
        return result
    except Exception as e:
        print(f"❌ Transcription Pipeline Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
