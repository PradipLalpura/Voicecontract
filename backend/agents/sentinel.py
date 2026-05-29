import os
import json
import logging
from openai import OpenAI
from typing import Dict, Any, List

logger = logging.getLogger("voicecontract.sentinel")

class SentinelAgent:
    """
    The Fact-Checker. Uses Llama 3.3 via Groq for high-speed tracking of the 8 Legal Pillars.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = "llama-3.3-70b-versatile"
        if not self.api_key:
            logger.error("GROQ_API_KEY missing for Sentinel")
        else:
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    async def analyze_transcript(self, transcript_delta: str, current_state: Dict[str, bool]) -> List[Dict[str, Any]]:
        """
        Analyzes recent transcript. Returns a list of 'PULSE' events (LOCK or NUDGE).
        current_state is a dict of pillar -> boolean (True if locked).
        """
        if not self.api_key or not transcript_delta.strip():
            return []

        locked_str = ", ".join([k for k, v in current_state.items() if v])
        
        prompt = f"""
        You are "The Sentinel," a hyper-vigilant legal fact-checker.
        8 Critical Pillars: Scope, Price, Payment, Timeline, Revisions, IP, Termination, Liability.
        Currently Locked Pillars: {locked_str if locked_str else "None"}
        
        RECENT TRANSCRIPT:
        {transcript_delta}

        DIRECTIVES:
        1. Identify if any NEW pillar was firmly agreed upon (LOCKED).
        2. Output a JSON list of pulses.
        Format:
        {{
            "pulses": [
                {{"kind": "LOCK", "pillar": "Price", "value": "₹50,000", "content": "Price confirmed at ₹50k", "confidence": 0.95, "urgency": "low"}}
            ]
        }}
        Only output valid JSON. If nothing new is locked, output empty pulses list.
        """

        try:
            # Using synchronous call in executor to not block, or async client if configured. 
            # For simplicity with standard OpenAI client, we'll wrap it or just use it (assuming standard fast response, but async is better).
            # We'll use the sync client wrapped in a try block for MVP speed, ideally AsyncOpenAI is used.
            from openai import AsyncOpenAI
            aclient = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            
            response = await aclient.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are The Sentinel, a strict legal fact-checker."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
            data = json.loads(response.choices[0].message.content)
            return data.get("pulses", [])
        except Exception as e:
            logger.error(f"Sentinel Analysis Error: {e}")
            return []
