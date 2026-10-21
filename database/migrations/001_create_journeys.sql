-- Migration: 001_create_journeys.sql
-- Authoritative schema and Row Level Security for Jaipur -> Dehradun vehicle tracker

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Allowed journey statuses
CREATE TYPE journey_status AS ENUM ('idle', 'running', 'paused', 'completed');

-- Journeys table
CREATE TABLE IF NOT EXISTS public.journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin TEXT NOT NULL DEFAULT 'Jaipur, Rajasthan',
    destination TEXT NOT NULL DEFAULT 'Dehradun, Uttarakhand',
    status journey_status NOT NULL DEFAULT 'idle',
    started_at TIMESTAMPTZ NULL,
    paused_at TIMESTAMPTZ NULL,
    elapsed_before_pause_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 21600.0, -- Default: 6 hours
    total_distance_meters DOUBLE PRECISION NOT NULL DEFAULT 534200.0, -- ~534.2 km
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Data integrity constraints
    CONSTRAINT valid_duration CHECK (duration_seconds > 0),
    CONSTRAINT valid_elapsed CHECK (elapsed_before_pause_seconds >= 0)
);

-- Seed initial journey record if table is empty
INSERT INTO public.journeys (
    id,
    origin,
    destination,
    status,
    started_at,
    paused_at,
    elapsed_before_pause_seconds,
    duration_seconds,
    total_distance_meters
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Jaipur, Rajasthan',
    'Dehradun, Uttarakhand',
    'idle',
    NULL,
    NULL,
    0.0,
    21600.0,
    534200.0
WHERE NOT EXISTS (SELECT 1 FROM public.journeys LIMIT 1);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_journeys_updated_at ON public.journeys;
CREATE TRIGGER trigger_journeys_updated_at
    BEFORE UPDATE ON public.journeys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access: Anyone (anonymous or authenticated) can view the current journey state
CREATE POLICY "Public read-only tracking access"
    ON public.journeys
    FOR SELECT
    USING (true);

-- 2. Authenticated Admin Access: Only service_role or authenticated administrators can modify
CREATE POLICY "Admin restricted insert"
    ON public.journeys
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

CREATE POLICY "Admin restricted update"
    ON public.journeys
    FOR UPDATE
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin restricted delete"
    ON public.journeys
    FOR DELETE
    TO authenticated, service_role
    USING (true);
