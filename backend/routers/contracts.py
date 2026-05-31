"""
contracts.py – AI-Powered Contract Generator Router
=====================================================
Generates world-class, legally sound contracts using Groq LLaMA 3.3 70B.
Supports MSA, SOW, NDA, Employment, Freelance, SaaS, Consulting, Vendor,
and Custom contract types with Indian Contract Act 1872 compliance.

Endpoints:
    POST /api/contracts/generate   – Generate a new AI contract
    GET  /api/contracts/list       – List user's contracts
    GET  /api/contracts/{id}       – Get a specific contract
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

try:
    from backend.auth.jwt_auth import verify_token
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
    from database.client import supabase_admin

logger = logging.getLogger("voicecontract.contracts")

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class PartyInfo(BaseModel):
    name: str = Field(..., min_length=1, description="Legal name of the party")
    address: str = Field(default="", description="Registered address")
    gstin: str = Field(default="", description="GST Identification Number (India)")


class ContractGenerateRequest(BaseModel):
    contract_type: str = Field(
        default="msa",
        description="One of: msa, sow, nda, employment, freelance, saas, consulting, vendor, custom",
    )
    title: str = Field(default="", description="Custom title override (AI will generate if blank)")
    party_a: PartyInfo = Field(..., description="First party (typically the service provider / employer)")
    party_b: PartyInfo = Field(..., description="Second party (typically the client / employee)")
    currency: str = Field(default="INR", description="Contract currency code")
    total_value: float = Field(default=0.0, description="Total contract consideration")
    payment_terms: str = Field(default="", description="E.g. '50% advance, 50% on delivery'")
    effective_date: str = Field(default="", description="Contract start date (ISO 8601 or human-readable)")
    expiry_date: str = Field(default="", description="Contract end date (ISO 8601 or human-readable)")
    special_instructions: str = Field(
        default="",
        description="Any additional clauses, jurisdiction overrides, or context for the AI",
    )


class SubClause(BaseModel):
    number: str
    content: str


class ContractClause(BaseModel):
    number: str
    title: str
    content: str
    sub_clauses: List[SubClause] = []
    risk_level: str = "low"  # low | medium | high


class ContractVariable(BaseModel):
    placeholder: str
    description: str
    default_value: str = ""


class ContractOutput(BaseModel):
    contract_title: str
    contract_number: str = ""
    contract_type: str
    recitals: str
    definitions: List[Dict[str, str]] = []
    clauses: List[ContractClause] = []
    schedules: List[Dict[str, str]] = []
    signature_block: Dict[str, Any] = {}
    variables: List[ContractVariable] = []
    generated_at: str = ""
    brand_dna_applied: bool = False
    html_content: str = ""


class ContractRecord(BaseModel):
    id: str
    user_id: str
    contract_number: str
    contract_type: str
    title: str
    status: str
    party_a_name: str
    party_b_name: str
    total_value: float
    currency: str
    created_at: str


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_CONTRACT_TYPES = {
    "msa", "sow", "nda", "employment", "freelance",
    "saas", "consulting", "vendor", "custom",
}

CONTRACT_TYPE_LABELS = {
    "msa": "Master Service Agreement",
    "sow": "Statement of Work",
    "nda": "Non-Disclosure Agreement",
    "employment": "Employment Agreement",
    "freelance": "Freelancer Services Agreement",
    "saas": "SaaS Subscription Agreement",
    "consulting": "Consulting Services Agreement",
    "vendor": "Vendor Supply Agreement",
    "custom": "Custom Agreement",
}


# ---------------------------------------------------------------------------
# AI Prompt Builder
# ---------------------------------------------------------------------------

def _build_contract_prompt(
    req: ContractGenerateRequest,
    brand_dna: Dict[str, Any] | None,
    contract_number: str,
) -> str:
    """
    Construct the comprehensive legal prompt sent to Groq LLaMA 3.3 70B.
    This is the heart of the contract generator — every word matters.
    """
    type_label = CONTRACT_TYPE_LABELS.get(req.contract_type, "Custom Agreement")
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    effective = req.effective_date or today
    expiry = req.expiry_date or "12 months from the Effective Date"

    # Brand DNA context (if available)
    brand_context = ""
    if brand_dna:
        brand_context = f"""
