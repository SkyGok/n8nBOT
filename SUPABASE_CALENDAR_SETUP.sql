-- ============================================
-- Calendar Events Table Setup for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON public.calendar_events(end_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON public.calendar_events USING GIST (tstzrange(start_time, end_time));

-- Step 3: Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public read access to calendar_events" ON public.calendar_events
FOR SELECT USING (true);

-- Allow public insert (for creating events)
DROP POLICY IF EXISTS "Allow public insert to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public insert to calendar_events" ON public.calendar_events
FOR INSERT WITH CHECK (true);

-- Allow public update (for editing events)
DROP POLICY IF EXISTS "Allow public update to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public update to calendar_events" ON public.calendar_events
FOR UPDATE USING (true);

-- Allow public delete (for deleting events)
DROP POLICY IF EXISTS "Allow public delete to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public delete to calendar_events" ON public.calendar_events
FOR DELETE USING (true);

-- ============================================
-- Setup Complete!
-- ============================================
-- The calendar_events table is now ready to use.
-- You can verify it in the Table Editor in Supabase.
-- ============================================

