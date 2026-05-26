import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "whisper-large-v3-turbo"
BASE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

async def transcribe_audio(file_bytes: bytes, filename: str) -> dict:
    """
    Transcribes audio using Groq Whisper.
    Very fast and accurate for meeting recordings.
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment")

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    
    # Explicitly separate files and data
    files = {"file": (filename, file_bytes)}
    data = {"model": MODEL}

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(BASE_URL, headers=headers, files=files, data=data)
            if response.status_code != 200:
                print(f"Groq Error Body: {response.text}")
            response.raise_for_status()
            data = response.json()
            return {
                "transcript": data.get("text", ""),
                "duration": data.get("duration", 0),
                "language": data.get("language", "en")
            }
        except Exception as e:
            print(f"Groq Transcription Error: {str(e)}")
            raise e
