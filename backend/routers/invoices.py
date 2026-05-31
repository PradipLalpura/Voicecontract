"""
Invoice Generator Router — GST-compliant invoices for India.

Endpoints:
  POST /api/invoices/generate   → Generate a professional HTML invoice
  GET  /api/invoices/list       → List invoices for the authenticated user
  GET  /api/invoices/{invoice_id} → Fetch a single invoice by ID
"""

import logging
import os
import json
import uuid
import math
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Body, Query
from pydantic import BaseModel, Field

try:
    from backend.auth.jwt_auth import verify_token
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
    from database.client import supabase_admin

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger("voicecontract.invoices")
router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_GST_RATE = 18.0  # percent

# Indian state-code map (first 2 digits of GSTIN)
STATE_CODE_MAP: Dict[str, str] = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
    "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman & Nicobar Islands", "36": "Telangana",
    "37": "Andhra Pradesh", "38": "Ladakh",
}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class BankDetails(BaseModel):
    account_name: str = ""
    account_number: str = ""
    bank_name: str = ""
    branch: str = ""
    ifsc_code: str = ""
    upi_id: str = ""


class BillerInfo(BaseModel):
    name: str
    address: str
    gstin: str
    pan: str = ""
    bank_details: Optional[BankDetails] = None


class RecipientInfo(BaseModel):
    name: str
    address: str
    gstin: str = ""


class LineItem(BaseModel):
    description: str
    hsn_sac_code: str = ""
    quantity: float = 1.0
    unit: str = "Nos"
    rate: float
    gst_rate: float = Field(default=DEFAULT_GST_RATE, description="GST rate % for this item")
    is_service: bool = False


class InvoiceGenerateRequest(BaseModel):
    biller: BillerInfo
    recipient: RecipientInfo
    line_items: List[LineItem]
    payment_terms: str = "Due on receipt"
    notes: str = ""
    invoice_date: Optional[str] = None  # ISO date string; defaults to today
    due_date: Optional[str] = None


class InvoiceLineResult(BaseModel):
    description: str
    hsn_sac_code: str
    quantity: float
    unit: str
    rate: float
    amount: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float


class InvoiceGenerateResponse(BaseModel):
    invoice_id: str
    invoice_number: str
    supply_type: str
    subtotal: float
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    total_amount: float
    amount_in_words: str
    html_content: str
    created_at: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_state_code(gstin: str) -> str:
    """Extract the 2-digit state code from a 15-character GSTIN."""
    if gstin and len(gstin) >= 2:
        return gstin[:2]
    return ""


def _detect_supply_type(biller_gstin: str, recipient_gstin: str) -> str:
    """
    Determine supply type from GSTIN state-code prefixes.
    Same state → intra_state (CGST + SGST)
    Different state → inter_state (IGST)
    If recipient has no GSTIN, default to inter_state.
    """
    biller_state = _get_state_code(biller_gstin)
    recipient_state = _get_state_code(recipient_gstin)
    if not biller_state or not recipient_state:
        return "inter_state"
    return "intra_state" if biller_state == recipient_state else "inter_state"


