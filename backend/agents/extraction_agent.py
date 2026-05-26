import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_ID = "llama-3.3-70b-versatile"
BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

def load_prompt(filename):
    path = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", filename)
    with open(path, "r") as f:
        return f.read()

async def process_transcript(transcript: str) -> dict:
    """
    Extracts terms and analyzes gaps using Groq Llama 3.3 70B.
    Replacing Gemini to avoid 429 Quota Exhausted errors.
    """
    extraction_prompt = load_prompt("extraction_prompt.md")
    gap_prompt = load_prompt("gap_analysis_prompt.md")

    system_instruction = f"{extraction_prompt}\n\nTHEN perform gap analysis as per this instruction:\n{gap_prompt}"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Meeting Transcript:\n{transcript}\n\nReturn the final JSON containing both 'terms' and 'gaps' keys."}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.post(BASE_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            # Parse the content string from the response
            content = result['choices'][0]['message']['content']
            return json.loads(content)
            
        except Exception as e:
            print(f"Groq Extraction Error: {str(e)}")
            # Return fallback empty state to prevent crash
            return {
                "terms": {},
                "gaps": [
                    {
                        "field": "all",
                        "warning": "The extraction agent encountered an error and couldn't process the transcript.",
                        "default_value": "Please review the transcript manually."
                    }
                ],
                "has_gaps": True,
                "gap_count": 1,
                "error": str(e)
            }
