-- ============================================
-- Calendar Events Table Migration
-- Use this if you already have a calendar_events table
-- and need to add missing columns
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add google_event_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'google_event_id') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN google_event_id TEXT NOT NULL DEFAULT 'manual-' || gen_random_uuid()::text;
    
    -- Remove default after adding column
    ALTER TABLE public.calendar_events 
    ALTER COLUMN google_event_id DROP DEFAULT;
  END IF;

  -- Add user_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'user_id') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Rename color to color_id if color exists but color_id doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'calendar_events' 
             AND column_name = 'color')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'calendar_events' 
                     AND column_name = 'color_id') THEN
    ALTER TABLE public.calendar_events 
    RENAME COLUMN color TO color_id;
  END IF;

  -- Add color_id if neither color nor color_id exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'color_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'calendar_events' 
                     AND column_name = 'color') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN color_id TEXT;
  END IF;

  -- Add status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'status') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled'));
  END IF;

  -- Add timezone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'timezone') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN timezone TEXT;
  END IF;

  -- Add recurrence column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'recurrence') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN recurrence TEXT;
  END IF;

  -- Add attendees column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'attendees') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add reminders column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'reminders') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN reminders JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add synced_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'calendar_events' 
                 AND column_name = 'synced_at') THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);

-- Update RLS policies to match the new schema
DROP POLICY IF EXISTS "Allow insert to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow insert to calendar_events" ON public.calendar_events
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

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

DROP POLICY IF EXISTS "Allow delete to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow delete to calendar_events" ON public.calendar_events
FOR DELETE USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- ============================================
-- Migration Complete!
-- ============================================

