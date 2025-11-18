-- ============================================
-- Calendar Events Table Setup for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT,
  color_id TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  recurrence TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  reminders JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON public.calendar_events(end_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON public.calendar_events USING GIST (tstzrange(start_time, end_time));
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);

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
-- Allow public read access (users can see all events, or filter by user_id if needed)
DROP POLICY IF EXISTS "Allow public read access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public read access to calendar_events" ON public.calendar_events
FOR SELECT USING (true);

-- Allow authenticated users to insert their own events
-- For unauthenticated users, allow insert with user_id = NULL
DROP POLICY IF EXISTS "Allow insert to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow insert to calendar_events" ON public.calendar_events
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Allow users to update their own events or events with user_id = NULL
DROP POLICY IF EXISTS "Allow update to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow update to calendar_events" ON public.calendar_events
FOR UPDATE USING (
  auth.uid() = user_id OR 
  user_id IS NULL
)
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Allow users to delete their own events or events with user_id = NULL
DROP POLICY IF EXISTS "Allow delete to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow delete to calendar_events" ON public.calendar_events
FOR DELETE USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- ============================================
-- Setup Complete!
-- ============================================
-- The calendar_events table is now ready to use.
-- You can verify it in the Table Editor in Supabase.
-- ============================================






