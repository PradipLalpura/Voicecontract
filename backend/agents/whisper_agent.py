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
        print("❌ CRITICAL: GROQ_API_KEY is missing from environment variables!")
        raise ValueError("GROQ_API_KEY not found in environment")

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    # Using a single files dict for everything to ensure Groq's multi-part parser is happy
    files = {
        "file": (filename, file_bytes),
        "model": (None, MODEL),
        "response_format": (None, "json")
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            print(f"🚀 Sending {len(file_bytes)} bytes to Groq Whisper...")
            response = await client.post(BASE_URL, headers=headers, files=files)

            if response.status_code != 200:
                print(f"❌ Groq API Error ({response.status_code}): {response.text}")

            response.raise_for_status()
            data = response.json()
            print(f"✨ Transcribed {data.get('duration', 0)}s of audio")

            return {
                "transcript": data.get("text", ""),
                "duration": data.get("duration", 0),
                "language": data.get("language", "en")
            }
        except Exception as e:
            print(f"❌ Groq HTTP Error: {str(e)}")
            raise e
