"""
Purchase Order Generator Router
--------------------------------
Generates professional, GST-compliant Purchase Orders using Groq LLM,
styled with the user's active Brand DNA. Auto-numbers via Supabase RPC,
computes line-item totals with configurable tax, and persists to the
`purchase_orders` table.

Endpoints:
    POST /api/purchase-orders/generate   – Generate a new PO
    GET  /api/purchase-orders/list       – List all POs for the user
    GET  /api/purchase-orders/{po_id}    – Fetch a single PO by ID
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body, Query
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
# Logger & Router
# ---------------------------------------------------------------------------
logger = logging.getLogger("voicecontract.purchase_orders")
router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_GST_RATE = Decimal("18.0")  # 18% GST

# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class BuyerInfo(BaseModel):
    name: str = Field(..., description="Buyer / Company name")
    address: str = Field("", description="Buyer registered address")
    gstin: str = Field("", description="Buyer GSTIN")
    contact: str = Field("", description="Buyer contact phone / email")
    department: str = Field("", description="Requesting department")


class VendorInfo(BaseModel):
    name: str = Field(..., description="Vendor / Supplier name")
    address: str = Field("", description="Vendor registered address")
    gstin: str = Field("", description="Vendor GSTIN")
    contact: str = Field("", description="Vendor contact phone / email")


class LineItem(BaseModel):
    item_code: str = Field("", description="Internal SKU / item code")
    description: str = Field(..., description="Item description")
    hsn_sac: str = Field("", description="HSN/SAC code for GST")
    quantity: float = Field(..., gt=0, description="Quantity ordered")
    unit: str = Field("Nos", description="Unit of measure (Nos, Kg, Ltr, etc.)")
    rate: float = Field(..., ge=0, description="Unit rate (excl. tax)")


class GeneratePORequest(BaseModel):
    buyer: BuyerInfo
    vendor: VendorInfo
    delivery_address: str = Field("", description="Delivery / ship-to address")
    delivery_date: str = Field("", description="Expected delivery date (YYYY-MM-DD)")
    delivery_terms: str = Field("Ex-Works", description="Delivery terms (Ex-Works, FOR, CIF, etc.)")
    line_items: List[LineItem] = Field(..., min_length=1)
    payment_terms: str = Field("Net 30 days from invoice date")
    special_instructions: str = Field("", description="Any special notes or instructions")
    gst_rate: Optional[float] = Field(None, description="Custom GST rate %. Defaults to 18%")


class ComputedLineItem(BaseModel):
    sr_no: int
    item_code: str
    description: str
    hsn_sac: str
    quantity: float
    unit: str
    rate: float
    amount: float
    tax_rate: float
    tax_amount: float
    total_amount: float


class POSummary(BaseModel):
    subtotal: float
    tax_rate: float
    tax_amount: float
    grand_total: float


class GeneratePOResponse(BaseModel):
    id: str
    po_number: str
    html_content: str
    computed_items: List[ComputedLineItem]
    summary: POSummary
    created_at: str
    status: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGroq | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY is not set. PO generation will fail.")
        return None
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        temperature=0.4,
        max_tokens=8000,
    )


def _compute_line_items(
    items: List[LineItem], gst_rate: Decimal
) -> tuple[list[dict], dict]:
    """Compute per-line totals and grand summary. Returns (items_list, summary_dict)."""
    computed = []
    subtotal = Decimal("0")

    for idx, item in enumerate(items, start=1):
        qty = Decimal(str(item.quantity))
        rate = Decimal(str(item.rate))
        amount = (qty * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        tax = (amount * gst_rate / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        total = amount + tax
        subtotal += amount

        computed.append(
            {
                "sr_no": idx,
                "item_code": item.item_code,
                "description": item.description,
                "hsn_sac": item.hsn_sac,
                "quantity": float(qty),
                "unit": item.unit,
                "rate": float(rate),
                "amount": float(amount),
                "tax_rate": float(gst_rate),
                "tax_amount": float(tax),
                "total_amount": float(total),
            }
        )

    total_tax = (subtotal * gst_rate / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    grand_total = subtotal + total_tax

    summary = {
        "subtotal": float(subtotal),
        "tax_rate": float(gst_rate),
        "tax_amount": float(total_tax),
        "grand_total": float(grand_total),
    }
    return computed, summary


def _resolve_user_id(token_data: dict) -> str:
    uid = token_data.get("sub") or token_data.get("id") or token_data.get("user_id")
    if not uid:
        raise HTTPException(status_code=401, detail="Could not resolve user identity")
    return uid


async def _fetch_active_brand_dna(user_id: str) -> dict:
    """Fetch the user's active Brand DNA for styling. Returns defaults on failure."""
    defaults = {
        "colours": {
            "primary": "#1a1a2e",
            "secondary": "#16213e",
            "accent": "#2563EB",
            "background": "#ffffff",
            "text": "#1a1a2e",
        },
        "tone": {"primary": "Professional", "formality": "formal"},
        "document_style": {
            "header_style": "corporate",
            "font_personality": "modern",
            "spacing": "comfortable",
            "logo_placement": "top-left",
        },
    }

    if not supabase_admin:
        return defaults

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
        if resp.data:
            row = resp.data[0]
            return {
                "colours": row.get("colours") or defaults["colours"],
                "tone": row.get("tone") or defaults["tone"],
                "document_style": row.get("document_style") or defaults["document_style"],
            }
    except Exception as exc:
        logger.warning(f"Failed to fetch brand DNA: {exc}")

    return defaults


