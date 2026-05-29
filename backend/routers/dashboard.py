from __future__ import annotations

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from backend.auth.jwt_auth import verify_token
from backend.models.deal import Deal, DealStatus, DashboardStats, DealMetric

logger = logging.getLogger("voicecontract.dashboard")
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# Simulation of a persistent store (In prod: Supabase/PostgreSQL)
MOCK_DEALS: List[Deal] = [
    Deal(
        id="deal_001",
        session_id="sess_123",
        client_name="Acme Corp",
        total_value_inr=50000.0,
        status=DealStatus.SIGNED,
        metrics=[
            DealMetric(pillar="Price", negotiation_time_seconds=120, volatility_score=0.2),
            DealMetric(pillar="IP Ownership", negotiation_time_seconds=300, volatility_score=0.1)
        ],
        friction_summary="IP Ownership was the primary friction point."
    ),
    Deal(
        id="deal_002",
        session_id="sess_456",
        client_name="Global Tech",
        total_value_inr=120000.0,
        status=DealStatus.SENT,
        metrics=[
            DealMetric(pillar="Timeline", negotiation_time_seconds=450, volatility_score=0.4)
        ]
    )
]

@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: dict = Depends(verify_token)):
    """
    Returns aggregated business intelligence metrics.
    """
    signed_deals = [d for d in MOCK_DEALS if d.status == DealStatus.SIGNED]
    pending_deals = [d for d in MOCK_DEALS if d.status != DealStatus.SIGNED]
    
    total_locked = sum(d.total_value_inr for d in signed_deals)
    pending_rev = sum(d.total_value_inr for d in pending_deals)
    
    return DashboardStats(
        total_value_locked=total_locked,
        pending_revenue=pending_rev,
        average_deal_size=total_locked / len(signed_deals) if signed_deals else 0,
        deal_count=len(MOCK_DEALS),
        conversion_rate=(len(signed_deals) / len(MOCK_DEALS)) * 100 if MOCK_DEALS else 0,
        top_friction_pillar="IP Ownership"
    )

@router.get("/deals", response_model=List[Deal])
async def list_deals(current_user: dict = Depends(verify_token)):
    """
    Returns the list of all deals for the Kanban board.
    """
    return MOCK_DEALS

@router.post("/deals/{deal_id}/status")
async def update_deal_status(deal_id: str, status: DealStatus, current_user: dict = Depends(verify_token)):
    """
    Updates a deal's position in the Kanban lifecycle.
    """
    for deal in MOCK_DEALS:
        if deal.id == deal_id:
            deal.status = status
            return {"ok": True}
    raise HTTPException(status_code=404, detail="Deal not found")
