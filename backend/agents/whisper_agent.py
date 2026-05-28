import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "whisper-large-v3-turbo"
BASE_URL = "https://api.groq.com/openai/v1"

# Initialize Groq client using the OpenAI library
client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url=BASE_URL
)

async def transcribe_audio(file_bytes: bytes, filename: str) -> dict:
    """
    Transcribes audio using Groq Whisper via the OpenAI SDK.
    Most reliable method for multi-part file uploads.
    """
    if not GROQ_API_KEY:
        print("❌ CRITICAL: GROQ_API_KEY is missing!")
        raise ValueError("GROQ_API_KEY not found in environment")

    try:
        print(f"🚀 Processing {filename} via Groq Whisper SDK...")
        
        # We need to wrap the bytes in a file-like object for the SDK
        from io import BytesIO
        audio_file = BytesIO(file_bytes)
        audio_file.name = filename

        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model=MODEL,
            response_format="json"
        )
        
        print("✅ Transcription successful via SDK")
        return {
            "transcript": transcription.text,
            "duration": 0, # SDK doesn't always return duration in simple json format
            "language": "en"
        }
    except Exception as e:
        print(f"❌ Groq SDK Error: {str(e)}")
        raise e
