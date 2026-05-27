import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_MODEL_ID = os.getenv("GITHUB_MODEL_ID", "openai/gpt-4o")
GITHUB_MODELS_URL = os.getenv(
    "GITHUB_MODELS_URL",
    "https://models.github.ai/inference/chat/completions",
)
GITHUB_API_VERSION = os.getenv("GITHUB_API_VERSION", "2026-03-10")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL_ID = os.getenv("GROQ_CONTRACT_MODEL_ID", "llama-3.3-70b-versatile")
GROQ_URL = os.getenv("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")

REQUEST_TIMEOUT_SECONDS = float(os.getenv("CONTRACT_AGENT_TIMEOUT_SECONDS", "24"))
MAX_FIELD_CHARS = int(os.getenv("CONTRACT_AGENT_MAX_FIELD_CHARS", "1200"))
MAX_OUTPUT_TOKENS = int(os.getenv("CONTRACT_AGENT_MAX_OUTPUT_TOKENS", "3500"))


def load_prompt(filename: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _log(message: str) -> None:
    print(f"Contract Agent: {message}")


def _clip_value(value: Any) -> Any:
    if isinstance(value, str):
        compact = " ".join(value.split())
        if len(compact) > MAX_FIELD_CHARS:
            return compact[:MAX_FIELD_CHARS].rstrip() + "..."
        return compact
    if isinstance(value, dict):
        return {str(k): _clip_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_clip_value(item) for item in value[:20]]
    return value


def _normalize_terms(terms: Any) -> dict[str, Any]:
    if not isinstance(terms, dict):
        return {}

    # Accept either raw terms or the full extraction payload by mistake.
    if isinstance(terms.get("terms"), dict):
        terms = terms["terms"]

    normalized = {str(key): _clip_value(value) for key, value in terms.items()}
    for key in (
        "deliverables",
        "price",
        "timeline",
        "payment_schedule",
        "revisions",
        "ip_ownership",
        "confidentiality",
        "dispute_resolution",
        "client_name",
    ):
        normalized.setdefault(key, None)
    return normalized


def _normalize_gaps(gaps: Any) -> list[dict[str, Any]]:
    if isinstance(gaps, dict):
        gaps = gaps.get("gaps", [])
    if not isinstance(gaps, list):
        return []

    normalized = []
    for gap in gaps[:20]:
        if isinstance(gap, dict):
            normalized.append({str(key): _clip_value(value) for key, value in gap.items()})
    return normalized


def _normalize_company_details(company_details: Any) -> dict[str, Any]:
    if not isinstance(company_details, dict):
        company_details = {}

    normalized = {str(key): _clip_value(value) for key, value in company_details.items()}
    normalized.setdefault("company_name", "Service Provider")
    normalized.setdefault("your_name", "Authorised Representative")
    normalized.setdefault("gst_number", "Not provided")
    normalized.setdefault("address", "Not provided")
    return normalized


def _apply_gap_defaults(terms: dict[str, Any], gaps: list[dict[str, Any]]) -> dict[str, Any]:
    merged = dict(terms)
    for gap in gaps:
        field = gap.get("field")
        default_value = gap.get("default_value")
        if isinstance(field, str) and field in merged and not merged.get(field) and default_value:
            merged[field] = default_value
    return merged


def _build_user_content(
    terms: dict[str, Any],
    gaps: list[dict[str, Any]],
    company_details: dict[str, Any],
) -> str:
    payload = {
        "deal_terms": _apply_gap_defaults(terms, gaps),
        "gaps_addressed": gaps,
        "service_provider": company_details,
        "brand_dna_context": company_details.get("brand_dna", "Professional, precise, and direct."),
        "drafting_requirements": {
            "jurisdiction": "India",
            "law": "Indian Contract Act, 1872",
            "format": "plain text only, no markdown",
            "minimum_sections": [
                "Parties",
                "Scope of Work",
                "Timeline",
                "Payment Terms",
                "Revisions",
                "Intellectual Property",
                "Confidentiality",
                "Dispute Resolution",
                "Termination",
                "Signatures",
            ],
            "quality_bar": "Specific, concrete, direct. Use defaults only where gaps require them.",
        },
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _messages(system_prompt: str, user_content: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]


async def _post_chat_completion(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    provider: str,
) -> str:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code >= 400:
        body = response.text[:500].replace("\n", " ")
        raise RuntimeError(f"{provider} returned HTTP {response.status_code}: {body}")

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError(f"{provider} returned no choices")

    message = choices[0].get("message") or {}
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError(f"{provider} returned an empty contract")

    return content.strip()


async def _generate_with_github(system_prompt: str, user_content: str) -> tuple[str, str]:
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN is not configured")

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }
    payload = {
        "model": GITHUB_MODEL_ID,
        "messages": _messages(system_prompt, user_content),
        "temperature": 0.2,
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    contract_text = await _post_chat_completion(
        GITHUB_MODELS_URL,
        headers,
        payload,
        f"GitHub Models {GITHUB_MODEL_ID}",
    )
    return contract_text, GITHUB_MODEL_ID


async def _generate_with_groq(system_prompt: str, user_content: str) -> tuple[str, str]:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL_ID,
        "messages": _messages(system_prompt, user_content),
        "temperature": 0.2,
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    contract_text = await _post_chat_completion(
        GROQ_URL,
        headers,
        payload,
        f"Groq {GROQ_MODEL_ID}",
    )
    return contract_text, GROQ_MODEL_ID


def _clean_party(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _local_contract(
    terms: dict[str, Any],
    gaps: list[dict[str, Any]],
    company_details: dict[str, Any],
) -> str:
    merged_terms = _apply_gap_defaults(terms, gaps)
    provider = _clean_party(company_details.get("company_name"), "Service Provider")
    representative = _clean_party(company_details.get("your_name"), "Authorised Representative")
    address = _clean_party(company_details.get("address"), "Address not provided")
    gst_number = _clean_party(company_details.get("gst_number"), "Not provided")
    client = _clean_party(merged_terms.get("client_name"), "Client")
    deliverables = _clean_party(merged_terms.get("deliverables"), "the services discussed and agreed between the parties")
    price = _clean_party(merged_terms.get("price"), "the fee agreed between the parties")
    timeline = _clean_party(merged_terms.get("timeline"), "the mutually agreed project timeline")
    payment_schedule = _clean_party(merged_terms.get("payment_schedule"), "50% advance and 50% before final handover")
    revisions = _clean_party(merged_terms.get("revisions"), "two reasonable revision rounds")
    ip_ownership = _clean_party(
        merged_terms.get("ip_ownership"),
        "the Client receives ownership of final approved deliverables only after full payment is received",
    )
    confidentiality = _clean_party(
        merged_terms.get("confidentiality"),
        "both parties must keep business, technical, commercial, and project information confidential",
    )
    dispute_resolution = _clean_party(
        merged_terms.get("dispute_resolution"),
        "good-faith discussion first, followed by remedies available under Indian law",
    )

    return f"""SERVICE AGREEMENT

This Service Agreement is made between {provider}, represented by {representative}, having its address at {address} and GST number {gst_number}, referred to as the "Service Provider", and {client}, referred to as the "Client".

1. PARTIES
The Service Provider agrees to perform professional services for the Client. The Client agrees to provide timely inputs, approvals, access, and payment so the work can be completed without avoidable delay. Each party confirms that it has authority to enter into this Agreement.
The parties intend this document to record the commercial understanding reached between them and to create binding obligations under applicable Indian law. A person signing for a company, firm, agency, or other organisation confirms that they are authorised to bind that organisation. Notices and approvals may be exchanged by email, written message, invoice, project management tool, or any other written channel normally used by the parties for this project.

2. SCOPE OF WORK
The Service Provider will deliver: {deliverables}. Any work outside this scope, including additional features, extra formats, new campaigns, extended support, or material changes after approval, will require written confirmation and may require additional fees and timelines.
The Service Provider is responsible for professional execution of the agreed scope. The Client is responsible for the accuracy, legality, and completeness of all content, brand assets, data, credentials, references, approvals, and instructions it provides. Unless expressly included above, the scope does not include media buying, third-party subscriptions, printing, hosting, legal registrations, advertising spends, stock asset purchases, or post-delivery maintenance. If a dependency from the Client or a third party is delayed, the Service Provider will not be responsible for the resulting delay.

3. TIMELINE
The project timeline is: {timeline}. The timeline depends on the Client providing required information, content, feedback, credentials, and approvals on time. Delays caused by late Client inputs will extend the delivery schedule by a reasonable period.
Any dates stated in this Agreement are working estimates unless the parties expressly identify them as fixed deadlines. The Service Provider will make reasonable efforts to meet the agreed timeline, but the schedule may change because of late feedback, change requests, delayed payment, unavailable assets, platform outages, force majeure events, or new requirements. The Client must review submitted work within a reasonable time. If the Client does not respond within seven days after a submission, the submitted work may be treated as accepted for the purpose of moving the project forward.

4. PAYMENT TERMS
The project fee is {price}. The payment schedule is: {payment_schedule}. Taxes, gateway charges, and out-of-pocket expenses are payable by the Client unless already included in the fee. The Service Provider may pause work if payment is overdue.
All payments must be made in Indian Rupees unless another currency is expressly agreed in writing. Invoices are payable on receipt unless a different due date is stated. The Client may not withhold payment for undisputed completed work because of a separate dispute about future work, optional additions, or subjective preference after approval. If payment is delayed, the Service Provider may withhold final files, source files, credentials, publication, or handover until all due amounts are received. Any additional work requested by the Client will be estimated separately and will start only after written approval.

5. REVISIONS
The included revision entitlement is: {revisions}. A revision means a reasonable change to already agreed work. A revision does not include a new direction, new deliverable, new concept, or change caused by missing or incorrect Client instructions.
Revision requests must be specific and consolidated. The Client should provide clear written feedback that identifies the item to be changed and the expected result. Conflicting feedback from multiple Client stakeholders may pause the project until the Client provides one final instruction. Revision rounds expire once the work is approved, published, handed over, or left without response for more than seven days. Additional revisions are billable at the Service Provider's standard or mutually agreed rate.

6. INTELLECTUAL PROPERTY
Intellectual property will be handled as follows: {ip_ownership}. Until full payment is received, all drafts, source files, methods, templates, concepts, and work in progress remain the property of the Service Provider. The Service Provider may reuse general know-how, non-confidential methods, and reusable tools.
Unless source files are expressly included in the agreed scope, final deliverables do not automatically include editable source files, internal notes, prompts, reusable components, rejected concepts, or process materials. Third-party materials remain subject to their own licence terms. The Client must ensure that any Client-provided materials do not infringe third-party rights. After full payment, the Client receives the rights expressly stated in this Agreement for final approved deliverables, but the Service Provider retains ownership of pre-existing materials, reusable systems, skills, techniques, and general knowledge.

7. CONFIDENTIALITY
Confidentiality terms are as follows: {confidentiality}. This obligation does not apply to information already public, independently developed, legally required to be disclosed, or received from a lawful third party without restriction.
Each party must use confidential information only for the project and must take reasonable steps to protect it from unauthorised access, copying, or disclosure. Confidential information includes pricing, strategy, customer data, business plans, credentials, unpublished designs, technical details, financial information, and private communications. The Service Provider may disclose confidential information to contractors or team members only where needed to perform the work, and only if they are bound by confidentiality duties. These confidentiality obligations continue after the project ends.

8. DISPUTE RESOLUTION AND GOVERNING LAW
Dispute resolution will follow: {dispute_resolution}. This Agreement is governed by the laws of India, including the Indian Contract Act, 1872. The parties will first try to resolve disputes through direct discussion before taking formal legal action.
Before starting legal proceedings, the complaining party must send written notice describing the issue and the relief requested. The parties will then attempt in good faith to resolve the dispute through discussion within fifteen days, unless urgent relief is required to protect confidential information, intellectual property, or unpaid amounts. If the dispute is not resolved, the parties may pursue remedies available under Indian law. Nothing in this clause prevents either party from seeking payment for completed work or protection against misuse of confidential information.

9. TERMINATION
Either party may terminate this Agreement by written notice if the other party materially breaches its obligations and does not cure the breach within a reasonable period. On termination, the Client must pay for completed work, approved work, committed expenses, and work in progress up to the termination date.
The Service Provider may also terminate or pause the project if the Client fails to pay on time, repeatedly delays feedback, requests unlawful work, misuses deliverables, or materially changes the scope without approving revised fees and timelines. The Client may terminate for convenience by written notice, but remains responsible for all fees earned, costs incurred, and non-cancellable commitments up to the termination date. After termination, each party must return or delete confidential materials on reasonable request, except records required for legal, tax, accounting, or compliance purposes.

10. LIMITATION OF LIABILITY
The Service Provider will perform the services with reasonable skill and care. However, the Service Provider does not guarantee a specific commercial result, sales result, ranking, platform approval, investment outcome, or third-party response unless expressly agreed in writing. To the maximum extent permitted by law, the Service Provider's aggregate liability under this Agreement will not exceed the fees actually paid by the Client for the affected services. Neither party will be liable for indirect, incidental, special, punitive, or consequential losses, including loss of profits, loss of data, loss of goodwill, or business interruption, except where such limitation is not permitted by law.

11. GENERAL TERMS
This Agreement records the full understanding between the parties for the services described above and replaces prior oral or written discussions on the same subject. Any amendment must be confirmed in writing by both parties. If any clause is found invalid or unenforceable, the remaining clauses will continue to apply. A delay in enforcing a right does not waive that right. Neither party may assign this Agreement without written consent, except to a successor in connection with a business transfer. The relationship between the parties is that of independent contracting parties, not employer and employee, partners, agents, or joint venturers.

12. SIGNATURES
For the Service Provider:
Name: {representative}
Signature: ______________________
Date: ___________________________

For the Client:
Name: {client}
Signature: ______________________
Date: ___________________________"""


def _validate_contract(contract_text: str) -> None:
    required_markers = [
        "PARTIES",
        "SCOPE",
        "TIMELINE",
        "PAYMENT",
        "REVISIONS",
        "INTELLECTUAL PROPERTY",
        "CONFIDENTIALITY",
        "DISPUTE",
        "TERMINATION",
        "SIGNATURE",
    ]
    upper_contract = contract_text.upper()
    missing = [marker for marker in required_markers if marker not in upper_contract]
    if missing:
        raise RuntimeError(f"Generated contract is missing required sections: {', '.join(missing)}")


async def generate_contract(terms: dict, gaps: list, company_details: dict) -> dict:
    """
    Generate a legally structured service agreement.

    Provider order:
    1. GitHub Models using GITHUB_TOKEN.
    2. Groq Llama 3.3 70B using GROQ_API_KEY.
    3. Deterministic local draft so the API route does not crash during demos.
    """
    normalized_terms = _normalize_terms(terms)
    normalized_gaps = _normalize_gaps(gaps)
    normalized_company = _normalize_company_details(company_details)

    contract_prompt = load_prompt("contract_prompt.md")
    user_content = _build_user_content(normalized_terms, normalized_gaps, normalized_company)

    failures = []
    providers = (_generate_with_github, _generate_with_groq)

    for provider in providers:
        try:
            provider_name = "GitHub Models" if provider is _generate_with_github else "Groq"
            _log(f"Requesting contract from {provider_name}.")
            contract_text, model_id = await provider(contract_prompt, user_content)
            _validate_contract(contract_text)
            word_count = len(contract_text.split())
            _log(f"Contract generated by {model_id}. Words: {word_count}.")
            return {
                "contract": contract_text,
                "word_count": word_count,
                "model": model_id,
                "provider": provider_name,
                "fallback_used": bool(failures),
                "warnings": failures,
            }
        except Exception as exc:
            message = str(exc)
            failures.append(message)
            _log(f"Provider failed. {message}")

    contract_text = _local_contract(normalized_terms, normalized_gaps, normalized_company)
    _validate_contract(contract_text)
    word_count = len(contract_text.split())
    _log(f"Contract generated locally. Words: {word_count}.")
    return {
        "contract": contract_text,
        "word_count": word_count,
        "model": "local-contract-template",
        "provider": "local",
        "fallback_used": True,
        "warnings": failures,
    }
