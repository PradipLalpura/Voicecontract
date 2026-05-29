from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class DealStatus(str, enum.Enum):
    DRAFTED = "drafted"
    SENT = "sent"
    VIEWED = "viewed"
    SIGNED = "signed"
    CANCELLED = "cancelled"

class DealMetric(BaseModel):
    pillar: str
    negotiation_time_seconds: float
    volatility_score: float # How much the value changed during meeting

class Deal(BaseModel):
    id: str
    session_id: str
    client_name: str
    total_value_inr: float
    status: DealStatus = DealStatus.DRAFTED
    created_at: datetime = Field(default_factory=datetime.now)
    signed_at: Optional[datetime] = None
    
    # Analytics data
    metrics: List[DealMetric] = Field(default_factory=list)
    friction_summary: Optional[str] = None
    
    # Document storage pointers (In prod: Supabase Storage URLs)
    msa_path: Optional[str] = None
    invoice_path: Optional[str] = None
    po_path: Optional[str] = None

class DashboardStats(BaseModel):
    total_value_locked: float
    pending_revenue: float
    average_deal_size: float
    deal_count: int
    conversion_rate: float
    top_friction_pillar: Optional[str] = None