async def _get_next_po_number(user_id: str) -> str:
    """Call Supabase RPC to get the next sequential PO number."""
    if not supabase_admin:
        # Fallback: timestamp-based number
        ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        return f"PO-{ts}"

    try:
        rpc_resp = supabase_admin.rpc(
            "get_next_document_number",
            {"p_user_id": user_id, "p_doc_type": "po"},
        ).execute()

        if rpc_resp.data:
            return str(rpc_resp.data)
    except Exception as exc:
        logger.warning(f"RPC get_next_document_number failed: {exc}")

    # Fallback
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"PO-{ts}"


def _parse_llm_html(raw: str) -> str:
    """Extract HTML content from LLM response (strip markdown fences if present)."""
    # Strip ```html ... ``` fences
    match = re.search(r"```(?:html)?\s*(.*?)\s*```", raw, re.DOTALL)
    if match:
        return match.group(1).strip()

    # If content starts with < it's likely raw HTML
    stripped = raw.strip()
    if stripped.startswith("<"):
        return stripped

    return stripped


# ---------------------------------------------------------------------------
# System Prompt
# ---------------------------------------------------------------------------

PO_SYSTEM_PROMPT = """You are VoiceContract's Purchase Order Generator — a world-class document architect that produces boardroom-ready, GST-compliant Purchase Orders in pure HTML with inline CSS.

You will receive structured PO data (buyer, vendor, line items with computed amounts, delivery terms, payment terms) and the user's Brand DNA (colours, tone, document style).

Generate a SINGLE complete HTML document for the Purchase Order that includes:

1. **HEADER SECTION**
   - Company logo placeholder area (styled div)
   - Large "PURCHASE ORDER" title
   - PO Number prominently displayed
   - PO Date

2. **BUYER & VENDOR DETAILS** (side by side)
   - Left: Buyer/Company details with GSTIN
   - Right: Vendor/Supplier details with GSTIN

3. **DELIVERY INFORMATION**
   - Delivery address, expected delivery date, delivery terms

4. **LINE ITEMS TABLE** — professional table with columns:
   - Sr. No. | Item Code | Description | HSN/SAC | Qty | UOM | Rate (₹) | Amount (₹)

5. **TOTALS SECTION**
   - Subtotal
   - GST breakdown (CGST + SGST or IGST as appropriate)
   - Grand Total (in bold, highlighted)
   - Amount in words (if possible)

6. **TERMS & CONDITIONS** section with standard PO clauses:
   - Delivery: Goods must be delivered by the specified date. Delayed delivery may result in penalty or order cancellation.
   - Quality: All items must conform to specifications. Defective goods will be returned at vendor's expense.
   - Payment: Payment will be processed as per the stated payment terms from date of invoice and satisfactory receipt of goods.
   - Cancellation: Buyer reserves the right to cancel the order in case of non-compliance.
   - Warranty: Vendor warrants that all goods are free from defects in material and workmanship.
   - Force Majeure: Neither party shall be liable for delays due to circumstances beyond reasonable control.
   - Jurisdiction: Any disputes shall be subject to the jurisdiction of courts at the buyer's location.

7. **VENDOR ACKNOWLEDGEMENT** section:
   - "We acknowledge receipt of this Purchase Order and confirm acceptance of all terms and conditions stated herein."
   - Vendor Signature line, Name, Designation, Date, Company Seal placeholder

8. **AUTHORISED SIGNATORY** block:
   - Signature line for the buyer's authorised representative
   - Name, Designation, Date

STYLING RULES:
- Use the provided Brand DNA colours throughout (accent for headers/borders, primary for text, background for the page)
- Professional typography: use system fonts (Segoe UI, -apple-system, sans-serif)
- Clean table borders, alternating row colours
- Adequate padding and spacing for print readiness
- The document should be fully self-contained HTML with all styles inline
- @media print styles for clean printing

OUTPUT:
Return ONLY the raw HTML. No markdown fences, no explanation, no preamble."""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=GeneratePOResponse)
async def generate_purchase_order(
    payload: GeneratePORequest = Body(...),
    token_data: dict = Depends(verify_token),
):
    """
    Generate a professional Purchase Order.

    Computes line-item totals with GST, fetches the user's Brand DNA,
    generates formatted HTML via Groq LLM, and stores the result in Supabase.
    """
    user_id = _resolve_user_id(token_data)

    # 1. Determine GST rate
    gst_rate = (
        Decimal(str(payload.gst_rate))
        if payload.gst_rate is not None
        else DEFAULT_GST_RATE
    )

    # 2. Compute line-item totals
    computed_items, summary = _compute_line_items(payload.line_items, gst_rate)

    # 3. Fetch Brand DNA
    brand_dna = await _fetch_active_brand_dna(user_id)

    # 4. Get PO number
    po_number = await _get_next_po_number(user_id)

    # 5. Build LLM prompt
    po_date = datetime.now(timezone.utc).strftime("%d-%b-%Y")

    prompt_data = {
        "po_number": po_number,
        "po_date": po_date,
        "buyer": payload.buyer.model_dump(),
        "vendor": payload.vendor.model_dump(),
        "delivery_address": payload.delivery_address,
        "delivery_date": payload.delivery_date,
        "delivery_terms": payload.delivery_terms,
        "line_items": computed_items,
        "summary": summary,
        "payment_terms": payload.payment_terms,
        "special_instructions": payload.special_instructions,
        "brand_dna": brand_dna,
    }

    user_prompt = (
        "Generate a professional Purchase Order HTML document using the following data:\n\n"
        f"{json.dumps(prompt_data, indent=2, ensure_ascii=False)}"
    )

    # 6. Call Groq LLM
    llm = _get_llm()
    if not llm:
        raise HTTPException(
            status_code=500,
            detail="LLM configuration missing. Set GROQ_API_KEY environment variable.",
        )

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=PO_SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ]
        )
        html_content = _parse_llm_html(response.content)
    except Exception as exc:
        logger.error(f"Groq LLM PO generation failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"AI generation failed: {exc}",
        )

    if not html_content or len(html_content) < 100:
        raise HTTPException(
            status_code=502,
            detail="AI returned insufficient content for the Purchase Order.",
        )

    # 7. Persist to Supabase
    po_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    record = {
        "id": po_id,
        "user_id": user_id,
        "po_number": po_number,
        "buyer": payload.buyer.model_dump(),
        "vendor": payload.vendor.model_dump(),
        "delivery_address": payload.delivery_address,
        "delivery_date": payload.delivery_date,
        "delivery_terms": payload.delivery_terms,
        "line_items": [li.model_dump() for li in payload.line_items],
        "computed_items": computed_items,
        "subtotal": summary["subtotal"],
        "tax_rate": summary["tax_rate"],
        "tax_amount": summary["tax_amount"],
        "grand_total": summary["grand_total"],
        "payment_terms": payload.payment_terms,
        "special_instructions": payload.special_instructions,
        "html_content": html_content,
        "status": "draft",
        "created_at": now_iso,
    }

    if supabase_admin:
        try:
            insert_resp = (
                supabase_admin.table("purchase_orders")
                .insert(record)
                .execute()
            )
            if insert_resp.data:
                po_id = insert_resp.data[0].get("id", po_id)
                logger.info(
                    f"✅ Purchase Order {po_number} stored for user {user_id}"
                )
        except Exception as db_exc:
            logger.error(f"Failed to persist PO to database: {db_exc}")
            # Non-fatal — still return the generated PO to the user
    else:
        logger.warning("Supabase not configured — PO not persisted.")

    return GeneratePOResponse(
        id=po_id,
        po_number=po_number,
        html_content=html_content,
        computed_items=[ComputedLineItem(**ci) for ci in computed_items],
        summary=POSummary(**summary),
        created_at=now_iso,
        status="draft",
    )


