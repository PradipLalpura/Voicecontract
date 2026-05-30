import logging
import os
import json
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token
from backend.database.client import supabase_admin
from backend.utils.encryption import security_service
from datetime import datetime

logger = logging.getLogger("voicecontract.dashboard")
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

class DocumentSelection(BaseModel):
    msa: bool = True
    invoice: bool = True
    po: bool = False

class DealCreateRequest(BaseModel):
    client_name: str
    client_company: str
    client_address: str = ""
    client_email: str = ""
    client_whatsapp: str = ""
    documents: DocumentSelection
    use_coach: bool = False

class DealResponse(BaseModel):
    id: str
    client_name: str
    total_value_inr: float
    status: str
    created_at: str

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(verify_token)):
    """Fetch high-level stats for the current user."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        return {
            "total_value_locked": 450000,
            "pending_revenue": 125000,
            "deal_count": 8,
            "conversion_rate": 72.5
        }
        
    try:
        deals_res = supabase_admin.table("deals").select("*").eq("user_id", user_id).execute()
        deals = deals_res.data or []
        
        locked = sum(d.get("total_value_inr", 0) for d in deals if d.get("status") == "signed")
        pending = sum(d.get("total_value_inr", 0) for d in deals if d.get("status") in ["drafted", "sent"])
        
        return {
            "total_value_locked": locked,
            "pending_revenue": pending,
            "deal_count": len(deals),
            "conversion_rate": 72.5 
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")

@router.get("/deals", response_model=List[DealResponse])
async def get_recent_deals(current_user: dict = Depends(verify_token)):
    """Fetch recent deals for the current user."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        return []
        
    try:
        deals_res = supabase_admin.table("deals").select("id, session_id, client_name, total_value_inr, status, created_at").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        
        formatted_deals = []
        for d in deals_res.data:
            dt = datetime.fromisoformat(d.get("created_at", datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            formatted_date = dt.strftime("%b %d, %Y")
            
            formatted_deals.append(DealResponse(
                id=str(d.get("session_id") or d.get("id")),
                client_name=d.get("client_name", "Unknown"),
                total_value_inr=float(d.get("total_value_inr", 0)),
                status=d.get("status", "drafted"),
                created_at=formatted_date
            ))
            
        return formatted_deals
    except Exception as e:
        logger.error(f"Error fetching deals: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")


@router.get("/deals/{session_id}")
async def get_deal_detail(session_id: str, current_user: dict = Depends(verify_token)):
    """
    Fetch full deal data for the review and sign pages.
    Returns committed terms (blueprint), decrypted MSA, invoice/PO data,
    client contact info, and deal audit.
    """
    user_id = current_user.get("sub", "anonymous_user")

    if not supabase_admin:
        # Dev fallback: return realistic mock data
        return {
            "id": "dev-session-123",
            "session_id": session_id,
            "client_name": "Dev Client",
            "total_value_inr": 75000,
            "status": "drafted",
            "msa_text": "MASTER SERVICE AGREEMENT\n\nThis Master Service Agreement (\"Agreement\") is entered into as of the date of last signature below.\n\n1. SCOPE OF SERVICES\nThe Service Provider shall deliver professional services as discussed and agreed upon during the recorded meeting session.\n\n2. CONSIDERATION\nTotal contract value: INR 75,000 (Seventy-Five Thousand Indian Rupees).\n\n3. PAYMENT TERMS\n50% advance upon signing, 50% upon successful delivery.\n\n4. TIMELINE\nDelivery within 14 business days from the date of advance payment.\n\n5. REVISIONS\nTwo rounds of minor revisions included. Additional revisions at INR 2,000/hour.\n\n6. INTELLECTUAL PROPERTY\nAll IP transfers to the Client only upon 100% full and final payment.\n\n7. TERMINATION\n15 days written notice required. Client must pay for all completed work.\n\n8. LIABILITY\nCapped at total contract value. No indirect damages.\n\n9. GOVERNING LAW\nGoverned by the Indian Contract Act, 1872.",
            "invoice_text": "TAX INVOICE\n\nInvoice #: INV-DEV-001\nDate: " + datetime.utcnow().strftime("%B %d, %Y") + "\n\nDescription: Professional Services as per MSA\nSubtotal: \u20b975,000\nIGST (18%): \u20b913,500\nGrand Total: \u20b988,500",
            "po_text": "PURCHASE ORDER\n\nPO #: PO-DEV-001\n\nDeliverables:\n- Professional services as described in the MSA\n\nDelivery Date: 14 business days from advance payment",
            "committed_terms": [
                {"type": "scope_of_work", "value": "Professional services as discussed", "confidence": 0.9, "legal_weight": "firm"},
                {"type": "total_price_inr", "value": "75,000", "confidence": 0.95, "legal_weight": "firm"},
                {"type": "payment_schedule", "value": "50% advance, 50% on completion", "confidence": 0.8, "legal_weight": "tentative"},
                {"type": "timeline", "value": "14 business days", "confidence": 0.85, "legal_weight": "firm"},
                {"type": "revisions", "value": "2 rounds included", "confidence": 0.7, "legal_weight": "tentative"},
                {"type": "ip_ownership", "value": "Transfers on full payment", "confidence": 0.7, "legal_weight": "tentative"},
            ],
            "client_email": "",
            "client_whatsapp": "",
            "crypto_stamp": "sha256:dev_mock_stamp_0000",
            "deal_audit": {
                "drawbacks": ["No specific drawbacks identified in dev mode"],
                "pain_points": ["Client needs quick delivery"],
                "follow_up_strategy": ["Emphasize quality", "Offer timeline guarantee", "Highlight IP protection"],
                "overall_sentiment": "Positive"
            },
        }

    try:
        # 1. Fetch the deal
        deal_res = supabase_admin.table("deals").select("*").eq("session_id", session_id).eq("user_id", user_id).execute()
        if not deal_res.data:
            raise HTTPException(status_code=404, detail="Deal not found or unauthorized.")

        deal = deal_res.data[0]
        deal_id = deal["id"]

        # 2. Parse friction_summary for pipeline data
        friction_raw = deal.get("friction_summary", "{}")
        try:
            friction = json.loads(friction_raw) if isinstance(friction_raw, str) else (friction_raw or {})
        except (json.JSONDecodeError, TypeError):
            friction = {}

        blueprint = friction.get("blueprint", {})
        invoice_data = friction.get("invoice_data", {})
        po_data = friction.get("po_data", {})
        deal_audit = friction.get("deal_audit", {})

        # 3. Fetch and decrypt the MSA document
        msa_text = ""
        crypto_stamp = "UNVERIFIED"
        try:
            doc_res = supabase_admin.table("documents").select("*").eq("deal_id", deal_id).eq("doc_type", "msa").execute()
            if doc_res.data:
                doc = doc_res.data[0]
                crypto_stamp = doc.get("crypto_stamp", "UNVERIFIED")
                encrypted = doc.get("encrypted_content", "")
                if encrypted:
                    msa_text = security_service.decrypt(encrypted)
        except Exception as dec_err:
            logger.warning(f"Failed to decrypt MSA for deal {deal_id}: {dec_err}")
            msa_text = "Document decryption failed. Please regenerate."

        # 4. Build invoice text from structured data
        inv_items = invoice_data.get("items", [])
        inv_lines = ["TAX INVOICE", ""]
        inv_lines.append(f"Invoice #: INV-{session_id[:8].upper()}")
        inv_lines.append(f"Date: {datetime.utcnow().strftime('%B %d, %Y')}")
        inv_lines.append(f"To: {deal.get('client_name', 'Client')}")
        inv_lines.append("")
        for item in inv_items:
            inv_lines.append(f"Description: {item.get('description', 'Professional Services')}")
            inv_lines.append(f"Amount: \u20b9{item.get('amount', 0):,.2f}")
        inv_lines.append("")
        inv_lines.append(f"Subtotal: \u20b9{invoice_data.get('subtotal', 0):,.2f}")
        inv_lines.append(f"IGST (18%): \u20b9{invoice_data.get('tax_igst_18', 0):,.2f}")
        inv_lines.append(f"Grand Total: \u20b9{invoice_data.get('grand_total', 0):,.2f}")
        invoice_text = "\n".join(inv_lines)

        # 5. Build PO text from structured data
        po_deliverables = po_data.get("deliverables", [])
        po_lines = ["PURCHASE ORDER", ""]
        po_lines.append(f"PO #: PO-{session_id[:8].upper()}")
        po_lines.append(f"From: {deal.get('client_name', 'Client')}")
        po_lines.append("")
        po_lines.append("Deliverables:")
        for d_item in po_deliverables:
            po_lines.append(f"  - {d_item}")
        po_lines.append("")
        po_lines.append(f"Delivery Date: {po_data.get('delivery_date', 'As specified in MSA')}")
        po_text = "\n".join(po_lines)

        # 6. Build committed_terms from blueprint
        committed_terms = []
        term_keys = [
            ("scope_of_work", "Scope of Work"),
            ("total_price_inr", "Total Consideration"),
            ("payment_schedule", "Payment Schedule"),
            ("timeline", "Timeline"),
            ("revisions", "Revision Policy"),
            ("ip_ownership", "IP Ownership"),
            ("termination", "Termination"),
            ("liability", "Liability Cap"),
        ]
        for key, label in term_keys:
            val = str(blueprint.get(key, ""))
            is_missing = val == "MISSING_DEFAULT_REQUIRED" or not val
            committed_terms.append({
                "type": key,
                "label": label,
                "value": val if not is_missing else "AI Default Applied",
                "confidence": 0.5 if is_missing else 0.9,
                "legal_weight": "tentative" if is_missing else "firm",
                "is_missing": is_missing,
            })

        # 7. Extract client contact from friction_summary
        client_email = friction.get("client_email", "")
        client_whatsapp = friction.get("client_whatsapp", "")

        return {
            "id": str(deal_id),
            "session_id": session_id,
            "client_name": deal.get("client_name", "Unknown"),
            "total_value_inr": float(deal.get("total_value_inr", 0)),
            "status": deal.get("status", "drafted"),
            "msa_text": msa_text,
            "invoice_text": invoice_text,
            "po_text": po_text,
            "committed_terms": committed_terms,
            "client_email": client_email,
            "client_whatsapp": client_whatsapp,
            "crypto_stamp": crypto_stamp,
            "deal_audit": deal_audit,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching deal detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch deal details.")


@router.post("/deals/draft", response_model=DealResponse)
async def draft_new_deal(payload: DealCreateRequest, current_user: dict = Depends(verify_token)):
    """Creates a new draft deal pre-flight."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        return DealResponse(
            id="dev-session-123",
            client_name=payload.client_name,
            total_value_inr=0.0,
            status="drafted",
            created_at=datetime.utcnow().strftime("%b %d, %Y")
        )
        
    import uuid
    session_id = str(uuid.uuid4())
    
    try:
        new_deal = {
            "user_id": user_id,
            "session_id": session_id,
            "client_name": payload.client_name,
            "total_value_inr": 0.0,
            "status": "drafted",
            "friction_summary": json.dumps({
                "client_company": payload.client_company,
                "client_address": payload.client_address,
                "client_email": payload.client_email,
                "client_whatsapp": payload.client_whatsapp,
                "documents": payload.documents.dict(),
                "use_coach": payload.use_coach
            })
        }
        res = supabase_admin.table("deals").insert(new_deal).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create deal.")
            
        d = res.data[0]
        dt = datetime.fromisoformat(d.get("created_at").replace('Z', '+00:00'))
        
        return DealResponse(
            id=d.get("session_id"),
            client_name=d.get("client_name"),
            total_value_inr=d.get("total_value_inr"),
            status=d.get("status"),
            created_at=dt.strftime("%b %d, %Y")
        )
    except Exception as e:
        logger.error(f"Error creating deal: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")