BRAND DNA CONTEXT (apply this tone and style to the contract language):
- Company Name: {brand_dna.get('company_name', 'N/A')}
- Industry: {brand_dna.get('industry', 'N/A')}
- Brand Voice: {brand_dna.get('brand_voice', 'Professional and authoritative')}
- Core Values: {brand_dna.get('core_values', 'N/A')}
- Jurisdiction Preference: {brand_dna.get('jurisdiction', 'India')}
- Standard Payment Terms: {brand_dna.get('payment_terms', 'As specified')}
- Liability Cap Policy: {brand_dna.get('liability_cap', 'Total contract value')}
- IP Policy: {brand_dna.get('ip_policy', 'All IP transfers upon full payment')}
"""

    # Contract-type specific guidance
    type_specific = _get_type_specific_guidance(req.contract_type)

    prompt = f"""You are an elite contract attorney AI with 25+ years of experience drafting commercial agreements across common law and civil law jurisdictions. You specialize in Indian commercial law and international business contracts.

TASK: Generate a complete, legally enforceable {type_label} (Contract Number: {contract_number}).

═══════════════════════════════════════════════════════════════
PARTIES TO THE AGREEMENT
═══════════════════════════════════════════════════════════════

PARTY A (First Party / Service Provider):
  Legal Name: {req.party_a.name}
  Address: {req.party_a.address or '{{PARTY_A_ADDRESS}}'}
  GSTIN: {req.party_a.gstin or '{{PARTY_A_GSTIN}}'}

PARTY B (Second Party / Client):
  Legal Name: {req.party_b.name}
  Address: {req.party_b.address or '{{PARTY_B_ADDRESS}}'}
  GSTIN: {req.party_b.gstin or '{{PARTY_B_GSTIN}}'}

═══════════════════════════════════════════════════════════════
COMMERCIAL TERMS
═══════════════════════════════════════════════════════════════

  Contract Type: {type_label}
  Currency: {req.currency}
  Total Consideration: {req.currency} {req.total_value:,.2f}
  Payment Terms: {req.payment_terms or '{{PAYMENT_TERMS}}'}
  Effective Date: {effective}
  Expiry Date: {expiry}
  Special Instructions: {req.special_instructions or 'None'}

{brand_context}

═══════════════════════════════════════════════════════════════
CONTRACT TYPE SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════════
{type_specific}

═══════════════════════════════════════════════════════════════
MANDATORY LEGAL REQUIREMENTS
═══════════════════════════════════════════════════════════════

You MUST generate ALL 13 of the following standard clauses. Each clause must be
substantive (not placeholder text), legally precise, and enforceable under the
Indian Contract Act, 1872 and applicable Indian statutes:

1. DEFINITIONS AND INTERPRETATION
   - Define every capitalized term used in the agreement
   - Include: "Affiliate", "Business Day", "Confidential Information",
     "Deliverables", "Effective Date", "Force Majeure Event", "Intellectual
     Property", "Losses", "Material Breach", "Party/Parties", "Services",
     "Term", "Territory"
   - Include an interpretation section covering: headings, singular/plural,
     references to statutes, business days, and "including" meaning
     "including without limitation"

2. SCOPE OF SERVICES / OBLIGATIONS
   - Clearly delineate what Party A will deliver
   - Acceptance criteria and timelines where applicable
   - Change order / variation procedure
   - Standards of performance (e.g., "reasonable skill and care",
     "industry best practices")

3. PAYMENT TERMS AND INVOICING
   - Payment schedule keyed to milestones or calendar
   - Invoice format and submission requirements
   - Payment due date (net 30 / net 15 as applicable)
   - Late payment interest: 1.5% per month or the maximum rate
     permitted under Indian law, whichever is lower
   - GST treatment: "All amounts are exclusive of applicable GST.
     Party B shall pay GST as invoiced in compliance with the CGST
     Act, 2017."
   - Right of set-off and disputed invoice procedure
   - Currency and exchange rate provisions if multi-currency

4. INTELLECTUAL PROPERTY RIGHTS
   - Background IP retained by originating party
   - Foreground IP / work product: assignment vs license model
   - License grants (scope, territory, exclusivity, duration)
   - Moral rights waiver where permitted
   - Third-party IP indemnification
   - Source code escrow provisions (if applicable for software)
   - Open source compliance obligations

