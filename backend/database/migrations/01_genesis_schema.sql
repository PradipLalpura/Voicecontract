-- VoiceContract Genesis Schema (Phase 1)
-- Implements strict Row Level Security (RLS) bound to Clerk authentication

-- 1. Users Table (Synced from Clerk via Webhooks)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Clerk User ID
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    gst_number TEXT,
    address TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    brand_dna_url TEXT,
    brand_accent TEXT DEFAULT '#2563EB',
    template_strategy TEXT DEFAULT 'generate',
    existing_msa_filename TEXT DEFAULT '',
    selected_msa_template TEXT,
    selected_po_template TEXT,
    selected_invoice_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Deals Table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    total_value_inr NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'drafted',
    friction_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    signed_at TIMESTAMPTZ
);

-- 3. Deal Metrics (For Dashboard Analytics)
CREATE TABLE IF NOT EXISTS public.deal_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    pillar TEXT NOT NULL,
    negotiation_time_seconds NUMERIC DEFAULT 0,
    volatility_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Documents (Encrypted payloads + Unforgeable Crypto-Stamps)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, -- 'msa', 'invoice', 'po'
    encrypted_content TEXT NOT NULL,
    crypto_stamp TEXT NOT NULL,
    digital_signature_hash TEXT, -- E-Sign vector hash
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Custom Function to extract Clerk User ID from JWT in Supabase
-- When the backend passes the Clerk token to Supabase, Supabase reads the 'sub' claim
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- RLS Policies

-- Users: A user can only see and update their own record
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (id = public.requesting_user_id());

-- Deals: Users can only CRUD their own deals
DROP POLICY IF EXISTS "Users can manage own deals" ON public.deals;
CREATE POLICY "Users can manage own deals" ON public.deals
    FOR ALL USING (user_id = public.requesting_user_id());

-- Deal Metrics: Inherits security from the Deals table
DROP POLICY IF EXISTS "Users can manage own deal metrics" ON public.deal_metrics;
CREATE POLICY "Users can manage own deal metrics" ON public.deal_metrics
    FOR ALL USING (
        deal_id IN (SELECT id FROM public.deals WHERE user_id = public.requesting_user_id())
    );

-- Documents: Inherits security from the Deals table
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents
    FOR ALL USING (
        deal_id IN (SELECT id FROM public.deals WHERE user_id = public.requesting_user_id())
    );
