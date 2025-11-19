-- ============================================
-- COMPLETE DATABASE SCHEMA FOR N8N AUTOMATION & AI AGENT
-- Run this entire script in Supabase SQL Editor
-- This creates the complete schema with all tables, columns, indexes, triggers, and functions
-- ============================================

-- ============================================
-- PART 1: CREATE CORE TABLES
-- ============================================

-- 1.1 Users Table (must exist first for foreign keys)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  full_name TEXT,
  company TEXT,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 1.3 Calls Table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  direction TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL,
  notes TEXT,
  agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL CHECK (call_type = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  CONSTRAINT calls_pkey PRIMARY KEY (id),
  CONSTRAINT calls_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id),
  CONSTRAINT calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT calls_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- 1.4 Therapists Table
CREATE TABLE IF NOT EXISTS public.therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif')),
  working_days TEXT[], -- Array of days: ['Monday', 'Tuesday', 'Wednesday', etc.]
  working_hours_start TIME, -- e.g., '09:00:00'
  working_hours_end TIME, -- e.g., '18:00:00'
  break_start TIME, -- Optional break time start
  break_end TIME, -- Optional break time end
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC'::text,
  color_id TEXT,
  status TEXT DEFAULT 'confirmed'::text CHECK (status = ANY (ARRAY['confirmed'::text, 'tentative'::text, 'cancelled'::text])),
  recurrence TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  reminders JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  appointment_id UUID,
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 1.6 Appointments Table (depends on calls and calendar_events)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  scheduled_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Confirmed'::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- AI Agent direct columns
  appointment_datetime TIMESTAMPTZ,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service_type TEXT,
  therapist_name TEXT,
  notes TEXT,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT appointments_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id),
  CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT appointments_calendar_event_id_fkey FOREIGN KEY (calendar_event_id) REFERENCES public.calendar_events(id),
  CONSTRAINT appointments_status_check CHECK (status IN ('Confirmed', 'Cancelled'))
);

-- Add foreign key constraint for calendar_events.appointment_id (must be after appointments table exists)
ALTER TABLE public.calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_appointment_id_fkey;

ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_appointment_id_fkey 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- 1.7 WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  direction TEXT NOT NULL CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  message_type TEXT DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'audio'::text, 'document'::text, 'location'::text, 'contact'::text, 'sticker'::text])),
  content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text, 'failed'::text])),
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 1.8 Engagement Metrics Table
CREATE TABLE IF NOT EXISTS public.engagement_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  appointments_via_agent INTEGER DEFAULT 0,
  whatsapp_conversations INTEGER DEFAULT 0,
  whatsapp_appointments INTEGER DEFAULT 0,
  notes_count_today INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT engagement_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT engagement_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 1.9 Status Summary Table