5. CONFIDENTIALITY AND DATA PROTECTION
   - Definition of Confidential Information (broad, with carve-outs)
   - Obligations: non-disclosure, non-use, reasonable security measures
   - Permitted disclosures: legal compulsion, professional advisors,
     affiliates bound by similar obligations
   - Duration: survives for 3 years post-termination (or 5 years for
     trade secrets)
   - Data protection: compliance with IT Act 2000, SPDI Rules 2011,
     and DPDP Act 2023 (Digital Personal Data Protection Act)
   - Data breach notification: within 72 hours
   - Return or destruction of confidential information on termination

6. LIMITATION OF LIABILITY
   - Aggregate liability cap: total fees paid/payable under this
     Agreement in the 12 months preceding the claim
   - Exclusion of indirect, consequential, incidental, punitive damages
   - Carve-outs from cap: (a) IP infringement indemnity, (b) breach of
     confidentiality, (c) gross negligence or wilful misconduct,
     (d) death or personal injury caused by negligence
   - Per-incident sub-cap where appropriate
   - Mutual application of limitations

7. INDEMNIFICATION
   - Mutual indemnification structure
   - Party A indemnifies Party B for: IP infringement, negligence,
     breach of law, data breach
   - Party B indemnifies Party A for: misuse of deliverables,
     third-party claims arising from Party B's instructions
   - Indemnification procedure: prompt notice, sole control of defense,
     cooperation, no admission without consent
   - Mitigation obligation

8. WARRANTIES AND REPRESENTATIONS
   - Mutual warranties: authority to enter agreement, no conflict with
     other obligations, compliance with applicable laws
   - Party A specific: services performed with reasonable skill and care,
     deliverables free from material defects, no infringement of
     third-party rights, compliance with anti-bribery laws
   - Party B specific: timely provision of information and access,
     accuracy of furnished data
   - WARRANTY DISCLAIMER: EXCEPT AS EXPRESSLY SET FORTH HEREIN,
     NEITHER PARTY MAKES ANY WARRANTIES, EXPRESS OR IMPLIED,
     INCLUDING WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A
     PARTICULAR PURPOSE
   - Remedy period: 30 days written notice to cure breach of warranty

9. TERM AND TERMINATION
   - Initial term and renewal mechanism (auto-renewal with opt-out)
   - Termination for convenience: 30 days' written notice
   - Termination for cause: material breach not cured within 30 days
     of written notice
   - Immediate termination triggers: insolvency, bankruptcy,
     assignment for benefit of creditors, material fraud
   - Effects of termination: (a) payment for services rendered,
     (b) return of property and data, (c) survival of specified clauses
   - Transition assistance: reasonable cooperation for up to 90 days
     post-termination at agreed rates

10. DISPUTE RESOLUTION
    - Escalation ladder: (1) good-faith negotiation between project
      managers within 15 Business Days, (2) escalation to senior
      management within 15 Business Days, (3) mediation under IIAM
      (Indian Institute of Arbitration & Mediation) rules
    - Binding arbitration under the Arbitration and Conciliation Act,
      1996 (as amended 2019, 2021)
    - Seat of arbitration: {brand_dna.get('jurisdiction', 'New Delhi, India') if brand_dna else 'New Delhi, India'}
    - Language: English
    - Single arbitrator for disputes under INR 1,00,00,000; panel of
      three for larger disputes
    - Interim relief: parties may seek injunctive relief from courts
      of competent jurisdiction without waiving right to arbitrate

11. GOVERNING LAW AND JURISDICTION
    - Governed by and construed in accordance with the laws of India
    - Subject to the exclusive jurisdiction of the courts at
      {brand_dna.get('jurisdiction', 'New Delhi') if brand_dna else 'New Delhi'} for any matters
      not subject to arbitration
    - Compliance with: Indian Contract Act 1872, Sale of Goods Act 1930,
      Information Technology Act 2000, Consumer Protection Act 2019
      (if applicable), Competition Act 2002, FEMA 1999 (for cross-border)

