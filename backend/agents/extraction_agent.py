import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = "gemini-2.0-flash"

# Initialize the client
client = genai.Client(api_key=GEMINI_API_KEY)

def load_prompt(filename):
    path = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", filename)
    with open(path, "r") as f:
        return f.read()

async def process_transcript(transcript: str) -> dict:
    """
    Extracts terms and analyzes gaps using Gemini 2.0 Flash.
    Two-step reasoning in one call for speed.
    """
    extraction_prompt = load_prompt("extraction_prompt.md")
    gap_prompt = load_prompt("gap_analysis_prompt.md")

    # Combine prompts for unified reasoning
    system_instruction = f"{extraction_prompt}\n\nTHEN perform gap analysis as per this instruction:\n{gap_prompt}"
    
    prompt = f"Meeting Transcript:\n{transcript}\n\nReturn the final JSON containing both 'terms' and 'gaps' keys."

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        # Safely parse JSON
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Gemini Extraction Error: {str(e)}")
        # Return fallback empty state to prevent crash
        return {
            "terms": {},
            "gaps": [],
            "has_gaps": True,
            "gap_count": 0,
            "error": str(e)
        }
