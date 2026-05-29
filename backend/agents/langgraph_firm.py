from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph


logger = logging.getLogger("voicecontract.langgraph_firm")

GITHUB_MODELS_BASE_URL = os.getenv("GITHUB_MODELS_BASE_URL", "https://models.github.ai/inference")
GITHUB_MODELS_TOKEN_ENV = "GITHUB_TOKEN"
GITHUB_MODELS_API_VERSION = os.getenv("GITHUB_MODELS_API_VERSION", "2026-03-10")
OPENAI_REASONING_MODEL = os.getenv("GITHUB_MODELS_GPT4O_MODEL", "openai/gpt-4o")
GROQ_AUDITOR_MODEL = os.getenv("GROQ_AUDITOR_MODEL", "llama-3.3-70b-versatile")
MAX_REVISIONS = int(os.getenv("LEGAL_FIRM_MAX_REVISIONS", "2"))


class FirmState(TypedDict, total=False):
    transcript: str
    identity: Dict[str, Any]
    final_blueprint: Dict[str, Any]
    draft_msa: str
    red_team_feedback: List[str]
    revision_count: int
    is_approved: bool
    invoice_data: Dict[str, Any]
    po_data: Dict[str, Any]


@dataclass(frozen=True, slots=True)
class LegalDocumentPackage:
    msa: str
    invoice: dict[str, Any]
    purchase_order: dict[str, Any]
    blueprint: dict[str, Any]
    red_team_feedback: list[str]
    revision_count: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


STRATEGIST_SYSTEM_PROMPT = """
You are the Chief Legal Strategist. You are analyzing a raw transcript of a business negotiation.
Human conversations are messy. They contradict themselves. A price might be stated as 50k at the start, but negotiated down to 40k at the end.

YOUR DIRECTIVE:
1. Extract the absolute FINAL truth. Ignore early brainstorming; focus on the final agreed terms.
2. Extract the 8 Critical Pillars: Scope, Price, Payment Terms, Timeline, Revisions, IP Ownership, Termination, Liability.
3. If a pillar was NOT discussed, explicitly mark its value as "MISSING_DEFAULT_REQUIRED".

Output ONLY valid JSON matching this blueprint:
{
    "scope_of_work": "exact description",
    "total_price_inr": 40000,
    "payment_schedule": "e.g., 50% advance, 50% on completion",
    "timeline": "e.g., 14 days",
    "revisions": "MISSING_DEFAULT_REQUIRED",
    "ip_ownership": "MISSING_DEFAULT_REQUIRED",
    "termination": "MISSING_DEFAULT_REQUIRED",
    "liability": "MISSING_DEFAULT_REQUIRED"
}
""".strip()

DRAFTER_SYSTEM_PROMPT = """
You are the Lead Contract Drafter at a top-tier Indian law firm.
You will receive a JSON blueprint of deal terms. Your job is to draft a 12-section Master Service Agreement (MSA) governed by the Indian Contract Act, 1872.

YOUR DIRECTIVE:
1. Use strict, uncompromising legalese. No markdown formatting. No pleasantries.
2. If any term is marked as "MISSING_DEFAULT_REQUIRED", you MUST apply the following aggressive defaults that protect the Service Provider (our user):
   - Revisions: Maximum of 2 minor revision rounds. Further changes billed at INR 2000/hour.
   - IP Ownership: IP transfers to Client ONLY upon 100% full and final payment.
   - Termination: 15 days written notice; Client must pay for all work completed up to the termination date.
   - Liability: Capped at the total value of this contract. No indirect damages.
3. The contract must flow logically and be ready for immediate execution.
""".strip()

RED_TEAM_SYSTEM_PROMPT = """
You are an adversarial Red Team Lawyer representing the Service Provider.
You will be given a draft MSA. Your only job is to find ways the Service Provider could be screwed over by this contract.

YOUR DIRECTIVE:
1. Look for ambiguity in the payment terms, scope, or timeline.
2. Look for weak IP protection.
3. If the contract is flawless and aggressively protects the Service Provider, output: {"approved": true, "feedback": []}
4. If you find loopholes, output: {"approved": false, "feedback": ["List of specific clauses that need to be rewritten to protect the Provider."]}

Output ONLY valid JSON.
""".strip()