12. FORCE MAJEURE
    - Definition: acts of God, natural disasters, pandemics, epidemics,
      war, terrorism, civil unrest, government actions, sanctions,
      embargoes, labour disputes (excluding the affected party's
      employees), failures of telecommunications or power supply,
      cyberattacks of unprecedented scale
    - Notice requirement: within 5 Business Days of occurrence
    - Mitigation obligation on affected party
    - Duration cap: if force majeure continues for more than 90
      consecutive days, either party may terminate without liability
    - Exclusion: payment obligations are NOT excused by force majeure

13. GENERAL PROVISIONS (BOILERPLATE)
    - Entire Agreement: supersedes all prior negotiations, representations
    - Amendment: in writing signed by both parties
    - Waiver: failure to enforce is not a waiver; waiver must be in writing
    - Severability: invalid provision severed, remainder enforceable
    - Assignment: not assignable without prior written consent (except
      to affiliates or in connection with merger/acquisition)
    - Notices: written, delivered to registered addresses, deemed received
      on delivery (courier), 5 Business Days (post), or on transmission
      (email with read receipt)
    - Counterparts: may be executed in counterparts, electronic
      signatures valid under IT Act 2000 Section 5
    - No Partnership/Agency: nothing creates a partnership, joint venture,
      or agency relationship
    - Third-Party Rights: no third-party beneficiary rights
    - Publicity: neither party shall use the other's name/logo without
      prior written consent
    - Anti-Bribery: compliance with Prevention of Corruption Act, 1988
      and applicable anti-bribery legislation
    - Export Controls: compliance with applicable export control
      regulations

═══════════════════════════════════════════════════════════════
VARIABLE PLACEHOLDERS
═══════════════════════════════════════════════════════════════

For any information NOT provided above, insert a placeholder using the
exact syntax: {{{{PLACEHOLDER_NAME}}}}

Examples: {{{{PARTY_A_ADDRESS}}}}, {{{{PAYMENT_SCHEDULE}}}}, {{{{DELIVERY_DATE}}}}

Track ALL placeholders in the "variables" array of your response so the
user can fill them in later.

═══════════════════════════════════════════════════════════════
RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

For EACH clause, assign a risk_level:
  - "low"    → standard boilerplate, minimal negotiation expected
  - "medium" → commercially sensitive, review recommended
  - "high"   → deal-critical, legal review strongly recommended

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no code fences, no commentary).
The JSON must conform to this exact structure:

{{
  "contract_title": "string — formal title of the agreement",
  "recitals": "string — WHEREAS clauses establishing context and intent",
  "definitions": [
    {{"term": "string", "definition": "string"}}
  ],
  "clauses": [
    {{
      "number": "1",
      "title": "DEFINITIONS AND INTERPRETATION",
      "content": "string — full clause text",
      "sub_clauses": [
        {{"number": "1.1", "content": "string"}}
      ],
      "risk_level": "low|medium|high"
    }}
  ],
  "schedules": [
    {{"title": "Schedule A — Scope of Services", "content": "string"}}
  ],
  "signature_block": {{
    "party_a": {{
      "name": "{req.party_a.name}",
      "title": "Authorized Signatory",
      "date_line": "Date: _______________"
    }},
    "party_b": {{
      "name": "{req.party_b.name}",
      "title": "Authorized Signatory",
      "date_line": "Date: _______________"
    }},
    "witness": {{
      "line_1": "Witness 1: Name: _______________ Signature: _______________",
      "line_2": "Witness 2: Name: _______________ Signature: _______________"
    }}
  }},
  "variables": [
    {{
      "placeholder": "{{{{EXAMPLE}}}}",
      "description": "What this placeholder represents",
      "default_value": "optional default"
    }}
  ]
}}

CRITICAL RULES:
1. Return ONLY the JSON object. No preamble, no explanation, no markdown.
2. Every clause MUST have substantive legal content — never use "[Insert details]" or similar.
3. All 13 clauses are MANDATORY. Do not skip or merge any.
4. Use precise legal language suitable for execution.
5. Cross-reference clauses internally (e.g., "as defined in Clause 1.3").
6. Ensure logical consistency across all clauses.
7. The contract must be enforceable under Indian law as a standalone document.
"""

    return prompt


def _get_type_specific_guidance(contract_type: str) -> str:
    """Return type-specific clause guidance for the AI."""
    guidance = {
        "msa": """
