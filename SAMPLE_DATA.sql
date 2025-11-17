-- ============================================
-- Sample Data for n8nBOT Dashboard Testing
-- This file contains realistic sample data for testing all features
-- 
-- IMPORTANT: Before running this script:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual Supabase user ID
--    You can get it from: SELECT id FROM auth.users LIMIT 1;
-- 2. Or create a test user first and use that ID
-- ============================================

-- ============================================
-- STEP 1: Demo Mode - No User ID Required
-- ============================================
-- For demo purposes, all data will be inserted with user_id = NULL
-- This allows testing without authentication
-- 
-- If you want to use a specific user_id later, you can update the data:
-- UPDATE public.calls SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- ============================================
-- STEP 2: Insert Sample Customers
-- ============================================
-- First, let's insert some customers
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

INSERT INTO public.customers (user_id, phone_number, email, full_name, company, notes, tags, created_at, updated_at)
VALUES
  -- Demo mode: user_id is NULL for all records
  (NULL, '+12345678901', 'john.doe@example.com', 'John Doe', 'Acme Corp', 'Regular customer, prefers morning calls', ARRAY['vip', 'regular'], NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  (NULL, '+12345678902', 'jane.smith@example.com', 'Jane Smith', 'Tech Solutions', 'Interested in premium package', ARRAY['prospect'], NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),
  (NULL, '+12345678903', 'bob.wilson@example.com', 'Bob Wilson', NULL, 'Follow up needed', ARRAY['follow-up'], NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  (NULL, '+12345678904', 'alice.brown@example.com', 'Alice Brown', 'Design Studio', 'Very satisfied customer', ARRAY['vip', 'satisfied'], NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
  (NULL, '+12345678905', 'charlie.davis@example.com', 'Charlie Davis', NULL, 'New customer', ARRAY['new'], NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
  (NULL, '+12345678906', 'diana.miller@example.com', 'Diana Miller', 'Marketing Agency', 'Requested callback', ARRAY['callback'], NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'),
  (NULL, '+12345678907', 'edward.garcia@example.com', 'Edward Garcia', NULL, 'Price inquiry', ARRAY['inquiry'], NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
  (NULL, '+12345678908', 'fiona.rodriguez@example.com', 'Fiona Rodriguez', 'Consulting Group', 'Scheduled appointment', ARRAY['appointment'], NOW() - INTERVAL '3 days', NOW());
-- Note: Removed ON CONFLICT for demo mode since user_id is NULL

-- ============================================
-- STEP 3: Insert Sample Calls (Inbound & Outbound)
-- ============================================
-- Insert calls with various statuses, directions, and timestamps
-- Spread across the last 30 days

INSERT INTO public.calls (
  user_id, 
  phone_number, 
  contact_name, 
  direction, 
  call_type,
  status, 
  duration_seconds, 
  timestamp, 
  notes, 
  customer_id,
  created_at
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  phone_number,
  full_name as contact_name,
  CASE WHEN random() < 0.6 THEN 'inbound' ELSE 'outbound' END as direction,
  CASE WHEN random() < 0.6 THEN 'inbound' ELSE 'outbound' END as call_type,
  CASE 
    WHEN random() < 0.6 THEN 'answered'
    WHEN random() < 0.8 THEN 'missed'
    WHEN random() < 0.9 THEN 'voicemail'
    ELSE 'busy'
  END as status,
  CASE 
    WHEN random() < 0.6 THEN floor(random() * 600 + 30)::integer  -- 30-630 seconds
    ELSE 0
  END as duration_seconds,
  (NOW() - (random() * INTERVAL '30 days'))::timestamptz as timestamp,
  CASE 
    WHEN random() < 0.3 THEN 'Customer inquiry about services'
    WHEN random() < 0.5 THEN 'Follow-up call scheduled'
    WHEN random() < 0.7 THEN 'Product demonstration requested'
    WHEN random() < 0.9 THEN 'Payment discussion'
    ELSE NULL
  END as notes,
  id as customer_id,
  (NOW() - (random() * INTERVAL '30 days'))::timestamptz as created_at
FROM public.customers
WHERE user_id IS NULL  -- Demo mode: get customers with NULL user_id
LIMIT 50;

-- Add some calls without customer records (new numbers)
INSERT INTO public.calls (
  user_id,
  phone_number,
  contact_name,
  direction,
  call_type,
  status,
  duration_seconds,
  timestamp,
  notes,
  created_at
)
VALUES
  (NULL, '+19876543210', 'Sarah Johnson', 'inbound', 'inbound', 'answered', 245, NOW() - INTERVAL '2 hours', 'New inquiry', NOW() - INTERVAL '2 hours'),
  (NULL, '+19876543211', 'Mike Thompson', 'outbound', 'outbound', 'answered', 180, NOW() - INTERVAL '5 hours', 'Follow-up call', NOW() - INTERVAL '5 hours'),
  (NULL, '+19876543212', NULL, 'inbound', 'inbound', 'missed', 0, NOW() - INTERVAL '1 day', 'Missed call - no voicemail', NOW() - INTERVAL '1 day'),
  (NULL, '+19876543213', 'Lisa Anderson', 'outbound', 'outbound', 'answered', 320, NOW() - INTERVAL '2 days', 'Product demo scheduled', NOW() - INTERVAL '2 days'),
  (NULL, '+19876543214', NULL, 'inbound', 'inbound', 'voicemail', 45, NOW() - INTERVAL '3 days', 'Left voicemail', NOW() - INTERVAL '3 days'),
  (NULL, '+19876543215', 'Tom Wilson', 'outbound', 'outbound', 'busy', 0, NOW() - INTERVAL '4 days', 'Line busy', NOW() - INTERVAL '4 days'),
  (NULL, '+19876543216', 'Emma Davis', 'inbound', 'inbound', 'answered', 195, NOW() - INTERVAL '5 days', 'Service inquiry', NOW() - INTERVAL '5 days'),
  (NULL, '+19876543217', NULL, 'inbound', 'inbound', 'missed', 0, NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  (NULL, '+19876543218', 'Robert Martinez', 'outbound', 'outbound', 'answered', 410, NOW() - INTERVAL '7 days', 'Contract discussion', NOW() - INTERVAL '7 days'),
  (NULL, '+19876543219', 'Olivia Taylor', 'inbound', 'inbound', 'answered', 125, NOW() - INTERVAL '8 days', 'Quick question', NOW() - INTERVAL '8 days');

-- ============================================
-- STEP 4: Insert Sample Appointments
-- ============================================
-- Link some appointments to calls

INSERT INTO public.appointments (
  user_id,
  source,
  scheduled_at,
  created_by,
  call_id,
  status,
  created_at
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  CASE WHEN random() < 0.5 THEN 'agent' ELSE 'whatsapp' END as source,
  (NOW() + (random() * INTERVAL '14 days'))::timestamptz as scheduled_at,
  NULL as created_by,  -- Demo mode: no created_by
  c.id as call_id,
  CASE 
    WHEN random() < 0.7 THEN 'scheduled'
    WHEN random() < 0.9 THEN 'confirmed'
    ELSE 'cancelled'
  END as status,
  c.created_at
FROM public.calls c
WHERE c.user_id IS NULL  -- Demo mode: get calls with NULL user_id
  AND c.status = 'answered'
  AND random() < 0.4  -- 40% of answered calls have appointments
LIMIT 15;

-- Add some appointments without call_id
INSERT INTO public.appointments (
  user_id,
  source,
  scheduled_at,
  created_by,
  status,
  created_at
)
VALUES
  (NULL, 'whatsapp', NOW() + INTERVAL '2 days', NULL, 'scheduled', NOW() - INTERVAL '1 day'),
  (NULL, 'agent', NOW() + INTERVAL '5 days', NULL, 'confirmed', NOW() - INTERVAL '2 days'),
  (NULL, 'whatsapp', NOW() + INTERVAL '7 days', NULL, 'scheduled', NOW() - INTERVAL '3 days'),
  (NULL, 'agent', NOW() + INTERVAL '10 days', NULL, 'confirmed', NOW() - INTERVAL '4 days'),
  (NULL, 'whatsapp', NOW() + INTERVAL '12 days', NULL, 'scheduled', NOW() - INTERVAL '5 days');

-- ============================================
-- STEP 5: Insert Sample WhatsApp Messages
-- ============================================
-- Create conversation threads and messages

INSERT INTO public.whatsapp_messages (
  user_id,
  conversation_id,
  message_id,
  phone_number,
  contact_name,
  direction,
  message_type,
  content,
  timestamp,
  status,
  read_at,
  created_at
)
VALUES
  -- Conversation 1
  (NULL, 'conv_001', 'msg_001_1', '+12345678901', 'John Doe', 'inbound', 'text', 'Hi, I''m interested in your services', NOW() - INTERVAL '2 days', 'read', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', NOW() - INTERVAL '2 days'),
  (NULL, 'conv_001', 'msg_001_2', '+12345678901', 'John Doe', 'outbound', 'text', 'Hello! I''d be happy to help. What services are you interested in?', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', 'read', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
  (NULL, 'conv_001', 'msg_001_3', '+12345678901', 'John Doe', 'inbound', 'text', 'I need help with appointment scheduling', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes', 'read', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'),
  
  -- Conversation 2
  (NULL, 'conv_002', 'msg_002_1', '+12345678902', 'Jane Smith', 'inbound', 'text', 'Can you send me more information?', NOW() - INTERVAL '1 day', 'read', NOW() - INTERVAL '1 day' + INTERVAL '3 minutes', NOW() - INTERVAL '1 day'),
  (NULL, 'conv_002', 'msg_002_2', '+12345678902', 'Jane Smith', 'outbound', 'text', 'Of course! I''ll send you a detailed brochure right away.', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes', 'delivered', NULL, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
  (NULL, 'conv_002', 'msg_002_3', '+12345678902', 'Jane Smith', 'outbound', 'document', NULL, NOW() - INTERVAL '1 day' + INTERVAL '6 minutes', 'delivered', NULL, NOW() - INTERVAL '1 day' + INTERVAL '6 minutes'),
  
  -- Conversation 3
  (NULL, 'conv_003', 'msg_003_1', '+12345678903', 'Bob Wilson', 'outbound', 'text', 'Hi Bob, following up on our conversation', NOW() - INTERVAL '3 days', 'read', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', NOW() - INTERVAL '3 days'),
  (NULL, 'conv_003', 'msg_003_2', '+12345678903', 'Bob Wilson', 'inbound', 'text', 'Thanks for following up! I''m still interested', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', 'read', NOW() - INTERVAL '3 days' + INTERVAL '2 hours' + INTERVAL '5 minutes', NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
  
  -- Conversation 4
  (NULL, 'conv_004', 'msg_004_1', '+12345678904', 'Alice Brown', 'inbound', 'text', 'Great service! Thank you', NOW() - INTERVAL '5 days', 'read', NOW() - INTERVAL '5 days' + INTERVAL '1 minute', NOW() - INTERVAL '5 days'),
  (NULL, 'conv_004', 'msg_004_2', '+12345678904', 'Alice Brown', 'outbound', 'text', 'You''re very welcome! We appreciate your business.', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes', 'read', NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),
  
  -- Conversation 5 (with image)
  (NULL, 'conv_005', 'msg_005_1', '+12345678905', 'Charlie Davis', 'inbound', 'image', 'Check this out!', NOW() - INTERVAL '1 day', 'read', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', NOW() - INTERVAL '1 day'),
  (NULL, 'conv_005', 'msg_005_2', '+12345678905', 'Charlie Davis', 'outbound', 'text', 'Thanks for sharing! That looks great.', NOW() - INTERVAL '1 day' + INTERVAL '35 minutes', 'delivered', NULL, NOW() - INTERVAL '1 day' + INTERVAL '35 minutes'),
  
  -- More recent conversations
  (NULL, 'conv_006', 'msg_006_1', '+19876543210', 'Sarah Johnson', 'inbound', 'text', 'Hello, I have a question', NOW() - INTERVAL '2 hours', 'read', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 hours'),
  (NULL, 'conv_006', 'msg_006_2', '+19876543210', 'Sarah Johnson', 'outbound', 'text', 'Hi Sarah! How can I help you today?', NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes', 'read', NOW() - INTERVAL '1 hour' + INTERVAL '10 minutes', NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes'),
  (NULL, 'conv_007', 'msg_007_1', '+19876543211', 'Mike Thompson', 'outbound', 'text', 'Reminder: Your appointment is tomorrow at 2 PM', NOW() - INTERVAL '6 hours', 'delivered', NULL, NOW() - INTERVAL '6 hours'),
  (NULL, 'conv_007', 'msg_007_2', '+19876543211', 'Mike Thompson', 'inbound', 'text', 'Thanks for the reminder!', NOW() - INTERVAL '5 hours', 'read', NOW() - INTERVAL '5 hours' + INTERVAL '2 minutes', NOW() - INTERVAL '5 hours');

-- ============================================
-- STEP 6: Insert Sample Calendar Events
-- ============================================
-- Create calendar events linked to appointments

INSERT INTO public.calendar_events (
  user_id,
  google_event_id,
  title,
  description,
  location,
  start_time,
  end_time,
  all_day,
  timezone,
  color_id,
  status,
  attendees,
  reminders,
  metadata,
  created_at,
  updated_at,
  synced_at
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  'google_event_' || a.id::text as google_event_id,
  CASE 
    WHEN c.full_name IS NOT NULL THEN 'Appointment with ' || c.full_name
    WHEN c.phone_number IS NOT NULL THEN 'Appointment with ' || c.phone_number
    WHEN a.source IS NOT NULL THEN 'Appointment scheduled via ' || a.source
    ELSE 'Appointment'
  END as title,
  'Appointment scheduled via ' || COALESCE(a.source, 'agent') as description,
  'Office' as location,
  a.scheduled_at as start_time,
  a.scheduled_at + INTERVAL '1 hour' as end_time,
  false as all_day,
  'America/New_York' as timezone,
  '1' as color_id,
  CASE WHEN a.status = 'cancelled' THEN 'cancelled' ELSE 'confirmed' END as status,
  '[]'::jsonb as attendees,
  '[{"method": "popup", "minutes": 15}]'::jsonb as reminders,
  jsonb_build_object('source', COALESCE(a.source, 'agent')) as metadata,
  a.created_at,
  a.created_at,
  a.created_at
FROM public.appointments a
LEFT JOIN public.customers c ON a.call_id IN (SELECT id FROM public.calls WHERE customer_id = c.id)
WHERE a.user_id IS NULL  -- Demo mode: get appointments with NULL user_id
  AND a.scheduled_at IS NOT NULL
LIMIT 10;

-- Add some standalone calendar events
INSERT INTO public.calendar_events (
  user_id,
  google_event_id,
  title,
  description,
  location,
  start_time,
  end_time,
  all_day,
  timezone,
  color_id,
  status,
  created_at,
  updated_at,
  synced_at
)
VALUES
  (NULL, 'google_event_standalone_1', 'Team Meeting', 'Weekly team sync', 'Conference Room A', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', false, 'America/New_York', '2', 'confirmed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (NULL, 'google_event_standalone_2', 'Client Presentation', 'Quarterly review presentation', 'Client Office', NOW() + INTERVAL '3 days' + INTERVAL '14 hours', NOW() + INTERVAL '3 days' + INTERVAL '16 hours', false, 'America/New_York', '9', 'confirmed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (NULL, 'google_event_standalone_3', 'Training Session', 'New employee onboarding', 'Training Room', NOW() + INTERVAL '7 days' + INTERVAL '9 hours', NOW() + INTERVAL '7 days' + INTERVAL '12 hours', false, 'America/New_York', '5', 'confirmed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- ============================================
-- STEP 7: Insert Sample Engagement Metrics
-- ============================================
-- Create daily engagement metrics for the last 30 days

INSERT INTO public.engagement_metrics (
  user_id,
  metric_date,
  appointments_via_agent,
  whatsapp_conversations,
  whatsapp_appointments,
  notes_count_today,
  last_updated
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  (CURRENT_DATE - (s * INTERVAL '1 day'))::date as metric_date,
  floor(random() * 10 + 1)::integer as appointments_via_agent,
  floor(random() * 15 + 3)::integer as whatsapp_conversations,
  floor(random() * 5 + 1)::integer as whatsapp_appointments,
  floor(random() * 20 + 5)::integer as notes_count_today,
  (CURRENT_DATE - (s * INTERVAL '1 day') + INTERVAL '18 hours')::timestamptz as last_updated
FROM generate_series(0, 29) s;
-- Note: Removed ON CONFLICT for demo mode - if you run this multiple times, it will create duplicate rows
-- To avoid duplicates, delete existing data first: DELETE FROM public.engagement_metrics WHERE user_id IS NULL;

-- ============================================
-- STEP 8: Insert Sample Timeseries Data
-- ============================================
-- Create hourly/daily timeseries data for charts

-- Calls metric (hourly for last 7 days)
INSERT INTO public.timeseries (
  user_id,
  metric,
  timestamp,
  value,
  metadata
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  'calls' as metric,
  (NOW() - (h * INTERVAL '1 hour'))::timestamptz as timestamp,
  floor(random() * 20 + 1)::numeric as value,
  '{}'::jsonb as metadata
FROM generate_series(0, 167) h;  -- 7 days * 24 hours
-- Note: Removed ON CONFLICT for demo mode

-- Duration metric (daily for last 30 days)
INSERT INTO public.timeseries (
  user_id,
  metric,
  timestamp,
  value,
  metadata
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  'duration' as metric,
  (CURRENT_DATE - (d * INTERVAL '1 day'))::date::timestamptz as timestamp,
  floor(random() * 300 + 100)::numeric as value,
  '{}'::jsonb as metadata
FROM generate_series(0, 29) d;
-- Note: Removed ON CONFLICT for demo mode

-- Answer rate metric (daily for last 30 days)
INSERT INTO public.timeseries (
  user_id,
  metric,
  timestamp,
  value,
  metadata
)
SELECT 
  NULL as user_id,  -- Demo mode: no user_id
  'answered_rate' as metric,
  (CURRENT_DATE - (d * INTERVAL '1 day'))::date::timestamptz as timestamp,
  floor(random() * 30 + 60)::numeric as value,  -- 60-90% answer rate
  '{}'::jsonb as metadata
FROM generate_series(0, 29) d;
-- Note: Removed ON CONFLICT for demo mode

-- ============================================
-- STEP 9: Insert Sample Status Summary
-- ============================================
-- Create status summaries for different periods

INSERT INTO public.status_summary (
  user_id,
  period,
  answered,
  missed,
  other,
  updated_at
)
VALUES
  (NULL, 'today',  -- Demo mode: no user_id
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'answered' AND DATE(timestamp) = CURRENT_DATE),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'missed' AND DATE(timestamp) = CURRENT_DATE),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status NOT IN ('answered', 'missed') AND DATE(timestamp) = CURRENT_DATE),
   NOW()),
  (NULL, 'week',
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'answered' AND timestamp >= CURRENT_DATE - INTERVAL '7 days'),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'missed' AND timestamp >= CURRENT_DATE - INTERVAL '7 days'),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status NOT IN ('answered', 'missed') AND timestamp >= CURRENT_DATE - INTERVAL '7 days'),
   NOW()),
  (NULL, 'month',
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'answered' AND timestamp >= CURRENT_DATE - INTERVAL '30 days'),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status = 'missed' AND timestamp >= CURRENT_DATE - INTERVAL '30 days'),
   (SELECT COUNT(*) FROM public.calls WHERE user_id IS NULL AND status NOT IN ('answered', 'missed') AND timestamp >= CURRENT_DATE - INTERVAL '30 days'),
   NOW());
-- Note: Removed ON CONFLICT for demo mode - if you run this multiple times, delete existing data first:
-- DELETE FROM public.status_summary WHERE user_id IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data was inserted correctly

-- Count records by table (Demo mode: user_id IS NULL)
SELECT 'customers' as table_name, COUNT(*) as count FROM public.customers WHERE user_id IS NULL
UNION ALL
SELECT 'calls', COUNT(*) FROM public.calls WHERE user_id IS NULL
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments WHERE user_id IS NULL
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM public.whatsapp_messages WHERE user_id IS NULL
UNION ALL
SELECT 'calendar_events', COUNT(*) FROM public.calendar_events WHERE user_id IS NULL
UNION ALL
SELECT 'engagement_metrics', COUNT(*) FROM public.engagement_metrics WHERE user_id IS NULL
UNION ALL
SELECT 'timeseries', COUNT(*) FROM public.timeseries WHERE user_id IS NULL
UNION ALL
SELECT 'status_summary', COUNT(*) FROM public.status_summary WHERE user_id IS NULL;

-- Check call distribution
SELECT call_type, status, COUNT(*) as count 
FROM public.calls 
WHERE user_id IS NULL
GROUP BY call_type, status 
ORDER BY call_type, status;

-- Check recent calls
SELECT call_type, phone_number, contact_name, status, duration_seconds, timestamp
FROM public.calls 
WHERE user_id IS NULL
ORDER BY timestamp DESC 
LIMIT 10;

