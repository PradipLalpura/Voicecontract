import os
import json
import logging
from openai import AsyncOpenAI
from typing import Dict, Any, List

logger = logging.getLogger("voicecontract.strategist")

class StrategistAgent:
    """
    The Oracle of Persuasion. Uses GPT-4o via GitHub Models to analyze psychology and emit TIPs/SIGNALs.
    """
    def __init__(self):
        self.api_key = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://models.inference.ai.azure.com"
        self.model = "gpt-4o"
        
        if not self.api_key:
            logger.error("GITHUB_TOKEN missing for Strategist")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)

    async def analyze_psychology(self, transcript_delta: str) -> List[Dict[str, Any]]:
        """
        Analyzes recent transcript for buying signals or hesitations.
        Returns a list of 'PULSE' events (TIP or SIGNAL).
        """
        if not self.client or not transcript_delta.strip():
            return []
            
        prompt = f"""
        You are "The Strategist," a world-class negotiation consultant and expert in human psychology. 
        You are listening to a client meeting. Your job is to help the Service Provider (the user) CLOSE THE DEAL.
        
        RECENT TRANSCRIPT:
        {transcript_delta}

        DIRECTIVES:
        1. BUYING SIGNALS: Identify when the client is leaning in. 
        2. HESITATION DETECTION: If the client sounds uncertain about price, identify the root cause (Risk? Budget? ROI?).
        3. CULTURAL CONTEXT: Understand Hinglish power dynamics.
        
        Output ONLY valid JSON containing a list of pulses. Example:
        {{
            "pulses": [
                {{"kind": "SIGNAL", "content": "Client is showing high intent. Pivot to 'Quick-Start' clause.", "urgency": "medium"}},
                {{"kind": "TIP", "content": "Client sounds worried about ROI. Propose performance milestones.", "urgency": "high"}}
            ]
        }}
        If no tip is needed right now, output an empty list. Max 1 pulse at a time to avoid overwhelming the user.
        """

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are The Strategist. Be brief, actionable, and psychologically astute."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            
            data = json.loads(response.choices[0].message.content)
            return data.get("pulses", [])[:1] # Limit to 1 tip at a time
        except Exception as e:
            logger.error(f"Strategist Analysis Error: {e}")
            return []