This is a Master Service Agreement — the umbrella contract governing the overall
relationship. Individual projects will be governed by Statements of Work (SOWs)
executed under this MSA. Emphasize:
- SOW incorporation mechanism and hierarchy of documents
- Service level expectations at the framework level
- Umbrella IP and confidentiality provisions
- Flexible payment structure that SOWs can customize
""",
        "sow": """
This is a Statement of Work — a project-specific document typically executed
under a Master Service Agreement. Emphasize:
- Detailed deliverables with acceptance criteria
- Project timeline with milestones
- Specific resource allocation and key personnel
- Milestone-based payment schedule
- Change request procedure with cost/time impact assessment
- Reference to governing MSA terms
""",
        "nda": """
This is a Non-Disclosure Agreement. It may be mutual or one-way. Emphasize:
- Precise definition of Confidential Information with clear carve-outs
- Purpose limitation (evaluate potential business relationship)
- Duration of obligations (minimum 3 years, 5 for trade secrets)
- Return/destruction obligations with certification
- No implied license to intellectual property
- Injunctive relief clause (damages may be inadequate)
- Residuals clause where appropriate
- Non-solicitation provision if needed
""",
        "employment": """
This is an Employment Agreement governed by Indian labour law. Emphasize:
- Compliance with: Industrial Disputes Act 1947, Shops & Establishments Act,
  Payment of Wages Act 1936, EPF Act 1952, ESI Act 1948, Payment of Gratuity
  Act 1972, Sexual Harassment of Women at Workplace Act 2013
- CTC breakdown: basic salary, HRA, special allowance, PF contribution
- Probation period, confirmation conditions
- Leave policy: earned/casual/sick/maternity/paternity
- Restrictive covenants: non-compete (enforceable limitations in India),
  non-solicitation, garden leave
- Invention assignment clause
- Notice period and exit provisions
- Background verification clause
""",
        "freelance": """
This is a Freelancer/Independent Contractor Agreement. Emphasize:
- Clear independent contractor status — NOT an employment relationship
- Contractor responsible for own taxes (no TDS obligations as employee)
- Section 194C TDS applicability for payments
- Deliverable-based payment, not hourly wages
- IP assignment on full payment
- No benefits, insurance, or employment perquisites
- Right to subcontract (with/without approval)
- Equipment and workspace are contractor's responsibility
""",
        "saas": """
This is a SaaS Subscription Agreement. Emphasize:
- Subscription model: per-user, per-seat, or usage-based
- Service Level Agreement (SLA) with uptime commitments (99.9%)
- SLA credits/remedies for downtime
- Data ownership: customer owns all customer data
- Data portability and export rights
- Security commitments: encryption, access controls, audit rights
- Acceptable Use Policy reference
- Auto-renewal with advance notice of price changes
- Suspension rights for non-payment or AUP violation
- Data deletion/return on termination within 30 days
""",
        "consulting": """
This is a Consulting Services Agreement. Emphasize:
- Advisory vs. implementation scope clarity
- Deliverables: reports, recommendations, assessments
- Professional independence of consultant
- Consultant's right to serve other clients (non-exclusivity)
- Client's obligation to provide access and information
- Limitation: consultant provides advice, client makes decisions
- Professional liability and E&O insurance requirements
- Key personnel and substitution rights
""",
        "vendor": """
This is a Vendor/Supplier Agreement. Emphasize:
- Product/service specifications and quality standards
- Delivery schedule, Incoterms (if physical goods)
- Inspection and acceptance procedure
- Warranty period and defect liability
- Returns and replacements procedure
- Compliance with Sale of Goods Act 1930
- Supply chain ethics and sustainability
- Insurance requirements (product liability, cargo)
- Price variation mechanism (index-linked if long-term)
- Minimum order quantities and lead times
""",
        "custom": """
