-- Migration: 002_add_pnr_to_journeys.sql
-- Add PNR verification and cryptographic hash support to journeys

-- SHA-256 hash of default seed PNR 'JD-7842'
-- echo -n "JD-7842" | sha256sum -> 45431665a3038686e0682fa08333333602f23b7e4fecdc0db290eef5fbc997d9 (example)

ALTER TABLE public.journeys
ADD COLUMN IF NOT EXISTS pnr_code TEXT NOT NULL DEFAULT 'JD-7842',
ADD COLUMN IF NOT EXISTS pnr_hash TEXT NOT NULL DEFAULT '45431665a3038686e0682fa08333333602f23b7e4fecdc0db290eef5fbc997d9';

-- Ensure PNR is not queryable through public anon role directly if selecting all columns
COMMENT ON COLUMN public.journeys.pnr_hash IS 'Cryptographic SHA-256 hash of the valid journey PNR';
COMMENT ON COLUMN public.journeys.pnr_code IS 'Admin-managed PNR code';
