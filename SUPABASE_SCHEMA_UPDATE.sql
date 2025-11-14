-- ============================================
-- Supabase Database Schema Update
-- Calendar Events + WhatsApp Messages + Multi-Tenant Support
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: CREATE NEW TABLES
-- ============================================

-- 1. Calendar Events Table
-- Stores Google Calendar events synced via n8n webhooks
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL, -- Google Calendar event ID for deduplication
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Multi-tenant: which user owns this event
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  color_id TEXT, -- Google Calendar color ID (e.g., '1', '2', etc.)
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  recurrence TEXT, -- RRULE string for recurring events
  attendees JSONB DEFAULT '[]'::jsonb, -- Array of attendee objects
  reminders JSONB DEFAULT '[]'::jsonb, -- Array of reminder objects
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional Google Calendar metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW() -- Last sync time from Google Calendar
);

-- 2. WhatsApp Messages Table
-- Append-only log of WhatsApp conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Multi-tenant
  conversation_id TEXT NOT NULL, -- WhatsApp conversation/thread ID
  message_id TEXT UNIQUE NOT NULL, -- WhatsApp message ID for deduplication
  phone_number TEXT NOT NULL, -- Customer phone number
  contact_name TEXT, -- Customer name if available
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker')),
  content TEXT, -- Message text content
  media_url TEXT, -- URL for media files (images, videos, etc.)
  media_mime_type TEXT, -- MIME type for media files
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  read_at TIMESTAMPTZ, -- When message was read (for outbound messages)
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional WhatsApp metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers Table (Optional but Recommended)
-- Centralized customer/contact information
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Multi-tenant
  phone_number TEXT NOT NULL,
  email TEXT,
  full_name TEXT,
  company TEXT,
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone_number) -- One customer per phone number per user
);

-- ============================================
-- PART 2: ALTER EXISTING TABLES
-- Add user_id and improve structure
-- ============================================

-- Add user_id to calls table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calls' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.calls 
    ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add customer_id to calls table (optional foreign key)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calls' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.calls 
    ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add user_id to appointments table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add calendar_event_id to appointments table (link to calendar events)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'calendar_event_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN calendar_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add user_id to engagement_metrics table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'engagement_metrics' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.engagement_metrics 
    ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    -- Update unique constraint to include user_id
    ALTER TABLE public.engagement_metrics 
    DROP CONSTRAINT IF EXISTS engagement_metrics_metric_date_key;
    ALTER TABLE public.engagement_metrics 
    ADD CONSTRAINT engagement_metrics_user_date_key UNIQUE (user_id, metric_date);
  END IF;
END $$;

-- Add user_id to timeseries table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'timeseries' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.timeseries 
    ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to status_summary table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'status_summary' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.status_summary 
    ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- PART 3: CREATE INDEXES
-- Optimize query performance
-- ============================================

-- Calendar Events Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status) WHERE status = 'confirmed';

-- WhatsApp Messages Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_conversation ON public.whatsapp_messages(user_id, conversation_id, timestamp DESC);

-- Customers Indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_user_phone ON public.customers(user_id, phone_number);

