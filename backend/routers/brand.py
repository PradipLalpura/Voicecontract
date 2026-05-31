"""
Brand DNA Router
----------------
Extracts Brand DNA (tone, colours, document style) from a URL, file, or
raw text using Groq LLM, persists the result in the `brand_dna` table,
and manages the active-record lifecycle per user.
"""

from __future__ import annotations

import json
import os
import re
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

try:
    from backend.auth.jwt_auth import verify_token
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
    from database.client import supabase_admin

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/api/brand", tags=["Brand DNA"])

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ExtractDNARequest(BaseModel):
    type: Literal["url", "file", "text"] = Field(
        ..., description="Source type: 'url', 'file', or 'text'"
    )
    content: str = Field(
        ..., description="URL string, file-extracted text, or raw text"
    )


class ToneProfile(BaseModel):
    primary: str
    descriptors: list[str]
    formality: str
    personality: str
    writing_style: str


class ColourProfile(BaseModel):
    primary: str
    secondary: str
    accent: str
    background: str
    text: str
    rationale: str


class DocumentStyle(BaseModel):
    header_style: str
    font_personality: str
    spacing: str
    logo_placement: str


class BrandDNAOut(BaseModel):
    id: str | None = None
    user_id: str | None = None
    source_type: str | None = None
    source_raw: str | None = None
    tone: dict | None = None
    colours: dict | None = None
    document_style: dict | None = None
    is_active: bool | None = None
    created_at: str | None = None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BRAND_DNA_SYSTEM_PROMPT = """You are a brand strategist and visual designer. Analyse the provided brand material and extract a precise Brand DNA profile.

Return ONLY a valid JSON object with this exact structure:
{
  "tone": {
    "primary": "one-word tone descriptor (e.g. Professional, Playful, Bold, Trustworthy, Innovative)",
    "descriptors": ["3-5 adjectives that describe the brand voice"],
    "formality": "formal | semi-formal | casual",
    "personality": "2-3 sentence brand personality description",
    "writing_style": "specific guidance on writing style"
  },
  "colours": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode",
    "rationale": "brief explanation of colour choices"
  },
  "document_style": {
    "header_style": "minimal | bold | elegant | corporate",
    "font_personality": "geometric | humanist | serif | modern",
    "spacing": "tight | comfortable | airy",
    "logo_placement": "top-left | top-center | top-right"
  }
}"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _fetch_url_content(url: str) -> str:
    """Fetch a web page and return a simplified text representation."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL (HTTP {exc.response.status_code})",
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Request error: {exc}")

    # Rough extraction: strip tags, collapse whitespace
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""

    # Remove script / style blocks, then strip remaining tags
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()

    # Trim to a reasonable size so the LLM context isn't blown
    max_chars = 12_000
    if len(body) > max_chars:
        body = body[:max_chars] + "…"

    return f"Page title: {title}\n\nPage content:\n{body}"


def _parse_llm_json(raw: str) -> dict:
    """Extract and parse the first JSON object from the LLM response."""
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try to find a JSON block inside markdown fences
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    # Last resort: find first { … }
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError("Could not extract valid JSON from LLM response")


async def _extract_brand_dna(material: str) -> dict:
    """Send material to Groq and return parsed Brand DNA dict."""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3,
    )

    messages = [
        SystemMessage(content=BRAND_DNA_SYSTEM_PROMPT),
        HumanMessage(content=material),
    ]

    response = await llm.ainvoke(messages)
    raw_text = response.content

    try:
        return _parse_llm_json(raw_text)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM returned invalid JSON: {exc}",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/extract-dna", response_model=BrandDNAOut)
async def extract_brand_dna(
    body: ExtractDNARequest,
    user=Depends(verify_token),
):
    """
    Extract Brand DNA from a URL, uploaded-file text, or raw text.
    Deactivates any previously active Brand DNA for the user and stores the
    new profile as the active one.
    """
    user_id: str = user.get("sub") or user.get("id") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not resolve user identity")

    # 1. Resolve material text ------------------------------------------------
    if body.type == "url":
        material = await _fetch_url_content(body.content)
    elif body.type in ("file", "text"):
        material = body.content
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {body.type}")

    if not material or not material.strip():
        raise HTTPException(status_code=400, detail="No content provided or extracted")

    # 2. Call LLM -------------------------------------------------------------
    try:
        dna = await _extract_brand_dna(material)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {exc}")

    tone = dna.get("tone", {})
    colours = dna.get("colours", {})
    document_style = dna.get("document_style", {})

    # 3. Deactivate previous active records -----------------------------------
    try:
        supabase_admin.table("brand_dna") \
            .update({"is_active": False}) \
            .eq("user_id", user_id) \
            .eq("is_active", True) \
            .execute()
    except Exception:
        # Non-fatal — first-time users won't have rows yet
        pass

    # 4. Insert new record ----------------------------------------------------
    try:
        insert_resp = (
            supabase_admin.table("brand_dna")
            .insert({
                "user_id": user_id,
                "source_type": body.type,
                "source_raw": body.content,
                "tone": tone,
                "colours": colours,
                "document_style": document_style,
                "is_active": True,
            })
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {exc}")

    if not insert_resp.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return insert_resp.data[0]


@router.get("/active", response_model=BrandDNAOut)
async def get_active_brand_dna(user=Depends(verify_token)):
    """Return the currently active Brand DNA for the authenticated user."""
    user_id: str = user.get("sub") or user.get("id") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not resolve user identity")

    try:
        resp = (
            supabase_admin.table("brand_dna")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database query failed: {exc}")

    if not resp.data:
        raise HTTPException(status_code=404, detail="No active Brand DNA found")

    return resp.data[0]
