-- ============================================
-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create all tables (if not already created)
-- Copy and paste your original SQL schema here, or run it separately

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for Public Read Access
-- (Adjust these based on your security requirements)

-- Policy for calls table
DROP POLICY IF EXISTS "Allow public read access to calls" ON public.calls;
CREATE POLICY "Allow public read access to calls" ON public.calls
FOR SELECT USING (true);

-- Policy for engagement_metrics table
DROP POLICY IF EXISTS "Allow public read access to engagement_metrics" ON public.engagement_metrics;
CREATE POLICY "Allow public read access to engagement_metrics" ON public.engagement_metrics
FOR SELECT USING (true);

-- Policy for timeseries table
DROP POLICY IF EXISTS "Allow public read access to timeseries" ON public.timeseries;
CREATE POLICY "Allow public read access to timeseries" ON public.timeseries
FOR SELECT USING (true);

-- Policy for appointments table
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
CREATE POLICY "Allow public read access to appointments" ON public.appointments
FOR SELECT USING (true);

-- Policy for status_summary table
DROP POLICY IF EXISTS "Allow public read access to status_summary" ON public.status_summary;
CREATE POLICY "Allow public read access to status_summary" ON public.status_summary
FOR SELECT USING (true);

-- Policy for users table
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users" ON public.users
FOR SELECT USING (true);

-- Step 4: Add unique constraint on engagement_metrics.metric_date (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'engagement_metrics_metric_date_key'
    ) THEN
        ALTER TABLE public.engagement_metrics 
        ADD CONSTRAINT engagement_metrics_metric_date_key UNIQUE (metric_date);
    END IF;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON public.calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON public.calls(direction);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON public.calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date ON public.engagement_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_metric_timestamp ON public.timeseries(metric, timestamp DESC);

-- Step 6: Insert sample data (optional - for testing)
-- Uncomment the lines below if you want to add test data

/*
-- Sample calls
INSERT INTO public.calls (phone_number, contact_name, direction, status, duration_seconds, timestamp, notes)
VALUES 
  ('+1234567890', 'John Doe', 'inbound', 'answered', 180, NOW() - INTERVAL '1 day', 'Customer inquiry'),
  ('+1234567891', 'Jane Smith', 'outbound', 'answered', 240, NOW() - INTERVAL '2 hours', 'Follow-up call'),
  ('+1234567892', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '1 hour', NULL),
  ('+1234567893', 'Bob Johnson', 'inbound', 'answered', 120, NOW() - INTERVAL '30 minutes', 'Appointment scheduled'),
  ('+1234567894', 'Alice Williams', 'outbound', 'voicemail', 0, NOW() - INTERVAL '15 minutes', 'Left voicemail'),
  ('+1234567895', 'Charlie Brown', 'inbound', 'answered', 300, NOW() - INTERVAL '10 minutes', 'Product inquiry'),
  ('+1234567896', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '5 minutes', NULL),
  ('+1234567897', 'Diana Prince', 'outbound', 'answered', 150, NOW(), 'Follow-up completed')
ON CONFLICT DO NOTHING;

-- Today's engagement metrics
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 25, 150, 18, 12)
ON CONFLICT (metric_date) DO UPDATE SET
  appointments_via_agent = EXCLUDED.appointments_via_agent,
  whatsapp_conversations = EXCLUDED.whatsapp_conversations,
  whatsapp_appointments = EXCLUDED.whatsapp_appointments,
  notes_count_today = EXCLUDED.notes_count_today,
  last_updated = NOW();
*/

-- ============================================
-- Setup Complete!
-- ============================================
-- Next steps:
-- 1. Verify tables exist: Go to Table Editor in Supabase
-- 2. (Optional) Uncomment and run the sample data section above
-- 3. Test your local app: npm run dev
-- ============================================