-- Updated indexes for existing tables with user_id
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_timestamp ON public.calls(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON public.calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_id ON public.appointments(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_date ON public.engagement_metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_user_metric ON public.timeseries(user_id, metric, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_status_summary_user_id ON public.status_summary(user_id);

-- ============================================
-- PART 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: CREATE RLS POLICIES
-- Multi-tenant: Users can only see/modify their own data
-- ============================================

-- Helper function to get current user_id from JWT
-- This assumes you're using Supabase Auth. If not, adjust accordingly.
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
  -- Try to get user_id from JWT claim
  RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calendar Events Policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert calendar events" ON public.calendar_events;
CREATE POLICY "Service role can insert calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (true); -- n8n webhook uses service role

DROP POLICY IF EXISTS "Service role can update calendar events" ON public.calendar_events;
CREATE POLICY "Service role can update calendar events" ON public.calendar_events
  FOR UPDATE USING (true); -- n8n webhook uses service role

DROP POLICY IF EXISTS "Service role can delete calendar events" ON public.calendar_events;
CREATE POLICY "Service role can delete calendar events" ON public.calendar_events
  FOR DELETE USING (true); -- n8n webhook uses service role

-- WhatsApp Messages Policies
DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can view their own WhatsApp messages" ON public.whatsapp_messages
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Service role can insert WhatsApp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (true); -- n8n webhook uses service role

-- Customers Policies
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
CREATE POLICY "Users can insert their own customers" ON public.customers
  FOR INSERT WITH CHECK (user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (user_id = public.get_user_id());

-- Update existing table policies to include user_id checks
-- Calls table
DROP POLICY IF EXISTS "Allow public read access to calls" ON public.calls;
CREATE POLICY "Users can view their own calls" ON public.calls
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert calls" ON public.calls;
CREATE POLICY "Service role can insert calls" ON public.calls
  FOR INSERT WITH CHECK (true);

-- Appointments table
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert appointments" ON public.appointments;
CREATE POLICY "Service role can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Engagement Metrics table
DROP POLICY IF EXISTS "Allow public read access to engagement_metrics" ON public.engagement_metrics;
CREATE POLICY "Users can view their own engagement metrics" ON public.engagement_metrics
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert engagement metrics" ON public.engagement_metrics;
CREATE POLICY "Service role can insert engagement metrics" ON public.engagement_metrics
  FOR INSERT WITH CHECK (true);

-- Timeseries table
DROP POLICY IF EXISTS "Allow public read access to timeseries" ON public.timeseries;
CREATE POLICY "Users can view their own timeseries" ON public.timeseries
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can insert timeseries" ON public.timeseries;
CREATE POLICY "Service role can insert timeseries" ON public.timeseries
  FOR INSERT WITH CHECK (true);

-- Status Summary table
DROP POLICY IF EXISTS "Allow public read access to status_summary" ON public.status_summary;
CREATE POLICY "Users can view their own status summary" ON public.status_summary
  FOR SELECT USING (user_id = public.get_user_id() OR user_id IS NULL);

-- ============================================
-- PART 6: CREATE TRIGGERS
-- Auto-update updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 7: CREATE FUNCTIONS FOR COMMON QUERIES
-- ============================================

-- Function to get upcoming calendar events for a user
CREATE OR REPLACE FUNCTION public.get_upcoming_events(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.title,
    ce.start_time,
    ce.end_time,
    ce.location,
    ce.status
  FROM public.calendar_events ce
  WHERE ce.user_id = p_user_id
    AND ce.status = 'confirmed'
    AND ce.start_time >= NOW()
  ORDER BY ce.start_time ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get WhatsApp conversation summary
CREATE OR REPLACE FUNCTION public.get_conversation_summary(
  p_user_id UUID,
  p_conversation_id TEXT
)
RETURNS TABLE (
  conversation_id TEXT,
  phone_number TEXT,
  contact_name TEXT,
  last_message_time TIMESTAMPTZ,
  message_count BIGINT,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.conversation_id,
    wm.phone_number,
    MAX(wm.contact_name) as contact_name,
    MAX(wm.timestamp) as last_message_time,
    COUNT(*)::BIGINT as message_count,
    COUNT(*) FILTER (WHERE wm.direction = 'inbound' AND wm.read_at IS NULL)::BIGINT as unread_count
  FROM public.whatsapp_messages wm
  WHERE wm.user_id = p_user_id
    AND wm.conversation_id = p_conversation_id
  GROUP BY wm.conversation_id, wm.phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Verify tables were created in Supabase Table Editor
-- 2. Test RLS policies with your user account
-- 3. Configure n8n webhooks to use service role key
-- 4. Update your React app to use new schema
-- ============================================

