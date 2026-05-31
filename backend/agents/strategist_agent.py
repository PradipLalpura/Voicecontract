from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Final, Literal, List, Dict

from openai import AsyncOpenAI

logger = logging.getLogger("voicecontract.strategist")

GITHUB_TOKEN: Final[str] = os.getenv("GITHUB_TOKEN", "")
STRATEGIST_MODEL: Final[str] = os.getenv("STRATEGIST_MODEL", "gpt-4o")
STRATEGIST_BASE_URL: Final[str] = os.getenv("STRATEGIST_BASE_URL", "https://models.inference.ai.azure.com")

class StrategistAgentError(RuntimeError):
    pass

@dataclass(frozen=True, slots=True)
class PulseTip:
    kind: str
    content: str
    urgency: str

class StrategistAgent:
    """
    The Oracle of Persuasion. Uses GPT-4o to analyze psychology and emit TIPs/SIGNALs.
    """
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = STRATEGIST_MODEL,
        base_url: str = STRATEGIST_BASE_URL,
    ) -> None:
        self.model = model
        resolved_key = api_key or GITHUB_TOKEN
        if not resolved_key:
            raise StrategistAgentError("GITHUB_TOKEN is required for live strategist analysis.")
        self._client = AsyncOpenAI(api_key=resolved_key, base_url=base_url, timeout=15)

    async def analyze_psychology(
        self,
        *,
        recent_transcript: str,
    ) -> List[PulseTip]:
        """
        Analyzes recent transcript for buying signals or hesitations.
        Returns a list of PulseTip events (TIP or SIGNAL).
        """
        if not recent_transcript.strip():
            return []
            
        prompt = f"""
        You are "The Strategist," the smartest brain in negotiation psychology for the Indian market. 
        You are listening to a meeting involving English, Hindi, and Gujarati. 
        Your goal is to help the user CLOSE THE DEAL by providing real-time psychological cues and tactics.
        
        RECENT TRANSCRIPT:
        {recent_transcript[-4000:]}

        SMART DIRECTIVES:
        1. CULTURAL CUES: Detect when 'paisa' or 'rokda' is mentioned with hesitation. Propose a 'Retainer' to ease risk.
        2. BUYING SIGNALS: If the client says "Barabar" or "Done" but asks about 'source code', pivot to 'IP Licensing' upsell.
        3. OBJECTION PREEMPTION: If the client sounds worried about 'Timeline' (e.g., "Bahut time lag raha hai"), suggest 'Agile Sprints'.
        4. TACTICAL ALERT: Use SIGNAL for high-value alerts and TIP for general advice.
        
        Output ONLY valid JSON:
        {{
            "pulses": [
                {{"kind": "SIGNAL", "content": "Client intent high. Lock the price NOW before scope creeps.", "urgency": "high"}}
            ]
        }}
        """

        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are The Strategist. Be brief, actionable, and psychologically astute."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            
            content = response.choices[0].message.content or "{}"
            raw = json.loads(content)
            
            pulses = []
            for item in raw.get("pulses", [])[:1]:
                if not isinstance(item, dict):
                    continue
                pulses.append(PulseTip(
                    kind=str(item.get("kind", "TIP")),
                    content=str(item.get("content", "")),
                    urgency=str(item.get("urgency", "low"))
                ))
            return pulses
        except Exception as exc:
            logger.warning(f"Strategist Analysis Error: {exc}")
            return []
