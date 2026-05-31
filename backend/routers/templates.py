import logging
import os
import json
from fastapi import APIRouter, Depends, Body, HTTPException
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

try:
    from backend.auth.jwt_auth import verify_token
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
    from database.client import supabase_admin

logger = logging.getLogger("voicecontract.templates")
router = APIRouter(prefix="/api/templates", tags=["Templates"])


def get_llm():
    token = os.getenv("GROQ_API_KEY")
    if not token:
        logger.warning("GROQ_API_KEY is not set.")
        return None
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=token,
        temperature=0.7,
        max_tokens=8000,
    )


def _get_brand_dna(user_id: str) -> dict:
    """Fetch the user's active brand DNA from database."""
    if not supabase_admin:
        return {}
    try:
        res = (
            supabase_admin.table("brand_dna")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.error(f"Failed to fetch brand DNA: {e}")
    return {}


SYSTEM_PROMPT = """You are VoiceContract's Elite Legal Template Architect — a senior commercial lawyer with 20 years of experience.
You are tasked to create HTML templates for ONE specific document type.

BRAND CONTEXT:
- Tone: {tone}
- Formality: {formality}
- Primary Colour: {primary_colour}
- Writing Style: {writing_style}

TONE VARIATIONS (generate 3 options):
- Option 1 "Conservative & Strict": Maximum legal protection, formal legalese, strict enforcement
- Option 2 "Balanced & Modern": Standard corporate, fair mutual protections, clear and professional
- Option 3 "Friendly & Collaborative": Simple language, collaborative tone, low friction

OUTPUT FORMAT — Return ONLY a valid JSON object matching this structure (no markdown fences):
{{
  "{doc_type}": [
    {{"title": "Conservative & Strict", "content": "<HTML content here>"}},
    {{"title": "Balanced & Modern", "content": "<HTML content here>"}},
    {{"title": "Friendly & Collaborative", "content": "<HTML content here>"}}
  ]
}}

Use inline CSS with the brand primary colour for headers and accents. Use {{PLACEHOLDER}} syntax for dynamic fields.
"""


@router.post("/generate")
async def generate_templates(
    payload: dict = Body(...),
    token_data: dict = Depends(verify_token),
):
    if not llm:
        raise HTTPException(status_code=500, detail="LLM configuration missing.")

    company_name = payload.get("company_name", "Unknown Company")
    address = payload.get("address", "")
    brand_dna_text = payload.get("brand_dna_url", "")

    # Fetch brand DNA from DB
    brand = _get_brand_dna(user_id)
    tone_data = brand.get("tone", {}) if brand else {}
    colour_data = brand.get("colours", {}) if brand else {}

    tone = tone_data.get("primary", "Professional")
    formality = tone_data.get("formality", "formal")
    writing_style = tone_data.get("writing_style", "Clear, concise, professional")
    primary_colour = colour_data.get("primary", "#2563EB")

    # Delete existing templates for this user to avoid duplicates if regenerating
    if supabase_admin:
        supabase_admin.table("templates").delete().eq("user_id", user_id).execute()

    async def _generate_single_type(doc_type: str, req_details: str):
        sys_prompt = SYSTEM_PROMPT.format(
            tone=tone, formality=formality, primary_colour=primary_colour, writing_style=writing_style, doc_type=doc_type
        )
        prompt = (
            f"Company: {company_name}\nAddress: {address}\nBrand DNA: {brand_dna_text}\n\n"
            f"Task: Generate 3 variations of {doc_type.upper()} ({req_details})."
        )
        try:
            resp = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=prompt)])
            cont = resp.content
            if "{" in cont and "}" in cont:
                cont = cont[cont.find("{") : cont.rfind("}") + 1]
            return json.loads(cont).get(doc_type, [])
        except Exception as e:
            logger.error(f"Failed {doc_type}: {e}")
            return []

    # Run all 3 concurrently
    results = await asyncio.gather(
        _generate_single_type("msa", "Must include Preamble, Scope, Payment Terms, IP Rights, Confidentiality, Liability, Term, Governing Law"),
        _generate_single_type("po", "Must include PO number, Buyer/Vendor details, Line items table, Delivery terms, Standard T&C"),
        _generate_single_type("invoice", "Must include Invoice number, Biller/Recipient, Line items table, Tax breakdown, Total Amount, Bank details")
    )
    
    data = {
        "msa": results[0],
        "po": results[1],
        "invoice": results[2]
    }

    # Store each template option in the DB
    if supabase_admin:
        for doc_type in ["msa", "po", "invoice"]:
            options = data.get(doc_type, [])
            for opt in options:
                try:
                    supabase_admin.table("templates").insert(
                        {
                            "user_id": user_id,
                            "name": f"{company_name} - {doc_type.upper()} ({opt.get('title', 'Standard')})",
                            "type": doc_type,
                            "generation_prompt": f"Generated via parallel process",
                            "brand_dna_id": brand.get("id") if brand else None,
                            "content_json": {"title": opt.get("title", ""), "sections": []},
                            "content_html": opt.get("content", ""),
                            "variables": [],
                        }
                    ).execute()
                except Exception as db_err:
                    logger.error(f"Failed to store {doc_type} template: {db_err}")

    return data


@router.get("/list")
async def list_templates(token_data: dict = Depends(verify_token)):
    """List all templates for the current user."""
    user_id = token_data.get("sub", "unknown")
    if not supabase_admin:
        return {"templates": []}
    try:
        res = (
            supabase_admin.table("templates")
            .select("id, name, type, is_favourite, use_count, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"templates": res.data or []}
    except Exception as e:
        logger.error(f"Failed to list templates: {e}")
        return {"templates": []}


@router.get("/{template_id}")
async def get_template(template_id: str, token_data: dict = Depends(verify_token)):
    """Get a specific template by ID."""
    user_id = token_data.get("sub", "unknown")
    if not supabase_admin:
        raise HTTPException(status_code=500, detail="Database not available.")
    try:
        res = (
            supabase_admin.table("templates")
            .select("*")
            .eq("id", template_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Template not found.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get template: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch template.")