CREATE TABLE IF NOT EXISTS public.status_summary (
  id SERIAL PRIMARY KEY,
  period TEXT NOT NULL,
  answered INTEGER DEFAULT 0,
  missed INTEGER DEFAULT 0,
  other INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT status_summary_pkey PRIMARY KEY (id),
  CONSTRAINT status_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 1.10 Timeseries Table
CREATE TABLE IF NOT EXISTS public.timeseries (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT timeseries_pkey PRIMARY KEY (id),
  CONSTRAINT timeseries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================
-- PART 2: ADD COMPUTED COLUMNS TO THERAPISTS
-- ============================================

-- Add 'name' column (computed from first_name + last_name, same as full_name)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'therapists' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.therapists ADD COLUMN name TEXT 
      GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
  END IF;
END $$;

-- Add 'working_hours' column (regular column, updated via trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'therapists' 
    AND column_name = 'working_hours'
  ) THEN
    ALTER TABLE public.therapists ADD COLUMN working_hours TEXT;
  END IF;
END $$;

-- Add 'break_times' column (regular column, updated via trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'therapists' 
    AND column_name = 'break_times'
  ) THEN
    ALTER TABLE public.therapists ADD COLUMN break_times TEXT;
  END IF;
END $$;

-- ============================================
-- PART 3: ENSURE APPOINTMENTS DIRECT COLUMNS EXIST
-- ============================================

-- Add direct columns to appointments table if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add client_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'client_name'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN client_name TEXT;
  END IF;

  -- Add client_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'client_email'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN client_email TEXT;
  END IF;

  -- Add client_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN client_phone TEXT;
  END IF;

  -- Add service_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'service_type'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN service_type TEXT;
  END IF;

  -- Add therapist_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'therapist_name'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN therapist_name TEXT;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN notes TEXT;
  END IF;

  -- Add appointment_datetime column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'appointment_datetime'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN appointment_datetime TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- PART 4: MIGRATE EXISTING DATA
-- ============================================

-- Update existing appointments status to 'Confirmed' or 'Cancelled'
UPDATE public.appointments 
SET status = 'Confirmed' 
WHERE status NOT IN ('Confirmed', 'Cancelled') OR status IS NULL;

-- Migrate data from metadata JSONB to direct columns (if metadata exists)
UPDATE public.appointments
SET 
  client_name = COALESCE(
    client_name,
    metadata->>'client_name',
    metadata->>'name'
  ),
  client_email = COALESCE(
    client_email,
    metadata->>'client_email',
    metadata->>'email'
  ),
  client_phone = COALESCE(
    client_phone,
    metadata->>'client_phone',
    metadata->>'phone'
  ),
  service_type = COALESCE(
    service_type,
    metadata->>'service_type'
  ),
  therapist_name = COALESCE(
    therapist_name,
    metadata->>'therapist_name'
  ),
  notes = COALESCE(
    notes,
    metadata->>'notes'
  ),
  appointment_datetime = COALESCE(
    appointment_datetime,
    scheduled_at
  )
WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;

-- Initialize therapists computed columns for existing records
UPDATE public.therapists
SET 
  working_hours = CASE 
    WHEN working_hours_start IS NOT NULL AND working_hours_end IS NOT NULL 
    THEN TO_CHAR(working_hours_start, 'HH24:MI') || '-' || TO_CHAR(working_hours_end, 'HH24:MI')
    ELSE NULL
  END,
  break_times = CASE 
    WHEN break_start IS NOT NULL AND break_end IS NOT NULL 
    THEN TO_CHAR(break_start, 'HH24:MI') || '-' || TO_CHAR(break_end, 'HH24:MI')
    ELSE NULL
  END;

-- ============================================
-- PART 5: CREATE INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON public.customers(phone_number);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON public.calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON public.calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON public.calls(timestamp DESC);

-- Therapists indexes
CREATE INDEX IF NOT EXISTS idx_therapists_status ON public.therapists(status);
CREATE INDEX IF NOT EXISTS idx_therapists_first_name ON public.therapists(first_name);
CREATE INDEX IF NOT EXISTS idx_therapists_full_name ON public.therapists(full_name);
CREATE INDEX IF NOT EXISTS idx_therapists_name ON public.therapists(name);

-- Calendar Events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_appointment_id ON public.calendar_events(appointment_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_id ON public.appointments(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_call_id ON public.appointments(call_id);
CREATE INDEX IF NOT EXISTS idx_appointments_metadata ON public.appointments USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_appointments_client_email ON public.appointments(client_email);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON public.appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_name ON public.appointments(therapist_name);
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON public.appointments(service_type);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_datetime ON public.appointments(appointment_datetime);

-- WhatsApp Messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);

-- Engagement Metrics indexes
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_id ON public.engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_metric_date ON public.engagement_metrics(metric_date DESC);

-- Timeseries indexes
CREATE INDEX IF NOT EXISTS idx_timeseries_user_id ON public.timeseries(user_id);
CREATE INDEX IF NOT EXISTS idx_timeseries_metric ON public.timeseries(metric);
CREATE INDEX IF NOT EXISTS idx_timeseries_timestamp ON public.timeseries(timestamp DESC);

-- Status Summary indexes
CREATE INDEX IF NOT EXISTS idx_status_summary_user_id ON public.status_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_status_summary_period ON public.status_summary(period);

-- ============================================
-- PART 6: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to format working days as string
CREATE OR REPLACE FUNCTION format_working_days(days TEXT[])
RETURNS TEXT AS $$
BEGIN
  IF days IS NULL OR array_length(days, 1) IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- If it's a range like Monday-Friday
  IF array_length(days, 1) = 5 AND 
     days[1] = 'Monday' AND days[5] = 'Friday' THEN
    RETURN 'Monday-Friday';
  END IF;
  
  -- Otherwise return comma-separated
  RETURN array_to_string(days, ', ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update therapists computed columns (working_hours, break_times)
CREATE OR REPLACE FUNCTION update_therapists_computed_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Update working_hours
    IF NEW.working_hours_start IS NOT NULL AND NEW.working_hours_end IS NOT NULL THEN
        NEW.working_hours := TO_CHAR(NEW.working_hours_start, 'HH24:MI') || '-' || TO_CHAR(NEW.working_hours_end, 'HH24:MI');
    ELSE
        NEW.working_hours := NULL;
    END IF;
    
    -- Update break_times
    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
        NEW.break_times := TO_CHAR(NEW.break_start, 'HH24:MI') || '-' || TO_CHAR(NEW.break_end, 'HH24:MI');
    ELSE
        NEW.break_times := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate therapist availability
CREATE OR REPLACE FUNCTION validate_therapist_availability(
  p_therapist_name TEXT,
  p_appointment_datetime TIMESTAMPTZ
)
RETURNS TABLE (
  is_available BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_therapist RECORD;
  v_appointment_day TEXT;
  v_appointment_time TIME;
  v_is_working_day BOOLEAN := false;
BEGIN
  -- Get therapist info
  SELECT * INTO v_therapist
  FROM public.therapists
  WHERE name = p_therapist_name OR 
        full_name = p_therapist_name OR
        (first_name || ' ' || last_name) = p_therapist_name
  LIMIT 1;

  -- Check if therapist exists
  IF v_therapist IS NULL THEN
    RETURN QUERY SELECT false, 'Therapist not found'::TEXT;
    RETURN;
  END IF;

  -- Check if therapist is active
  IF v_therapist.status != 'Aktif' THEN
    RETURN QUERY SELECT false, 'Therapist is not active (status: ' || v_therapist.status || ')'::TEXT;
    RETURN;
  END IF;

  -- Get appointment day name
  v_appointment_day := TO_CHAR(p_appointment_datetime, 'Day');
  v_appointment_time := p_appointment_datetime::TIME;

  -- Check if therapist works on this day
  IF v_therapist.working_days IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM unnest(v_therapist.working_days) AS day
      WHERE TRIM(day) = TRIM(v_appointment_day)
    ) INTO v_is_working_day;
  END IF;

  IF NOT v_is_working_day THEN
    RETURN QUERY SELECT false, 'Therapist does not work on ' || TRIM(v_appointment_day)::TEXT;
    RETURN;
  END IF;

  -- Check if appointment time is within working hours
  IF v_therapist.working_hours_start IS NOT NULL AND 
     v_therapist.working_hours_end IS NOT NULL THEN
    IF v_appointment_time < v_therapist.working_hours_start OR 
       v_appointment_time >= v_therapist.working_hours_end THEN
      RETURN QUERY SELECT false, 
        'Appointment time is outside working hours (' || 
        TO_CHAR(v_therapist.working_hours_start, 'HH24:MI') || '-' ||
        TO_CHAR(v_therapist.working_hours_end, 'HH24:MI') || ')'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check if appointment conflicts with break time
  IF v_therapist.break_start IS NOT NULL AND v_therapist.break_end IS NOT NULL THEN
    IF v_appointment_time >= v_therapist.break_start AND 
       v_appointment_time < v_therapist.break_end THEN
      RETURN QUERY SELECT false, 
        'Appointment time conflicts with break time (' ||
        TO_CHAR(v_therapist.break_start, 'HH24:MI') || '-' ||
        TO_CHAR(v_therapist.break_end, 'HH24:MI') || ')'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'Available'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to sync appointment columns
CREATE OR REPLACE FUNCTION sync_appointment_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync appointment_datetime to scheduled_at (bidirectional)
  IF NEW.appointment_datetime IS NOT NULL AND NEW.scheduled_at IS NULL THEN
    NEW.scheduled_at := NEW.appointment_datetime;
  ELSIF NEW.scheduled_at IS NOT NULL AND NEW.appointment_datetime IS NULL THEN
    NEW.appointment_datetime := NEW.scheduled_at;
  ELSIF NEW.scheduled_at IS NOT NULL AND NEW.appointment_datetime IS NOT NULL THEN
    -- Keep them in sync - use scheduled_at as source of truth
    NEW.appointment_datetime := NEW.scheduled_at;
  END IF;

  -- Sync direct columns to metadata JSONB
  IF NEW.client_name IS NOT NULL OR NEW.client_email IS NOT NULL OR 
     NEW.client_phone IS NOT NULL OR NEW.service_type IS NOT NULL OR 
     NEW.therapist_name IS NOT NULL OR NEW.notes IS NOT NULL THEN
    
    NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
      'client_name', COALESCE(NEW.client_name, NEW.metadata->>'client_name'),
      'client_email', COALESCE(NEW.client_email, NEW.metadata->>'client_email'),
      'client_phone', COALESCE(NEW.client_phone, NEW.metadata->>'client_phone'),
      'service_type', COALESCE(NEW.service_type, NEW.metadata->>'service_type'),
      'therapist_name', COALESCE(NEW.therapist_name, NEW.metadata->>'therapist_name'),
      'notes', COALESCE(NEW.notes, NEW.metadata->>'notes')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync appointment to calendar event
CREATE OR REPLACE FUNCTION sync_appointment_to_calendar_event()
RETURNS TRIGGER AS $$
DECLARE
  v_calendar_event_id UUID;
  v_end_time TIMESTAMPTZ;
  v_title TEXT;
  v_description TEXT;
  v_client_name TEXT;
  v_client_email TEXT;
  v_client_phone TEXT;
  v_service_type TEXT;
  v_therapist_name TEXT;
  v_notes TEXT;
BEGIN
  -- Skip if scheduled_at is NULL
  IF NEW.scheduled_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extract client info from direct columns or metadata JSONB
  v_client_name := COALESCE(NEW.client_name, NEW.metadata->>'client_name', NEW.metadata->>'name', '');
  v_client_email := COALESCE(NEW.client_email, NEW.metadata->>'client_email', NEW.metadata->>'email', '');
  v_client_phone := COALESCE(NEW.client_phone, NEW.metadata->>'client_phone', NEW.metadata->>'phone', '');
  v_service_type := COALESCE(NEW.service_type, NEW.metadata->>'service_type', '');
  v_therapist_name := COALESCE(NEW.therapist_name, NEW.metadata->>'therapist_name', '');
  v_notes := COALESCE(NEW.notes, NEW.metadata->>'notes', '');
  
  -- Calculate end time (default 60 minutes duration)
  v_end_time := NEW.scheduled_at + INTERVAL '60 minutes';
  
  -- Build title: Therapist - Client Name - Service Type
  v_title := COALESCE(
    CASE 
      WHEN v_therapist_name != '' THEN v_therapist_name || ' - ' || v_client_name || ' - ' || v_service_type
      WHEN v_client_name != '' THEN v_client_name || ' - ' || v_service_type
      ELSE 'Appointment - ' || v_service_type
    END,
    'Appointment'
  );
  
  -- Build description with all appointment details
  v_description := '';
  IF v_service_type != '' THEN
    v_description := v_description || 'Service: ' || v_service_type;
  END IF;
  IF v_client_name != '' THEN
    v_description := v_description || CASE WHEN v_description != '' THEN ', ' ELSE '' END || 'Client: ' || v_client_name;
  END IF;
  IF v_client_phone != '' THEN
    v_description := v_description || CASE WHEN v_description != '' THEN ', ' ELSE '' END || 'Phone: ' || v_client_phone;
  END IF;
  IF v_client_email != '' THEN
    v_description := v_description || CASE WHEN v_description != '' THEN ', ' ELSE '' END || 'Email: ' || v_client_email;
  END IF;
  IF v_notes != '' THEN
    v_description := v_description || CASE WHEN v_description != '' THEN ', ' ELSE '' END || 'Notes: ' || v_notes;
  END IF;
  
  -- Check if calendar event already exists via calendar_event_id
  IF NEW.calendar_event_id IS NOT NULL THEN
    -- Update existing calendar event
    UPDATE public.calendar_events
    SET
      title = v_title,
      description = v_description,
      start_time = NEW.scheduled_at,
      end_time = v_end_time,
      status = CASE 
        WHEN NEW.status = 'Cancelled' THEN 'cancelled'
        ELSE 'confirmed'
      END,
      metadata = jsonb_build_object(
        'appointment_id', NEW.id,
        'client_name', v_client_name,
        'client_email', v_client_email,
        'client_phone', v_client_phone,
        'service_type', v_service_type,
        'therapist_name', v_therapist_name,
        'notes', v_notes,
        'source', NEW.source
      ),
      updated_at = NOW()
    WHERE id = NEW.calendar_event_id;
    
    v_calendar_event_id := NEW.calendar_event_id;
  ELSE
    -- Create new calendar event
    INSERT INTO public.calendar_events (
      appointment_id,
      google_event_id,
      user_id,
      title,
      description,
      start_time,
      end_time,
      all_day,
      timezone,
      status,
      metadata
    )
    VALUES (
      NEW.id,
      'appointment_' || NEW.id::text,
      NEW.user_id,
      v_title,
      v_description,
      NEW.scheduled_at,
      v_end_time,
      false,
      'UTC',
      CASE 
        WHEN NEW.status = 'Cancelled' THEN 'cancelled'
        ELSE 'confirmed'
      END,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'client_name', v_client_name,
        'client_email', v_client_email,
        'client_phone', v_client_phone,
        'service_type', v_service_type,
        'therapist_name', v_therapist_name,
        'notes', v_notes,
        'source', NEW.source
      )
    )
    RETURNING id INTO v_calendar_event_id;
    
    -- Update appointment with calendar event ID
    UPDATE public.appointments
    SET calendar_event_id = v_calendar_event_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle appointment cancellation
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- If appointment is cancelled, update calendar event status
  IF NEW.status = 'Cancelled' AND (OLD.status IS NULL OR OLD.status != 'Cancelled') THEN
    UPDATE public.calendar_events
    SET
      status = 'cancelled',
      updated_at = NOW()
    WHERE appointment_id = NEW.id OR id = NEW.calendar_event_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AI Agent Helper Functions
CREATE OR REPLACE FUNCTION get_active_therapists()
RETURNS TABLE (
  id UUID,
  name TEXT,
  status TEXT,
  working_days TEXT,
  working_hours TEXT,
  break_times TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.status,
    format_working_days(t.working_days) AS working_days,
    t.working_hours,
    t.break_times
  FROM public.therapists t
  WHERE t.status = 'Aktif'
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_client_bookings(p_client_email TEXT)
RETURNS TABLE (
  id UUID,
  appointment_datetime TIMESTAMPTZ,
  status TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service_type TEXT,
  therapist_name TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.appointment_datetime, a.scheduled_at) AS appointment_datetime,
    a.status,
    a.client_name,
    a.client_email,
    a.client_phone,
    a.service_type,
    a.therapist_name,
    a.notes
  FROM public.appointments a
  WHERE a.client_email = p_client_email
  ORDER BY a.scheduled_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION create_appointment(
  p_appointment_datetime TIMESTAMPTZ,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_service_type TEXT,
  p_therapist_name TEXT,
  p_notes TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'ai_agent'
)
RETURNS TABLE (
  success BOOLEAN,
  appointment_id UUID,
  message TEXT
) AS $$
DECLARE
  v_validation RECORD;
  v_appointment_id UUID;
BEGIN
  -- Validate therapist availability
  SELECT * INTO v_validation
  FROM validate_therapist_availability(p_therapist_name, p_appointment_datetime);

  IF NOT v_validation.is_available THEN
    RETURN QUERY SELECT false, NULL::UUID, v_validation.reason;
    RETURN;
  END IF;

  -- Create appointment
  INSERT INTO public.appointments (
    scheduled_at,
    appointment_datetime,
    status,
    client_name,
    client_email,
    client_phone,
    service_type,
    therapist_name,
    notes,
    source
  ) VALUES (
    p_appointment_datetime,
    p_appointment_datetime,
    'Confirmed',
    p_client_name,
    p_client_email,
    p_client_phone,
    p_service_type,
    p_therapist_name,
    p_notes,
    p_source
  )
  RETURNING id INTO v_appointment_id;

  RETURN QUERY SELECT true, v_appointment_id, 'Appointment created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_appointment(
  p_appointment_id UUID,
  p_appointment_datetime TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_therapist_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_validation RECORD;
  v_existing RECORD;
BEGIN
  -- Get existing appointment
  SELECT * INTO v_existing
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_existing IS NULL THEN
    RETURN QUERY SELECT false, 'Appointment not found'::TEXT;
    RETURN;
  END IF;

  -- If therapist or time is being changed, validate
  IF (p_therapist_name IS NOT NULL AND p_therapist_name != v_existing.therapist_name) OR
     (p_appointment_datetime IS NOT NULL AND p_appointment_datetime != COALESCE(v_existing.appointment_datetime, v_existing.scheduled_at)) THEN
    
    SELECT * INTO v_validation
    FROM validate_therapist_availability(
      COALESCE(p_therapist_name, v_existing.therapist_name),
      COALESCE(p_appointment_datetime, COALESCE(v_existing.appointment_datetime, v_existing.scheduled_at))
    );

    IF NOT v_validation.is_available THEN
      RETURN QUERY SELECT false, v_validation.reason;
      RETURN;
    END IF;
  END IF;

  -- Update appointment
  UPDATE public.appointments
  SET
    scheduled_at = COALESCE(p_appointment_datetime, scheduled_at),
    appointment_datetime = COALESCE(p_appointment_datetime, appointment_datetime, scheduled_at),
    status = COALESCE(p_status, status),
    client_name = COALESCE(p_client_name, client_name),
    client_email = COALESCE(p_client_email, client_email),
    client_phone = COALESCE(p_client_phone, client_phone),
    service_type = COALESCE(p_service_type, service_type),
    therapist_name = COALESCE(p_therapist_name, therapist_name),
    notes = COALESCE(p_notes, notes)
  WHERE id = p_appointment_id;

  RETURN QUERY SELECT true, 'Appointment updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_existing RECORD;
BEGIN
  SELECT * INTO v_existing
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_existing IS NULL THEN
    RETURN QUERY SELECT false, 'Appointment not found'::TEXT;
    RETURN;
  END IF;

  IF v_existing.status = 'Cancelled' THEN
    RETURN QUERY SELECT false, 'Appointment is already cancelled'::TEXT;
    RETURN;
  END IF;

  UPDATE public.appointments
  SET status = 'Cancelled'
  WHERE id = p_appointment_id;

  RETURN QUERY SELECT true, 'Appointment cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_appointment(p_appointment_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_existing RECORD;
BEGIN
  SELECT * INTO v_existing
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_existing IS NULL THEN
    RETURN QUERY SELECT false, 'Appointment not found'::TEXT;
    RETURN;
  END IF;

  DELETE FROM public.appointments
  WHERE id = p_appointment_id;

  RETURN QUERY SELECT true, 'Appointment deleted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_appointment(p_appointment_id UUID)
RETURNS TABLE (
  id UUID,
  appointment_datetime TIMESTAMPTZ,
  status TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service_type TEXT,
  therapist_name TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.appointment_datetime, a.scheduled_at) AS appointment_datetime,
    a.status,
    a.client_name,
    a.client_email,
    a.client_phone,
    a.service_type,
    a.therapist_name,
    a.notes,
    a.source,
    a.created_at,
    a.updated_at
  FROM public.appointments a
  WHERE a.id = p_appointment_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 7: CREATE TRIGGERS
-- ============================================

-- Therapists updated_at trigger
DROP TRIGGER IF EXISTS update_therapists_updated_at ON public.therapists;
CREATE TRIGGER update_therapists_updated_at
    BEFORE UPDATE ON public.therapists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Therapists computed columns trigger (working_hours, break_times)
DROP TRIGGER IF EXISTS update_therapists_computed_columns ON public.therapists;
CREATE TRIGGER update_therapists_computed_columns
    BEFORE INSERT OR UPDATE ON public.therapists
    FOR EACH ROW
    EXECUTE FUNCTION update_therapists_computed_columns();

-- Appointments updated_at trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Calendar Events updated_at trigger
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Customers updated_at trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Appointments column sync trigger
DROP TRIGGER IF EXISTS trigger_sync_appointment_columns ON public.appointments;
CREATE TRIGGER trigger_sync_appointment_columns
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_columns();

-- Appointments to calendar sync triggers
DROP TRIGGER IF EXISTS trigger_sync_appointment_to_calendar_insert ON public.appointments;
CREATE TRIGGER trigger_sync_appointment_to_calendar_insert
    AFTER INSERT ON public.appointments
    FOR EACH ROW
    WHEN (NEW.scheduled_at IS NOT NULL)
    EXECUTE FUNCTION sync_appointment_to_calendar_event();

DROP TRIGGER IF EXISTS trigger_sync_appointment_to_calendar_update ON public.appointments;
CREATE TRIGGER trigger_sync_appointment_to_calendar_update
    AFTER UPDATE ON public.appointments
    FOR EACH ROW
    WHEN (
      OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at OR
      OLD.status IS DISTINCT FROM NEW.status OR
      OLD.metadata IS DISTINCT FROM NEW.metadata OR
      OLD.client_name IS DISTINCT FROM NEW.client_name OR
      OLD.client_email IS DISTINCT FROM NEW.client_email OR
      OLD.therapist_name IS DISTINCT FROM NEW.therapist_name OR
      OLD.calendar_event_id IS NULL
    )
    EXECUTE FUNCTION sync_appointment_to_calendar_event();

-- Appointment cancellation trigger
DROP TRIGGER IF EXISTS trigger_handle_appointment_cancellation ON public.appointments;
CREATE TRIGGER trigger_handle_appointment_cancellation
    AFTER UPDATE ON public.appointments
    FOR EACH ROW
    WHEN (NEW.status = 'Cancelled' AND (OLD.status IS NULL OR OLD.status != 'Cancelled'))
    EXECUTE FUNCTION handle_appointment_cancellation();

-- ============================================
-- PART 8: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 9: CREATE RLS POLICIES (DEMO-FRIENDLY)
-- All policies allow public access for demo purposes
-- user_id can be NULL - n8n will ignore it for demo
-- ============================================

-- Appointments policies (demo-friendly: allow all operations, user_id optional)
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
CREATE POLICY "Allow public read access to appointments" ON public.appointments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to appointments" ON public.appointments;
CREATE POLICY "Allow public insert access to appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to appointments" ON public.appointments;
CREATE POLICY "Allow public update access to appointments" ON public.appointments
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to appointments" ON public.appointments;
CREATE POLICY "Allow public delete access to appointments" ON public.appointments
FOR DELETE USING (true);

-- Calendar Events policies
DROP POLICY IF EXISTS "Allow public read access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public read access to calendar_events" ON public.calendar_events
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public insert access to calendar_events" ON public.calendar_events
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public update access to calendar_events" ON public.calendar_events
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to calendar_events" ON public.calendar_events;
CREATE POLICY "Allow public delete access to calendar_events" ON public.calendar_events
FOR DELETE USING (true);

-- Calls policies
DROP POLICY IF EXISTS "Allow public read access to calls" ON public.calls;
CREATE POLICY "Allow public read access to calls" ON public.calls
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to calls" ON public.calls;
CREATE POLICY "Allow public insert access to calls" ON public.calls
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to calls" ON public.calls;
CREATE POLICY "Allow public update access to calls" ON public.calls
FOR UPDATE USING (true);

-- Customers policies
DROP POLICY IF EXISTS "Allow public read access to customers" ON public.customers;
CREATE POLICY "Allow public read access to customers" ON public.customers
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to customers" ON public.customers;
CREATE POLICY "Allow public insert access to customers" ON public.customers
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to customers" ON public.customers;
CREATE POLICY "Allow public update access to customers" ON public.customers
FOR UPDATE USING (true);

-- WhatsApp Messages policies
DROP POLICY IF EXISTS "Allow public read access to whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Allow public read access to whatsapp_messages" ON public.whatsapp_messages
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Allow public insert access to whatsapp_messages" ON public.whatsapp_messages
FOR INSERT WITH CHECK (true);

-- Engagement Metrics policies
DROP POLICY IF EXISTS "Allow public read access to engagement_metrics" ON public.engagement_metrics;
CREATE POLICY "Allow public read access to engagement_metrics" ON public.engagement_metrics
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to engagement_metrics" ON public.engagement_metrics;
CREATE POLICY "Allow public insert access to engagement_metrics" ON public.engagement_metrics
FOR INSERT WITH CHECK (true);

-- Timeseries policies
DROP POLICY IF EXISTS "Allow public read access to timeseries" ON public.timeseries;
CREATE POLICY "Allow public read access to timeseries" ON public.timeseries
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to timeseries" ON public.timeseries;
CREATE POLICY "Allow public insert access to timeseries" ON public.timeseries
FOR INSERT WITH CHECK (true);

-- Status Summary policies
DROP POLICY IF EXISTS "Allow public read access to status_summary" ON public.status_summary;
CREATE POLICY "Allow public read access to status_summary" ON public.status_summary
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to status_summary" ON public.status_summary;
CREATE POLICY "Allow public insert access to status_summary" ON public.status_summary
FOR INSERT WITH CHECK (true);

-- Therapists policies
DROP POLICY IF EXISTS "Allow public read access to therapists" ON public.therapists;
CREATE POLICY "Allow public read access to therapists" ON public.therapists
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to therapists" ON public.therapists;
CREATE POLICY "Allow public insert access to therapists" ON public.therapists
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to therapists" ON public.therapists;
CREATE POLICY "Allow public update access to therapists" ON public.therapists
FOR UPDATE USING (true);

-- ============================================
-- PART 10: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_active_therapists() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_client_bookings(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_appointment(TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_appointment(UUID, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_appointment(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_appointment(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_therapist_availability(TEXT, TIMESTAMPTZ) TO anon, authenticated;

-- ============================================
-- COMPLETE!
-- ============================================
-- Database schema is now complete with:
-- - All tables (users, customers, calls, therapists, calendar_events, appointments, whatsapp_messages, engagement_metrics, timeseries, status_summary)
-- - All columns including AI agent direct columns
-- - All indexes for performance
-- - All triggers for auto-sync and validation
-- - All helper functions for AI agent
-- - All RLS policies for n8n automation
-- 
-- Ready for n8n workflows and AI agent operations!
-- ============================================