def _amount_in_words_indian(amount: float) -> str:
    """
    Convert a monetary amount to words using the Indian numbering system
    (lakhs, crores). Handles up to 99,99,99,99,999 (99 arab+).
    """
    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
        "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
        "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety",
    ]

    def _two_digits(n: int) -> str:
        if n < 20:
            return ones[n]
        return (tens[n // 10] + " " + ones[n % 10]).strip()

    def _three_digits(n: int) -> str:
        if n >= 100:
            return ones[n // 100] + " Hundred" + (" and " + _two_digits(n % 100) if n % 100 else "")
        return _two_digits(n)

    if amount < 0:
        return "Minus " + _amount_in_words_indian(-amount)

    rupees = int(math.floor(amount))
    paise = round((amount - rupees) * 100)

    if rupees == 0 and paise == 0:
        return "Zero Rupees Only"

    parts: list[str] = []

    if rupees > 0:
        # Break into: ones-hundreds | thousands | lakhs | crores
        crore = rupees // 10000000
        remainder = rupees % 10000000
        lakh = remainder // 100000
        remainder = remainder % 100000
        thousand = remainder // 1000
        remainder = remainder % 1000
        hundred_part = remainder

        if crore:
            parts.append(_two_digits(crore) + " Crore")
        if lakh:
            parts.append(_two_digits(lakh) + " Lakh")
        if thousand:
            parts.append(_two_digits(thousand) + " Thousand")
        if hundred_part:
            parts.append(_three_digits(hundred_part))

    rupee_words = " ".join(parts).strip()

    if paise and rupee_words:
        paise_words = _two_digits(paise)
        return f"Rupees {rupee_words} and {paise_words} Paise Only"
    elif paise:
        paise_words = _two_digits(paise)
        return f"{paise_words} Paise Only"
    else:
        return f"Rupees {rupee_words} Only"


def _compute_line_taxes(item: LineItem, supply_type: str) -> dict:
    """Compute tax amounts for a single line item."""
    amount = round(item.quantity * item.rate, 2)
    gst_rate = item.gst_rate

    if supply_type == "intra_state":
        half_rate = gst_rate / 2
        cgst = round(amount * half_rate / 100, 2)
        sgst = round(amount * half_rate / 100, 2)
        igst = 0.0
    else:
        cgst = 0.0
        sgst = 0.0
        igst = round(amount * gst_rate / 100, 2)

    return {
        "description": item.description,
        "hsn_sac_code": item.hsn_sac_code,
        "quantity": item.quantity,
        "unit": item.unit,
        "rate": item.rate,
        "amount": amount,
        "gst_rate": gst_rate,
        "cgst_amount": cgst,
        "sgst_amount": sgst,
        "igst_amount": igst,
    }


def _get_llm():
    """Initialise Groq LLM."""
    token = os.getenv("GROQ_API_KEY")
    if not token:
        logger.warning("GROQ_API_KEY is not set. Invoice HTML generation will use fallback.")
        return None
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=token,
        temperature=0.4,
        max_tokens=8000,
    )


def _get_biller_state_name(gstin: str) -> str:
    code = _get_state_code(gstin)
    return STATE_CODE_MAP.get(code, "India")


# ---------------------------------------------------------------------------
# AI prompt for HTML invoice
# ---------------------------------------------------------------------------

INVOICE_SYSTEM_PROMPT = """You are an expert invoice designer. Generate a SINGLE, complete, professional GST-compliant HTML invoice.

RULES:
- Output ONLY raw HTML. No markdown fences, no explanation, no commentary.
- Use inline CSS for all styling. The HTML must be fully self-contained.
- Use the brand colours provided to create a polished, modern design.
- The invoice MUST include ALL the data provided — do NOT omit any field.
- Currency is Indian Rupees (₹). Use the ₹ symbol throughout.
- Format numbers in Indian style: 1,00,000 for one lakh.
- The design should be print-ready on A4 paper.

REQUIRED SECTIONS (in order):
1. **Header**: Company name, logo placeholder, address, GSTIN, PAN — styled with brand primary colour.
2. **Invoice metadata**: Invoice number, date, due date, place of supply.
3. **Bill To**: Recipient name, address, GSTIN.
4. **Line items table**: Columns — S.No, Description, HSN/SAC, Qty, Unit, Rate, Amount.
5. **Tax summary table**: Show CGST + SGST rows (if intra-state) OR IGST row (if inter-state) with rate and amount per item grouping.
6. **Totals**: Subtotal, total tax, Grand Total (bold, large, brand colour).
7. **Amount in words**: Full line showing the total in words.
8. **Bank details**: Account name, number, bank, branch, IFSC, UPI ID — in a styled box.
9. **Payment terms and notes**: Below bank details.
10. **Footer**: "This is a computer-generated invoice" + "Powered by VoiceContract".

DESIGN GUIDELINES:
- Use a clean, minimal layout with generous whitespace.
- Header should have a coloured band/accent using the brand primary colour.
- Table headers should use brand primary colour background with white text.
- Alternate row striping for readability.
- Grand total row should be visually prominent.
- Use professional fonts: system-ui, -apple-system, sans-serif.
"""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=InvoiceGenerateResponse)
async def generate_invoice(
    payload: InvoiceGenerateRequest = Body(...),
    current_user: dict = Depends(verify_token),
):
    """
    Generate a GST-compliant professional HTML invoice.

    1. Auto-detect supply type from GSTIN prefixes.
    2. Compute line-level and aggregate taxes.
    3. Fetch brand_dna for styling.
    4. Call Supabase RPC for auto-numbering.
    5. Send to Groq for HTML generation.
    6. Store in Supabase `invoices` table.
    """
    user_id = current_user.get("sub", "anonymous_user")
    invoice_id = str(uuid.uuid4())
    now = datetime.utcnow()
    invoice_date = payload.invoice_date or now.strftime("%Y-%m-%d")
    due_date = payload.due_date or (now + timedelta(days=30)).strftime("%Y-%m-%d")

    # ── 1. Supply type detection ──────────────────────────────────────────
    supply_type = _detect_supply_type(payload.biller.gstin, payload.recipient.gstin)
    biller_state = _get_biller_state_name(payload.biller.gstin)
    recipient_state = _get_biller_state_name(payload.recipient.gstin)

    logger.info(
        f"Invoice supply_type={supply_type} | "
        f"biller_state={biller_state} | recipient_state={recipient_state}"
    )

    # ── 2. Compute taxes per line ─────────────────────────────────────────
    computed_items: list[dict] = []
    subtotal = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0

    for item in payload.line_items:
        line = _compute_line_taxes(item, supply_type)
        computed_items.append(line)
        subtotal += line["amount"]
        total_cgst += line["cgst_amount"]
        total_sgst += line["sgst_amount"]
        total_igst += line["igst_amount"]

    subtotal = round(subtotal, 2)
    total_cgst = round(total_cgst, 2)
    total_sgst = round(total_sgst, 2)
    total_igst = round(total_igst, 2)
    taxable_amount = subtotal
    total_tax = round(total_cgst + total_sgst + total_igst, 2)
    total_amount = round(subtotal + total_tax, 2)
    amount_in_words = _amount_in_words_indian(total_amount)

    # ── 3. Fetch brand DNA for styling ────────────────────────────────────
    brand_primary = "#2563EB"
    brand_secondary = "#1E40AF"
    brand_company_name = payload.biller.name

    if supabase_admin:
        try:
            brand_res = (
                supabase_admin.table("brand_dna")
                .select("*")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .limit(1)
                .execute()
            )
            if brand_res.data:
                dna = brand_res.data[0]
                brand_primary = dna.get("primary_color") or dna.get("brand_accent") or brand_primary
                brand_secondary = dna.get("secondary_color") or brand_secondary
                brand_company_name = dna.get("company_name") or brand_company_name
        except Exception as e:
            logger.warning(f"Failed to fetch brand_dna: {e}")

    # ── 4. Auto-numbering via Supabase RPC ────────────────────────────────
    invoice_number = f"INV-{invoice_id[:8].upper()}"
    if supabase_admin:
        try:
            rpc_res = supabase_admin.rpc(
                "get_next_document_number",
                {"p_user_id": user_id, "p_doc_type": "invoice"},
            ).execute()
            if rpc_res.data:
                invoice_number = str(rpc_res.data)
        except Exception as e:
            logger.warning(f"RPC get_next_document_number failed, using fallback: {e}")

    # ── 5. Build context and call Groq for HTML ───────────────────────────
    bank = payload.biller.bank_details
    bank_section = ""
    if bank:
        bank_section = (
            f"Bank Details:\n"
            f"  Account Name: {bank.account_name}\n"
            f"  Account Number: {bank.account_number}\n"
            f"  Bank: {bank.bank_name}\n"
            f"  Branch: {bank.branch}\n"
            f"  IFSC: {bank.ifsc_code}\n"
            f"  UPI ID: {bank.upi_id}\n"
        )

    items_text = ""
    for idx, ci in enumerate(computed_items, 1):
        items_text += (
            f"  {idx}. {ci['description']} | HSN/SAC: {ci['hsn_sac_code']} | "
            f"Qty: {ci['quantity']} {ci['unit']} | Rate: ₹{ci['rate']:,.2f} | "
            f"Amount: ₹{ci['amount']:,.2f} | GST: {ci['gst_rate']}%"
        )
        if supply_type == "intra_state":
            items_text += f" | CGST: ₹{ci['cgst_amount']:,.2f} | SGST: ₹{ci['sgst_amount']:,.2f}"
        else:
            items_text += f" | IGST: ₹{ci['igst_amount']:,.2f}"
        items_text += "\n"

    tax_summary = ""
    if supply_type == "intra_state":
        tax_summary = (
            f"Tax Type: Intra-State (CGST + SGST)\n"
            f"  Total CGST: ₹{total_cgst:,.2f}\n"
            f"  Total SGST: ₹{total_sgst:,.2f}\n"
        )
    else:
        tax_summary = (
            f"Tax Type: Inter-State (IGST)\n"
            f"  Total IGST: ₹{total_igst:,.2f}\n"
        )

    human_prompt = f"""Generate a professional HTML invoice with the following data:

INVOICE METADATA:
  Invoice Number: {invoice_number}
  Invoice Date: {invoice_date}
  Due Date: {due_date}
  Place of Supply: {recipient_state}
  Supply Type: {supply_type.replace('_', '-')}

BILLER (From):
  Company: {payload.biller.name}
  Address: {payload.biller.address}
  GSTIN: {payload.biller.gstin}
  PAN: {payload.biller.pan}
  State: {biller_state}

RECIPIENT (Bill To):
  Name: {payload.recipient.name}
  Address: {payload.recipient.address}
  GSTIN: {payload.recipient.gstin or 'N/A — Unregistered'}
  State: {recipient_state}

LINE ITEMS:
{items_text}

TAX SUMMARY:
{tax_summary}

TOTALS:
  Subtotal (Taxable Amount): ₹{taxable_amount:,.2f}
  Total Tax: ₹{total_tax:,.2f}
  Grand Total: ₹{total_amount:,.2f}

AMOUNT IN WORDS: {amount_in_words}

{bank_section}

PAYMENT TERMS: {payload.payment_terms}
NOTES: {payload.notes or 'N/A'}

BRAND COLOURS:
  Primary: {brand_primary}
  Secondary: {brand_secondary}
"""

    html_content = ""
    llm = _get_llm()
    if llm:
        try:
            response = await llm.ainvoke([
                SystemMessage(content=INVOICE_SYSTEM_PROMPT),
                HumanMessage(content=human_prompt),
            ])
            html_content = response.content.strip()

            # Strip markdown fences if the model wraps them
            if html_content.startswith("```"):
                lines = html_content.split("\n")
                # Remove first and last fence lines
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                html_content = "\n".join(lines)

        except Exception as e:
            logger.error(f"Groq invoice generation failed: {e}")

    # Fallback HTML if LLM failed
    if not html_content:
        html_content = _build_fallback_html(
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            due_date=due_date,
            biller=payload.biller,
            recipient=payload.recipient,
            computed_items=computed_items,
            supply_type=supply_type,
            subtotal=subtotal,
            total_cgst=total_cgst,
            total_sgst=total_sgst,
            total_igst=total_igst,
            total_amount=total_amount,
            amount_in_words=amount_in_words,
            payment_terms=payload.payment_terms,
            notes=payload.notes,
            brand_primary=brand_primary,
            biller_state=biller_state,
            recipient_state=recipient_state,
        )

    # ── 6. Store in Supabase ──────────────────────────────────────────────
    created_at = now.isoformat() + "Z"

    if supabase_admin:
        try:
            row = {
                "id": invoice_id,
                "user_id": user_id,
                "invoice_number": invoice_number,
                "invoice_date": invoice_date,
                "due_date": due_date,
                "biller": json.loads(payload.biller.model_dump_json()),
                "recipient": json.loads(payload.recipient.model_dump_json()),
                "line_items": [json.loads(li.model_dump_json()) for li in payload.line_items],
                "computed_items": computed_items,
                "supply_type": supply_type,
                "subtotal": subtotal,
                "taxable_amount": taxable_amount,
                "cgst_amount": total_cgst,
                "sgst_amount": total_sgst,
                "igst_amount": total_igst,
                "total_tax": total_tax,
                "total_amount": total_amount,
                "amount_in_words": amount_in_words,
                "html_content": html_content,
                "payment_terms": payload.payment_terms,
                "notes": payload.notes,
                "status": "generated",
                "created_at": created_at,
            }
            supabase_admin.table("invoices").insert(row).execute()
        except Exception as e:
            logger.error(f"Failed to store invoice in Supabase: {e}")
            # Non-fatal — still return the generated invoice

    return InvoiceGenerateResponse(
        invoice_id=invoice_id,
        invoice_number=invoice_number,
        supply_type=supply_type,
        subtotal=subtotal,
        taxable_amount=taxable_amount,
        cgst_amount=total_cgst,
        sgst_amount=total_sgst,
        igst_amount=total_igst,
        total_amount=total_amount,
        amount_in_words=amount_in_words,
        html_content=html_content,
        created_at=created_at,
    )


@router.get("/list")
async def list_invoices(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(verify_token),
):
    """List invoices for the authenticated user, newest first."""
    user_id = current_user.get("sub", "anonymous_user")

    if not supabase_admin:
        return {"invoices": [], "total": 0}

    try:
        res = (
            supabase_admin.table("invoices")
            .select(
                "id, invoice_number, invoice_date, due_date, "
                "recipient, supply_type, subtotal, total_amount, "
                "status, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        invoices = res.data or []

        # Get total count (separate query)
        count_res = (
            supabase_admin.table("invoices")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total = count_res.count if hasattr(count_res, "count") and count_res.count is not None else len(invoices)

        return {"invoices": invoices, "total": total}
    except Exception as e:
        logger.error(f"Error listing invoices: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices.")


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(verify_token),
):
    """Fetch a single invoice by ID. Only the owner can access it."""
    user_id = current_user.get("sub", "anonymous_user")

    if not supabase_admin:
        raise HTTPException(status_code=503, detail="Database not configured.")

    try:
        res = (
            supabase_admin.table("invoices")
            .select("*")
            .eq("id", invoice_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Invoice not found or access denied.")

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoice.")


# ---------------------------------------------------------------------------
# Fallback HTML builder (used when LLM is unavailable)
# ---------------------------------------------------------------------------

def _build_fallback_html(
    *,
    invoice_number: str,
    invoice_date: str,
    due_date: str,
    biller: BillerInfo,
    recipient: RecipientInfo,
    computed_items: list[dict],
    supply_type: str,
    subtotal: float,
    total_cgst: float,
    total_sgst: float,
    total_igst: float,
    total_amount: float,
    amount_in_words: str,
    payment_terms: str,
    notes: str,
    brand_primary: str,
    biller_state: str,
    recipient_state: str,
) -> str:
    """Produce a clean, professional fallback HTML invoice."""

    # Build line-item rows
    item_rows = ""
    for idx, ci in enumerate(computed_items, 1):
        tax_cell = ""
        if supply_type == "intra_state":
            tax_cell = (
                f"<td style='padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;'>"
                f"₹{ci['cgst_amount']:,.2f}</td>"
                f"<td style='padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;'>"
                f"₹{ci['sgst_amount']:,.2f}</td>"
            )
        else:
            tax_cell = (
                f"<td style='padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;'>"
                f"₹{ci['igst_amount']:,.2f}</td>"
            )

        bg = "#f9fafb" if idx % 2 == 0 else "#ffffff"
        item_rows += f"""
        <tr style='background:{bg};'>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;'>{idx}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;'>{ci['description']}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;'>{ci['hsn_sac_code'] or '—'}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;'>{ci['quantity']}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;'>{ci['unit']}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;'>₹{ci['rate']:,.2f}</td>
            <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;'>₹{ci['amount']:,.2f}</td>
            {tax_cell}
        </tr>"""

    # Tax header columns
    if supply_type == "intra_state":
        tax_headers = (
            "<th style='padding:12px;text-align:right;color:#fff;'>CGST</th>"
            "<th style='padding:12px;text-align:right;color:#fff;'>SGST</th>"
        )
        tax_total_row = f"""
        <tr><td colspan='6' style='text-align:right;padding:8px 12px;'>CGST</td>
            <td colspan='3' style='text-align:right;padding:8px 12px;'>₹{total_cgst:,.2f}</td></tr>
        <tr><td colspan='6' style='text-align:right;padding:8px 12px;'>SGST</td>
            <td colspan='3' style='text-align:right;padding:8px 12px;'>₹{total_sgst:,.2f}</td></tr>"""
        col_count = 9
    else:
        tax_headers = "<th style='padding:12px;text-align:right;color:#fff;'>IGST</th>"
        tax_total_row = f"""
        <tr><td colspan='6' style='text-align:right;padding:8px 12px;'>IGST</td>
            <td colspan='2' style='text-align:right;padding:8px 12px;'>₹{total_igst:,.2f}</td></tr>"""
        col_count = 8

    # Bank details
    bank_html = ""
    if biller.bank_details:
        b = biller.bank_details
        bank_html = f"""
        <div style='margin-top:24px;padding:16px;background:#f0f4ff;border-left:4px solid {brand_primary};border-radius:6px;'>
            <h4 style='margin:0 0 10px 0;color:{brand_primary};'>Bank Details</h4>
            <table style='font-size:13px;'>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>Account Name</td><td>{b.account_name}</td></tr>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>Account No.</td><td>{b.account_number}</td></tr>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>Bank</td><td>{b.bank_name}</td></tr>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>Branch</td><td>{b.branch}</td></tr>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>IFSC</td><td>{b.ifsc_code}</td></tr>
                <tr><td style='padding:3px 12px 3px 0;color:#6b7280;'>UPI ID</td><td>{b.upi_id}</td></tr>
            </table>
        </div>"""

    total_tax = round(total_cgst + total_sgst + total_igst, 2)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Invoice {invoice_number}</title>
</head>
<body style='margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;color:#1f2937;background:#fff;'>
<div style='max-width:800px;margin:0 auto;padding:32px;'>

    <!-- Header -->
    <div style='display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid {brand_primary};padding-bottom:20px;margin-bottom:24px;'>
        <div>
            <h1 style='margin:0;font-size:28px;color:{brand_primary};'>{biller.name}</h1>
            <p style='margin:4px 0;font-size:13px;color:#6b7280;'>{biller.address}</p>
            <p style='margin:2px 0;font-size:13px;color:#6b7280;'>GSTIN: {biller.gstin} | PAN: {biller.pan or "N/A"}</p>
            <p style='margin:2px 0;font-size:13px;color:#6b7280;'>State: {biller_state}</p>
        </div>
        <div style='text-align:right;'>
            <h2 style='margin:0;font-size:32px;color:{brand_primary};letter-spacing:2px;'>TAX INVOICE</h2>
        </div>
    </div>

    <!-- Invoice meta + Bill To -->
    <div style='display:flex;justify-content:space-between;margin-bottom:28px;'>
        <div style='border-left:4px solid {brand_primary};padding-left:14px;'>
            <h4 style='margin:0 0 6px;color:{brand_primary};font-size:13px;text-transform:uppercase;'>Bill To</h4>
            <p style='margin:2px 0;font-weight:600;'>{recipient.name}</p>
            <p style='margin:2px 0;font-size:13px;color:#6b7280;'>{recipient.address}</p>
            <p style='margin:2px 0;font-size:13px;color:#6b7280;'>GSTIN: {recipient.gstin or "Unregistered"}</p>
            <p style='margin:2px 0;font-size:13px;color:#6b7280;'>State: {recipient_state}</p>
        </div>
        <div style='text-align:right;font-size:13px;'>
            <p style='margin:3px 0;'><strong>Invoice #:</strong> {invoice_number}</p>
            <p style='margin:3px 0;'><strong>Date:</strong> {invoice_date}</p>
            <p style='margin:3px 0;'><strong>Due Date:</strong> {due_date}</p>
            <p style='margin:3px 0;'><strong>Place of Supply:</strong> {recipient_state}</p>
            <p style='margin:3px 0;'><strong>Supply Type:</strong> {supply_type.replace('_', '-').title()}</p>
        </div>
    </div>

    <!-- Items table -->
    <table style='width:100%;border-collapse:collapse;font-size:13px;margin-bottom:4px;'>
        <thead>
            <tr style='background:{brand_primary};'>
                <th style='padding:12px;text-align:center;color:#fff;'>S.No</th>
                <th style='padding:12px;text-align:left;color:#fff;'>Description</th>
                <th style='padding:12px;text-align:center;color:#fff;'>HSN/SAC</th>
                <th style='padding:12px;text-align:center;color:#fff;'>Qty</th>
                <th style='padding:12px;text-align:center;color:#fff;'>Unit</th>
                <th style='padding:12px;text-align:right;color:#fff;'>Rate (₹)</th>
                <th style='padding:12px;text-align:right;color:#fff;'>Amount (₹)</th>
                {tax_headers}
            </tr>
        </thead>
        <tbody>
            {item_rows}
        </tbody>
    </table>

    <!-- Totals -->
    <table style='width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;'>
        <tr style='border-top:2px solid #e5e7eb;'>
            <td colspan='{col_count - 3}' style='text-align:right;padding:8px 12px;font-weight:600;'>Subtotal</td>
            <td colspan='3' style='text-align:right;padding:8px 12px;font-weight:600;'>₹{subtotal:,.2f}</td>
        </tr>
        {tax_total_row}
        <tr style='background:{brand_primary};color:#fff;'>
            <td colspan='{col_count - 3}' style='text-align:right;padding:12px;font-size:16px;font-weight:700;'>GRAND TOTAL</td>
            <td colspan='3' style='text-align:right;padding:12px;font-size:18px;font-weight:700;'>₹{total_amount:,.2f}</td>
        </tr>
    </table>

    <!-- Amount in words -->
    <div style='padding:10px 14px;background:#f9fafb;border-radius:6px;margin-bottom:20px;font-size:13px;'>
        <strong>Amount in Words:</strong> {amount_in_words}
    </div>

    {bank_html}

    <!-- Payment terms & notes -->
    <div style='margin-top:20px;font-size:13px;'>
        <p><strong>Payment Terms:</strong> {payment_terms}</p>
        {"<p><strong>Notes:</strong> " + notes + "</p>" if notes else ""}
    </div>

    <!-- Footer -->
    <div style='margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;'>
        <p>This is a computer-generated invoice and does not require a physical signature.</p>
        <p>Powered by <strong style='color:{brand_primary};'>VoiceContract</strong></p>
    </div>

</div>
</body>
</html>"""