AUDITOR_SYSTEM_PROMPT = """
You are the Financial Auditor. You will receive the final blueprint.
Your job is to generate the structured data for a GST Invoice and a Purchase Order.

YOUR DIRECTIVE:
1. MATHEMATICAL PERFECTION: Calculate 18% IGST on the total price.
   - Subtotal = Total Price
   - GST (18%) = Subtotal * 0.18
   - Grand Total = Subtotal + GST
2. Generate itemized deliverables for the PO based on the scope.

Output ONLY valid JSON:
{
    "invoice_data": {
        "items": [{"description": "Professional Services as per MSA", "amount": 40000}],
        "subtotal": 40000,
        "tax_igst_18": 7200,
        "grand_total": 47200
    },
    "po_data": {
        "deliverables": ["Deliverable 1", "Deliverable 2"],
        "delivery_date": "Extracted timeline"
    }
}
""".strip()


def _github_gpt4o() -> ChatOpenAI:
    token = os.getenv(GITHUB_MODELS_TOKEN_ENV)
    if not token:
        raise RuntimeError(f"{GITHUB_MODELS_TOKEN_ENV} is required for GitHub Models GPT-4o execution.")
    return ChatOpenAI(
        model=OPENAI_REASONING_MODEL,
        api_key=token,
        base_url=GITHUB_MODELS_BASE_URL,
        temperature=0,
        timeout=45,
        max_retries=2,
        default_headers={
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": GITHUB_MODELS_API_VERSION,
        },
    )


def _groq_llama() -> ChatGroq:
    token = os.getenv("GROQ_API_KEY")
    if not token:
        raise RuntimeError("GROQ_API_KEY is required for Groq auditor execution.")
    return ChatGroq(
        model=GROQ_AUDITOR_MODEL,
        api_key=token,
        temperature=0,
        timeout=30,
        max_retries=2,
    )


async def strategist_node(state: FirmState) -> FirmState:
    llm = _github_gpt4o()
    prompt = {
        "identity": state.get("identity", {}),
        "transcript": state["transcript"],
    }
    response = await llm.ainvoke(
        [
            SystemMessage(content=STRATEGIST_SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(prompt, ensure_ascii=False, separators=(",", ":"))),
        ]
    )
    blueprint = _parse_json_object(str(response.content), required_keys={"scope_of_work", "total_price_inr"})
    blueprint = _normalize_blueprint(blueprint)
    return {"final_blueprint": blueprint}


async def drafter_node(state: FirmState) -> FirmState:
    llm = _github_gpt4o()
    feedback = state.get("red_team_feedback", [])
    revision_count = int(state.get("revision_count", 0))
    if feedback:
        revision_count += 1

    prompt = {
        "identity": state.get("identity", {}),
        "final_blueprint": state.get("final_blueprint", {}),
        "existing_draft_msa": state.get("draft_msa", ""),
        "red_team_feedback_to_fix": feedback,
        "revision_count": revision_count,
        "drafting_instruction": "Return only the complete revised 12-section MSA text. No markdown.",
    }
    response = await llm.ainvoke(
        [
            SystemMessage(content=DRAFTER_SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(prompt, ensure_ascii=False, separators=(",", ":"))),
        ]
    )
    draft = _clean_contract_text(str(response.content))
    if len(draft) < 1200:
        raise RuntimeError("Drafter returned an MSA that is too short to be execution-ready.")
    return {"draft_msa": draft, "revision_count": revision_count}


async def red_team_node(state: FirmState) -> FirmState:
    llm = _github_gpt4o()
    prompt = {
        "identity": state.get("identity", {}),
        "final_blueprint": state.get("final_blueprint", {}),
        "draft_msa": state.get("draft_msa", ""),
    }
    response = await llm.ainvoke(
        [
            SystemMessage(content=RED_TEAM_SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(prompt, ensure_ascii=False, separators=(",", ":"))),
        ]
    )
    result = _parse_json_object(str(response.content), required_keys={"approved", "feedback"})
    approved = bool(result.get("approved"))
    feedback = result.get("feedback", [])
    if not isinstance(feedback, list):
        feedback = [str(feedback)]
    return {
        "is_approved": approved,
        "red_team_feedback": [str(item).strip() for item in feedback if str(item).strip()][:12],
    }


async def auditor_node(state: FirmState) -> FirmState:
    llm = _groq_llama()
    prompt = {
        "identity": state.get("identity", {}),
        "final_blueprint": state.get("final_blueprint", {}),
        "final_msa_excerpt": state.get("draft_msa", "")[:6000],
    }
    response = await llm.ainvoke(
        [
            SystemMessage(content=AUDITOR_SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(prompt, ensure_ascii=False, separators=(",", ":"))),
        ]
    )
    result = _parse_json_object(str(response.content), required_keys={"invoice_data", "po_data"})
    invoice = _normalize_invoice(result.get("invoice_data", {}), state.get("final_blueprint", {}))
    po = _normalize_po(result.get("po_data", {}), state.get("final_blueprint", {}))
    return {"invoice_data": invoice, "po_data": po}