This is a Custom Agreement. Generate a comprehensive general-purpose commercial
contract that covers all 13 mandatory clauses. Adapt the language and emphasis
based on the special instructions provided. Maintain full legal rigor.
""",
    }
    return guidance.get(contract_type, guidance["custom"])


# ---------------------------------------------------------------------------
# AI Client (Groq)
# ---------------------------------------------------------------------------

def _get_groq_llm():
    """Initialise and return the Groq ChatGroq instance."""
    from langchain_groq import ChatGroq

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is not configured. Contract generation is unavailable.",
        )
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        temperature=0.25,       # Low temperature for legal precision
        max_tokens=8000,        # Contracts can be long
    )


def _extract_json_from_response(text: str) -> Dict[str, Any]:
    """
    Robustly extract JSON from the LLM response, handling markdown
    code fences, preamble text, and common formatting issues.
    """
    # Strip markdown code fences
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (with optional language tag)
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object boundaries
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace : last_brace + 1])
        except json.JSONDecodeError:
            pass

    # Last resort: try to fix common issues
    cleaned = text.replace("\n", " ").replace("\r", "")
    cleaned = re.sub(r",\s*}", "}", cleaned)   # trailing commas
    cleaned = re.sub(r",\s*]", "]", cleaned)    # trailing commas in arrays
    try:
        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace != -1 and last_brace != -1:
            return json.loads(cleaned[first_brace : last_brace + 1])
    except json.JSONDecodeError:
        pass

    raise ValueError("Failed to parse AI response as valid JSON")


# ---------------------------------------------------------------------------
# Helper – fetch brand DNA
# ---------------------------------------------------------------------------

async def _fetch_brand_dna(user_id: str) -> Dict[str, Any] | None:
    """Fetch the user's active brand DNA from Supabase."""
    if not supabase_admin:
        return None
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
        logger.warning("brand_dna_fetch_failed user=%s error=%s", user_id, e)
    return None


# ---------------------------------------------------------------------------
# Helper – get next document number via RPC
# ---------------------------------------------------------------------------

async def _get_next_document_number(user_id: str) -> str:
    """
    Call the Supabase RPC `get_next_document_number` for auto-numbering.
    Falls back to a UUID-based number if RPC is unavailable.
    """
    if not supabase_admin:
        return f"CTR-{uuid.uuid4().hex[:8].upper()}"
    try:
        res = supabase_admin.rpc(
            "get_next_document_number",
            {"p_user_id": user_id, "p_doc_type": "contract"},
        ).execute()
        if res.data:
            return str(res.data)
    except Exception as e:
        logger.warning("document_number_rpc_failed user=%s error=%s", user_id, e)
    return f"CTR-{uuid.uuid4().hex[:8].upper()}"