@router.get("/list")
async def list_purchase_orders(
    token_data: dict = Depends(verify_token),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (draft, sent, accepted, cancelled)"),
):
    """
    List all Purchase Orders for the authenticated user, with pagination.
    Returns metadata without the full HTML content for performance.
    """
    user_id = _resolve_user_id(token_data)

    if not supabase_admin:
        raise HTTPException(
            status_code=503,
            detail="Database not configured.",
        )

    try:
        query = (
            supabase_admin.table("purchase_orders")
            .select(
                "id, po_number, buyer, vendor, subtotal, tax_amount, "
                "grand_total, status, delivery_date, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
        )

        if status:
            query = query.eq("status", status)

        # Pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        resp = query.execute()
    except Exception as exc:
        logger.error(f"Failed to list POs: {exc}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {exc}")

    # Get total count for pagination metadata
    total_count = 0
    try:
        count_query = (
            supabase_admin.table("purchase_orders")
            .select("id", count="exact")
            .eq("user_id", user_id)
        )
        if status:
            count_query = count_query.eq("status", status)
        count_resp = count_query.execute()
        total_count = count_resp.count if hasattr(count_resp, "count") and count_resp.count else len(resp.data or [])
    except Exception:
        total_count = len(resp.data or [])

    return {
        "purchase_orders": resp.data or [],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": max(1, -(-total_count // page_size)),  # ceil division
        },
    }


@router.get("/{po_id}")
async def get_purchase_order(
    po_id: str,
    token_data: dict = Depends(verify_token),
):
    """
    Retrieve a single Purchase Order by ID.
    Returns the full record including HTML content.
    """
    user_id = _resolve_user_id(token_data)

    if not supabase_admin:
        raise HTTPException(
            status_code=503,
            detail="Database not configured.",
        )

    try:
        resp = (
            supabase_admin.table("purchase_orders")
            .select("*")
            .eq("id", po_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as exc:
        logger.error(f"Failed to fetch PO {po_id}: {exc}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {exc}")

    if not resp.data:
        raise HTTPException(
            status_code=404,
            detail=f"Purchase Order with ID '{po_id}' not found.",
        )

    return resp.data[0]