def _red_team_route(state: FirmState) -> str:
    if state.get("is_approved", False):
        return "auditor"
    if int(state.get("revision_count", 0)) < MAX_REVISIONS:
        return "drafter"
    return "auditor"


def build_legal_firm_graph():
    graph = StateGraph(FirmState)
    graph.add_node("strategist", strategist_node)
    graph.add_node("drafter", drafter_node)
    graph.add_node("red_team", red_team_node)
    graph.add_node("auditor", auditor_node)
    graph.set_entry_point("strategist")
    graph.add_edge("strategist", "drafter")
    graph.add_edge("drafter", "red_team")
    graph.add_conditional_edges("red_team", _red_team_route, {"drafter": "drafter", "auditor": "auditor"})
    graph.add_edge("auditor", END)
    return graph.compile()


try:
    from backend.utils.pii_scrubber import scrub_transcript
except ModuleNotFoundError:
    from utils.pii_scrubber import scrub_transcript

async def execute_legal_firm(transcript: str, identity: dict[str, Any]) -> LegalDocumentPackage:
    if not transcript.strip():
        raise ValueError("Cannot execute legal firm without a transcript.")
        
    # Phase 4 Security: Scrub transcript before it hits external LLMs
    safe_transcript = scrub_transcript(transcript)
    
    graph = build_legal_firm_graph()
    final_state = await graph.ainvoke(
        {
            "transcript": safe_transcript,
            "identity": identity,
            "final_blueprint": {},
            "draft_msa": "",
            "red_team_feedback": [],
            "revision_count": 0,
            "is_approved": False,
            "invoice_data": {},
            "po_data": {},
        }
    )
    return LegalDocumentPackage(
        msa=str(final_state.get("draft_msa", "")).strip(),
        invoice=dict(final_state.get("invoice_data", {})),
        purchase_order=dict(final_state.get("po_data", {})),
        blueprint=dict(final_state.get("final_blueprint", {})),
        red_team_feedback=list(final_state.get("red_team_feedback", [])),
        revision_count=int(final_state.get("revision_count", 0)),
    )


def _parse_json_object(content: str, *, required_keys: set[str]) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise ValueError(f"Model returned non-JSON content: {cleaned[:300]}") from exc
        parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise ValueError("Model returned JSON that is not an object.")
    missing = required_keys.difference(parsed)
    if missing:
        raise ValueError(f"Model JSON missing required keys: {sorted(missing)}")
    return parsed


def _normalize_blueprint(blueprint: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(blueprint)
    for key in (
        "scope_of_work",
        "payment_schedule",
        "timeline",
        "revisions",
        "ip_ownership",
        "termination",
        "liability",
    ):
        value = str(normalized.get(key, "MISSING_DEFAULT_REQUIRED")).strip()
        normalized[key] = value or "MISSING_DEFAULT_REQUIRED"
    normalized["total_price_inr"] = _coerce_money(normalized.get("total_price_inr", 0))
    return normalized


def _normalize_invoice(invoice: dict[str, Any], blueprint: dict[str, Any]) -> dict[str, Any]:
    subtotal = _coerce_money(invoice.get("subtotal") or blueprint.get("total_price_inr", 0))
    tax = round(subtotal * 0.18, 2)
    grand_total = round(subtotal + tax, 2)
    items = invoice.get("items")
    if not isinstance(items, list) or not items:
        items = [{"description": "Professional Services as per MSA", "amount": subtotal}]
    return {
        "items": items,
        "subtotal": subtotal,
        "tax_igst_18": tax,
        "grand_total": grand_total,
    }


def _normalize_po(po: dict[str, Any], blueprint: dict[str, Any]) -> dict[str, Any]:
    deliverables = po.get("deliverables")
    if not isinstance(deliverables, list) or not deliverables:
        scope = str(blueprint.get("scope_of_work", "")).strip()
        deliverables = [scope] if scope else ["Professional services as described in the MSA"]
    return {
        "deliverables": [str(item).strip() for item in deliverables if str(item).strip()],
        "delivery_date": str(po.get("delivery_date") or blueprint.get("timeline") or "As specified in the MSA"),
    }


def _coerce_money(value: Any) -> int | float:
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return round(value, 2)
    text = str(value)
    number = re.sub(r"[^0-9.]", "", text)
    if not number:
        return 0
    parsed = float(number)
    return int(parsed) if parsed.is_integer() else round(parsed, 2)


def _clean_contract_text(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:text)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()