# ---------------------------------------------------------------------------
# POST /generate
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=ContractOutput, status_code=status.HTTP_201_CREATED)
async def generate_contract(
    payload: ContractGenerateRequest,
    current_user: dict = Depends(verify_token),
):
    """
    Generate a legally sound, AI-powered contract.

    Flow:
    1. Validate contract type
    2. Fetch user's active brand DNA
    3. Get next auto-incremented document number
    4. Build comprehensive legal prompt
    5. Send to Groq LLaMA 3.3 70B
    6. Parse and validate AI response
    7. Persist to Supabase `contracts` table
    8. Return structured contract output
    """
    user_id = current_user.get("sub", "anonymous_user")

    # 1. Validate contract type
    ctype = payload.contract_type.lower().strip()
    if ctype not in VALID_CONTRACT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid contract_type '{ctype}'. Must be one of: {', '.join(sorted(VALID_CONTRACT_TYPES))}",
        )

    # 2. Fetch brand DNA
    brand_dna = await _fetch_brand_dna(user_id)

    # 3. Get document number
    contract_number = await _get_next_document_number(user_id)

    # 4. Build prompt
    prompt = _build_contract_prompt(payload, brand_dna, contract_number)

    # 5. Call Groq
    try:
        llm = _get_groq_llm()
        ai_response = llm.invoke(prompt)
        raw_text = ai_response.content if hasattr(ai_response, "content") else str(ai_response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("groq_invocation_failed user=%s error=%s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service invocation failed: {str(e)}",
        )

    # 6. Parse AI response
    try:
        parsed = _extract_json_from_response(raw_text)
    except ValueError as e:
        logger.error(
            "contract_json_parse_failed user=%s error=%s response_preview=%s",
            user_id, e, raw_text[:500],
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an unparseable response. Please retry.",
        )

    # 7. Build output model
    now_iso = datetime.now(timezone.utc).isoformat()

    # Parse clauses
    clauses: List[ContractClause] = []
    for c in parsed.get("clauses", []):
        sub_clauses = [
            SubClause(number=sc.get("number", ""), content=sc.get("content", ""))
            for sc in c.get("sub_clauses", [])
        ]
        clauses.append(
            ContractClause(
                number=str(c.get("number", "")),
                title=c.get("title", ""),
                content=c.get("content", ""),
                sub_clauses=sub_clauses,
                risk_level=c.get("risk_level", "low"),
            )
        )

    # Parse variables
    variables: List[ContractVariable] = []
    for v in parsed.get("variables", []):
        variables.append(
            ContractVariable(
                placeholder=v.get("placeholder", ""),
                description=v.get("description", ""),
                default_value=v.get("default_value", ""),
            )
        )

    contract_title = parsed.get("contract_title", payload.title or f"{CONTRACT_TYPE_LABELS.get(ctype, 'Agreement')}")

    # Generate HTML representation for frontend rendering
    html_parts = [f"<h1>{contract_title}</h1>", f"<p><strong>Contract Number:</strong> {contract_number}</p>"]
    if parsed.get("recitals"):
        html_parts.append(f"<h2>Recitals</h2><p>{parsed.get('recitals')}</p>")
    if parsed.get("definitions"):
        html_parts.append("<h2>Definitions</h2><ul>")
        for d in parsed.get("definitions", []):
            for k, v in d.items():
                html_parts.append(f"<li><strong>{k}:</strong> {v}</li>")
        html_parts.append("</ul>")
    if clauses:
        html_parts.append("<h2>Clauses</h2>")
        for idx, clause in enumerate(clauses, 1):
            html_parts.append(f"<h3>{idx}. {clause.title}</h3><p>{clause.text}</p>")
            for sub in clause.sub_clauses:
                html_parts.append(f"<p style='margin-left:20px'><strong>{sub.title}</strong>: {sub.text}</p>")
    html_content = "".join(html_parts)

    output = ContractOutput(
        contract_title=contract_title,
        contract_number=contract_number,
        contract_type=ctype,
        recitals=parsed.get("recitals", ""),
        definitions=parsed.get("definitions", []),
        clauses=clauses,
        schedules=parsed.get("schedules", []),
        signature_block=parsed.get("signature_block", {}),
        variables=variables,
        generated_at=now_iso,
        brand_dna_applied=brand_dna is not None,
        html_content=html_content,
    )

    # 8. Persist to Supabase
    if supabase_admin:
        try:
            record = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "contract_number": contract_number,
                "contract_type": ctype,
                "title": contract_title,
                "status": "draft",
                "party_a_name": payload.party_a.name,
                "party_a_address": payload.party_a.address,
                "party_a_gstin": payload.party_a.gstin,
                "party_b_name": payload.party_b.name,
                "party_b_address": payload.party_b.address,
                "party_b_gstin": payload.party_b.gstin,
                "currency": payload.currency,
                "total_value": payload.total_value,
                "payment_terms": payload.payment_terms,
                "effective_date": payload.effective_date or None,
                "expiry_date": payload.expiry_date or None,
                "special_instructions": payload.special_instructions,
                "contract_data": json.dumps(output.model_dump(), default=str),
                "brand_dna_applied": brand_dna is not None,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            supabase_admin.table("contracts").insert(record).execute()
            logger.info(
                "contract_generated user=%s number=%s type=%s clauses=%d",
                user_id, contract_number, ctype, len(clauses),
            )
        except Exception as e:
            # Log but don't fail — the contract was generated successfully
            logger.error("contract_persist_failed user=%s error=%s", user_id, e)

    return output


# ---------------------------------------------------------------------------
# GET /list
# ---------------------------------------------------------------------------

@router.get("/list", response_model=List[ContractRecord])
async def list_contracts(
    current_user: dict = Depends(verify_token),
    limit: int = 50,
    offset: int = 0,
):
    """List the current user's contracts, ordered by most recent first."""
    user_id = current_user.get("sub", "anonymous_user")

    if not supabase_admin:
        # Dev fallback
        return [
            ContractRecord(
                id="dev-contract-001",
                user_id=user_id,
                contract_number="CTR-DEV-001",
                contract_type="msa",
                title="Sample Master Service Agreement",
                status="draft",
                party_a_name="Dev Company",
                party_b_name="Dev Client",
                total_value=100000.0,
                currency="INR",
                created_at=datetime.now(timezone.utc).strftime("%b %d, %Y"),
            )
        ]

    try:
        res = (
            supabase_admin.table("contracts")
            .select(
                "id, user_id, contract_number, contract_type, title, status, "
                "party_a_name, party_b_name, total_value, currency, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        records: List[ContractRecord] = []
        for row in res.data or []:
            created_raw = row.get("created_at", "")
            try:
                dt = datetime.fromisoformat(created_raw.replace("Z", "+00:00"))
                created_fmt = dt.strftime("%b %d, %Y")
            except (ValueError, AttributeError):
                created_fmt = created_raw

            records.append(
                ContractRecord(
                    id=str(row.get("id", "")),
                    user_id=row.get("user_id", ""),
                    contract_number=row.get("contract_number", ""),
                    contract_type=row.get("contract_type", ""),
                    title=row.get("title", ""),
                    status=row.get("status", "draft"),
                    party_a_name=row.get("party_a_name", ""),
                    party_b_name=row.get("party_b_name", ""),
                    total_value=float(row.get("total_value", 0)),
                    currency=row.get("currency", "INR"),
                    created_at=created_fmt,
                )
            )
        return records

    except Exception as e:
        logger.error("contracts_list_failed user=%s error=%s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve contracts.",
        )


# ---------------------------------------------------------------------------
# GET /{contract_id}
# ---------------------------------------------------------------------------

@router.get("/{contract_id}")
async def get_contract(
    contract_id: str,
    current_user: dict = Depends(verify_token),
):
    """
    Fetch a specific contract by ID.
    Returns the full contract data including all clauses and metadata.
    """
    user_id = current_user.get("sub", "anonymous_user")

    if not supabase_admin:
        # Dev fallback
        return {
            "id": contract_id,
            "user_id": user_id,
            "contract_number": "CTR-DEV-001",
            "contract_type": "msa",
            "title": "Sample Master Service Agreement",
            "status": "draft",
            "party_a_name": "Dev Company",
            "party_a_address": "123 Dev Street",
            "party_a_gstin": "DEV000000000",
            "party_b_name": "Dev Client",
            "party_b_address": "456 Client Avenue",
            "party_b_gstin": "CLI000000000",
            "currency": "INR",
            "total_value": 100000.0,
            "payment_terms": "50% advance, 50% on delivery",
            "effective_date": datetime.now(timezone.utc).isoformat(),
            "expiry_date": "",
            "special_instructions": "",
            "contract_data": {},
            "brand_dna_applied": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    try:
        res = (
            supabase_admin.table("contracts")
            .select("*")
            .eq("id", contract_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found or you do not have access.",
            )

        row = res.data[0]

        # Parse contract_data JSON
        contract_data = row.get("contract_data", "{}")
        if isinstance(contract_data, str):
            try:
                contract_data = json.loads(contract_data)
            except json.JSONDecodeError:
                contract_data = {}

        return {
            "id": str(row.get("id", "")),
            "user_id": row.get("user_id", ""),
            "contract_number": row.get("contract_number", ""),
            "contract_type": row.get("contract_type", ""),
            "title": row.get("title", ""),
            "status": row.get("status", "draft"),
            "party_a_name": row.get("party_a_name", ""),
            "party_a_address": row.get("party_a_address", ""),
            "party_a_gstin": row.get("party_a_gstin", ""),
            "party_b_name": row.get("party_b_name", ""),
            "party_b_address": row.get("party_b_address", ""),
            "party_b_gstin": row.get("party_b_gstin", ""),
            "currency": row.get("currency", "INR"),
            "total_value": float(row.get("total_value", 0)),
            "payment_terms": row.get("payment_terms", ""),
            "effective_date": row.get("effective_date", ""),
            "expiry_date": row.get("expiry_date", ""),
            "special_instructions": row.get("special_instructions", ""),
            "contract_data": contract_data,
            "brand_dna_applied": row.get("brand_dna_applied", False),
            "created_at": row.get("created_at", ""),
            "updated_at": row.get("updated_at", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("contract_fetch_failed user=%s contract=%s error=%s", user_id, contract_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve contract.",
        )
