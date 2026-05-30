-- Phase 2: Add Brand DNA columns to users table
-- These columns support the onboarding wizard's full data capture

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_accent TEXT DEFAULT '#00C2CC';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS template_strategy TEXT DEFAULT 'generate';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS existing_msa_filename TEXT DEFAULT '';
